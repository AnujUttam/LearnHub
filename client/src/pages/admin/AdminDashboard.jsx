import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  BookOpen,
  GraduationCap,
  ShieldAlert,
  IndianRupee,
  CreditCard,
  Eye,
  UserCheck,
  ArrowRight
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminMetrics = async () => {
      try {
        setLoading(true);
        const res = await api.get("/users/admin/stats");
        setStats(res.data.stats || {});
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to load admin metrics");
      } finally {
        setLoading(false);
      }
    };

    fetchAdminMetrics();
  }, []);

  if (loading) {
    return <div className="manage-loading">Loading platform analytics...</div>;
  }

  const kpis = [
    {
      title: "Total Registered Users",
      value: stats?.totalUsers || 0,
      sub: `${stats?.totalStudents || 0} Students • ${stats?.totalInstructors || 0} Instructors`,
      icon: Users,
      color: "#4f46e5"
    },
    {
      title: "Platform Courses",
      value: stats?.totalCourses || 0,
      sub: `${stats?.publishedCourses || 0} Published • ${stats?.draftCourses || 0} Drafts`,
      icon: BookOpen,
      color: "#16a34a"
    },
    {
      title: "Total Enrollments",
      value: stats?.totalEnrollments || 0,
      sub: "Active course learning registrations",
      icon: GraduationCap,
      color: "#8b5cf6"
    },
    {
      title: "Verified Revenue",
      value: `₹${(stats?.totalRevenue || 0).toLocaleString("en-IN")}`,
      sub: `${stats?.totalPayments || 0} successful orders`,
      icon: IndianRupee,
      color: "#059669"
    }
  ];

  return (
    <div style={{ maxWidth: "1400px", margin: "auto" }}>
      {/* Header */}
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
            Platform Administration
          </h1>
          <p style={{ color: "#64748b", fontSize: "14px" }}>
            Real-time LearnHub platform health, user directory, and content governance.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="button"
            className="manage-create-btn"
            onClick={() => navigate("/dashboard/admin/users")}
          >
            <Users size={17} />
            Manage Users
          </button>

          <button
            type="button"
            className="manage-create-btn"
            style={{ background: "#4338ca" }}
            onClick={() => navigate("/dashboard/admin/courses")}
          >
            <BookOpen size={17} />
            Moderate Courses
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
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
                padding: "24px",
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
                    padding: "9px",
                    borderRadius: "10px",
                    background: `${kpi.color}15`,
                    color: kpi.color
                  }}
                >
                  <Icon size={22} />
                </div>
              </div>

              <h2 style={{ fontSize: "30px", color: "#1e293b", margin: "0 0 8px" }}>
                {kpi.value}
              </h2>

              <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0 }}>
                {kpi.sub}
              </p>
            </div>
          );
        })}
      </div>

      {/* Admin Action Banners */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "20px"
        }}
      >
        <div
          onClick={() => navigate("/dashboard/admin/users")}
          style={{
            background: "#ffffff",
            padding: "26px",
            borderRadius: "14px",
            border: "1px solid #e8eaf2",
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(15, 23, 42, 0.03)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Users size={28} color="#4f46e5" />
            <ArrowRight size={18} color="#94a3b8" />
          </div>
          <h3 style={{ fontSize: "18px", margin: "16px 0 8px", color: "#1e293b" }}>
            User Governance & Access Control
          </h3>
          <p style={{ fontSize: "13px", color: "#64748b", lineHeight: "1.6", margin: 0 }}>
            Inspect student and instructor profiles, search by email, filter by role, or deactivate non-compliant accounts.
          </p>
        </div>

        <div
          onClick={() => navigate("/dashboard/admin/courses")}
          style={{
            background: "#ffffff",
            padding: "26px",
            borderRadius: "14px",
            border: "1px solid #e8eaf2",
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(15, 23, 42, 0.03)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <BookOpen size={28} color="#16a34a" />
            <ArrowRight size={18} color="#94a3b8" />
          </div>
          <h3 style={{ fontSize: "18px", margin: "16px 0 8px", color: "#1e293b" }}>
            Course Quality & Moderation
          </h3>
          <p style={{ fontSize: "13px", color: "#64748b", lineHeight: "1.6", margin: 0 }}>
            Review all courses published across the platform, verify curricula, and manage inappropriate content.
          </p>
        </div>
      </div>
    </div>
  );
}