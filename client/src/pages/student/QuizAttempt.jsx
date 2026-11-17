
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Clock, ChevronLeft, ChevronRight, Send, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

export default function QuizAttempt() {
  const { courseId, quizId } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const submittedRef = useRef(false);

  useEffect(() => {
    const loadQuiz = async () => {
      try {
        // Fetch quiz details
        const quizRes = await api.get(`/quizzes/${quizId}`);
        const selectedQuiz = quizRes.data.quiz;

        if (!selectedQuiz) {
          toast.error("Quiz not found or not available");
          navigate("/dashboard/quizzes");
          return;
        }

        setQuiz(selectedQuiz);

        // Start / resume quiz attempt on backend to sync server timer
        try {
          const startRes = await api.post(`/quizzes/${quizId}/start`);
          if (startRes.data.remainingSeconds !== undefined) {
            setTimeLeft(startRes.data.remainingSeconds);
          } else {
            setTimeLeft((selectedQuiz.duration || 30) * 60);
          }
        } catch (startErr) {
          if (startErr.response?.status === 409) {
            toast.error("You have already completed this quiz");
            navigate("/dashboard/quizzes");
            return;
          }
          // Default to full duration if start endpoint wasn't reached
          setTimeLeft((selectedQuiz.duration || 30) * 60);
        }
      } catch (error) {
        toast.error(
          error.response?.data?.message || "Unable to load quiz"
        );
        navigate("/dashboard/quizzes");
      } finally {
        setLoading(false);
      }
    };

    loadQuiz();
  }, [quizId, navigate]);

  const submitQuiz = useCallback(async () => {
    if (submittedRef.current || submitting || !quiz) return;

    submittedRef.current = true;
    setSubmitting(true);

    const formattedAnswers = quiz.questions.map((_, index) => ({
      questionIndex: index,
      selectedAnswer: answers[index] ?? -1
    }));

    try {
      const response = await api.post(
        `/quizzes/${quizId}/submit`,
        { answers: formattedAnswers }
      );

      setResult(
        response.data.result ||
        response.data.attempt ||
        response.data
      );
      toast.success("Quiz submitted successfully!");
    } catch (error) {
      submittedRef.current = false;
      toast.error(
        error.response?.data?.message || "Unable to submit quiz"
      );
    } finally {
      setSubmitting(false);
    }
  }, [answers, quiz, quizId, submitting]);

  useEffect(() => {
    if (!quiz || result || submitting || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((previous) => Math.max(0, previous - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [quiz, result, submitting, timeLeft]);

  useEffect(() => {
    if (quiz && timeLeft === 0 && !result && !loading) {
      submitQuiz();
    }
  }, [timeLeft, quiz, result, loading, submitQuiz]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  };

  if (loading) {
    return <div className="quiz-loading">Loading quiz...</div>;
  }

  if (!quiz) return null;

  if (result) {
    return (
      <div className="quiz-result-page">
        <CheckCircle size={55} />
        <h1>Quiz Submitted!</h1>
        <p>Your quiz has been evaluated.</p>

        <div className="quiz-result-score">
          <strong>{result.score ?? 0}</strong>
          <span> / {result.totalMarks ?? quiz.totalMarks} Marks</span>
        </div>

        <h2>{result.percentage ?? 0}%</h2>

        <span className={result.passed ? "result-passed" : "result-failed"}>
          {result.passed ? "Congratulations! You Passed" : "You did not pass"}
        </span>

        <button
          className="start-quiz-btn"
          onClick={() => navigate("/dashboard/quizzes")}
        >
          Back to Quizzes
        </button>
      </div>
    );
  }

  const question = quiz.questions[currentQuestion];
  const totalQuestions = quiz.questions.length;

  return (
    <div className="quiz-attempt-page">
      <div className="quiz-attempt-header">
        <div>
          <h1>{quiz.title}</h1>
          <p>Question {currentQuestion + 1} of {totalQuestions}</p>
        </div>

        <div className={`quiz-timer ${timeLeft < 60 ? "timer-warning" : ""}`}>
          <Clock size={18} />
          {formatTime(timeLeft)}
        </div>
      </div>

      <div className="quiz-question-progress">
        <div
          style={{
            width: `${((currentQuestion + 1) / totalQuestions) * 100}%`
          }}
        />
      </div>

      <div className="quiz-question-card">
        <span className="question-number">
          Question {currentQuestion + 1}
        </span>

        <h2>{question.questionText}</h2>

        <div className="quiz-options">
          {question.options.map((option, index) => (
            <label
              key={index}
              className={`quiz-option ${
                answers[currentQuestion] === index ? "selected" : ""
              }`}
            >
              <input
                type="radio"
                name={`question-${currentQuestion}`}
                checked={answers[currentQuestion] === index}
                onChange={() =>
                  setAnswers((previous) => ({
                    ...previous,
                    [currentQuestion]: index
                  }))
                }
              />
              <span className="option-letter">
                {String.fromCharCode(65 + index)}
              </span>
              <span>{option}</span>
            </label>
          ))}
        </div>

        <div className="quiz-navigation">
          <button
            className="quiz-nav-btn"
            disabled={currentQuestion === 0}
            onClick={() => setCurrentQuestion((previous) => previous - 1)}
          >
            <ChevronLeft size={18} />
            Previous
          </button>

          {currentQuestion < totalQuestions - 1 ? (
            <button
              className="quiz-nav-btn next"
              onClick={() => setCurrentQuestion((previous) => previous + 1)}
            >
              Next
              <ChevronRight size={18} />
            </button>
          ) : (
            <button
              className="quiz-nav-btn submit"
              onClick={submitQuiz}
              disabled={submitting}
            >
              <Send size={17} />
              {submitting ? "Submitting..." : "Submit Quiz"}
            </button>
          )}
        </div>
      </div>

      <div className="quiz-question-palette">
        <h3>Question Navigator</h3>
        <div>
          {quiz.questions.map((_, index) => (
            <button
              key={index}
              className={[
                currentQuestion === index ? "active" : "",
                answers[index] !== undefined ? "answered" : ""
              ].join(" ")}
              onClick={() => setCurrentQuestion(index)}
            >
              {index + 1}
            </button>
          ))}
        </div>
        <p>
          Answered: {Object.keys(answers).length} / {totalQuestions}
        </p>
      </div>
    </div>
  );
}
