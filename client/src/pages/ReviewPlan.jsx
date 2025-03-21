import axios from "axios";
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const ReviewPlan = () => {
  const location = useLocation();
  const navigate = useNavigate();
  let { goal, plan, planId, previousInput } = location.state || {
    goal: "",
    plan: `{"Week": 1, "Tasks": [
        {
            "Task/Topic": "Engineering Mathematics",
            "Date": "2025-03-02",
            "Study Hours": "3",
            "Details": [
                "Focus on Linear Algebra and Calculus.",
                "Solve previous year GATE questions related to these topics.",
                "Review key formulas and concepts."
            ]
        },
        {
            "Task/Topic": "Digital Logic",
            "Date": "2025-03-03",
            "Study Hours": "3",
            "Details": [
                "Study Boolean Algebra and Combinatorial Logic.",
                "Practice problems on Karnaugh Maps and Minimization.",
                "Review Sequential Logic circuits."
            ]
        },
        {
            "Task/Topic": "Computer Networks",
            "Date": "2025-03-04",
            "Study Hours": "3",
            "Details": [
                "Focus on OSI and TCP/IP models.",
                "Study HTTP, FTP, and TCP protocols.",
                "Understand Network Layer concepts like Routing and Congestion Control."
            ]
        },
        {
            "Task/Topic": "Practice Test",
            "Date": "2025-03-05",
            "Study Hours": "3",
            "Details": [
                "Attempt a full-length GATE mock test.",
                "Analyze weaknesses and mistakes.",
                "Review solutions and improve time management."
            ]
        }
    ],"Week": 2, "Tasks": [
        {
            "Task/Topic": "Operating Systems",
            "Date": "2025-03-06",
            "Study Hours": "3",
            "Details": [
                "Study Process Management and Scheduling.",
                "Focus on Memory Management and Virtual Memory.",
                "Review File Systems and I/O Management."
            ]
        },
        {
            "Task/Topic": "Database Management Systems",
            "Date": "2025-03-07",
            "Study Hours": "3",
            "Details": [
                "Study Relational Algebra and SQL.",
                "Focus on Normalization and Denormalization.",
                "Review Transaction Management concepts."
            ]
        },
        {
            "Task/Topic": "Compiler Design",
            "Date": "2025-03-08",
            "Study Hours": "3",
            "Details": [
                "Study Lexical Analysis and Syntax Analysis.",
                "Focus on Intermediate Code Generation.",
                "Review Parsing Techniques and Context-Free Grammars."
            ]
        },
        {
            "Task/Topic": "Practice Test",
            "Date": "2025-03-09",
            "Study Hours": "3",
            "Details": [
                "Attempt another full-length GATE mock test.",
                "Focus on improving speed and accuracy.",
                "Review difficult topics and weak areas."
            ]
        }
    ],"Week": 3, "Tasks": [
        {
            "Task/Topic": "Microprocessors and Interfacing",
            "Date": "2025-03-10",
            "Study Hours": "3",
            "Details": [
                "Study 8085 Microprocessor Architecture.",
                "Focus on Interrupts and Programming.",
                "Review Interfacing peripherals like Keyboards and Displays."
            ]
        },
        {
            "Task/Topic": "Control Systems",
            "Date": "2025-03-11",
            "Study Hours": "3",
            "Details": [
                "Study Time Response Analysis.",
                "Focus on Frequency Response and Stability.",
                "Review Compensators and Controllers."
            ]
        },
        {
            "Task/Topic": "Revision and Strategy",
            "Date": "2025-03-12",
            "Study Hours": "3",
            "Details": [
                "Revise all high-weightage topics.",
                "Focus on weak areas identified from mock tests.",
                "Plan exam strategy and time management."
            ]
        },
        {
            "Task/Topic": "Final Mock Test",
            "Date": "2025-03-13",
            "Study Hours": "3",
            "Details": [
                "Attempt a final full-length GATE mock test.",
                "Analyze performance and finalize preparation.",
                "Stay calm and confident for the exam."
            ]
          }]}`,
    planId: "67db206b001aba1a4aa2",
  };
  const [planData, setPlanData] = useState([]);
  const [userMessage, setuserMessage] = useState("");
  const [expandedWeeks, setExpandedWeeks] = useState({}); // Track which weeks are expanded
  const [isLoading, setIsLoading] = useState(false); // Add loading state

  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("userSession"))
  );

  // Move parseResponse outside useEffect so it can be reused
  const parseResponse = (responseText) => {
    // Extract JSON content from ```json blocks
    let jsonString = responseText;

    try {
      // Custom parsing for the specific JSON structure with repeated Week keys
      const weekRegex = /"Week":\s*(\d+)/g;
      const weekMatches = [...jsonString.matchAll(weekRegex)];

      // Initialize array for processed weeks
      const processedData = [];

      // Process each week separately
      for (let i = 0; i < weekMatches.length; i++) {
        const weekMatch = weekMatches[i];
        const weekNum = parseInt(weekMatch[1]);
        const weekStartIndex = weekMatch.index;

        // Find the end of this week's data (either next week or end of JSON)
        let weekEndIndex;
        if (i < weekMatches.length - 1) {
          weekEndIndex = weekMatches[i + 1].index;
        } else {
          weekEndIndex = jsonString.length;
        }

        // Extract this week's JSON string
        const weekJsonString = jsonString.substring(
          weekStartIndex,
          weekEndIndex
        );

        // Find tasks array using regex
        const tasksMatch = weekJsonString.match(
          /\[\s*(\{[\s\S]*?\}(?:\s*,\s*\{[\s\S]*?\})*)\s*\]/
        );

        if (tasksMatch && tasksMatch[1]) {
          const tasksString = `[${tasksMatch[1]}]`;

          // Parse tasks array
          try {
            const tasks = JSON.parse(tasksString);
            processedData.push({
              week: weekNum,
              tasks: tasks,
            });
          } catch (e) {
            console.error(`Error parsing tasks for week ${weekNum}:`, e);
            // Try alternative approach with individual task parsing
            const individualTasksRegex = /\{\s*"Task\/Topic"[\s\S]*?\}/g;
            const individualTasks = [
              ...tasksString.matchAll(individualTasksRegex),
            ]
              .map((match) => {
                try {
                  return JSON.parse(match[0]);
                } catch {
                  return null;
                }
              })
              .filter((task) => task !== null);

            if (individualTasks.length > 0) {
              processedData.push({
                week: weekNum,
                tasks: individualTasks,
              });
            }
          }
        }
      }

      return { planData: processedData };
    } catch (error) {
      console.error("Failed to parse JSON:", error);
      return { planData: [] };
    }
  };

  useEffect(() => {
    if (plan) {
      try {
        const planDataTemp = parseResponse(plan).planData;

        setPlanData(planDataTemp);

        // Set first week expanded by default if available
        if (planDataTemp.length > 0) {
          setExpandedWeeks({ [planDataTemp[0].week]: true });
        }
      } catch (error) {
        console.error("Error processing plan:", error);
      }
    }
  }, []);

  const toggleWeekExpansion = (weekNum) => {
    setExpandedWeeks((prev) => ({
      ...prev,
      [weekNum]: !prev[weekNum],
    }));
  };

  const handleRecreate = () => {
    console.log("Recreating plan with:", userMessage);
    setIsLoading(true); // Set loading to true before API call

    axios
      .post("http://localhost:5000/edit-study-plan", {
        originalPlan: plan,
        userMessage: userMessage,
        planId: planId,
        previousInput: previousInput,
      })
      .then((res) => {
        console.log("Plan changed response:", res.data);

        // Get the new plan content
        const newPlanContent = res.data.choices[0].message.content;

        // Parse the new plan content
        const { planData: newPlanData } = parseResponse(newPlanContent);

        // Update the state with the new plan data
        setPlanData(newPlanData);

        // Set first week expanded by default if available
        if (newPlanData.length > 0) {
          setExpandedWeeks({ [newPlanData[0].week]: true });
        }

        console.log("reason for stop:", res.data.choices[0].finish_reason);
        setIsLoading(false); // Set loading to false after processing response
      })
      .catch((error) => {
        console.error("Error recreating plan:", error);
        setIsLoading(false); // Set loading to false even if there's an error
      });
  };

  const handleConfirmPlan = () => {
    console.log("Plan confirmed");
    setIsLoading(true); // Add loading state while playlists are being created

    axios
      .post("http://localhost:5000/add-playlists", {
        planId: planId,
      })
      .then((response) => {
        console.log("Playlists added successfully:", response.data);
        setIsLoading(false);
        navigate("/dashboard/feature1");
      })
      .catch((error) => {
        console.error("Error adding playlists:", error);
        setIsLoading(false);
        navigate("/dashboard/feature1"); // Still navigate even if there's an error
      });
  };

  return (
    <div className="w-full min-h-screen bg-[#f8f8ec] font-sans">
      {/* Main Content Container with Flex Layout */}
      <div className="h-full flex">
        {/* Study Plan Display - Left Side (70%) */}
        <div className="w-[70%] p-5 bg-white overflow-y-auto">
          <h2 className="text-gray-800 text-2xl pb-[10px] mb-5 border-b-2 border-[#c4e456]">
            Study Plan {goal ? `for ${goal}` : ""}
          </h2>

          {planData.length > 0 ? (
            planData.map((weekData, weekIndex) => (
              <div
                key={weekIndex}
                className="mb-8 bg-[#fbfbf5] rounded-lg shadow-sm overflow-hidden"
              >
                <div
                  className="p-4 border-b border-[#e0e0d0] cursor-pointer flex justify-between items-center hover:bg-[#f0f0e0] transition-colors"
                  onClick={() => toggleWeekExpansion(weekData.week)}
                >
                  <h3 className="text-gray-800 font-semibold">
                    WEEK {weekData.week}
                  </h3>
                  <div className="text-gray-600">
                    {expandedWeeks[weekData.week] ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 15l7-7 7 7"
                        />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    )}
                  </div>
                </div>

                {expandedWeeks[weekData.week] && (
                  <div className="p-4">
                    {weekData.tasks &&
                      weekData.tasks.map((task, taskIndex) => (
                        <div
                          key={taskIndex}
                          className="mb-5 p-4 bg-white rounded-md border border-[#e0e0d0]"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-6 h-6 bg-[#c4e456] text-gray-800 rounded-[3px] flex items-center justify-center font-bold text-sm">
                              {taskIndex + 1}
                            </div>

                            <div className="flex-1">
                              <h4 className="text-gray-700 font-semibold mb-3">
                                {task["Topic"] || "Untitled Task"}
                              </h4>

                              <div className="flex flex-wrap gap-2 mb-3">
                                <span className="bg-[#eaefce] px-2 py-1 rounded text-sm font-medium text-gray-700">
                                  Date: {task.Date || "Not specified"}
                                </span>
                                <span className="bg-[#f0f0e0] px-2 py-1 rounded text-sm font-medium text-gray-700">
                                  Study Hours: {task["Study Hours"] || "0"}
                                </span>
                              </div>

                              <div className="mt-3">
                                <div className="text-sm font-medium text-gray-600 mb-1">
                                  Details:
                                </div>
                                <ul className="list-disc pl-5 text-gray-600">
                                  {Array.isArray(task.Details) ? (
                                    task.Details.map((detail, detailIndex) => (
                                      <li key={detailIndex} className="mb-1">
                                        {detail}
                                      </li>
                                    ))
                                  ) : (
                                    <li>
                                      {task.Details || "No details available"}
                                    </li>
                                  )}
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="p-5 bg-[#f4f4e8] rounded-lg text-center text-gray-600">
              No study plan data available
            </div>
          )}

          <div className="w-full flex justify-end gap-3">
            <button
              onClick={() => navigate("/dashboard/feature1/new")}
              type="button"
              className="px-6 py-2 text-sm font-light rounded-md border border-slate-400"
            >
              Back
            </button>
            <button
              className="px-6 py-2 text-sm font-light rounded-md text-black bg-[#c4e456] disabled:opacity-70 disabled:cursor-not-allowed"
              onClick={handleConfirmPlan}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-black"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Creating Playlists...
                </span>
              ) : (
                "Confirm Plan"
              )}
            </button>
          </div>
        </div>

        {/* Recreate Plan Section - Right Side (30%) */}
        <div className="w-[30%] p-5 bg-[#fbfbf5]">
          <div className="sticky top-5 p-2 bg-[#fbfbf5] rounded-lg ">
            <h3 className="text-gray-800 text-xl pb-2 mb-4 border-b-2">
              Recreate Plan
            </h3>
            <p className="text-gray-600 mb-3">
              To customize the timetable, please provide your course syllabus,
              learning materials, or any specific changes you'd like to make.
            </p>
            <textarea
              value={userMessage}
              onChange={(e) => setuserMessage(e.target.value)}
              placeholder="Enter details to recreate your plan..."
              className="w-full h-40 p-3 border border-[#e0e0d0] rounded-md focus:outline-none focus:ring-2 focus:ring-[#fbfbf5] resize-none"
              disabled={isLoading}
            />
            <button
              onClick={handleRecreate}
              className="mt-4 px-6 py-2 text-sm font-light rounded-md text-black bg-[#c4e456] hover:bg-[#b3d147] transition-colors w-full disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-black"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Generating...
                </>
              ) : (
                "Re-generate Plan"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewPlan;
