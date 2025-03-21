import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Calendar,
  Clock,
  Award,
  Youtube,
  Lock,
  AlertCircle,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const PlanDetailsPage = () => {
  const [planData, setPlanData] = useState(null);
  let location = useLocation();
  let navigate = useNavigate();

  const [showPostponeModal, setShowPostponeModal] = useState(false);
  const [postponeDays, setPostponeDays] = useState(1);
  const [postponeReason, setPostponeReason] = useState("");

  useEffect(() => {
    if (location.state && location.state.planData) {
      const rawData = JSON.parse(location.state.planData.plan);

      // Trim the last 21 characters from the plan name
      const planName = location.state.planData.name
        ? location.state.planData.name.slice(0, -21)
        : "Unnamed Plan";

      // Transform data to match UI expectations and add dependencies
      const transformedData = {
        planName: planName,
        startTime: rawData[0]?.Tasks[0]?.Date || "Not set",
        completionTime:
          rawData[rawData.length - 1]?.Tasks[
            rawData[rawData.length - 1]?.Tasks.length - 1
          ]?.Date || "Not set",
        progressStatus: 0,
        weeks: rawData.map((weekData, weekIndex) => ({
          weekName: `Week ${weekData.Week}`,
          isExpanded: false,
          topics: weekData.Tasks.map((task, taskIndex) => {
            // Calculate the previous topic's identifier for dependency tracking
            let previousId = null;

            if (weekIndex === 0 && taskIndex === 0) {
              // First topic of first week has no dependency
              previousId = null;
            } else if (taskIndex === 0) {
              // First topic of other weeks depends on the last topic of previous week
              previousId = `week-${weekData.Week - 1}-task-${
                rawData[weekIndex - 1].Tasks.length - 1
              }`;
            } else {
              // All other topics depend on previous topic in the same week
              previousId = `week-${weekData.Week}-task-${taskIndex - 1}`;
            }

            return {
              id: `week-${weekData.Week}-task-${taskIndex}`,
              name: task.Topic,
              testDate: task.Date,
              testTaken: task.testTaken,
              testScore: task.testScore,
              isCompleted: task.testTaken,
              Details: task.Details,
              studyHours: task["Study Hours"],
              YTplaylist: task.YTplaylist,
              previousTopicId: previousId,
              isAccessible: weekIndex === 0 && taskIndex === 0 ? true : false, // Only first topic is accessible initially
            };
          }),
        })),
      };

      // Process dependencies to determine which topics are accessible
      processTopicAccessibility(transformedData);

      setPlanData(transformedData);
    }
  }, [location.state]);

  // Function to determine which topics are accessible based on prerequisites
  const processTopicAccessibility = (data) => {
    // Make a flat map of all topics for easy lookup
    const topicMap = {};
    data.weeks.forEach((week) => {
      week.topics.forEach((topic) => {
        topicMap[topic.id] = topic;
      });
    });

    // For each topic, determine if it's accessible
    data.weeks.forEach((week) => {
      week.topics.forEach((topic) => {
        if (!topic.previousTopicId) {
          // First topic is always accessible
          topic.isAccessible = true;
        } else {
          const prevTopic = topicMap[topic.previousTopicId];
          // A topic is accessible if previous topic is completed with score > 70
          topic.isAccessible =
            prevTopic && prevTopic.testTaken && prevTopic.testScore >= 70;
        }
      });
    });

    return data;
  };

  useEffect(() => {
    if (planData) {
      calculateProgress();
    }
  }, [planData?.weeks]);

  const calculateProgress = () => {
    if (!planData || !planData.weeks) return;

    const totalTopics = planData.weeks.reduce(
      (sum, week) => sum + week.topics.length,
      0
    );

    const completedTopics = planData.weeks.reduce((sum, week) => {
      return sum + week.topics.filter((topic) => topic.isCompleted).length;
    }, 0);

    const newProgress =
      totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

    setPlanData((prevData) => ({
      ...prevData,
      progressStatus: newProgress,
    }));
  };

  const toggleWeekExpansion = (weekIndex) => {
    const updatedWeeks = [...planData.weeks];
    updatedWeeks[weekIndex].isExpanded = !updatedWeeks[weekIndex].isExpanded;
    setPlanData({ ...planData, weeks: updatedWeeks });
  };

  const toggleTopicCompletion = (weekIndex, topicId) => {
    const updatedWeeks = [...planData.weeks];
    const topicIndex = updatedWeeks[weekIndex].topics.findIndex(
      (topic) => topic.id === topicId
    );

    // Only toggle if topic is accessible
    if (!updatedWeeks[weekIndex].topics[topicIndex].isAccessible) {
      return;
    }

    updatedWeeks[weekIndex].topics[topicIndex].isCompleted =
      !updatedWeeks[weekIndex].topics[topicIndex].isCompleted;

    // After toggling completion, recalculate accessibility for all topics
    const updatedPlanData = {
      ...planData,
      weeks: updatedWeeks,
    };

    // Process topic accessibility after updating completion status
    processTopicAccessibility(updatedPlanData);

    // Update state and recalculate progress
    setPlanData(updatedPlanData);
  };

  const goBack = () => {
    navigate(-1);
  };

  const handleTestAction = (topicName, details, weekIndex, topicIndex) => {
    // Find the topic from the planData
    navigate("/dashboard/quiz", {
      state: {
        topic: topicName,
        description: details,
        weekIndex: weekIndex,
        topicId: topicIndex, // Just pass the task index
        planData: location.state.planData, // Pass the entire plan data
        planId: location.state.planData.$id,
      },
    });
  };

  // Mock function to simulate test completion and update test scores
  // In a real app, this would come from the quiz page after completion
  const updateTestScore = (weekIndex, topicId, score) => {
    const updatedWeeks = [...planData.weeks];
    const topicIndex = updatedWeeks[weekIndex].topics.findIndex(
      (topic) => topic.id === topicId
    );

    updatedWeeks[weekIndex].topics[topicIndex].testTaken = true;
    updatedWeeks[weekIndex].topics[topicIndex].testScore = score;

    // Process accessibility based on new test score
    const updatedPlanData = {
      ...planData,
      weeks: updatedWeeks,
    };

    processTopicAccessibility(updatedPlanData);
    setPlanData(updatedPlanData);
  };

  if (!planData) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-pulse text-xl text-gray-600">
          Loading plan data...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#f8f8ec] to-[#f2f2e6] p-0 m-0">
      <div className="max-w-screen bg-white min-h-screen shadow-xl">
        {/* Header */}
        <div className="bg-[#c4e456] bg-opacity-20 px-8 py-6 border-b border-gray-100">
          <div className="flex items-center">
            <button
              onClick={goBack}
              className="flex items-center text-gray-700 hover:text-gray-900 mr-4 transition-colors duration-200 hover:bg-white hover:bg-opacity-50 p-2 rounded-lg"
            >
              <ArrowLeft size={20} />
              <span className="ml-1 font-medium">Back</span>
            </button>
            <h1 className="text-3xl font-bold flex-grow text-gray-800">
              {planData.planName}
            </h1>
          </div>
        </div>

        <div className="p-8">
          {/* Learning sequence info message */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">
                    Learning Sequence Required:
                  </span>{" "}
                  You must complete each topic and pass its test (score 70% or
                  higher) before unlocking the next topic.
                </p>
              </div>
            </div>
          </div>

          {/* Plan Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="bg-[#f8f8ec] rounded-xl p-5 flex items-center shadow-md transform hover:scale-105 transition-transform duration-300">
              <div className="bg-white p-3 rounded-full mr-4 shadow-sm">
                <Calendar size={24} className="text-[#96b639]" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                  Start Date
                </p>
                <p className="font-semibold text-gray-800 text-lg">
                  {planData.startTime}
                </p>
              </div>
            </div>

            <div className="bg-[#f8f8ec] rounded-xl p-5 flex items-center shadow-md transform hover:scale-105 transition-transform duration-300">
              <div className="bg-white p-3 rounded-full mr-4 shadow-sm">
                <Clock size={24} className="text-[#96b639]" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                  Completion Date
                </p>
                <p className="font-semibold text-gray-800 text-lg">
                  {planData.completionTime}
                </p>
              </div>
            </div>

            <div className="bg-[#f8f8ec] rounded-xl p-5 flex items-center shadow-md transform hover:scale-105 transition-transform duration-300">
              <div className="bg-white p-3 rounded-full mr-4 shadow-sm">
                <Award size={24} className="text-[#96b639]" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                  Progress
                </p>
                <p className="font-semibold text-gray-800 text-lg">
                  {planData.progressStatus}% Complete
                </p>
              </div>
            </div>
          </div>

          {/* Weeks and Topics */}
          <div className="space-y-8">
            {planData.weeks.map((week, weekIndex) => (
              <div
                key={week.weekName}
                className="overflow-hidden rounded-xl border border-gray-200 shadow-md"
              >
                <div
                  className={`flex items-center justify-between p-5 ${
                    week.isExpanded
                      ? "bg-[#c4e456] bg-opacity-30"
                      : "bg-[#f8f8ec]"
                  } cursor-pointer transition-colors duration-300 hover:bg-opacity-40`}
                  onClick={() => toggleWeekExpansion(weekIndex)}
                >
                  <h2 className="font-bold text-xl text-gray-800">
                    {week.weekName}
                  </h2>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 mr-4 bg-white bg-opacity-70 px-3 py-1 rounded-full">
                      {week.topics.filter((t) => t.isCompleted).length}/
                      {week.topics.length} Complete
                    </span>
                    {week.isExpanded ? (
                      <ChevronUp size={22} className="text-gray-700" />
                    ) : (
                      <ChevronDown size={22} className="text-gray-700" />
                    )}
                  </div>
                </div>

                {week.isExpanded && (
                  <div className="p-5 space-y-4 bg-white">
                    {week.topics.map((topic, topicIndex) => (
                      <div
                        key={topic.id}
                        className={`flex flex-col p-5 rounded-xl transition-all duration-300 ${
                          !topic.isAccessible
                            ? "bg-gray-100 opacity-80"
                            : topic.isCompleted
                            ? "bg-green-50 border-l-4 border-[#c4e456]"
                            : "bg-[#f8f8ec] hover:bg-[#f0f0e0]"
                        } hover:shadow-lg`}
                      >
                        <div className="flex items-center flex-grow mb-4">
                          <div className="relative">
                            {!topic.isAccessible ? (
                              <div className="w-6 h-6 rounded-md border-2 flex items-center justify-center cursor-not-allowed bg-gray-200 border-gray-300">
                                <Lock size={12} className="text-gray-500" />
                              </div>
                            ) : (
                              <div
                                className={`w-6 h-6 rounded-md border-2 flex items-center justify-center cursor-pointer ${
                                  topic.isCompleted
                                    ? "bg-[#c4e456] border-[#96b639]"
                                    : "border-gray-300 bg-white"
                                }`}
                                onClick={() =>
                                  toggleTopicCompletion(weekIndex, topic.id)
                                }
                              >
                                {topic.isCompleted && (
                                  <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M5 13L9 17L19 7"
                                      stroke="#4A5532"
                                      strokeWidth="3"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                )}
                              </div>
                            )}
                          </div>
                          <label
                            className={`ml-4 font-medium ${
                              topic.isAccessible
                                ? "cursor-pointer"
                                : "cursor-not-allowed"
                            } text-lg ${
                              topic.isCompleted
                                ? "line-through text-gray-500"
                                : !topic.isAccessible
                                ? "text-gray-500"
                                : "text-gray-800"
                            }`}
                            onClick={() =>
                              topic.isAccessible &&
                              toggleTopicCompletion(weekIndex, topic.id)
                            }
                          >
                            {topic.name}
                            {!topic.isAccessible && (
                              <span className="ml-2 text-sm text-gray-500 italic">
                                (Locked)
                              </span>
                            )}
                          </label>

                          <div className="ml-auto flex items-center">
                            <div className="text-sm bg-white px-3 py-1 rounded-full border border-gray-200 text-gray-600 mr-3">
                              <span className="font-medium">
                                {topic.studyHours} hr
                              </span>
                            </div>
                            <div className="text-sm bg-white px-3 py-1 rounded-full border border-gray-200 text-gray-600">
                              <span className="font-medium">
                                {topic.testDate}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Details section */}
                        <div className="pl-10 mt-2 space-y-3">
                          <div
                            className={`text-gray-700 text-sm bg-white p-3 rounded-lg border border-gray-100 ${
                              !topic.isAccessible ? "opacity-60" : ""
                            }`}
                          >
                            <h4 className="font-semibold mb-2">
                              Study Details:
                            </h4>
                            <ul className="list-disc pl-5 space-y-1">
                              {topic.Details.map((detail, idx) => (
                                <li key={idx}>{detail}</li>
                              ))}
                            </ul>
                          </div>

                          {topic.YTplaylist && (
                            <a
                              href={topic.isAccessible ? topic.YTplaylist : "#"}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`inline-flex items-center ${
                                topic.isAccessible
                                  ? "text-red-600 hover:text-red-700"
                                  : "text-gray-400 cursor-not-allowed pointer-events-none"
                              } bg-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100`}
                              onClick={(e) =>
                                !topic.isAccessible && e.preventDefault()
                              }
                            >
                              <Youtube size={18} className="mr-2" />
                              <span>Study Playlist</span>
                            </a>
                          )}

                          <button
                            onClick={() => {
                              if (topic.isAccessible) {
                                navigate("/dashboard/plandetail/cheatsheet", {
                                  state: {
                                    topic: topic.name,
                                    details: topic.Details,
                                    type: "detailed", // Directly use detailed type
                                    studyHours: topic.studyHours,
                                  },
                                });
                              }
                            }}
                            className={`inline-flex items-center ml-2 ${
                              topic.isAccessible
                                ? "text-blue-600 hover:text-blue-700"
                                : "text-gray-400 cursor-not-allowed"
                            } bg-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100`}
                            disabled={!topic.isAccessible}
                          >
                            <span>Cheat Sheet</span>
                          </button>

                          <div className="flex justify-end mt-4">
                            {!topic.isAccessible ? (
                              <div className="flex items-center text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
                                <Lock size={14} className="mr-2" />
                                <span>
                                  {topicIndex === 0 && weekIndex > 0
                                    ? `Complete Week ${weekIndex} topics first`
                                    : `Complete previous topic with 70% or higher score`}
                                </span>
                              </div>
                            ) : topic.isCompleted ? (
                              <button
                                onClick={() =>
                                  handleTestAction(
                                    topic.name,
                                    topic.Details,
                                    weekIndex,
                                    topic.id
                                  )
                                }
                                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-300 shadow-sm hover:shadow-md ${
                                  topic.testTaken
                                    ? "bg-gray-200 text-gray-800 hover:bg-gray-300"
                                    : "bg-[#c4e456] text-gray-800 hover:bg-opacity-80 transform hover:scale-105"
                                }`}
                              >
                                {topic.testTaken
                                  ? `Score: ${topic.testScore}% | ${
                                      topic.testScore >= 70
                                        ? "Passed ✓"
                                        : "Failed ✗"
                                    }`
                                  : "Take Test"}
                              </button>
                            ) : (
                              <span className="text-sm text-gray-500 italic">
                                Complete this topic to take the test
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanDetailsPage;
