
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Play,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Clock,
  CheckCircle,
  ArrowLeft,
  Circle,
  Check
} from "lucide-react";
import toast from "react-hot-toast";
import api, { SERVER_BASE_URL } from "../services/api";
import "./LessonPlayer.css";

const LessonPlayer = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [lessons, setLessons] = useState([]);
  const [activeLesson, setActiveLesson] = useState(null);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    const fetchLearningData = async () => {
      try {
        setLoading(true);

        const [lessonResponse, enrollmentResponse] = await Promise.all([
          api.get(`/lessons/${courseId}`),
          api.get("/enrollments/my-courses")
        ]);

        const lessonData = lessonResponse.data.lessons || [];
        const enrollments = enrollmentResponse.data.enrollments || [];

        const enrollment = enrollments.find(
          (item) =>
            item.course?._id === courseId ||
            item.course?._id?.toString() === courseId
        );

        setLessons(lessonData);
        setCompletedLessons(
          (enrollment?.completedLessons || []).map((id) =>
            id.toString()
          )
        );
        setProgress(enrollment?.progress || 0);

        if (lessonData.length > 0) {
          setActiveLesson(lessonData[0]);
        }
      } catch (error) {
        toast.error(
          error.response?.data?.message || "Unable to load lessons"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchLearningData();
  }, [courseId]);

  const currentIndex = lessons.findIndex(
    (lesson) => lesson._id === activeLesson?._id
  );

  const isCompleted = (lessonId) =>
    completedLessons.includes(lessonId?.toString());

  const markAsComplete = async () => {
    if (!activeLesson || isCompleted(activeLesson._id)) {
      return;
    }

    try {
      setCompleting(true);

      const response = await api.post(
        `/enrollments/${courseId}/lessons/${activeLesson._id}/complete`
      );

      setCompletedLessons(
        (previous) => [
          ...new Set([...previous, activeLesson._id.toString()])
        ]
      );

      setProgress(response.data.progress);

      toast.success("Lesson completed successfully!");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to complete lesson"
      );
    } finally {
      setCompleting(false);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setActiveLesson(lessons[currentIndex - 1]);
    }
  };

  const goToNext = () => {
    if (currentIndex < lessons.length - 1) {
      setActiveLesson(lessons[currentIndex + 1]);
    }
  };

  const formatDuration = (seconds) => {
    const minutes = Math.floor((seconds || 0) / 60);
    return `${minutes} min`;
  };

  if (loading) {
    return <div className="lesson-loading">Loading lessons...</div>;
  }

  if (lessons.length === 0) {
    return (
      <div className="lesson-empty">
        <BookOpen size={48} />
        <h2>No Lessons Available</h2>
        <p>The instructor has not added any lessons yet.</p>
        <button onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  const videoSource = activeLesson?.videoUrl
    ? `${SERVER_BASE_URL}${activeLesson.videoUrl}`
    : null;

  return (
    <div className="lesson-player-page">
      <header className="lesson-header">
        <button
          className="lesson-back-btn"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={18} />
          Back to My Courses
        </button>

        <div className="lesson-header-title">
          <BookOpen size={20} />
          <span>Learning Portal</span>
        </div>
      </header>

      <div className="lesson-layout">
        <main className="lesson-main">
          <div className="lesson-video-container">
            {videoSource ? (
              <video
                key={videoSource}
                className="lesson-video"
                controls
                controlsList="nodownload"
                src={`${SERVER_BASE_URL}${activeLesson.videoUrl}`}
              >
                Your browser does not support video playback.
              </video>
            ) : (
              <div className="lesson-video-placeholder">
                <Play size={55} />
                <h3>Video Unavailable</h3>
                <p>This lesson does not have a video available.</p>
              </div>
            )}
          </div>

          <div className="lesson-content">
            <div className="lesson-meta">
              <span>
                Lesson {currentIndex + 1} of {lessons.length}
              </span>

              <span>
                <Clock size={15} />
                {formatDuration(activeLesson?.duration)}
              </span>
            </div>

            <h1>{activeLesson?.title}</h1>

            <p className="lesson-description">
              Continue learning and complete this lesson to improve
              your course progress.
            </p>

            <div className="lesson-completion">
              {isCompleted(activeLesson?._id) ? (
                <div className="completed-message">
                  <CheckCircle size={19} />
                  Lesson Completed
                </div>
              ) : (
                <button
                  className="mark-complete-btn"
                  onClick={markAsComplete}
                  disabled={completing}
                >
                  <Check size={18} />
                  {completing ? "Saving..." : "Mark as Complete"}
                </button>
              )}
            </div>

            <div className="lesson-progress-info">
              <div>
                <span>Course Progress</span>
                <strong>{progress}%</strong>
              </div>

              <div className="lesson-progress-track">
                <div
                  className="lesson-progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="lesson-navigation">
              <button
                onClick={goToPrevious}
                disabled={currentIndex === 0}
              >
                <ChevronLeft size={18} />
                Previous
              </button>

              <button
                className="next-lesson-btn"
                onClick={goToNext}
                disabled={currentIndex === lessons.length - 1}
              >
                Next Lesson
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </main>

        <aside className="lesson-sidebar">
          <div className="lesson-sidebar-heading">
            <div>
              <h2>Course Content</h2>
              <p>
                {completedLessons.length} of {lessons.length} completed
              </p>
            </div>
            <BookOpen size={22} />
          </div>

          <div className="lesson-list">
            {lessons.map((lesson, index) => (
              <button
                key={lesson._id}
                className={`lesson-item ${
                  activeLesson?._id === lesson._id ? "active" : ""
                }`}
                onClick={() => setActiveLesson(lesson)}
              >
                <div className="lesson-item-icon">
                  {isCompleted(lesson._id) ? (
                    <CheckCircle color="#16a34a" size={19} />
                  ) : activeLesson?._id === lesson._id ? (
                    <Play size={17} />
                  ) : (
                    <Circle size={17} />
                  )}
                </div>

                <div className="lesson-item-info">
                  <span className="lesson-number">
                    Lesson {index + 1}
                  </span>

                  <strong>{lesson.title}</strong>

                  <small>
                    <Clock size={12} />
                    {formatDuration(lesson.duration)}
                  </small>
                </div>
              </button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default LessonPlayer;
