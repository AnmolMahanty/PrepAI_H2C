const axios = require("axios");

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_API_KEY = "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"; // Ensure API key security

async function generateStudyPlan(userInputs) {
  const prompt = `
You are an AI-powered study planner that dynamically creates personalized schedules, generates quizzes to assess progress, provides AI-powered explanations, and reschedules topics based on user performance.

### **Task:**  
- Generate a **structured study plan** based on the user's inputs.  
- Prioritize **difficult** and **high-importance** topics first.  
- Optimize **study and break periods** for maximum efficiency.  
- Provide **quizzes** after each major topic to test understanding.  
- Adjust schedules dynamically if user struggles with certain topics.  
- Ensure the response is formatted **in JSON**.

### **User Inputs:**  
${JSON.stringify(userInputs, null, 2)}

### **Expected JSON Output Structure:**
\`\`\`json
{
  "study_plan": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "sessions": [
        {
          "time": "09:00 - 10:30",
          "topic": "Mathematics - Calculus",
          "difficulty": "Hard",
          "priority": "High",
          "notes": "Focus on differentiation techniques.",
          "quiz": {
            "questions": ["What is the derivative of x^2?", "Explain chain rule."]
          }
        },
        ...
      ],
      "breaks": ["10:30 - 10:45 (Tea Break)", "13:00 - 14:00 (Lunch)"]
    },
    ...
  ]
}
\`\`\`
Now, generate a structured study plan based on the user's inputs.
  `;

  try {
    console.log("Requesting AI-generated study plan...");

    const response = await axios.post(
      GROQ_API_URL,
      {
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1500,
        temperature: 0.7,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
      }
    );

    return response.data.choices[0].message.content; // Extract study plan
  } catch (error) {
    console.error("Groq AI API Error:", error.response ? error.response.data : error.message);
    throw new Error("Failed to generate study plan from Groq AI");
  }
}

module.exports = { generateStudyPlan };

// Test the function with sample inputs
(async () => {
  const userInputs = {
    study_goal: { goal: "Ace the final exams", deadline: "2025-06-15" },
    study_time: {
      hours_per_day: 6,
      preferred_days: ["Monday", "Wednesday", "Friday"],
      break_preference: "Pomodoro"
    },
    study_topics: [
      {
        subject: "Mathematics",
        topics: ["Calculus", "Algebra"],
        priority: "High",
        difficulty: "Hard"
      },
      {
        subject: "Physics",
        topics: ["Mechanics", "Optics"],
        priority: "Medium",
        difficulty: "Medium"
      },
      {
        subject: "History",
        topics: ["World War II", "Industrial Revolution"],
        priority: "Low",
        difficulty: "Easy"
      }
    ],
    learning_preferences: {
      style: "Visual & Problem-Solving",
      revision_slots: { enabled: true, frequency: "Twice a Week" }
    },
    rescheduling: {
      missed_session_action: "Reschedule Next Day",
      low_quiz_score_action: "Focus on Weak Areas"
    },
    additional_preferences: {
      focus_level: "Needs Frequent Breaks",
      best_study_time: "Morning"
    }
  };

  try {
    const studyPlan = await generateStudyPlan(userInputs);
    console.log("Generated Study Plan:", studyPlan);
  } catch (error) {
    console.error("Error generating study plan:", error);
  }
})();

