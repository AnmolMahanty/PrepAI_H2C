const axios = require("axios");
const { storePlan, updatePlan } = require("./appwrite");
const { google } = require("googleapis");
const { serializePlan, deserializePlan } = require("./shared");

const GROQ_API_URL = process.env.GROQ_API_URL;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY; // Add this to your .env file

async function generateStudyPlan(userInputs) {
  const { type, goal, deadline, studyhrs, days, startDate, startDay, userId } =
    userInputs;
  const prompt = `I am PREPAI, your AI-powered study planner. Based on your inputs, I will generate a structured and optimized study plan in JSON format only. 
  
  GoalType : ${type}
  Goal : ${goal}
  Start Date: ${startDate}
  Start Day: ${startDay}
  Deadline  : ${deadline}
  Study hours : ${studyhrs}
  Days Preferred  : ${days}


  The output must strictly follow this structure:
[
  {
    "Week": 1,
    "Tasks": [
      {
        "Topic": "",
        "Date": "YYYY-MM-DD",
        "Study Hours": 0,
        "Details": [
          "Point 1",
          "Point 2",
          "Point 3"
        ]
      }
    ]
  }
  
  {
    "Week": 2,
    "Tasks": [
      {
        "Topic": "",
        "Date": "YYYY-MM-DD",
        "Study Hours": 0,
        "Details": [
          "Point 1",
          "Point 2",
          "Point 3"
        ]
      }
    ]
  }
]

Rules for Output:
Only return JSON format—no extra text or explanations.
Details must be in 3 brief points (at least 3 sentences) summarizing key aspects of the topic/task.
Ensure the plan is well-structured, achievable, and balanced based on the user’s goal where all the weeks are covered.
Ensure full coverage—Distribute study tasks evenly across all weeks until the deadline.
Balance learning, practice, and revision for maximum effectiveness.
Prioritize important/high-weightage topics first, then move to lower-priority ones.
Maintain logical sequencing—Topics should build progressively in difficulty or relevance.
Adhere to user preferences (preferred days, hours, and study pace).
If any input is missing or invalid, generate the best possible plan based on available information.
Plan Optimization Based on Goal:
Exam Prep → Retrieve syllabus, prioritize high-weightage topics, include revision & tests.
Skill Development → Structure beginner → advanced, include hands-on practice & projects.
Research/Writing → Divide into research, drafting, editing, and feedback phases.
Language Learning → Cover vocabulary, grammar, speaking, and real-world practice.
Project-Based Learning → Break into milestones (planning, execution, testing, refinement).
Fitness/Personal Growth → Balance theory & practice, track progress with measurable goals.
Custom Goals → Identify key sub-goals, split into learning, practice, and assessment.


Generate the study plan strictly in JSON format as specified."
  `;

  try {
    console.log("Sending request to AI API...");
    const response = await axios.post(
      GROQ_API_URL,
      {
        model: "deepseek-r1-distill-llama-70b",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 8000,
        temperature: 0.7,
        reasoning_format: "hidden",
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
      }
    );

    // console.log("AI Response:", response.data);

    // Parse and validate the AI response
    let plan;

    if (
      response.data &&
      response.data.choices &&
      response.data.choices[0] &&
      response.data.choices[0].message
    ) {
      let content = response.data.choices[0].message.content;
      // console.log("Raw AI Response Content:", content);

      // Attempt to clean up the response if it contains unexpected text
      try {
        // Extract the JSON part using a regular expression
        content = content.replace(/```json/g, "").replace(/```/g, "");

        const jsonMatch = content.match(/\{[\s\S]*\}|\[[\s\S]*\]/); // Matches JSON objects or arrays

        if (jsonMatch) {
          console.log("JSON Match:", jsonMatch[0]);
          content = jsonMatch[0]; // Extract the JSON part
        } else {
          throw new Error("No valid JSON found in the response");
        }

        // Fix invalid JSON structure
        // content = fixInvalidJsonStructure(content);
        // console.log("Fixed JSON Content:", content);
        //remove all \n and \ from the string
        content = content.replace(/\\n/g, "").replace(/\\/g, "");

        // Parse the cleaned and fixed JSON
        plan = content;
      } catch (error) {
        console.error("Failed to parse AI response content:", error.message);
        console.error("Returning an empty plan as fallback.");
        plan = []; // Fallback to an empty plan
      }
    }

    console.log("Parsed AI Response:", plan);

    // Step 3: Store the updated study plan in the database
    const { id: planId } = await storePlan(
      userId,
      plan,
      goal,
      startDate,
      deadline
    );

    return { plan, planId };
  } catch (error) {
    console.error("Error during AI API request:", error.message);
    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
    }
    throw new Error("Failed to generate and store study plan");
  }
}

