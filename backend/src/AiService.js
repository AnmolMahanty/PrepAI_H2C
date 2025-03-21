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

  const prompt = `Generate a comprehensive **Cheat Sheet** based on the details below:

- **Topic:** ${topic}
- **Description:** ${topic_description}
- **Cheat Sheet Type:** Comprehensive

This cheat sheet should be approximately 1000-1500 words and structured like well-organized student notes, balancing depth with readability. 

### **Formatting Guidelines:**

**Headings & Structure:**
- Use a clear hierarchical structure with descriptive headings and subheadings
- All headings should be **bold** for easy navigation
- Organize content logically from foundational concepts to advanced applications

**Key Terms & Definitions:**
- Highlight **key terms** in bold
- Provide concise but complete definitions
- Use *italics* for emphasis on important points
- Include contextual information where necessary for understanding

**Examples & Applications:**
- Include 2-3 clear examples for each major concept
- Show practical applications of theoretical concepts
- Use code blocks, tables, or diagrams when appropriate
- Provide step-by-step breakdowns for complex processes

**Explanations & Formulas:**
- Break down complex ideas into digestible bullet points (4-6 per concept)
- Display formulas with proper spacing and notation
- Explain the purpose and context of each formula
- Identify when and how to apply specific techniques

**Common Pitfalls & Best Practices:**
- Highlight frequent misconceptions or errors
- Provide troubleshooting tips for difficult concepts
- Include memory aids and learning strategies
- Add efficiency tips for practical application

**Readability:**
- Use moderate spacing with clear section breaks
- Employ tables, bullet points, and numbered lists for clear organization
- Ensure sufficient white space to prevent visual overwhelm
- Structure for both quick reference and deeper study

**Return the cheat sheet in Markdown format** with proper formatting for headings, lists, tables, and emphasis.

**Only provide the formatted cheat sheet without any extra explanations or metadata.**`;

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

const rescheduleStudyPlan = async (
  studyPlanData,
  testDate,
  currentDate,
  planId
) => {
  try {
    const systemPrompt = `I am PREPAI, your AI-powered study planner. I will reschedule missed sessions and prioritize topics with low test scores based on your current study plan and progress data. The rescheduled plan will be provided in JSON format only.

    *Original Study Plan:* ${JSON.stringify(studyPlanData)}
    *Plan's Test Date:* ${testDate}
    *Current Date:* ${currentDate}

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
        ],
        YTplaylist: "(YouTube Playlist URL)",
        testTaken: (true/false - boolean),
        testScore: (0-100 - integer)
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
        ],
        YTplaylist: "(YouTube Playlist URL)",
        testTaken: (true/false - boolean),
        testScore: (0-100 - integer)
      }
    ]
  }
]

    ### Rescheduling Rules:
    1. JSON Format Only
    2. Never chanage the YTplaylist, testTaken, testScore
    3. Reschedule the entire plan based on the test date and current date

    Generate the rescheduled study plan strictly in JSON format as specified.`;

    const response = await axios.post(
      GROQ_API_URL,
      {
        model: "deepseek-r1-distill-llama-70b",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content:
              "Please reschedule my study plan based on my test results and missed sessions.",
          },
        ],
        max_tokens: 4000,
        temperature: 0.1, // Low temperature for more deterministic output
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
      }
    );

    console.log("AI Response:", response.data);

    // Parse and validate the response before updating
    const updatedPlan = response.data;
    let plan = updatedPlan.choices[0].message.content;
    plan = plan.replace(/```json/g, "").replace(/```/g, "");

    const jsonMatch = plan.match(/\{[\s\S]*\}|\[[\s\S]*\]/); // Matches JSON objects or arrays

    if (jsonMatch) {
      console.log("JSON Match:", jsonMatch[0]);
      plan = jsonMatch[0]; // Extract the JSON part
    } else {
      throw new Error("No valid JSON found in the response");
    }

    plan = plan.replace(/\\n/g, "").replace(/\\/g, "");

    // Update the plan in the database
    await updatePlan(planId, plan);

    return updatedPlan;
  } catch (error) {
    console.error("Error in rescheduleStudyPlan:", error);
    throw new Error(
      "Failed to reschedule study plan: " + (error.message || "Unknown error")
    );
  }
};

console.log("Exporting from AiService.js:", {
  generateStudyPlan,
  editStudyPlan,
  generateCheatSheet,
  rescheduleStudyPlan,
});

module.exports = {
  generateStudyPlan,
  editStudyPlan,
  generateCheatSheet,
  rescheduleStudyPlan,
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
