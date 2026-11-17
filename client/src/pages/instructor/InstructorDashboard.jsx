import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  BookOpen,
  Users,
  Video,
  Award,
  IndianRupee,
  PlusCircle,
  Eye,
  EyeOff,
  ClipboardList,
  TrendingUp,
  ArrowRight
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";
import toast from "react-hot-toast";
import api from "../../services/api";

const BAR_COLORS = ["#4f46e5", "#6366f1", "#818cf8", "#a5b4fc", "#c7d2fe"];

export default function InstructorDashboard() {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await api.get("/users/instructor/stats");
        setStats(res.data.stats || {});
        setChartData(res.data.courseEnrollmentData || []);
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to load instructor metrics");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <div className="manage-loading">Loading instructor analytics...</div>;
  }

  const kpis = [
    {
      title: "Total Courses",
      value: stats?.totalCourses || 0,
      icon: BookOpen,
      sub: `${stats?.publishedCourses || 0} Published • ${stats?.draftCourses || 0} Drafts`,
      color: "#4f46e5"
    },
    {
      title: "Enrolled Students",
      value: stats?.totalStudents || 0,
      icon: Users,
      sub: "Active unique learners",
      color: "#16a34a"
    },
    {
      title: "Quizzes Created",
      value: stats?.totalQuizzes || 0,
      icon: ClipboardList,
      sub: "Active student assessments",
      color: "#f59e0b"
    },
    {
      title: "Live Classes",
      value: stats?.totalLiveClasses || 0,
      icon: Video,
      sub: "Interactive sessions scheduled",
      color: "#ec4899"
    },
    {
      title: "Total Earnings",
      value: `₹${(stats?.totalRevenue || 0).toLocaleString("en-IN")}`,
      icon: IndianRupee,
      sub: "From verified student purchases",
      color: "#059669"
    }
  ];

  return (
    <div style={{ maxWidth: "1400px", margin: "auto" }}>
      {/* Welcome Banner */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "28px"
        }}
      >
        <div>
          <h1 style={{ fontSize: "26px", color: "#1e293b", marginBottom: "6px" }}>
            Instructor Dashboard
          </h1>
          <p style={{ color: "#64748b", fontSize: "14px" }}>
            Welcome back, {user?.name}! Here is your course performance overview.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            type="button"
            className="manage-create-btn"
            onClick={() => navigate("/dashboard/create-course")}
          >
            <PlusCircle size={17} />
            Create Course
          </button>

          <button
            type="button"
            className="manage-create-btn"
            style={{ background: "#4338ca" }}
            onClick={() => navigate("/dashboard/instructor/quizzes/create")}
          >
            <ClipboardList size={17} />
            Create Quiz
          </button>

          <button
            type="button"
            className="manage-create-btn"
            style={{ background: "#3730a3" }}
            onClick={() => navigate("/dashboard/live-classes")}
          >
            <Video size={17} />
            Live Class
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: "18px",
          marginBottom: "30px"
        }}
      >
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.title}
              style={{
                background: "#ffffff",
                border: "1px solid #e8eaf2",
                borderRadius: "14px",
                padding: "20px",
                boxShadow: "0 4px 14px rgba(15, 23, 42, 0.03)"
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "14px"
                }}
              >
                <span style={{ fontSize: "13px", color: "#64748b", fontWeight: 600 }}>
                  {kpi.title}
                </span>
                <div
                  style={{
                    padding: "8px",
                    borderRadius: "10px",
                    background: `${kpi.color}15`,
                    color: kpi.color
                  }}
                >
                  <Icon size={20} />
                </div>
              </div>

              <h2 style={{ fontSize: "28px", color: "#1e293b", margin: "0 0 6px" }}>
                {kpi.value}
              </h2>

              <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0 }}>
                {kpi.sub}
              </p>
            </div>
          );
        })}
      </div>

      {/* Analytics Chart */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e8eaf2",
          borderRadius: "14px",
          padding: "26px",
          marginBottom: "30px",
          boxShadow: "0 4px 14px rgba(15, 23, 42, 0.03)"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h2 style={{ fontSize: "18px", color: "#1e293b", margin: "0 0 4px" }}>
              Student Enrollment by Course
            </h2>
            <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
              Real-time student numbers enrolled in your published content
            </p>
          </div>
          <TrendingUp size={22} color="#4f46e5" />
        </div>

        {chartData.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
            No courses available yet to render analytics.
          </div>
        ) : (
          <div style={{ width: "100%", height: 320 }}>
            <ResponsiveContainer>
              <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                <Tooltip
                  contentStyle={{
                    background: "#1e293b",
                    borderRadius: "8px",
                    border: "none",
                    color: "#ffffff",
                    fontSize: "13px"
                  }}
                  formatter={(val) => [`${val} Students`, "Enrolled"]}
                />
                <Bar dataKey="students" radius={[6, 6, 0, 0]}>
                  {chartData.map((_, index) => (
                    <Cell key={index} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Quick Navigation Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "18px"
        }}
      >
        <div
          onClick={() => navigate("/dashboard/manage-courses")}
          style={{
            background: "#ffffff",
            padding: "22px",
            borderRadius: "14px",
            border: "1px solid #e8eaf2",
            cursor: "pointer",
            transition: "0.2s"
          }}
        >
          <BookOpen size={24} color="#4f46e5" />
          <h3 style={{ fontSize: "16px", margin: "12px 0 6px" }}>Manage Courses & Upload Lessons</h3>
          <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
            Upload video lessons, edit course curricula, publish or unpublish.
          </p>
        </div>

        <div
          onClick={() => navigate("/dashboard/students")}
          style={{
            background: "#ffffff",
            padding: "22px",
            borderRadius: "14px",
            border: "1px solid #e8eaf2",
            cursor: "pointer",
            transition: "0.2s"
          }}
        >
          <Users size={24} color="#16a34a" />
          <h3 style={{ fontSize: "16px", margin: "12px 0 6px" }}>Enrolled Students Directory</h3>
          <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
            Inspect student progress, completion percentages, and contact details.
          </p>
        </div>

        <div
          onClick={() => navigate("/dashboard/instructor/quizzes")}
          style={{
            background: "#ffffff",
            padding: "22px",
            borderRadius: "14px",
            border: "1px solid #e8eaf2",
            cursor: "pointer",
            transition: "0.2s"
          }}
        >
          <ClipboardList size={24} color="#f59e0b" />
          <h3 style={{ fontSize: "16px", margin: "12px 0 6px" }}>Assessment & Quiz Results</h3>
          <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
            Analyze student test attempts, percentage scores, and pass rates.
          </p>
        </div>
      </div>
    </div>
  );
}