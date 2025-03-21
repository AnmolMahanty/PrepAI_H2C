import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
} from "lucide-react";
import axios from "axios";

// Sample data for study plans
const sampleEvents = [
  {
    id: "evt001",
    name: "Algorithms Study",
    topic: "Computer Science",
    subtopic: "Sorting Algorithms",
    date: new Date(2025, 2, 10),
    isCompleted: false,
    color: "#ffcccb",
  },
  {
    id: "evt002",
    name: "Machine Learning Basics",
    topic: "AI",
    subtopic: "Supervised Learning",
    date: new Date(2025, 2, 11),
    isCompleted: false,
    color: "#c6e6fb",
  },
  {
    id: "evt003",
    name: "French Vocabulary",
    topic: "Languages",
    subtopic: "Common Phrases",
    date: new Date(2025, 2, 12),
    isCompleted: false,
    color: "#d8f3dc",
  },
  {
    id: "evt004",
    name: "Economic Principles",
    topic: "Economics",
    subtopic: "Supply and Demand",
    date: new Date(2025, 2, 14),
    isCompleted: true,
    color: "#ffd6a5",
  },
  {
    id: "evt005",
    name: "Organic Chemistry",
    topic: "Chemistry",
    subtopic: "Carbon Compounds",
    date: new Date(2025, 2, 9),
    isCompleted: false,
    color: "#caffbf",
  },
  {
    id: "evt006",
    name: "History Review",
    topic: "History",
    subtopic: "World War II",
    date: new Date(2025, 2, 10),
    isCompleted: false,
    color: "#ffe8d6",
  },
];

