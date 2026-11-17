import { useEffect, useState } from "react";
import { Users, Search, Shield, CheckCircle2, XCircle, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../services/api";

export default function ManageUsers() {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [actionId, setActionId] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (roleFilter !== "all") params.role = roleFilter;

      const res = await api.get("/users/admin/users", { params });
      setUsers(res.data.users || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      fetchUsers();
    }, 300);

    return () => clearTimeout(delaySearch);
  }, [search, roleFilter]);

  const handleToggleStatus = async (user) => {
    const action = user.isActive ? "deactivate" : "activate";
    if (!window.confirm(`Are you sure you want to ${action} ${user.name}'s account?`)) {
      return;
    }

    try {
      setActionId(user._id);
      const res = await api.patch(`/users/admin/users/${user._id}/status`);
      toast.success(res.data.message || `User status updated`);
      setUsers((prev) =>
        prev.map((u) =>
          u._id === user._id ? { ...u, isActive: res.data.user.isActive } : u
        )
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update user status");
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="manage-courses-page">
      <div className="manage-courses-header">
        <div>
          <button
            type="button"
            className="back-button"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft size={17} />
            Back to Dashboard
          </button>
          <h1>User Governance</h1>
          <p>Search, filter, and control user access across student, instructor, and admin roles.</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "14px",
          marginBottom: "24px"
        }}
      >
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", flex: 1 }}>
          <div className="course-search" style={{ width: "320px" }}>
            <Search size={18} />
            <input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{
              height: "44px",
              padding: "0 14px",
              borderRadius: "9px",
              border: "1px solid #dbe2ee",
              background: "#ffffff",
              fontSize: "13px",
              color: "#1e293b",
              outline: "none"
            }}
          >
            <option value="all">All Roles</option>
            <option value="student">Students</option>
            <option value="instructor">Instructors</option>
            <option value="admin">Admins</option>
          </select>
        </div>

        <div style={{ fontSize: "13px", color: "#64748b" }}>
          Total Users Found: <strong>{users.length}</strong>
        </div>
      </div>

      {loading ? (
        <div className="manage-loading">Loading users directory...</div>
      ) : users.length === 0 ? (
        <div className="manage-empty">
          <Users size={48} />
          <h2>No Users Found</h2>
          <p>No user accounts matched the search or filter criteria.</p>
        </div>
      ) : (
        <div
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            border: "1px solid #e8eaf2",
            overflow: "hidden",
            boxShadow: "0 4px 14px rgba(15, 23, 42, 0.03)"
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left",
                fontSize: "13px"
              }}
            >
              <thead>
                <tr style={{ background: "#f8fafc", color: "#475569", borderBottom: "1px solid #e2e8f0" }}>
                  <th style={{ padding: "14px 18px" }}>User</th>
                  <th style={{ padding: "14px 18px" }}>Role</th>
                  <th style={{ padding: "14px 18px" }}>Account Status</th>
                  <th style={{ padding: "14px 18px" }}>Member Since</th>
                  <th style={{ padding: "14px 18px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const roleColors = {
                    admin: { bg: "#fee2e2", text: "#dc2626" },
                    instructor: { bg: "#e0e7ff", text: "#4338ca" },
                    student: { bg: "#f1f5f9", text: "#475569" }
                  };
                  const roleStyle = roleColors[u.role] || roleColors.student;

                  return (
                    <tr
                      key={u._id}
                      style={{ borderBottom: "1px solid #f1f5f9", transition: "0.2s" }}
                    >
                      <td style={{ padding: "14px 18px" }}>
                        <strong style={{ display: "block", color: "#1e293b", fontSize: "14px" }}>
                          {u.name}
                        </strong>
                        <span style={{ color: "#64748b", fontSize: "12px" }}>
                          {u.email}
                        </span>
                      </td>

                      <td style={{ padding: "14px 18px" }}>
                        <span
                          style={{
                            padding: "4px 9px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            background: roleStyle.bg,
                            color: roleStyle.text
                          }}
                        >
                          {u.role}
                        </span>
                      </td>

                      <td style={{ padding: "14px 18px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "4px 9px",
                            borderRadius: "20px",
                            fontSize: "11px",
                            fontWeight: 600,
                            background: u.isActive ? "#dcfce7" : "#fee2e2",
                            color: u.isActive ? "#15803d" : "#dc2626"
                          }}
                        >
                          {u.isActive ? "Active" : "Deactivated"}
                        </span>
                      </td>

                      <td style={{ padding: "14px 18px", color: "#64748b" }}>
                        {u.createdAt
                          ? new Date(u.createdAt).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric"
                            })
                          : "N/A"}
                      </td>

                      <td style={{ padding: "14px 18px", textAlign: "right" }}>
                        <button
                          type="button"
                          className={u.isActive ? "delete-course-btn" : "publish-btn"}
                          style={{ padding: "6px 12px", fontSize: "12px" }}
                          disabled={actionId === u._id}
                          onClick={() => handleToggleStatus(u)}
                        >
                          {u.isActive ? "Deactivate" : "Activate"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}