import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Video,
  Award,
  Clock,
  PlayCircle,
  GraduationCap,
  ArrowRight,
  TrendingUp
} from "lucide-react";
import InstructorDashboard from "../instructor/InstructorDashboard";
import AdminDashboard from "../admin/AdminDashboard";
import api from "../../services/api";

export default function Dashboard() {
  const { user } = useSelector((state) => state.auth);

  if (user?.role === "admin") {
    return <AdminDashboard />;
  }

  if (user?.role === "instructor") {
    return <InstructorDashboard />;
  }

  // Student Dashboard logic
  const [metrics, setMetrics] = useState({
    enrolledCourses: 0,
    completedCourses: 0,
    liveClassesCount: 0,
    quizzesCompleted: 0,
    averageQuizScore: 0,
    learningHours: "0.0"
  });
  const [recentCourses, setRecentCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudentStats = async () => {
      try {
        setLoading(true);
        const res = await api.get("/users/student/stats");
        if (res.data.stats) {
          setMetrics(res.data.stats);
        }
        if (res.data.recentEnrollments) {
          setRecentCourses(res.data.recentEnrollments);
        }
      } catch (err) {
        // graceful fallback if empty
      } finally {
        setLoading(false);
      }
    };

    fetchStudentStats();
  }, []);

  const stats = [
    {
      title: "Enrolled Courses",
      value: metrics.enrolledCourses,
      icon: BookOpen,
      sub: `${metrics.completedCourses} Completed`,
      color: "#4f46e5"
    },
    {
      title: "Upcoming Live Classes",
      value: metrics.liveClassesCount,
      icon: Video,
      sub: "Interactive sessions scheduled",
      color: "#ec4899"
    },
    {
      title: "Quizzes Completed",
      value: metrics.quizzesCompleted,
      icon: Award,
      sub: `Avg score: ${metrics.averageQuizScore}%`,
      color: "#f59e0b"
    },
    {
      title: "Learning Hours",
      value: `${metrics.learningHours} hrs`,
      icon: Clock,
      sub: "Estimated study time",
      color: "#16a34a"
    }
  ];

  return (
    <div>
      <div className="welcome-section">
        <h1>Your Learning Dashboard</h1>
        <p>
          Welcome back, {user?.name}! Continue where you left off and achieve your study goals.
        </p>
      </div>

      <div className="stats-grid">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <div className="stat-card" key={item.title}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <div
                  className="stat-icon"
                  style={{ color: item.color, marginBottom: "8px" }}
                >
                  <Icon size={24} />
                </div>
              </div>
              <p>{item.title}</p>
              <h2>{item.value}</h2>
              <small style={{ color: "#94a3b8", fontSize: "12px" }}>{item.sub}</small>
            </div>
          );
        })}
      </div>

      {/* Continue Learning Section */}
      {recentCourses.length > 0 ? (
        <div style={{ marginBottom: "30px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px"
            }}
          >
            <h2 style={{ fontSize: "19px", color: "#1e293b", margin: 0 }}>
              Continue Learning
            </h2>
            <Link
              to="/dashboard/my-courses"
              style={{
                fontSize: "13px",
                color: "#4f46e5",
                fontWeight: 600,
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: "4px"
              }}
            >
              View All Enrolled Courses <ArrowRight size={15} />
            </Link>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "16px"
            }}
          >
            {recentCourses.map((item) => (
              <div
                key={item._id}
                style={{
                  background: "#ffffff",
                  borderRadius: "14px",
                  padding: "18px",
                  border: "1px solid #e8eaf2",
                  boxShadow: "0 3px 12px rgba(15, 23, 42, 0.03)"
                }}
              >
                <span
                  style={{
                    fontSize: "11px",
                    color: "#4f46e5",
                    background: "#eef2ff",
                    padding: "3px 8px",
                    borderRadius: "4px",
                    fontWeight: 600
                  }}
                >
                  {item.course?.category || "General"}
                </span>

                <h3 style={{ fontSize: "15px", margin: "10px 0 6px", color: "#1e293b" }}>
                  {item.course?.title}
                </h3>

                <div style={{ margin: "14px 0" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "12px",
                      marginBottom: "6px"
                    }}
                  >
                    <span style={{ color: "#64748b" }}>Progress</span>
                    <strong style={{ color: "#4f46e5" }}>{item.progress}%</strong>
                  </div>
                  <div
                    style={{
                      height: "6px",
                      background: "#e2e8f0",
                      borderRadius: "10px",
                      overflow: "hidden"
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${item.progress}%`,
                        background: item.progress === 100 ? "#16a34a" : "#4f46e5",
                        borderRadius: "10px"
                      }}
                    />
                  </div>
                </div>

                <Link
                  to={`/dashboard/learn/${item.course?._id}`}
                  className="continue-learning-btn"
                  style={{ margin: 0, padding: "8px", fontSize: "13px" }}
                >
                  <PlayCircle size={15} />
                  {item.progress === 100 ? "Review Course" : "Continue Lesson"}
                </Link>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="dashboard-panel">
        <h2>Explore LearnHub</h2>
        <p>
          Discover new courses taught by experts, test your skills through interactive quizzes,
          and participate in scheduled live classrooms with instructor feedback.
        </p>
        <div style={{ marginTop: "16px" }}>
          <Link
            to="/dashboard/courses"
            className="browse-courses-btn"
            style={{ display: "inline-flex" }}
          >
            <BookOpen size={16} /> Explore All Courses
          </Link>
        </div>
      </div>
    </div>
  );
}