const Calender = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("monthly"); // 'monthly' or 'weekly'
  const [events, setEvents] = useState([]); // Initialize with empty array, not sampleEvents
  const [plans, setPlans] = useState([]);
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("userSession"))
  );

  useEffect(() => {
    console.log("Fetching plans data...");
    axios
      .post("http://localhost:5000/get-plans", { userId: user.$id })
      .then((res) => {
        console.log("Plans data received:", res.data);
        setPlans(res.data);

        // Array to hold all task events
        const allTaskEvents = [];

        // Process each plan
        res.data.forEach((plan, planIndex) => {
          console.log(`Processing plan ${planIndex}:`, plan);

          try {
            // Parse the stringified JSON plan
            let parsedPlan;
            if (typeof plan.plan === "string") {
              parsedPlan = JSON.parse(plan.plan);
              console.log(`Successfully parsed plan ${planIndex}`);
            } else if (Array.isArray(plan.plan)) {
              parsedPlan = plan.plan;
              console.log(`Plan ${planIndex} is already an array`);
            } else {
              console.error(`Plan ${planIndex} has invalid format`, plan.plan);
              return; // Skip this plan
            }

            // Extract tasks from each week in the plan
            parsedPlan.forEach((week, weekIndex) => {
              console.log(`Processing week ${week.Week || weekIndex + 1}`);

              // Check if week has tasks
              const tasks = week.Tasks || [];
              console.log(
                `Week ${week.Week || weekIndex + 1} has ${tasks.length} tasks`
              );

              // Process each task in the week
              tasks.forEach((task, taskIndex) => {
                // Parse task date
                let taskDate;
                try {
                  taskDate = new Date(task.Date);
                  if (isNaN(taskDate.getTime())) {
                    console.error("Invalid date format for task:", task);
                    taskDate = new Date(); // Fallback to today
                  }
                } catch (error) {
                  console.error("Error parsing task date:", error);
                  taskDate = new Date(); // Fallback to today
                }

                console.log(`Task: ${task.Topic}, Date: ${taskDate}`);

                // Generate a color based on the subject
                const colorMapping = {
                  Physics: "#ffcccb",
                  Chemistry: "#c6e6fb",
                  Biology: "#d8f3dc",
                  Revision: "#ffd6a5",
                  "Full-Length": "#caffbf",
                  Final: "#ffe8d6",
                };

                // Extract subject from Topic (assuming format: "Subject - Topic")
                const subject = task.Topic.split(" - ")[0];
                const color = colorMapping[subject] || "#c6e6fb";

                allTaskEvents.push({
                  id: `task-${planIndex}-${weekIndex}-${taskIndex}`,
                  name: task.Topic,
                  topic: `Week ${week.Week || weekIndex + 1}`,
                  subtopic: task.Details ? task.Details.join(" ") : "",
                  date: taskDate,
                  isCompleted: task.testTaken || false,
                  color: color,
                  studyHours: task["Study Hours"] || 0,
                  ytPlaylist: task.YTplaylist || "",
                  originalTask: task,
                });
              });
            });
          } catch (error) {
            console.error(`Error processing plan ${planIndex}:`, error);
          }
        });

        console.log("All task events:", allTaskEvents);
        // Use only task events, no sample events
        setEvents(allTaskEvents);
      })
      .catch((error) => {
        console.error("Error fetching plans:", error);
      });
  }, [user.$id]);

  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  );
  const firstDayOfGrid = new Date(firstDayOfMonth);
  firstDayOfGrid.setDate(firstDayOfGrid.getDate() - firstDayOfGrid.getDay());

  // Handle event click
  const handleEventClick = (eventId) => {
    console.log(`Navigating to event: ${eventId}`);
    // In a real app, you would use router navigation here
    // navigate(`/study-plan/${eventId}`);
  };

  // Handle completion toggle
  const handleCompletionToggle = (eventId, isCompleted) => {
    setEvents(
      events.map((event) => {
        if (event.id === eventId) {
          const updatedEvent = { ...event, isCompleted: !isCompleted };

          if (!isCompleted) {
            console.log({
              id: updatedEvent.id,
              name: updatedEvent.name,
              topic: updatedEvent.topic,
              subtopic: updatedEvent.subtopic,
            });
          } else {
            console.log("unchecked");
          }

          return updatedEvent;
        }
        return event;
      })
    );
  };

  // Navigate to previous month/week
  const navigatePrevious = () => {
    const newDate = new Date(currentDate);
    if (viewMode === "monthly") {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setDate(newDate.getDate() - 7);
    }
    setCurrentDate(newDate);
  };

  // Navigate to next month/week
  const navigateNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === "monthly") {
      newDate.setMonth(newDate.getMonth() + 1);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  // Get events for a specific date - update to handle any date format issues
  const getEventsForDate = (date) => {
    if (!events || events.length === 0) {
      return [];
    }

    console.log(`Getting events for date: ${date.toDateString()}`);
    const matchingEvents = events.filter((event) => {
      // Handle potential invalid dates
      if (!(event.date instanceof Date) || isNaN(event.date.getTime())) {
        console.warn("Invalid date found in event:", event);
        return false;
      }

      const matches =
        event.date.getDate() === date.getDate() &&
        event.date.getMonth() === date.getMonth() &&
        event.date.getFullYear() === date.getFullYear();

      if (matches) {
        console.log(`Found matching event for ${date.toDateString()}:`, event);
      }

      return matches;
    });

    return matchingEvents;
  };

  // Generate the grid for monthly view
  const generateMonthlyGrid = () => {
    const daysInMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    ).getDate();
    const monthGridDays = [];
    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    // Add days from previous month to fill the first week
    const currentDay = new Date(firstDayOfGrid);

    for (let i = 0; i < 42; i++) {
      const isCurrentMonth = currentDay.getMonth() === currentDate.getMonth();
      const isToday =
        currentDay.getDate() === new Date().getDate() &&
        currentDay.getMonth() === new Date().getMonth() &&
        currentDay.getFullYear() === new Date().getFullYear();

      const dayEvents = getEventsForDate(currentDay);

      monthGridDays.push(
        <div
          key={`day-${i}`}
          className={`border border-gray-200 min-h-32 p-1 ${
            isCurrentMonth ? "bg-white" : "bg-gray-50 text-gray-400"
          } ${isToday ? "border-2 border-green-400" : ""}`}
        >
          <div className="text-right text-sm mb-1">{currentDay.getDate()}</div>
          <div className="space-y-1 max-h-28 overflow-y-auto">
            {dayEvents.map((event) => (
              <div
                key={event.id}
                className={`rounded p-1 text-xs cursor-pointer transition-all duration-300 hover:shadow-md ${
                  event.isCompleted
                    ? "bg-gray-200 line-through text-gray-500"
                    : `bg-opacity-90 hover:bg-opacity-100`
                }`}
                style={{
                  backgroundColor: event.isCompleted ? "#d1d5db" : event.color,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleEventClick(event.id);
                }}
              >
                <div className="mb-1">
                  <div className="font-medium truncate">{event.name}</div>
                </div>
                {event.studyHours && (
                  <div className="text-xs flex items-center mt-1">
                    <Clock size={10} className="mr-1" />
                    {event.studyHours} hrs
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      );

      currentDay.setDate(currentDay.getDate() + 1);
    }

    return (
      <div className="grid grid-cols-7  bg-white rounded-md overflow-hidden shadow-sm">
        {weekDays.map((day) => (
          <div
            key={day}
            className="p-2 text-center text-sm font-medium bg-gray-50 border-b border-gray-200"
          >
            {day}
          </div>
        ))}
        {monthGridDays}
      </div>
    );
  };

  // Generate weekly view
  const generateWeeklyView = () => {
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay());

    const weekDays = [];
    const weekDayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(day.getDate() + i);

      const isToday =
        day.getDate() === new Date().getDate() &&
        day.getMonth() === new Date().getMonth() &&
        day.getFullYear() === new Date().getFullYear();

      const dayEvents = getEventsForDate(day);

      weekDays.push(
        <div key={`week-day-${i}`} className="flex flex-col">
          <div
            className={`text-center py-2 ${
              isToday ? "bg-green-100 font-medium" : "bg-gray-50"
            }`}
          >
            <div className="text-sm font-medium">{weekDayNames[i]}</div>
            <div className={`text-lg ${isToday ? "text-green-600" : ""}`}>
              {day.getDate()}
            </div>
          </div>
          <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-96">
            {dayEvents.map((event) => (
              <div
                key={event.id}
                className={`rounded p-2 text-sm cursor-pointer transition-all duration-300 hover:shadow-md ${
                  event.isCompleted
                    ? "bg-gray-200 line-through text-gray-500"
                    : `bg-opacity-90 hover:bg-opacity-100`
                }`}
                style={{
                  backgroundColor: event.isCompleted ? "#d1d5db" : event.color,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleEventClick(event.id);
                }}
              >
                <div className="mb-1">
                  <div className="font-medium">{event.name}</div>
                </div>
                <div className="text-xs mt-1">
                  {event.studyHours && (
                    <div className="flex items-center">
                      <Clock size={12} className="mr-1" />
                      {event.studyHours} hours
                    </div>
                  )}
                  {event.subtopic && (
                    <div className="mt-1 text-gray-600">
                      {event.subtopic.substring(0, 40)}
                      {event.subtopic.length > 40 ? "..." : ""}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-7 gap-1 bg-white rounded-md overflow-hidden shadow-sm h-96">
        {weekDays}
      </div>
    );
  };

  return (
    <div
      className="w-full mx-auto p-4 bg-beige text-gray-800 font-sans"
      style={{ backgroundColor: "#f8f8ec" }}
    >
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Header Section */}
        <div className="p-4 bg-white border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={navigatePrevious}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>

            <div className="text-xl font-medium">
              {viewMode === "monthly"
                ? `${new Intl.DateTimeFormat("en-US", {
                    month: "long",
                    year: "numeric",
                  }).format(currentDate)}`
                : `Week of ${new Intl.DateTimeFormat("en-US", {
                    month: "short",
                    day: "numeric",
                  }).format(
                    new Date(
                      currentDate.setDate(
                        currentDate.getDate() - currentDate.getDay()
                      )
                    )
                  )}`}
            </div>

            <button
              onClick={navigateNext}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1 text-sm rounded border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Today
            </button>

            <div className="flex rounded overflow-hidden border border-gray-300">
              <button
                onClick={() => setViewMode("monthly")}
                className={`px-3 py-1 text-sm transition-colors ${
                  viewMode === "monthly"
                    ? "bg-green-100 text-green-800"
                    : "bg-white hover:bg-gray-50"
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setViewMode("weekly")}
                className={`px-3 py-1 text-sm transition-colors ${
                  viewMode === "weekly"
                    ? "bg-green-100 text-green-800"
                    : "bg-white hover:bg-gray-50"
                }`}
              >
                Week
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="p-4">
          {viewMode === "monthly"
            ? generateMonthlyGrid()
            : generateWeeklyView()}
        </div>
      </div>
    </div>
  );
};

export default Calender;
