
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import {
  GraduationCap,
  LayoutDashboard,
  BookOpen,
  Library,
  Video,
  ClipboardList,
  LogOut,
  Users,
  PlusCircle,
  Bell,
  Check,
  ExternalLink
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import api from "../../services/api";

import { logout } from "../../store/authSlice";
import toast from "react-hot-toast";

export default function DashboardLayout() {
  const { user } = useSelector((state) => state.auth);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);

  const loadNotifications = async () => {
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch {
      // ignore in background
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000); // 30s poll
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      toast.error("Failed to mark notifications read");
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      try {
        await api.patch(`/notifications/${notif._id}/read`);
        setUnreadCount((prev) => Math.max(0, prev - 1));
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
        );
      } catch {
        // ignore
      }
    }

    if (notif.link) {
      setShowNotifications(false);
      navigate(notif.link);
    }
  };

  const instructor = user?.role === "instructor";
  const admin = user?.role === "admin";
  const student = user?.role === "student";

  const handleLogout = () => {
    dispatch(logout());
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const studentLinks = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard
    },
    {
      name: "Courses",
      path: "/dashboard/courses",
      icon: Library
    },
    {
      name: "My Courses",
      path: "/dashboard/my-courses",
      icon: BookOpen
    },
    {
      name: "Quizzes",
      path: "/dashboard/quizzes",
      icon: ClipboardList
    },
    {
      name: "Live Classes",
      path: "/dashboard/live-classes",
      icon: Video
    }
  ];

  const instructorLinks = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard
    },
    {
      name: "Manage Courses",
      path: "/dashboard/manage-courses",
      icon: BookOpen
    },
    {
      name: "Create Course",
      path: "/dashboard/create-course",
      icon: PlusCircle
    },
    {
      name: "Manage Quizzes",
      path: "/dashboard/instructor/quizzes",
      icon: ClipboardList
    },
    {
      name: "Live Classes",
      path: "/dashboard/live-classes",
      icon: Video
    },
    {
      name: "Students",
      path: "/dashboard/students",
      icon: Users
    }
  ];

  const adminLinks = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard
    },
    {
      name: "Users",
      path: "/dashboard/admin/users",
      icon: Users
    },
    {
      name: "Courses",
      path: "/dashboard/admin/courses",
      icon: BookOpen
    },
    {
      name: "Manage Quizzes",
      path: "/dashboard/instructor/quizzes",
      icon: ClipboardList
    },
    {
      name: "Live Classes",
      path: "/dashboard/live-classes",
      icon: Video
    }
  ];

  const links = admin ? adminLinks : instructor ? instructorLinks : studentLinks;

  return (
    <div className="dashboard-layout">

      <aside className="sidebar">

        <div className="sidebar-brand">
          <GraduationCap size={30} />
          <h2>LearnHub</h2>
        </div>

        <nav>
          {links.map((link) => {
            const Icon = link.icon;

            return (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.path === "/dashboard"}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? "active" : ""}`
                }
              >
                <Icon size={19} />
                <span>{link.name}</span>
              </NavLink>
            );
          })}
        </nav>

        <button
          className="logout-button"
          onClick={handleLogout}
        >
          <LogOut size={19} />
          <span>Logout</span>
        </button>

      </aside>

      <main className="dashboard-main">

        <header className="dashboard-header">

          <div>
            <h3>Hello, {user?.name || "Learner"} 👋</h3>
            <p>Welcome to your learning space</p>
          </div>

          <div className="header-user" style={{ display: "flex", alignItems: "center", gap: "16px", position: "relative" }} ref={notifRef}>
            {/* Notification Bell */}
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              style={{
                position: "relative",
                background: "#f1f5f9",
                border: "none",
                borderRadius: "50%",
                width: "40px",
                height: "40px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#475569",
                transition: "0.2s"
              }}
              title="Notifications"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "-2px",
                    right: "-2px",
                    background: "#ef4444",
                    color: "#ffffff",
                    borderRadius: "50%",
                    fontSize: "11px",
                    fontWeight: 700,
                    width: "18px",
                    height: "18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Popover */}
            {showNotifications && (
              <div
                style={{
                  position: "absolute",
                  top: "50px",
                  right: 0,
                  width: "360px",
                  background: "#ffffff",
                  borderRadius: "14px",
                  boxShadow: "0 10px 35px rgba(15, 23, 42, 0.15)",
                  border: "1px solid #e2e8f0",
                  zIndex: 1000,
                  overflow: "hidden"
                }}
              >
                <div
                  style={{
                    padding: "14px 18px",
                    borderBottom: "1px solid #f1f5f9",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <strong style={{ fontSize: "14px", color: "#1e293b" }}>Notifications</strong>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#4f46e5",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer"
                      }}
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div style={{ maxHeight: "360px", overflowY: "auto" }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: "30px 20px", textAlign: "center", color: "#64748b", fontSize: "13px" }}>
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif._id}
                        onClick={() => handleNotificationClick(notif)}
                        style={{
                          padding: "12px 16px",
                          borderBottom: "1px solid #f8fafc",
                          background: notif.isRead ? "#ffffff" : "#f0f4ff",
                          cursor: "pointer",
                          transition: "0.2s",
                          position: "relative"
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                          <strong style={{ fontSize: "13px", color: notif.isRead ? "#334155" : "#1e293b" }}>
                            {notif.title}
                          </strong>
                          <span style={{ fontSize: "10px", color: "#94a3b8" }}>
                            {new Date(notif.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: "12px", color: "#64748b", lineHeight: "1.4" }}>
                          {notif.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            <span className="role-badge">
              {user?.role || "student"}
            </span>
          </div>

        </header>

        <section className="dashboard-content">
          <Outlet />
        </section>

      </main>

    </div>
  );
}