function fixInvalidJsonStructure(content) {
  try {
    // Replace invalid "Week": 1, [ ... ] with "Week": 1, "Tasks": [ ... ]
    content = content.replace(
      /"Week":\s*(\d+),\s*\[/g,
      '"Week": $1, "Tasks": ['
    );
    return content;
  } catch (error) {
    console.error("Error fixing JSON structure:", error.message);
    throw new Error("Failed to fix JSON structure");
  }
}

async function editStudyPlan(userInputs) {
  const { originalPlan, userMessage, planId, previousInput } = userInputs;

  // Ensure originalPlan is properly formatted for the prompt
  const serializedOriginalPlan =
    typeof originalPlan === "string"
      ? originalPlan
      : serializePlan(originalPlan);

  const editPrompt = `I am PREPAI, your AI-powered study planner. Based on your inputs, I will edit your existing study plan in JSON format only. 

  Original Study Plan:
  ${serializedOriginalPlan}

  Original Inputs :
    GoalType : ${previousInput.type}
  Goal : ${previousInput.goal}
  Start Date: ${previousInput.startDate}
  Start Day: ${previousInput.startDay}
  Deadline  : ${previousInput.deadline}
  Study hours : ${previousInput.studyhrs}
  Days Preferred  : ${previousInput.days}
  
  User's Requested Changes:
  ${userMessage}
  
  The output must strictly follow this structure:
[
  {
    "Week": 1,
    "Tasks": [
      {
        "Topic": "",
        "Date": "YYYY-MM-DD",
        "Study Hours": 0,
        "Details": [
          "Point 1",
          "Point 2",
          "Point 3"
        ]
      }
    ]
  }
  
  {
    "Week": 2,
    "Tasks": [
      {
        "Topic": "",
        "Date": "YYYY-MM-DD",
        "Study Hours": 0,
        "Details": [
          "Point 1",
          "Point 2",
          "Point 3"
        ]
      }
    ]
  }
]
  
  Rules for Output:
  Only return JSON format—no extra text or explanations.
  Apply ONLY the changes requested by the user. Do not make any other modifications to the original plan unless explicitly asked.
  Maintain the original structure and format of the timetable unless the user requests a change to the structure.
  If the user requests an impossible change, return the original timetable with an error message in a "error" property inside the json.
  If the user requests a change that is already present in the original timetable, return the original timetable with a message in a "message" property inside the json.
  If the user requests a change that can be applied, apply the change and return the modified timetable.
  Ensure the edited plan remains well-structured, achievable, and balanced.
  Adhere to user preferences (preferred days, hours, and study pace) as originally established in the original timetable, unless the user explicitly requests changes to these preferences.
  If the user's request is unclear or ambiguous, make a reasonable interpretation and apply the change, then include a "message" property explaining the interpretation made.
  If the user provides completely new Goal, startDate, deadline, and studyhrs, then generate new timetable from scratch.
  Generate the edited study plan strictly in JSON format as specified.
  `;

  try {
    // console.log("GROQ_API_URL:", GROQ_API_URL);
    // console.log("Headers:", {
    //   "Content-Type": "application/json",
    //   Authorization: `Bearer ${GROQ_API_KEY}`,
    // });

    const response = await axios.post(
      GROQ_API_URL,
      {
        model: "gemma2-9b-it", // Use appropriate Groq-supported DeepSeek model
        messages: [{ role: "user", content: editPrompt }],
        max_tokens: 8000,
        temperature: 0.7,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
      }
    );

    // Parse and validate the response before updating
    const updatedPlan = response.data;
    let plan = updatedPlan.choices[0].message.content;
    plan = plan.replace(/```json/g, "").replace(/```/g, "");

    await updatePlan(planId, plan);
    return updatedPlan;
  } catch (error) {
    console.error("Error:", error);
    throw new Error("Failed to edit and update study plan");
  }
}

async function generateCheatSheet(userInputs) {
  const { topic, topic_description, cheatsheet_type } = userInputs;

  if (!topic || !topic_description) {
    throw new Error("Missing required fields: topic and topic_description");
  }

  const prompt = `Generate a **Cheat Sheet** based on the details below:  
- **Topic:** ${topic}  
- **Description:** ${topic_description}  
- **Cheat Sheet Type:** ${cheatsheet_type || "Detailed"}  

### **Cheat Sheet Types:**  
- **Short:** Covers only key points, definitions, and must-know facts.  
- **Brief:** Summarizes main concepts with short explanations and examples.  
- **Detailed:** Provides comprehensive coverage with explanations, formulas, and multiple examples.  

### **Formatting Guidelines:**  
Structure the cheat sheet **like well-organized student notes**, ensuring **clarity, readability, and easy revision**.  

 **Headings & Subheadings:** Clearly organize topics for quick navigation.  

 **Key Terms & Definitions:**  
   - Provide a **brief definition** for each concept.  
   - Use **bold** or *italic* text for emphasis.  
   - Keep explanations **short and precise**.  

 **Examples & Applications:**  
   - Each concept should include at least **one relevant example**.  
   - Clearly separate examples using a **line break** for readability.  
   - Use proper **formatting for equations, code, or data tables**.  

 **Bullet Points & Short Sentences:**  
   - Avoid large paragraphs—break content into digestible points.  
   - Use simple language for quick understanding.  

 **Formulas & Equations:**  
   - Display formulas **properly spaced** and easy to read.  
   - Show **step-by-step breakdowns** when needed.  

 **Common Mistakes & Tips:**  
   - Highlight **common errors** students make.  
   - Provide **study shortcuts or memory aids**.  

### **Spacing & Readability:**  
 Leave **line gaps** between sections to avoid clutter.  

 Ensure **proper indentation** for better structure.  

 Use tables, bullet points, and symbols for **quick skimming**.  

**Return the cheat sheet in Markdown format** (for proper headings, lists, tables, and emphasis).  
**Only provide the formatted cheat sheet without any extra explanations or metadata.**  
`;

  try {
    const response = await axios.post(
      GROQ_API_URL,
      {
        model: "llama3-8b-8192",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 4000,
        temperature: 0.5,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
      }
    );

    if (!response.data?.choices?.[0]?.message) {
      throw new Error("Invalid AI response format");
    }

    const cheatSheetContent = response.data.choices[0].message.content;

    return {
      content: cheatSheetContent,
      metadata: {
        topic,
        topic_description,
        cheatsheet_type: cheatsheet_type || "Comprehensive",
        generated_at: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error("Error generating cheat sheet:", error);
    throw new Error("Failed to generate cheat sheet");
  }
}

console.log("Exporting from AiService.js:", {
  generateStudyPlan,
  editStudyPlan,
  generateCheatSheet,
});

module.exports = {
  generateStudyPlan,
  editStudyPlan,
  generateCheatSheet,
};

// Test the generateStudyPlan function
// (async () => {
//   const userInputs = {
//     subjects: [
//       {
//         name: "Mathematics",
//         topics: [
//           { name: "Algebra", difficulty: "hard", importance: "high" },
//           { name: "Geometry", difficulty: "medium", importance: "medium" },
//           { name: "Calculus", difficulty: "hard", importance: "high" }
//         ]
//       },
//       {
//         name: "Physics",
//         topics: [
//           { name: "Mechanics", difficulty: "medium", importance: "high" },
//           { name: "Optics", difficulty: "easy", importance: "medium" }
//         ]
//       }
//     ],
//     totalStudyTime: 20, // in hours
//     availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
//   };

//   try {
//     console.log("url", GROQ_API_URL);
//     const studyPlan = await generateStudyPlan(userInputs);
//     console.log("Generated Study Plan:", JSON.stringify(studyPlan, null, 2));
//   } catch (error) {
//     console.error("Error generating study plan:", error);
//   }
// })();
