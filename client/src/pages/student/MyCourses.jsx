
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  GraduationCap,
  CheckCircle,
  Award,
  PlayCircle
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

export default function MyCourses() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMyCourses = async () => {
      try {
        const response = await api.get("/enrollments/my-courses");

        setEnrollments(response.data.enrollments || []);
      } catch (error) {
        toast.error(
          error.response?.data?.message || "Unable to load your courses"
        );
      } finally {
        setLoading(false);
      }
    };

    loadMyCourses();
  }, []);

  if (loading) {
    return <p>Loading your courses...</p>;
  }

  return (
    <div className="my-courses-page">

      <div className="courses-heading">
        <div>
          <h1>My Courses</h1>
          <p>
            Continue learning from the courses you have enrolled in.
          </p>
        </div>
      </div>

      {enrollments.length === 0 ? (

        <div className="my-courses-empty">
          <div className="my-courses-empty-icon">
            <GraduationCap size={42} />
          </div>

          <h2>You haven't enrolled in any course yet</h2>

          <p>
            Explore our courses and enroll in your first course
            to start learning.
          </p>

          <Link
            to="/dashboard/courses"
            className="browse-courses-btn"
          >
            <BookOpen size={18} />
            Explore Courses
          </Link>
        </div>

      ) : (

        <div className="courses-grid">

          {enrollments.map((enrollment) => {
            const course = enrollment.course;

            if (!course) return null;

            const progress = Math.min(
              100,
              Math.max(0, enrollment.progress || 0)
            );

            const completedCount =
              enrollment.completedLessons?.length || 0;

            const totalLessons = course.lessons?.length || 0;

            const isCompleted =
              enrollment.status === "completed" || progress === 100;

            return (
              <div className="course-card" key={enrollment._id}>

                {course.thumbnail ? (
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                  />
                ) : (
                  <div className="course-placeholder">
                    <BookOpen size={40} />
                  </div>
                )}

                <div className="course-card-content">

                  <span>
                    {course.category || "General"}
                  </span>

                  <h3>{course.title}</h3>

                  <p>{course.description}</p>

                  <p className="course-instructor">
                    By {course.instructor?.name || "Instructor"}
                  </p>

                  {/* Completion Status */}
                  {isCompleted && (
                    <div className="course-completed-badge">
                      <Award size={17} />
                      Course Completed
                    </div>
                  )}

                  {/* Progress */}
                  <div className="my-course-progress">

                    <div className="my-course-progress-heading">
                      <span>Learning Progress</span>

                      <strong>{progress}%</strong>
                    </div>

                    <div className="my-course-progress-track">
                      <div
                        className="my-course-progress-fill"
                        style={{
                          width: `${progress}%`
                        }}
                      />
                    </div>

                    <div className="course-lesson-count">
                      <span>
                        <CheckCircle size={14} />
                        {completedCount} Completed
                      </span>

                      <span>
                        {totalLessons} Total Lessons
                      </span>
                    </div>

                  </div>

                  <Link
                    to={`/dashboard/learn/${course._id}`}
                    className="continue-learning-btn"
                  >
                    {isCompleted ? (
                      <>
                        <CheckCircle size={17} />
                        Review Course
                      </>
                    ) : (
                      <>
                        <PlayCircle size={17} />
                        Continue Learning
                      </>
                    )}
                  </Link>

                </div>
              </div>
            );
          })}

        </div>

      )}

    </div>
  );
}
