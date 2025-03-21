const axios = require("axios");
const { google } = require("googleapis");
const { serializePlan, deserializePlan } = require("./shared");

const GROQ_API_URL = process.env.GROQ_API_URL;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Update the validation function to check for explanations
function validateQuizData(data) {
  if (!data || !Array.isArray(data.questions)) {
    return false;
  }

  return data.questions.every(
    (q) =>
      q.id &&
      q.question &&
      Array.isArray(q.options) &&
      q.options.length === 4 &&
      typeof q.correctAnswer === "number" &&
      q.explanation &&
      typeof q.explanation.correct === "string" &&
      q.explanation.incorrect &&
      typeof q.explanation.incorrect === "object" 
      // && Object.keys(q.explanation.incorrect).length === 4
  );
}

async function generateQuiz(userInputs) {
  if (!userInputs || !userInputs.topic || !userInputs.topic_description) {
    throw new Error("Missing required fields: topic and topic_description");
  }

  const { topic, topic_description } = userInputs;

  // Update the prompt in generateQuiz function
  const prompt = `Generate a JSON object for a balanced multiple-choice quiz based on the given input.

    Inputs:
    - Topic: ${topic}
    - Topic Description: ${topic_description}
    
    Quiz Structure:
    - The quiz should contain 8 questions, distributed as follows:
      - 3 Easy: Basic recall-based questions
      - 3 Medium: Questions requiring understanding and application
      - 2 Hard: Analytical, multi-step, or problem-solving questions
    - The order of questions must be: Easy → Medium → Hard.
    
    Output Format:
    {
      "questions": [
        {
          "id": "1",
          "question": "Question text",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": 0,
          "explanation": {
            "correct": "Explanation (50-100 words) why the correct answer is right, including relevant concepts and principles",
            "incorrect": {
              "0": "Brief explanation why Option A is incorrect (if not the correct answer)",
              "1": "Brief explanation why Option B is incorrect (if not the correct answer)",
              "2": "Brief explanation why Option C is incorrect (if not the correct answer)",
              "3": "Brief explanation why Option D is incorrect (if not the correct answer)"
            }
          }
        }
      ]
    }
    
    Requirements:
    1. Each question MUST include detailed explanations for both correct and incorrect answers
    2. The correct answer explanation should be comprehensive and educational
    3. Each incorrect answer explanation should clearly explain why that option is wrong
    4. Use factual, clear language in explanations
    5. Include relevant terminology and concepts in explanations
    
    Question Generation Rules:
    - Each question must have exactly 4 options
    - Options should be clear and concise (max 30 characters)
    - Progress from Easy to Hard difficulty
    - Include comprehensive explanations for ALL answers
    - Correct answer should contain index of correct option and should be a number between 0 and 3 only (Important)
    
    Format all explanations in clear, educational language. Do not use placeholders.
    Return only a valid JSON object with no additional text.`;

  try {
    console.log("Sending request to AI API...");
    const response = await axios.post(
      GROQ_API_URL,
      {
        model: "gemma2-9b-it",
        messages: [{ role: "user", content: prompt }],
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

    if (!response.data?.choices?.[0]?.message) {
      throw new Error("Invalid AI response format");
    }

    let content = response.data.choices[0].message.content;

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error("No valid JSON found in the response");

      content = fixInvalidJsonStructure(jsonMatch[0]);
      const quizData = JSON.parse(content);
      const formattedQuizData = formatExplanations(quizData);
      console.log("Formatted Quiz Data", JSON.stringify(formattedQuizData));

      if (!validateQuizData(formattedQuizData)) {
        throw new Error("Invalid quiz data structure");
      }

      const enrichedQuizData = {
        ...formattedQuizData,
        metadata: {
          topic,
          topic_description,
          generated_at: new Date().toISOString(),
          question_count: formattedQuizData.questions.length,
        },
      };

      return enrichedQuizData;
    } catch (error) {
      console.error("Failed to parse AI response:", error.message);
      throw new Error(`Quiz generation failed: ${error.message}`);
    }
  } catch (error) {
    console.error("Error in generateQuiz:", error);
    throw error; // Let the error propagate to the route handler
  }
}

// Function to fix common JSON formatting errors from AI responses
function fixInvalidJsonStructure(jsonString) {
  return jsonString
    .replace(/“|”/g, '"') // Fix curly quotes
    .replace(/,\s*([\]}])/g, "$1") // Remove trailing commas
    .trim();
}

function formatExplanations(quizData) {
  return {
    ...quizData,
    questions: quizData.questions.map((q) => ({
      ...q,
      explanation: {
        correct: q.explanation.correct,
        incorrect: Object.fromEntries(
          q.options.map((_, index) => [
            index,
            index === q.correctAnswer
              ? q.explanation.correct
              : q.explanation.incorrect[index] ||
                `This option is incorrect because it doesn't match the correct answer.`,
          ])
        ),
      },
    })),
  };
}

module.exports = { generateQuiz };
