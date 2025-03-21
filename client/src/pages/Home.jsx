import React, { useState, useEffect } from "react";
import {
  Sparkles,
  BookOpen,
  Brain,
  BarChart3,
  Users,
  ChevronDown,
  ChevronRight,
  Star,
  ArrowRight,
  ArrowDown,
  Check,
  Menu,
  X,
  Calendar,
  LineChart,
  CheckSquare,
} from "lucide-react";
import Navbar from "../components/Navbar";
import image from "../assets/image.png";
import { useAuth } from "../lib/context/AuthContext";
import { useNavigate } from "react-router-dom";
import Hero from "../assets/hero.jpg";

const Home = () => {
  const [scrollY, setScrollY] = useState(0);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleNavigateClick = () => {
    const selected = localStorage.getItem("selected");
    if (user) {
      if (selected === "feature2") {
        localStorage.setItem("selected", "feature1");
        navigate("/dashboard/feature1");
      } else {
        navigate("/dashboard/feature1");
      }
      console.log(selected);
    } else {
      navigate("signin");
    }
  };

  return (
    <div className="bg-[#ffffff] text-black min-h-screen font-sans overflow-x-hidden">
      {/* Navigation */}
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-20 md:pt-24 md:pb-32 px-12 relative">
        <div
          className="absolute top-0 left-0 w-full h-full opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 40% 20%, rgba(196, 228, 86, 1) 0%, transparent 45%)",
          }}
        />

        <div className="container mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div
            className="relative"
            style={{
              transform: `translateY(${scrollY * 0.05}px)`,
            }}
          >
            <div className="absolute -left-6 -top-6 w-20 h-20 bg-[#c4e456]/10 rounded-full blur-xl" />
            <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
              Study Smarter with{" "}
              <span className="text-[#c4e456] relative">
                AI-Powered
                <div className="absolute -right-2 -top-2">
                  <Sparkles
                    size={20}
                    className="text-[#1e2508] animate-pulse"
                  />
                </div>
              </span>{" "}
              Learning
            </h1>
            <p className="text-lg text-gray-700 mb-8">
              Personalized study plans that adapt in real-time to your learning
              style, progress, and goals.
            </p>
            <button
              className="bg-[#c4e456] text-black px-8 py-3 rounded-md font-medium hover:bg-[#d2ee7a] transition-all duration-300 shadow-lg shadow-[#c4e456]/20 group flex items-center space-x-2"
              onClick={handleNavigateClick}
            >
              <span>Get My Study Plan</span>
              <ArrowRight
                size={18}
                className="group-hover:translate-x-1 transition-transform duration-300"
              />
            </button>
          </div>

          {/* Add the image container */}
          <div className="relative hidden md:block">
            <img
              src={Hero}
              alt="Hero illustration"
              className="w-full h-full object-contain rounded-lg"
              style={{
                transform: `translateY(${scrollY * -0.05}px)`,
              }}
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="w-full py-20 px-12 bg-[#f8f8ec]">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Choose <span className="text-[#c4e456]">PrepAI</span>?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our AI-powered study planner adapts to your unique learning style,
              helping you achieve your academic goals with less stress and
              better results.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 hover:border-[#c4e456] transition-all duration-300 hover:shadow-xl hover:shadow-[#c4e456]/20 hover:-translate-y-1">
              <div className="bg-[#c4e456] w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Brain size={24} className="text-[#000000]" />
              </div>
              <h3 className="text-xl font-bold mb-3">
                AI-Powered Study Plan Creation
              </h3>
              <p className="text-gray-600">
                Get a personalized study plan tailored to your goals, strengths,
                and time availability with AI-driven optimization.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 hover:border-[#c4e456] transition-all duration-300 hover:shadow-xl hover:shadow-[#c4e456]/20 hover:-translate-y-1">
              <div className="bg-[#c4e456] w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 size={24} className="text-[#000000]" />
              </div>
              <h3 className="text-xl font-bold mb-3">
                MOM (Mentor on Mission) - Your AI Study Companion
              </h3>
              <p className="text-gray-600">
                Interact with an AI-powered voice assistant to clear doubts, get
                explanations, take pop quizzes, and receive motivational boosts.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 hover:border-[#c4e456] transition-all duration-300 hover:shadow-xl hover:shadow-[#c4e456]/20 hover:-translate-y-1">
              <div className="bg-[#c4e456] w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Sparkles size={24} className="text-[#000000]" />
              </div>
              <h3 className="text-xl font-bold mb-3">
                Comprehensive Learning Resources
              </h3>
              <p className="text-gray-600">
                Access curated learning materials for each topic, including
                articles, videos, and expert insights to enhance understanding.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 hover:border-[#c4e456] transition-all duration-300 hover:shadow-xl hover:shadow-[#c4e456]/20 hover:-translate-y-1">
              <div className="bg-[#c4e456] w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Users size={24} className="text-[#000000]" />
              </div>
              <h3 className="text-xl font-bold mb-3">
                AI-Generated Dynamic Tests
              </h3>
              <p className="text-gray-600">
                Reinforce learning with AI-driven quizzes and tests tailored to
                your understanding level and knowledge gaps
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 hover:border-[#c4e456] transition-all duration-300 hover:shadow-xl hover:shadow-[#c4e456]/20 hover:-translate-y-1">
              <div className="bg-[#c4e456] w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <BookOpen size={24} className="text-[#000000]" />
              </div>
              <h3 className="text-xl font-bold mb-3">
                AI-Powered Cheat Sheets
              </h3>
              <p className="text-gray-600">
                Instantly generate concise and effective cheat sheets for any
                topic, summarizing key concepts for quick revision.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 hover:border-[#c4e456] transition-all duration-300 hover:shadow-xl hover:shadow-[#c4e456]/20 hover:-translate-y-1">
              <div className="bg-[#c4e456] w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <ArrowDown size={24} className="text-[#000000]" />
              </div>
              <h3 className="text-xl font-bold mb-3">Targeted Revisions</h3>
              <p className="text-gray-600">
                The system automatically schedules review sessions for topics
                you struggle with, using spaced repetition to optimize long-term
                memory retention.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-10 bg-[#ffffff]">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How <span className="text-[#c4e456]">PrepAI</span> Works
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our AI-powered system adapts to your unique learning patterns to
              create the perfect study experience
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {/* Line connector for desktop */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-[#c4e456]/0 via-[#c4e456]/30 to-[#c4e456]/0"></div>

            {/* Step 1 */}
            <div className="relative">
              <div className="bg-white p-6 rounded-lg border border-gray-200 hover:border-[#c4e456] transition-all duration-300 hover:shadow-xl hover:shadow-[#c4e456]/30 hover:-translate-y-2 h-full">
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-[#ffffff] border-2 border-[#c4e456] text-[#c4e456] w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl">
                  1
                </div>
                <div className="pt-6">
                  <h3 className="text-xl font-bold mb-3 text-center">
                    Set Your Goals
                  </h3>
                  <p className="text-gray-600 text-center">
                    Tell us what you're studying, your deadlines, and your
                    learning preferences
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="bg-white p-6 rounded-lg border border-gray-200 hover:border-[#c4e456] transition-all duration-300 hover:shadow-xl hover:shadow-[#c4e456]/30 hover:-translate-y-2 h-full">
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-[#ffffff] border-2 border-[#c4e456] text-[#c4e456] w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl">
                  2
                </div>
                <div className="pt-6">
                  <h3 className="text-xl font-bold mb-3 text-center">
                    AI Creates Your Plan
                  </h3>
                  <p className="text-gray-600 text-center">
                    Our AI generates a personalized study plan optimized for
                    your specific needs
                  </p>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="bg-white p-6 rounded-lg border border-gray-200 hover:border-[#c4e456] transition-all duration-300 hover:shadow-xl hover:shadow-[#c4e456]/30 hover:-translate-y-2 h-full">
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-[#ffffff] border-2 border-[#c4e456] text-[#c4e456] w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl">
                  3
                </div>
                <div className="pt-6">
                  <h3 className="text-xl font-bold mb-3 text-center">
                    Track Your Progress
                  </h3>
                  <p className="text-gray-600 text-center">
                    Study with the plan and take AI-generated quizzes to track
                    your understanding
                  </p>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="relative">
              <div className="bg-white p-6 rounded-lg border border-gray-200 hover:border-[#c4e456] transition-all duration-300 hover:shadow-xl hover:shadow-[#c4e456]/30 hover:-translate-y-2 h-full">
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-[#ffffff] border-2 border-[#c4e456] text-[#c4e456] w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl">
                  4
                </div>
                <div className="pt-6">
                  <h3 className="text-xl font-bold mb-3 text-center">
                    AI Adapts & Improves
                  </h3>
                  <p className="text-gray-600 text-center">
                    The system constantly optimizes your plan based on your
                    performance
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 50% 50%, rgba(196, 228, 86, 0.4) 0%, transparent 70%)",
          }}
        />

        <div className="container mx-auto text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
            Ready to Transform <br />
            Your Study Habits?
          </h2>
          <p className="text-gray-700 max-w-2xl mx-auto mb-10">
            Join thousands of students who have already improved their grades
            and reduced study stress with PrepAI's's AI-powered study planner.
          </p>

          <div className="bg-[#ffffff]/80 backdrop-blur-md max-w-lg mx-auto p-8 rounded-xl border border-[#c4e456]/20 shadow-xl shadow-[#c4e456]/5">
            <div className="space-y-6">
              <div
                className="flex flex-col justify-center md:flex-row space-y-4 md:space-y-0 md:space-x-4"
                onClick={handleNavigateClick}
              >
                <button className="bg-[#c4e456] text-black px-6 py-3 rounded-md font-medium hover:bg-[#d2ee7a] transition-all duration-300 shadow-lg shadow-[#c4e456]/20 whitespace-nowrap">
                  Get Started Free
                </button>
              </div>

              <div className="flex flex-col md:flex-row items-center justify-center space-y-2 md:space-y-0 md:space-x-8 text-sm text-gray-600">
                <div className="flex items-center">
                  <Check size={16} className="text-[#c4e456] mr-2" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center">
                  <Check size={16} className="text-[#c4e456] mr-2" />
                  <span>Just Planify</span>
                </div>
                <div className="flex items-center">
                  <Check size={16} className="text-[#c4e456] mr-2" />
                  <span>Compete</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-100 text-gray-700">
        <div className="container mx-auto px-4">
          <div className="border-t border-gray-300 py-5 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-600">&copy; 2025 PrepAI</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
