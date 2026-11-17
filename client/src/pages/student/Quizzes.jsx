
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ClipboardList,
  Clock,
  Award,
  BookOpen,
  CheckCircle,
  PlayCircle
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

export default function Quizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadQuizzes = async () => {
      try {
        const [coursesResponse, resultsResponse] = await Promise.all([
          api.get("/enrollments/my-courses"),
          api.get("/quizzes/my-results")
        ]);

        const enrollments = (
          coursesResponse.data.enrollments || []
        ).filter((item) => item.course);

        const attempts = resultsResponse.data.attempts || [];

        // Fetch quizzes for each enrolled course
        const quizResponses = await Promise.all(
          enrollments.map((item) =>
            api.get(`/quizzes/course/${item.course._id}`)
          )
        );

        // Attach courseId and previous attempt details
        const quizList = quizResponses.flatMap(
          (response, index) => {
            const courseId = enrollments[index].course._id;
            const courseQuizzes = response.data.quizzes || [];

            return courseQuizzes.map((quiz) => {
              const attempt = attempts.find((item) => {
                const attemptedQuizId =
                  item.quiz?._id || item.quiz;

                return attemptedQuizId === quiz._id;
              });

              return {
                ...quiz,
                courseId,
                attempted: Boolean(attempt),
                result: attempt || null
              };
            });
          }
        );

        setQuizzes(quizList);
      } catch (error) {
        toast.error(
          error.response?.data?.message ||
          "Unable to load quizzes"
        );
      } finally {
        setLoading(false);
      }
    };

    loadQuizzes();
  }, []);

  if (loading) {
    return (
      <div className="quiz-loading">
        Loading quizzes...
      </div>
    );
  }

  const attemptedCount = quizzes.filter(
    (quiz) => quiz.attempted
  ).length;

  const notAttemptedCount = quizzes.length - attemptedCount;

  return (
    <div className="quiz-page">

      {/* Page Header */}
      <div className="quiz-page-header">
        <div>
          <h1>My Quizzes</h1>
          <p>
            Test your knowledge and track your learning progress.
          </p>
        </div>

        <div className="quiz-header-icon">
          <ClipboardList size={30} />
        </div>
      </div>

      {/* Quiz Statistics */}
      <div className="quiz-stats-grid">

        <div className="quiz-stat-card">
          <ClipboardList size={24} />
          <div>
            <span>Total Quizzes</span>
            <h2>{quizzes.length}</h2>
          </div>
        </div>

        <div className="quiz-stat-card">
          <CheckCircle size={24} />
          <div>
            <span>Attempted</span>
            <h2>{attemptedCount}</h2>
          </div>
        </div>

        <div className="quiz-stat-card">
          <PlayCircle size={24} />
          <div>
            <span>Not Attempted</span>
            <h2>{notAttemptedCount}</h2>
          </div>
        </div>

      </div>

      {/* Quiz List */}
      {quizzes.length === 0 ? (

        <div className="quiz-empty">
          <BookOpen size={48} />

          <h2>No Quizzes Available</h2>

          <p>
            Your instructors haven't published any quizzes
            for your enrolled courses yet.
          </p>
        </div>

      ) : (

        <div className="quiz-grid">

          {quizzes.map((quiz) => (

            <div className="quiz-card" key={quiz._id}>

              <div className="quiz-card-top">

                <div className="quiz-icon">
                  <ClipboardList size={24} />
                </div>

                {quiz.attempted ? (
                  <span className="quiz-status attempted">
                    Attempted
                  </span>
                ) : (
                  <span className="quiz-status pending">
                    Not Attempted
                  </span>
                )}

              </div>

              <h3>{quiz.title}</h3>

              <p className="quiz-description">
                {quiz.description ||
                  "Test your knowledge with this quiz."}
              </p>

              <div className="quiz-meta">

                <span>
                  <Clock size={16} />
                  {quiz.duration || 30} min
                </span>

                <span>
                  <Award size={16} />
                  {quiz.totalMarks || 0} Marks
                </span>

                <span>
                  <BookOpen size={16} />
                  {quiz.questions?.length || 0} Questions
                </span>

              </div>

              {quiz.attempted ? (

                <div className="quiz-result-preview">

                  <div>
                    <span>Your Score</span>

                    <strong>
                      {quiz.result?.score ?? 0}/
                      {quiz.result?.totalMarks ?? quiz.totalMarks}
                    </strong>
                  </div>

                  <span
                    className={
                      quiz.result?.passed
                        ? "result-passed"
                        : "result-failed"
                    }
                  >
                    {quiz.result?.passed ? "Passed" : "Failed"}
                  </span>

                </div>

              ) : (

                <Link
                  to={`/dashboard/quizzes/${quiz.courseId}/${quiz._id}`}
                  className="start-quiz-btn"
                >
                  Start Quiz
                  <PlayCircle size={17} />
                </Link>

              )}

            </div>

          ))}

        </div>

      )}

    </div>
  );
}
