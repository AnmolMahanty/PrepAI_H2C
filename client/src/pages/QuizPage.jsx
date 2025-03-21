import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";

// Quiz Component
const Quiz = () => {
  const location = useLocation();
  const [quizTopic, setQuizTopic] = useState(
    location.state?.topic || "General Knowledge"
  );
  const [topicDescription, setTopicDescription] = useState(
    location.state?.description || "Comprehensive assessment of the topic"
  );
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(900); // 15 minutes in seconds
  const [hoveredOption, setHoveredOption] = useState(null);
  const [warningCount, setWarningCount] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const blurCountRef = useRef(0);
  const maxBlurWarnings = 3;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [quizResults, setQuizResults] = useState(null);
  const [planId, setPlanId] = useState(location.state?.planId);
  const [weekIndex, setWeekIndex] = useState(location.state?.weekIndex);
  const [topicId, setTopicId] = useState(location.state?.topicId);
  const [entirePlan, setEntirePlan] = useState(
    JSON.parse(location.state?.planData?.plan || null)
  );

  // Sample questions - replace with your actual questions
  const sampleQuestions = [{"id":"1","question":"What is the derivative of f(x) = x^2?","options":["2x","x^2","x","1"],"correctAnswer":0,"explanation":{"correct":"The derivative of x^2 is 2x. This is found using the power rule of differentiation, which states that the derivative of x^n is nx^(n-1). Applying this rule to x^2, we get 2x^(2-1) = 2x.","incorrect":{"0":"The derivative of x^2 is 2x. This is found using the power rule of differentiation, which states that the derivative of x^n is nx^(n-1). Applying this rule to x^2, we get 2x^(2-1) = 2x.","1":"x^2 is the function itself, not its derivative.","2":"x is the derivative of x^2 but not the complete derivative.","3":"1 is the derivative of a constant function, not a function like x^2."}}},{"id":"2","question":"Which theorem states that the derivative of a function is zero at a point where the function is differentiable and attains a local maximum or minimum?","options":["Mean Value Theorem","Fundamental Theorem of Calculus","Intermediate Value Theorem","Fermat's Theorem"],"correctAnswer":3,"explanation":{"correct":"Fermat's Theorem states that if a function f(x) is differentiable at a point x = c and attains a local maximum or minimum at c, then f'(c) = 0. This theorem helps identify potential maxima and minima of a function.","incorrect":{"0":"The Mean Value Theorem relates the average rate of change to the instantaneous rate of change.","1":"The Fundamental Theorem of Calculus connects differentiation and integration.","2":"The Intermediate Value Theorem guarantees the existence of a root for a continuous function within a given interval.","3":"Fermat's Theorem states that if a function f(x) is differentiable at a point x = c and attains a local maximum or minimum at c, then f'(c) = 0. This theorem helps identify potential maxima and minima of a function."}}},{"id":"3","question":"What is the limit of (x^2 - 1) / (x - 1) as x approaches 1?","options":["0","1","2","Does not exist"],"correctAnswer":2,"explanation":{"correct":"The limit of (x^2 - 1) / (x - 1) as x approaches 1 is 2. This can be found by factoring the numerator as (x+1)(x-1) and canceling the common factor of (x-1). This leaves us with the limit of (x+1) as x approaches 1, which evaluates to 2.","incorrect":{"0":"While the limit is finite, it is not equal to zero.","1":"This is not the correct value of the limit.","2":"The limit of (x^2 - 1) / (x - 1) as x approaches 1 is 2. This can be found by factoring the numerator as (x+1)(x-1) and canceling the common factor of (x-1). This leaves us with the limit of (x+1) as x approaches 1, which evaluates to 2.","3":"The limit exists and can be calculated."}}},{"id":"4","question":"A function f(x) is continuous on the interval [a, b]. According to the Mean Value Theorem, there exists a point c in (a, b) such that:","options":["f'(c) = 0","f'(c) = (f(b) - f(a)) / (b - a)","f(c) = (f(b) + f(a)) / 2","f(c) = f(a) + (b - a)f'(a)"],"correctAnswer":1,"explanation":{"correct":"The Mean Value Theorem states that if a function is continuous on a closed interval [a, b] and differentiable on the open interval (a, b), then there exists at least one point c in (a, b) where the instantaneous rate of change (the derivative) is equal to the average rate of change over the interval. This is represented as f'(c) = (f(b) - f(a)) / (b - a).","incorrect":{"0":"This is not a condition of the Mean Value Theorem.","1":"The Mean Value Theorem states that if a function is continuous on a closed interval [a, b] and differentiable on the open interval (a, b), then there exists at least one point c in (a, b) where the instantaneous rate of change (the derivative) is equal to the average rate of change over the interval. This is represented as f'(c) = (f(b) - f(a)) / (b - a).","2":"This describes the average value of the function, not the Mean Value Theorem.","3":"This statement is related to the Fundamental Theorem of Calculus, not the Mean Value Theorem."}}},{"id":"5","question":"If f'(x) = 3x^2 - 6x, find the critical points of f(x).","options":["x = 0 and x = 2","x = 1 and x = 3","x = -2 and x = 0","x = 0 only"],"correctAnswer":0,"explanation":{"correct":"Critical points occur where the derivative is zero or undefined. Setting f'(x) = 0, we get 3x^2 - 6x = 0. Factoring, we have 3x(x - 2) = 0, so the critical points are x = 0 and x = 2.","incorrect":{"0":"Critical points occur where the derivative is zero or undefined. Setting f'(x) = 0, we get 3x^2 - 6x = 0. Factoring, we have 3x(x - 2) = 0, so the critical points are x = 0 and x = 2.","1":"These values are not solutions to the derivative equation.","2":"These values do not correspond to where the derivative is zero.","3":"While x = 0 is a critical point, x = -2 is not."}}},{"id":"6","question":"A particle moves along a straight line with velocity v(t) = t^2 - 4t + 3. Find the displacement of the particle during the time interval [0, 3].","options":["0","3","9","1"],"correctAnswer":0,"explanation":{"correct":"Displacement is the change in position.  It is found by integrating the velocity function over the time interval. The integral of v(t) = t^2 - 4t + 3 is (1/3)t^3 - 2t^2 + 3t. Evaluating this from t=0 to t=3 gives us [(1/3)(3)^3 - 2(3)^2 + 3(3)] - [(1/3)(0)^3 - 2(0)^2 + 3(0)] = 9 - 18 + 9 = 0.","incorrect":{"0":"Displacement is the change in position.  It is found by integrating the velocity function over the time interval. The integral of v(t) = t^2 - 4t + 3 is (1/3)t^3 - 2t^2 + 3t. Evaluating this from t=0 to t=3 gives us [(1/3)(3)^3 - 2(3)^2 + 3(3)] - [(1/3)(0)^3 - 2(0)^2 + 3(0)] = 9 - 18 + 9 = 0.","1":"The displacement is not equal to the velocity at t=3.","2":"This value is too large and does not reflect the integration of the velocity function.","3":"This value is too large and does not reflect the integration of the velocity function."}}},{"id":"7","question":"Suppose f(x) = sin(x) and g(x) = cos(x).  What is the value of  (f * g)'(π/4)?","options":["√2 / 2","-√2 / 2","1","0"],"correctAnswer":1,"explanation":{"correct":"Here, (f * g)'(x) represents the derivative of the product of f(x) and g(x). Using the product rule, we have (f * g)'(x) = f'(x)g(x) + f(x)g'(x).  Therefore, (f * g)'(π/4) = (cos(π/4))cos(π/4) + (sin(π/4))( -sin(π/4)). This simplifies to (√2 / 2)(√2 / 2) + (√2 / 2)(-√2 / 2) = √2 / 2 - √2 / 2 = 0.","incorrect":{"0":"The derivative of the product involves both f'(x) and g'(x) terms.","1":"Here, (f * g)'(x) represents the derivative of the product of f(x) and g(x). Using the product rule, we have (f * g)'(x) = f'(x)g(x) + f(x)g'(x).  Therefore, (f * g)'(π/4) = (cos(π/4))cos(π/4) + (sin(π/4))( -sin(π/4)). This simplifies to (√2 / 2)(√2 / 2) + (√2 / 2)(-√2 / 2) = √2 / 2 - √2 / 2 = 0.","2":"The product rule states that the derivative of a product is found by adding the derivatives of the individual functions multiplied together, not by simply adding the functions themselves.","3":"This value does not correspond to the correct evaluation of the derivative using the product rule."}}},{"id":"8","question":"Find the absolute maximum value of f(x) = x^3 - 3x^2 + 2 on the interval [0, 3].","options":["2","5","9","0"],"correctAnswer":5,"explanation":{"correct":"To find the absolute maximum on the closed interval [0, 3], we need to consider the function's critical points within the interval and the function's values at the endpoints. First, find the derivative f'(x) = 3x^2 - 6x. Set it to zero and solve for x: 3x^2 - 6x = 0. This gives us x = 0 and x = 2. Evaluate f(x) at these critical points and the endpoints: f(0) = 2, f(2) = -2, f(3) = 2. The absolute maximum value is 5, which occurs at x = 2.","incorrect":{"0":"While f(0) and f(3) are equal to 2, they are not the absolute maximum.","1":"This value is too small and does not represent the maximum value of the function.","2":"This option is incorrect because it doesn't match the correct answer.","3":"This value is too small and does not represent the maximum value of the function."}}}];

  // Format time from seconds to MM:SS
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const remainingSeconds = (seconds % 60).toString().padStart(2, "0");
    return `${minutes}:${remainingSeconds}`;
  };

  // Handle the countdown timer
  useEffect(() => {
    let timer;
    if (quizStarted && !quizSubmitted && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining((prev) => prev - 1);
      }, 1000);
    } else if (timeRemaining === 0 && !quizSubmitted) {
      handleSubmitQuiz();
    }
    return () => clearInterval(timer);
  }, [quizStarted, quizSubmitted, timeRemaining]);

  // Handle tab visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && quizStarted && !quizSubmitted) {
        blurCountRef.current += 1;
        setWarningCount(blurCountRef.current);
        setShowWarning(true);

        // Auto-hide warning after 5 seconds
        setTimeout(() => {
          setShowWarning(false);
        }, 5000);

        // If max warnings reached, auto-submit
        if (blurCountRef.current >= maxBlurWarnings) {
          handleSubmitQuiz();
        }
      }
    };

    const handleBeforeUnload = (e) => {
      if (quizStarted && !quizSubmitted) {
        e.preventDefault();
        e.returnValue =
          "Warning: This will count as a violation. You have " +
          (maxBlurWarnings - blurCountRef.current) +
          " warnings remaining.";
        return e.returnValue;
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [quizStarted, quizSubmitted]);

  useEffect(() => {
    if (quizStarted && (!questions || questions.length === 0)) {
      setError("No quiz questions available");
      setQuizStarted(false);
    }
  }, [quizStarted, questions]);

  const startQuiz = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        "http://localhost:5000/api/generate-quiz",
        {
          topic: quizTopic,
          topic_description: topicDescription,
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to generate quiz");
      }

      // Transform the backend quiz data to match frontend structure
      const transformedQuestions = response.data.data.questions.map(
        (q, index) => ({
          id: q.id || index + 1,
          question: q.question,
          options: q.options.map((text, optIndex) => ({
            id: optIndex, // Use numeric IDs instead of letters
            text: text,
            explanation:
              optIndex === q.correctAnswer
                ? q.explanation.correct
                : q.explanation.incorrect[optIndex],
          })),
          correctAnswer: q.correctAnswer, // Already numeric from backend
        })
      );
      transformedQuestions.map((question) => {if(question.correctAnswer>3){
        //compare the correctAnswer with the options and find the index of the correct answer
        question.correctAnswer = question.options.findIndex((option) => option.text == question.correctAnswer);
        
      }});


      setQuestions(transformedQuestions);
      setQuizStarted(true);
      setQuizSubmitted(false);
      setReviewMode(false);
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
      setTimeRemaining(900);
      setError(null);
      setQuizResults(null);
    } catch (err) {
      console.error("Quiz generation error:", err);
      setError(err.response?.data?.error || "Failed to load quiz");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionId, answerId) => {
    if (!reviewMode) {
      setSelectedAnswers({
        ...selectedAnswers,
        [questionId]: answerId,
      });
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const getQuizResults = () => {
    // Return memoized results if available
    if (quizResults) return quizResults;

    let correct = 0;
    let wrong = 0;
    let notAttempted = 0;

    questions.forEach((question) => {
      if(question.correctAnswer>3){
        //compare the correctAnswer with the options and find the index of the correct answer
        question.correctAnswer = question.options.findIndex((option) => option.text == question.correctAnswer);
      }
      if (!selectedAnswers[question.id]=== null) {
        notAttempted++;
      } else if (selectedAnswers[question.id] === question.correctAnswer) {
        correct++;
      } else {
        wrong++;
      }
    });

    const totalQuestions = questions.length;
    const score = (correct / totalQuestions) * 100;

    const results = {
      correct,
      wrong,
      notAttempted,
      totalQuestions,
      score,
    };

    // Store the results
    setQuizResults(results);
    return results;
  };

  const updatePlanWithQuizResults = async (score) => {
    try {
      // Update the specific topic in the plan
      const updatedPlan = entirePlan.map((weekData, wIndex) => {
        if (wIndex === weekIndex) {
          return {
            ...weekData,
            Tasks: weekData.Tasks.map((task, tIndex) => {
              if (`week-${weekData.Week}-task-${tIndex}` === topicId) { // topicId should now be just the task index
                return {
                  ...task,
                  testTaken: true,
                  testScore: score
                };
              }
              return task;
            })
          };
        }
        return weekData;
      });
      console.log("planId: ",planId);
      // Send the entire updated plan to backend
      const response = await axios.post('http://localhost:5000/update-plan', {
        planId: planId,
        updatedPlan: updatedPlan
      });

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to update plan');
      }

      console.log('Plan updated successfully');
    } catch (err) {
      console.error('Error updating plan:', err);
    }
  };

  const handleSubmitQuiz = async () => {
    setQuizSubmitted(true);
    const results = getQuizResults();
    
    // Only update plan if we have the full plan data and topic details
    if (entirePlan && weekIndex !== undefined && topicId !== undefined) {
      await updatePlanWithQuizResults(results.score);
    }
  };

  const handleTryAgain = () => {
    // Reset quiz results when trying again
    setQuizResults(null);
    startQuiz();
  };

  const handleReviewAnswers = () => {
    setReviewMode(true);
    setCurrentQuestionIndex(0);
  };

  const getOptionClassName = (question, option) => {
    if (!reviewMode) {
      return `p-4 rounded-lg border cursor-pointer ${
        selectedAnswers[question.id] === option.id
          ? "border-[#c4e456] bg-white shadow-md"
          : "border-gray-200 bg-gray-50 hover:bg-white"
      }`;
    } else {
      // In review mode
      if (option.id === question.correctAnswer) {
        return "p-4 rounded-lg border border-green-500 bg-green-50 cursor-pointer";
      } else if (selectedAnswers[question.id] === option.id) {
        return "p-4 rounded-lg border border-red-500 bg-red-50 cursor-pointer";
      } else {
        return "p-4 rounded-lg border border-gray-200 bg-gray-50 cursor-pointer";
      }
    }
  };

  return (
    <div className="w-full bg-white flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3 flex justify-between items-center">
        <div className="font-medium text-gray-800">{quizTopic}</div>
        {quizStarted && !quizSubmitted && (
          <div className="flex items-center bg-gray-50 px-4 py-2 rounded-full border border-gray-200">
            <div className="flex items-center space-x-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-gray-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-gray-600 font-medium">
                {formatTime(timeRemaining)}
              </span>
            </div>
            <button
              onClick={() => {
                if (
                  window.confirm(
                    "Are you sure you want to end the quiz? This action cannot be undone."
                  )
                ) {
                  handleSubmitQuiz();
                }
              }}
              className="ml-4 text-gray-400 hover:text-gray-600 transition"
              title="End Quiz"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        )}
      </header>

      {/* Add the warning message here */}
      {showWarning && (
        <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong className="font-bold">Warning!</strong>
          <span className="block sm:inline">
            {" "}
            Leaving the quiz page: {warningCount}/{maxBlurWarnings} violations.
          </span>
          {warningCount >= maxBlurWarnings && (
            <span className="block">Quiz will be automatically submitted.</span>
          )}
        </div>
      )}

      {/* Progress bar - only show when quiz has started but not submitted */}
      {quizStarted && !quizSubmitted && (
        <div className="bg-white px-4 py-3">
          <div className="flex justify-center items-center gap-1">
            {[...Array(questions.length)].map((_, index) => (
              <div
                key={index}
                className={`h-2 w-2 rounded-full ${
                  index <= currentQuestionIndex ? "bg-[#c4e456]" : "bg-gray-200"
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="w-full flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          {!quizStarted ? (
            <div className="w-full bg-[#f8f8ec] rounded-lg p-6">
              <div className="w-full flex justify-center mb-6">
                <img
                  src="/assets/quizlogo.jpg"
                  alt="Quiz Icon"
                  className="w-12 h-12 rounded-full object-cover"
                />
              </div>
              <h1 className="text-xl font-medium text-center mb-4">
                Quiz on {quizTopic}
              </h1>
              <p className="text-gray-600 mb-6">
                This quiz will test your knowledge of {topicDescription}
              </p>
              <p className="text-gray-600 mb-6">
                The following will be a quiz of {sampleQuestions.length}{" "}
                questions. Before you begin, please take note that the quiz must
                be completed:
              </p>
              <div className="space-y-4 mb-8">
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-[#c4e456] rounded-full w-6 h-6 flex items-center justify-center mr-3">
                    <span className="text-sm font-medium">1</span>
                  </div>
                  <p className="text-gray-800">In Full-screen Mode</p>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-[#c4e456] rounded-full w-6 h-6 flex items-center justify-center mr-3">
                    <span className="text-sm font-medium">2</span>
                  </div>
                  <p className="text-gray-800">On your own, without copying.</p>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-[#c4e456] rounded-full w-6 h-6 flex items-center justify-center mr-3">
                    <span className="text-sm font-medium">3</span>
                  </div>
                  <p className="text-gray-800">
                    Test will automatically submit when the time is up.
                  </p>
                </div>
              </div>
              <div className="flex justify-center">
                <button
                  onClick={startQuiz}
                  disabled={loading}
                  className={`py-2 px-8 border border-gray-800 rounded-full transition ${
                    loading
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-gray-100"
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-gray-800 mr-2"></div>
                      Generating Quiz...
                    </div>
                  ) : (
                    "Let's Go"
                  )}
                </button>
              </div>
              {error && (
                <div className="mt-4 text-red-500 text-center">
                  {error}
                  <button
                    onClick={startQuiz}
                    className="ml-2 text-blue-500 hover:underline"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
          ) : quizSubmitted && !reviewMode ? (
            // Results Page
            <div className="bg-[#f8f8ec] rounded-lg p-6">
              <h2 className="text-xl font-medium text-center mb-6">
                Quiz Results
              </h2>

              <div className="mb-8">
                <div className="flex justify-between mb-4">
                  <span className="text-gray-700">Score:</span>
                  <span className="font-medium">
                    {getQuizResults().score.toFixed(1)}%
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-green-50 p-4 rounded-lg border border-green-100 text-center">
                    <div className="text-green-600 font-medium text-lg">
                      {getQuizResults().correct}
                    </div>
                    <div className="text-gray-500 text-sm">Correct</div>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg border border-red-100 text-center">
                    <div className="text-red-600 font-medium text-lg">
                      {getQuizResults().wrong}
                    </div>
                    <div className="text-gray-500 text-sm">Wrong</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-center">
                    <div className="text-gray-600 font-medium text-lg">
                      {getQuizResults().notAttempted}
                    </div>
                    <div className="text-gray-500 text-sm">Not Attempted</div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
                  <div className="text-gray-700 mb-2">Performance Summary</div>
                  <div className="text-gray-600 text-sm">
                    You answered {getQuizResults().correct} out of{" "}
                    {getQuizResults().totalQuestions} questions correctly.
                    {getQuizResults().score >= 70 ? (
                      <span className="block mt-2 text-green-600">
                        Great job! You have passed the quiz.
                      </span>
                    ) : (
                      <span className="block mt-2 text-red-600">
                        Keep practicing! You need to score at least 70% to pass.
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={handleReviewAnswers}
                  className="py-2 px-6 border border-gray-300 rounded-full hover:bg-gray-100 transition text-gray-800"
                >
                  Review Answers
                </button>
                <button
                  onClick={handleTryAgain}
                  className="py-2 px-6 border border-gray-300 rounded-full hover:bg-gray-100 transition text-gray-800"
                >
                  Try Again
                </button>
                <button
                  onClick={() => (window.location.href = "/dashboard/feature1")}
                  className="py-2 px-6 bg-[#c4e456] rounded-full hover:bg-opacity-90 transition text-gray-800"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          ) : (
            // Quiz Questions or Review Mode
            <div className="bg-[#f8f8ec] rounded-lg p-6">
              {reviewMode && (
                <div className="mb-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <div className="text-gray-700 font-medium">Review Mode</div>{" "}
                </div>
              )}
              <div className="mb-8">
                <h2 className="text-lg font-medium mb-6">
                  {reviewMode && (
                    <span className="text-gray-500 mr-2">
                      Question {currentQuestionIndex + 1}:
                    </span>
                  )}
                  {questions[currentQuestionIndex].question}
                </h2>
                <div className="space-y-3">
                  {questions[currentQuestionIndex].options.map((option) => (
                    <div
                      key={option.id}
                      className={getOptionClassName(
                        questions[currentQuestionIndex],
                        option
                      )}
                      onClick={() =>
                        handleAnswerSelect(
                          questions[currentQuestionIndex].id,
                          option.id
                        )
                      }
                    >
                      <div className="flex items-center">
                        <div
                          className={`h-5 w-5 rounded-full border ${
                            selectedAnswers[
                              questions[currentQuestionIndex].id
                            ] === option.id
                              ? reviewMode
                                ? option.id ===
                                  questions[currentQuestionIndex].correctAnswer
                                  ? "border-green-500"
                                  : "border-red-500"
                                : "border-[#c4e456]"
                              : option.id ===
                                  questions[currentQuestionIndex]
                                    .correctAnswer && reviewMode
                              ? "border-green-500"
                              : "border-gray-300"
                          } flex items-center justify-center mr-3`}
                        >
                          {selectedAnswers[
                            questions[currentQuestionIndex].id
                          ] === option.id && (
                            <div
                              className={`h-3 w-3 rounded-full ${
                                reviewMode
                                  ? option.id ===
                                    questions[currentQuestionIndex]
                                      .correctAnswer
                                    ? "bg-green-500"
                                    : "bg-red-500"
                                  : "bg-[#c4e456]"
                              }`}
                            ></div>
                          )}
                          {option.id ===
                            questions[currentQuestionIndex].correctAnswer &&
                            reviewMode &&
                            selectedAnswers[
                              questions[currentQuestionIndex].id
                            ] !== option.id && (
                              <div className="h-3 w-3 rounded-full bg-green-500"></div>
                            )}
                        </div>
                        <span>{option.text}</span>
                      </div>
                      {reviewMode && (
                        <div className="mt-2 text-sm p-2 bg-gray-50 rounded border border-gray-200">
                          {option.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-between">
                <button
                  onClick={handlePrevQuestion}
                  className={`py-2 px-8 border border-gray-300 rounded-full ${
                    currentQuestionIndex === 0
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-gray-100"
                  } transition`}
                  disabled={currentQuestionIndex === 0}
                >
                  Back
                </button>
                {reviewMode && currentQuestionIndex === questions.length - 1 ? (
                  <button
                    onClick={() => {
                      setReviewMode(false);
                      setQuizSubmitted(true);
                    }}
                    className="py-2 px-8 bg-[#c4e456] rounded-full hover:bg-opacity-90 transition text-gray-800"
                  >
                    Finish Review
                  </button>
                ) : currentQuestionIndex < questions.length - 1 ? (
                  <button
                    onClick={handleNextQuestion}
                    className="py-2 px-8 bg-[#c4e456] rounded-full hover:bg-opacity-90 transition text-gray-800"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={handleSubmitQuiz}
                    className="py-2 px-8 bg-[#c4e456] rounded-full hover:bg-opacity-90 transition text-gray-800"
                  >
                    Submit
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Quiz;
