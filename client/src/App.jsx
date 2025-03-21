import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./lib/context/AuthContext";
import Home from "./pages/Home";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import Feature1 from "./pages/Feature1";
import Feature2 from "./pages/Feature2";
import Calender from "./pages/Calender";
import PlanDetailsPage from "./pages/PlanDetail";
import NewPlan from "./pages/NewPlan";
import ReviewPlan from "./pages/ReviewPlan";
import PrivateRoutes from "./pages/utils/PrivateRoutes";
import NotFound from "./pages/NotFound";
import QuizPage from "./pages/QuizPage";
import MomBot from "./pages/MomBot";
import CheatSheet from "./pages/CheatSheet";

function App() {
  return (
    <>
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="*" element={<NotFound />} />
            <Route path="/" element={<Home />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route element={<PrivateRoutes />}>
              <Route path="/dashboard" element={<Dashboard />}>
                <Route path="feature1" element={<Feature1 />} />
                <Route path="feature2" element={<Feature2 />} />
                <Route path="calender" element={<Calender />} />
                <Route path="plandetail" element={<PlanDetailsPage />} />
                <Route path="plandetail/cheatsheet" element={<CheatSheet />} />
                <Route path="/dashboard/feature1/new" element={<NewPlan />} />
                <Route
                  path="/dashboard/feature1/review-plan"
                  element={<ReviewPlan />}
                />
                <Route path="quiz" element={<QuizPage />} />
                <Route path="momBot" element={<MomBot />} />
              </Route>
            </Route>
          </Routes>
        </AuthProvider>
      </Router>
    </>
  );
}

export default App;
