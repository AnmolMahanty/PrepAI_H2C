import React from "react";
import { useState, useEffect } from "react";
import { Plus, Quote } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const Feature1 = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Add this to detect navigation changes

  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("userSession"))
  );
  const [planId, setPlanId] = useState("");
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  const safeParseJSON = (jsonString) => {
    try {
      // Remove any backticks if present
      const cleanString = jsonString.replace(/^```json|```$/g, "");
      return JSON.parse(cleanString);
    } catch (error) {
      console.error("JSON parsing error:", error);
      return []; // Return empty array since plan data is array of weeks
    }
  };

  const calculateProgress = (planData) => {
    let totalTasks = 0;
    let completedTasks = 0;

    planData.forEach((week) => {
      week.Tasks.forEach((task) => {
        totalTasks++;
        if (task.testTaken) completedTasks++;
      });
    });

    return {
      totalTasks,
      completedPercentage: totalTasks
        ? Math.round((completedTasks / totalTasks) * 100)
        : 0,
    };
  };

  // Load plans whenever the component mounts or location changes
  useEffect(() => {
    setLoading(true);
    axios
      .post("http://localhost:5000/get-plans", { userId: user.$id })
      .then((res) => {
        setPlans(res.data);
        console.log("Plans loaded:", res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading plans:", err);
        setLoading(false);
      });
  }, [location.pathname]); // Re-run when pathname changes

  const handleNewPlanClick = () => {
    navigate("/dashboard/feature1/new");
  };

  const handlePlanClick = (planData) => {
    navigate("/dashboard/plandetail", { state: { planData } });
    console.log(planData);
  };

  return (
    <div className="w-full bg-white">
      <div className="border-b border-black/10 flex items-center h-20 px-8">
        <h3 className="text-2xl text-gray-700">Hello, {user.name}</h3>
      </div>

      <div className="w-full flex flex-col gap-4 px-8 pt-10">
        <h2 className="text-xl font-medium text-gray-800">My Plans</h2>
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* new plan card */}
          <div
            onClick={handleNewPlanClick}
            className="border border-gray-200 rounded-lg bg-white hover:bg-[#f8f8ec] transition-colors cursor-pointer flex items-center justify-center h-[180px]"
          >
            <div className="flex flex-col items-center gap-2">
              <Plus size={20} className="text-gray-400" />
              <p className="text-sm text-gray-500">New plan</p>
            </div>
          </div>

          {/* Loading indicator */}
          {loading && (
            <div className="col-span-full py-8 text-center text-gray-500">
              Loading plans...
            </div>
          )}

          {/* Dynamic card data*/}
          {!loading &&
            plans.map((plan) => {
              const parsedPlan = safeParseJSON(plan.plan);
              const { totalTasks, completedPercentage } =
                calculateProgress(parsedPlan);
              // Trim the last 21 characters from the plan name
              const trimmedName = plan.name
                ? plan.name.slice(0, -21)
                : "Unnamed Plan";
              return (
                <div
                  key={plan.$id}
                  onClick={() => handlePlanClick(plan)}
                  className="flex flex-col justify-between h-[180px] rounded-lg border border-gray-200/70 bg-[#f8f8ec] hover:scale-[102%] transition-all cursor-pointer p-4"
                >
                  <div>
                    <h3 className="text-base font-medium text-gray-800">
                      {trimmedName}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {parsedPlan.length} weeks
                    </p>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-500">Tasks</span>
                      <span className="text-gray-700">{totalTasks} tasks</span>
                    </div>

                    <div className="w-full bg-white rounded-full h-1.5">
                      <div
                        className="bg-[#c4e456] h-1.5 rounded-full"
                        style={{ width: `${completedPercentage}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 text-right">
                      {completedPercentage}% complete
                    </p>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

export default Feature1;
