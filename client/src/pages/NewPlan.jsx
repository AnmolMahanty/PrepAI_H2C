import React, { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const NewPlan = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("userSession"))
  );
  // Form state
  const [formData, setFormData] = useState({
    planType: "",
    goal: "",
    startDate: "",
    endDate: "",
    studyHours: 1,
    preferredDays: [],
  });
  // Add loading state
  const [loading, setLoading] = useState(false);

  // Days of the week
  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const handlecancelClick = () => {
    navigate("/dashboard/feature1");
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); // Set loading to true when submitting

    // Get day of week from startDate
    const startDateObj = new Date(formData.startDate);
    const daysOfWeek = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const startDay = daysOfWeek[startDateObj.getDay()];

    console.log("Form data:", formData);
    console.log("Start day:", startDay);

    // axios.post("http://localhost:5000/generate-study-plan", { goal: "Gate exam", startDate: "18/3/25", deadline: "18/4/25", studyhrs: "4", days: "monday, tuesday, wednesday" ,userId: user.$id}).then((response) => {
    //   console.log("New plan created:", response.data);
    //   console.log("Plan created:", response.data.choices[0].message.content);
    //   console.log("reason for stop", response.data.choices[0].finish_reason);
    //   console.log("Requesting changes to the plan");

    //   axios.post("http://localhost:5000/edit-study-plan", { originalPlan: response.data.choices[0].message.content, userMessage: " give more days to digital logics" ,planId:response.data.planId}).then((res) => {
    //     console.log("Plan changed response:", res.data);
    //     console.log("Plan changed:", res.data.choices[0].message.content);
    //     console.log("reason for stop", res.data.choices[0].finish_reason);
    //   });
    // });
    const AiInput = {
      type: formData.planType,
      goal: formData.goal,
      startDate: formData.startDate,
      startDay: startDay, // Added startDay parameter
      deadline: formData.endDate,
      studyhrs: formData.studyHours,
      days: formData.preferredDays.join(", "),
      userId: user.$id,
    };
    axios
      .post("http://localhost:5000/generate-study-plan", AiInput)
      .then((response) => {
        console.log("New plan created:", response.data);
        navigate("/dashboard/feature1/review-plan", {
          state: {
            goal: formData.goal,
            plan: response.data.plan,
            planId: response.data.planId,
            previousInput: AiInput,
          },
        });
      })
      .catch((error) => {
        console.error("Error creating plan:", error);
        setLoading(false); // Reset loading state if there's an error
      });
  };

  const handlePlanTypeChange = (value) => {
    setFormData({
      ...formData,
      planType: value,
      goal: "",
    });
  };

  const handleGoalChange = (value) => {
    setFormData({
      ...formData,
      goal: value,
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleStudyHoursChange = (direction) => {
    let newHours = formData.studyHours + direction;
    // Ensure hours stays between 1 and 12
    newHours = Math.max(1, Math.min(12, newHours));

    setFormData({
      ...formData,
      studyHours: newHours,
    });
  };

  const handleDayToggle = (day) => {
    const currentDays = [...formData.preferredDays];

    if (currentDays.includes(day)) {
      setFormData({
        ...formData,
        preferredDays: currentDays.filter((d) => d !== day),
      });
    } else {
      setFormData({
        ...formData,
        preferredDays: [...currentDays, day],
      });
    }
  };

  const handleSelectAllDays = () => {
    if (formData.preferredDays.length === daysOfWeek.length) {
      // If all days are currently selected, deselect all
      setFormData({
        ...formData,
        preferredDays: [],
      });
    } else {
      // Otherwise select all days
      setFormData({
        ...formData,
        preferredDays: [...daysOfWeek],
      });
    }
  };

  return (
    <div className="w-full min-h-screen flex justify-center items-center p-4 bg-white">
      <div className="w-full max-w-5xl">
        <div className="p-6">
          <h2 className="text-2xl font-light mb-10 text-center">
            Create Study Plan
          </h2>

          <form className="grid grid-cols-2 gap-8">
            <div className="space-y-2">
              <Label htmlFor="planType" className="text-sm font-light">
                Type of Study Plan
              </Label>
              <Select
                value={formData.planType}
                onValueChange={handlePlanTypeChange}
              >
                <SelectTrigger className="w-full bg-transparent border-slate-200">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="exam_prep">Exam Prep</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="goal" className="text-sm font-light">
                Goal
              </Label>
              {formData.planType === "exam_prep" ? (
                <Select value={formData.goal} onValueChange={handleGoalChange}>
                  <SelectTrigger className="w-full bg-transparent border-slate-200">
                    <SelectValue placeholder="Select exam" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="JEE">JEE</SelectItem>
                    <SelectItem value="NEET">NEET</SelectItem>
                    <SelectItem value="GATE">GATE</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="goal"
                  name="goal"
                  value={formData.goal}
                  onChange={handleInputChange}
                  placeholder="Enter your goal"
                  className="w-full bg-transparent border-slate-200"
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate" className="text-sm font-light">
                Start Date
              </Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                value={formData.startDate}
                onChange={handleInputChange}
                className="w-full bg-transparent border-slate-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate" className="text-sm font-light">
                End Date
              </Label>
              <Input
                id="endDate"
                name="endDate"
                type="date"
                value={formData.endDate}
                onChange={handleInputChange}
                className="w-full bg-transparent border-slate-200"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-light">Study Hours</Label>
              <div className="flex items-center border border-slate-200 rounded-md p-2">
                <button
                  type="button"
                  onClick={() => handleStudyHoursChange(-1)}
                  className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-slate-100"
                >
                  -
                </button>
                <div className="flex-1 text-center">{formData.studyHours}</div>
                <button
                  type="button"
                  onClick={() => handleStudyHoursChange(1)}
                  className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-slate-100"
                >
                  +
                </button>
              </div>
            </div>

            <div className="space-y-2 col-span-2">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-light">Preferred Days</Label>
                <button
                  type="button"
                  onClick={handleSelectAllDays}
                  className="text-xs text-slate-500 hover:text-slate-700 hover:underline"
                >
                  {formData.preferredDays.length === daysOfWeek.length
                    ? "Deselect All"
                    : "Select All"}
                </button>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {daysOfWeek.map((day) => (
                  <div
                    key={day}
                    onClick={() => handleDayToggle(day)}
                    className={`flex flex-col items-center justify-center p-2 rounded-md border cursor-pointer transition-colors ${
                      formData.preferredDays.includes(day)
                        ? "bg-slate-100"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="text-xs">{day.substring(0, 3)}</div>
                    <div className="mt-1 h-4 w-4 rounded-full border flex items-center justify-center">
                      {formData.preferredDays.includes(day) && (
                        <div className="h-2 w-2 rounded-full bg-slate-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </form>
        </div>

        <div className="flex justify-end gap-4 p-6 border-t border-slate-100">
          <button
            type="button"
            className="px-6 py-2 text-sm font-light rounded-md border border-slate-200"
            onClick={handlecancelClick}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 text-sm font-light rounded-md text-black bg-[#c4e456] flex items-center justify-center"
            onClick={handleFormSubmit}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-black border-t-transparent rounded-full mr-2"></div>
                Generating...
              </>
            ) : (
              "Create Plan"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewPlan;
