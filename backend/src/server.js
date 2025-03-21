require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { generateStudyPlan, editStudyPlan } = require("./AiService");
const { getUserPlans, getPlan, updatePlan } = require("./appwrite");
const { generateQuiz } = require("./quiz"); // Add this import
const { addYouTubePlaylistsToPlan } = require("./youtubeUtils"); // Import the YouTube utility function
const { transcribeAudio, getAIResponse ,textToSpeech} = require("./momBot");
const { Server } = require("socket.io");
const http = require("http");
const { generateCheatSheet } = require("./AiService");


const app = express();
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Vite's default port
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

// Test Route
app.get("/test", (req, res) => {
  res.json({ message: "Hello from the server!" });
});

// API Route to generate study plan
app.post("/generate-study-plan", async (req, res) => {
  console.log("Received request to /generate-study-plan");
  try {
    const userInputs = req.body;

    // Validate user inputs
    if (!userInputs.goal || !userInputs.deadline || !userInputs.studyhrs || !userInputs.days || !userInputs.startDate || !userInputs.userId) {
      return res.status(400).json({ error: "Missing required fields in user inputs" });
    }

    console.log("User Inputs:", userInputs);
    const studyPlan = await generateStudyPlan(userInputs);
    res.json(studyPlan);
  } catch (error) {
    console.error("Error generating study plan:", error.message);
    res.status(500).json({ error: "Failed to generate study plan" });
  }
});

app.post("/edit-study-plan", async (req, res) => {
  console.log("Received request to /edit-study-plan");
  try {
    const userInputs = req.body;
    console.log("User Inputs:", userInputs);
    const studyPlan = await editStudyPlan(userInputs);
    res.json(studyPlan);
  } catch (error) {
    console.error("Error editing study plan:", error.message);
    res.status(500).json({ error: "Failed to edit study plan" });
  }
});

app.post("/get-plans", async (req, res) => {
  console.log("Received request to /get-plans");
  try {
    const userInputs = req.body;
    console.log("User Inputs:", userInputs);
    const studyPlans = await getUserPlans(userInputs.userId);
    res.json(studyPlans);
  } catch (error) {
    console.error("Error getting study plan:", error.message);
    res.status(500).json({ error: "Failed to get study plan" });
  }
});

app.post('/api/generate-quiz', async (req, res) => {
  try {
    const userInputs = req.body;
    const quiz = await generateQuiz(userInputs);
    
    res.json({
      success: true,
      data: quiz
    });
  } catch (error) {
    console.error("Error generating quiz:", error.message);
    res.status(500).json({ 
      success: false,
      error: error.message || "Failed to generate quiz"
    });
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});
// API Route to get a single plan by planId
app.get("/get-plan/:planId", async (req, res) => {
  console.log("Received request to /get-plan/:planId");
  try {
    const { planId } = req.params;

    // Validate input
    if (!planId) {
      return res.status(400).json({ error: "Missing required field: planId" });
    }

    console.log("Fetching plan with ID:", planId);

    // Call the getPlan function
    const plan = await getPlan(planId);

    res.json(plan);
  } catch (error) {
    console.error("Error fetching plan:", error.message);
    res.status(500).json({ error: "Failed to fetch the plan" });
  }
});

// API Route to generate YouTube playlists
app.post("/add-playlists", async (req, res) => {
  console.log("Received request to /add-playlists");
  try {
    const { planId } = req.body;

    // Validate input
    if (!planId) {
      return res.status(400).json({ error: "Missing required field: planId" });
    }

    console.log("Generating YouTube playlists for planId:", planId);

    // Call the function to add YouTube playlists to the study plan
    await addYouTubePlaylistsToPlan(planId);

    res.json({ message: "YouTube playlists added successfully to the study plan." });
  } catch (error) {
    console.error("Error generating YouTube playlists:", error.message);
    res.status(500).json({ error: "Failed to generate YouTube playlists" });
  }
});
const conversations = new Map();




  // Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // Initialize conversation history for this client
  conversations.set(socket.id, []);

  socket.on("speech-data", async (audioBuffer) => {
    try {
      // Step 1: Transcribe audio to text
      const transcription = await transcribeAudio(audioBuffer);
      if (!transcription || transcription.trim() === "") {
        socket.emit("error", {
          message: "Could not transcribe audio or no speech detected",
        });
        return;
      }

      console.log("Transcription:", transcription);

      // Send the transcription to the client
      socket.emit("transcription", transcription);

      // Update conversation history with user message
      const history = conversations.get(socket.id) || [];
      history.push({ role: "user", content: transcription });

      // Step 2: Get AI response
      const aiResponse = await getAIResponse(transcription, history);

      // Update conversation history with AI response
      history.push({ role: "assistant", content: aiResponse });
      conversations.set(socket.id, history);

      // Send text response to client
      socket.emit("ai-response-text", aiResponse);

      // Step 3: Convert AI response to speech in parallel with sending text
      textToSpeech(aiResponse, socket);
    } catch (error) {
      console.error("Error processing speech:", error);
      socket.emit("error", { message: "Error processing your speech" });
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
    // Clean up conversation history
    conversations.delete(socket.id);
  });
});

// API endpoint for health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.post("/update-plan", async (req,res) => {
    try {
      // console.log(req.body);
      const userInputs = req.body;
      const plan = req.body.updatedPlan;
      const serializedPlan = typeof plan === 'string' 
      ? plan 
      : JSON.stringify(plan);
      // console.log("UpdatedPlan ",serializedPlan);
      const result = await updatePlan(userInputs.planId, serializedPlan);
      
      res.json({
        success: true,
      });
    } catch (error) {
      console.error("Error generating quiz:", error.message);
      res.status(500).json({ 
        success: false,
        error: error.message || "Failed to generate quiz"
      });
    }
  });

  app.post("/generate-cheatsheet", async (req, res) => {
    try {
      const userInputs = req.body;
      const cheatSheet = await generateCheatSheet(userInputs);
      res.status(200).json(cheatSheet);
    } catch (error) {
      console.error("Error generating cheat sheet:", error);
      res.status(500).json({ error: error.message || "Failed to generate cheat sheet" });
    }
  });
  
  app.post("/reschedule-plan", async (req, res) => {
    try {
      const { studyPlanData, testDate, currentDate, planId } = req.body;
  
      if (!studyPlanData || !testDate || !currentDate) {
        return res.status(400).json({
          success: false,
          error: "Missing required parameters",
        });
      }
  
      // Call the AI service to reschedule the plan
      const { rescheduleStudyPlan } = require("./AiService");
      const studyPlan = await rescheduleStudyPlan(
        studyPlanData,
        testDate,
        currentDate,
        planId
      );
  
      // Update the plan in the database if needed
      // For example with MongoDB: await PlanModel.findByIdAndUpdate(planId, { plan: JSON.stringify(studyPlan) });
  
      res.json({
        success: true,
        data: studyPlan,
      });
    } catch (error) {
      console.error("Error in reschedule-plan:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Internal server error",
      });
    }
  });


server.listen(5000, () => {
  console.log("Server running at http://localhost:5000");
});