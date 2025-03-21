import { useState, useEffect } from "react";
import AuthNavbar from "../components/AuthNavbar";
import { useAuth } from "../lib/context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import auth from "../assets/auth.jpg";
import { Eye, EyeOff } from "lucide-react";

const SignIn = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = () => {
    if (isSignInPage) {
      navigate("/signup");
    } else {
      navigate("/signin");
    }
  };

  const isSignInPage = location.pathname === "/signin";
  const text = isSignInPage ? "Sign Up" : "Sign In";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mailError, setMailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [error, setError] = useState("");

  const { user, loginUser } = useAuth();

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    return password.length >= 8;
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError("");
    setMailError("");
    setPasswordError("");

    // Validate email
    if (!validateEmail(email)) {
      setMailError("Please enter a valid email address");
      return;
    }

    // Validate password
    if (!validatePassword(password)) {
      setPasswordError("Password must be at least 8 characters long");
      return;
    }

    const userInfo = { email, password };
    await loginUser(userInfo);
  };

  return (
    <div>
      <AuthNavbar />
      {/* Update main container to be responsive */}
      <div className="bg-[#fffffb] min-h-[calc(100vh-64px)] flex flex-col md:flex-row">
        {/* Form section - updated for mobile */}
        <div className="w-full md:w-1/2 flex flex-col justify-center px-4 py-8 md:px-[180px]">
          <div className="items-start pb-6 md:pb-8 w-full">
            <h1 className="font-overpass text-2xl md:text-3xl text-left tracking-[5%]">
              PrepAI
            </h1>
            <p className="text-gray-600 text-sm md:text-base">
              Join Us and Capture, Organize, and Elevate Your Ideas.
            </p>
          </div>

          <div className="flex flex-col w-full">
            <form className="space-y-4 md:space-y-6">
              <div className="flex flex-col w-full">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-gray-700 mb-1"
                >
                  Email
                </label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  id="email"
                  name="email"
                  autoComplete="off"
                  placeholder="john@gmail.com"
                  className="border-b border-gray-300 focus:outline-none py-2 text-sm md:text-base"
                />
                {mailError && (
                  <p className="text-red-500 text-xs md:text-sm mt-1">{mailError}</p>
                )}
              </div>

              <div className="relative flex flex-col w-full">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-gray-700 mb-1"
                >
                  Password
                </label>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  autoComplete="off"
                  placeholder="••••••••"
                  className="border-b border-gray-300 focus:outline-none py-2 text-sm md:text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-9 text-gray-400 rounded"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                {passwordError && (
                  <p className="text-red-500 text-xs md:text-sm mt-1">{passwordError}</p>
                )}
              </div>

              <button
                onClick={handleSignIn}
                className="text-white bg-black rounded-full py-2.5 w-full text-sm md:text-base mt-4"
              >
                Sign In
              </button>
              {error && <p className="text-red-500 text-xs md:text-sm">{error}</p>}
            </form>
          </div>

          <p className="text-gray-600 text-sm md:text-base pt-3 text-center md:text-left">
            {isSignInPage ? "Don't have an account?" : "Already have an account"}{" "}
            <button
              onClick={handleClick}
              className="text-green-600 font-semibold cursor-pointer hover:underline underline-offset-auto"
            >
              {text}
            </button>
          </p>
        </div>

        {/* Image section - hidden on mobile, shown on medium devices and up */}
        <div className="hidden md:block w-full md:w-1/2 h-[calc(100vh-64px)]">
          <img
            src={auth}
            alt="auth-image"
            className="h-full w-full object-cover"
          />
        </div>
      </div>
    </div>
  );
};

export default SignIn;
