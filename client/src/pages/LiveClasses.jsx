import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  Video,
  Calendar,
  Clock,
  Play,
  Plus,
  Users,
  CheckCircle,
  AlertCircle,
  X,
  Radio,
  Trash2,
  BookOpen,
  ArrowRight,
  LogOut
} from "lucide-react";
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer
} from "@livekit/components-react";
import toast from "react-hot-toast";
import api from "../services/api";

export default function LiveClasses() {
  const { user } = useSelector((state) => state.auth);
  const isInstructor = user?.role === "instructor" || user?.role === "admin";

  const [classes, setClasses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Scheduling Modal
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    title: "",
    description: "",
    course: "",
    scheduledAt: "",
    duration: 60
  });

  // Active LiveKit Meeting Room State
  const [activeSession, setActiveSession] = useState(null);
  // Waiting room state for students
  const [waitingInfo, setWaitingInfo] = useState(null);
  const [actionId, setActionId] = useState(null);

  const loadClasses = async () => {
    try {
      setLoading(true);
      if (isInstructor) {
        const [classesRes, coursesRes] = await Promise.all([
          api.get("/live-classes/instructor/my-classes"),
          api.get("/courses/instructor/my-courses")
        ]);
        setClasses(classesRes.data.liveClasses || []);
        setCourses(coursesRes.data.courses || []);
        if (coursesRes.data.courses?.length > 0 && !scheduleForm.course) {
          setScheduleForm((prev) => ({
            ...prev,
            course: coursesRes.data.courses[0]._id
          }));
        }
      } else {
        const res = await api.get("/live-classes/upcoming");
        setClasses(res.data.liveClasses || []);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load live classes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, [isInstructor]);

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!scheduleForm.title.trim() || !scheduleForm.course || !scheduleForm.scheduledAt) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setScheduling(true);
      await api.post("/live-classes", {
        ...scheduleForm,
        title: scheduleForm.title.trim(),
        duration: Number(scheduleForm.duration) || 60
      });

      toast.success("Live class scheduled successfully!");
      setShowScheduleModal(false);
      setScheduleForm({
        title: "",
        description: "",
        course: courses[0]?._id || "",
        scheduledAt: "",
        duration: 60
      });
      loadClasses();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to schedule class");
    } finally {
      setScheduling(false);
    }
  };

  const handleJoinClass = async (classItem) => {
    try {
      setActionId(classItem._id);
      const res = await api.post(`/live-classes/${classItem._id}/join`);

      if (res.data.waiting) {
        setWaitingInfo({
          ...res.data,
          classItem
        });
        toast("Waiting room: The instructor has not started the session yet.", {
          icon: "⏳"
        });
      } else if (res.data.token && res.data.serverUrl) {
        setActiveSession({
          serverUrl: res.data.serverUrl,
          token: res.data.token,
          roomName: res.data.roomName,
          title: classItem.title,
          classId: classItem._id
        });
        toast.success("Connected to live class!");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to join live class");
    } finally {
      setActionId(null);
    }
  };

  const handleEndClass = async (classId) => {
    if (!window.confirm("Are you sure you want to end this live class for all participants?")) {
      return;
    }

    try {
      await api.patch(`/live-classes/${classId}/status`, { status: "completed" });
      toast.success("Live class ended");
      if (activeSession?.classId === classId) {
        setActiveSession(null);
      }
      loadClasses();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to end class");
    }
  };

  const handleDeleteClass = async (classId) => {
    if (!window.confirm("Are you sure you want to delete this scheduled class?")) {
      return;
    }

    try {
      await api.delete(`/live-classes/${classId}`);
      toast.success("Class deleted");
      setClasses((prev) => prev.filter((c) => c._id !== classId));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete class");
    }
  };

  const handleLeaveMeeting = () => {
    setActiveSession(null);
    toast("Left the live session", { icon: "👋" });
    loadClasses();
  };

  // If currently in a LiveKit Meeting
  if (activeSession) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "calc(100vh - 120px)",
          background: "#0f172a",
          borderRadius: "16px",
          overflow: "hidden",
          color: "#ffffff"
        }}
      >
        {/* Meeting Header */}
        <div
          style={{
            padding: "16px 24px",
            background: "#1e293b",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid #334155"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "#ef4444",
                padding: "4px 10px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: 700
              }}
            >
              <Radio size={14} className="animate-pulse" />
              LIVE
            </div>
            <h2 style={{ fontSize: "17px", margin: 0 }}>{activeSession.title}</h2>
          </div>

          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            {isInstructor && (
              <button
                type="button"
                onClick={() => handleEndClass(activeSession.classId)}
                style={{
                  background: "#dc2626",
                  color: "#ffffff",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                End Meeting for All
              </button>
            )}

            <button
              type="button"
              onClick={handleLeaveMeeting}
              style={{
                background: "#334155",
                color: "#ffffff",
                border: "none",
                padding: "8px 16px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <LogOut size={15} />
              Leave
            </button>
          </div>
        </div>

        {/* LiveKit Video Room */}
        <div style={{ flex: 1, position: "relative" }}>
          <LiveKitRoom
            serverUrl={activeSession.serverUrl}
            token={activeSession.token}
            connect={true}
            video={true}
            audio={true}
            onDisconnected={handleLeaveMeeting}
            style={{ height: "100%", width: "100%" }}
          >
            <VideoConference />
            <RoomAudioRenderer />
          </LiveKitRoom>
        </div>
      </div>
    );
  }

  return (
    <div className="manage-courses-page">
      {/* Page Header */}
      <div className="manage-courses-header">
        <div>
          <h1>{isInstructor ? "Live Classes & Webinars" : "Upcoming Live Classes"}</h1>
          <p>
            {isInstructor
              ? "Schedule live interactive lectures and broadcast directly to your enrolled students."
              : "Attend live lectures, interact with instructors, and ask real-time questions."}
          </p>
        </div>

        {isInstructor && (
          <button
            type="button"
            className="manage-create-btn"
            onClick={() => setShowScheduleModal(true)}
            disabled={courses.length === 0}
          >
            <Plus size={18} />
            Schedule Live Class
          </button>
        )}
      </div>

      {/* Waiting Room Modal */}
      {waitingInfo && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px"
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              maxWidth: "500px",
              width: "100%",
              padding: "32px",
              textAlign: "center",
              boxShadow: "0 20px 45px rgba(0,0,0,0.2)"
            }}
          >
            <div
              style={{
                width: "70px",
                height: "70px",
                borderRadius: "50%",
                background: "#eef2ff",
                color: "#4f46e5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px"
              }}
            >
              <Clock size={36} />
            </div>

            <h2 style={{ fontSize: "20px", color: "#1e293b", marginBottom: "10px" }}>
              Waiting for Instructor
            </h2>

            <p style={{ color: "#64748b", fontSize: "14px", lineHeight: "1.6", marginBottom: "20px" }}>
              You have entered the waiting room for <strong>{waitingInfo.title}</strong>.
              The session will connect automatically as soon as the instructor starts.
            </p>

            <div
              style={{
                background: "#f8fafc",
                padding: "12px",
                borderRadius: "8px",
                fontSize: "13px",
                color: "#475569",
                marginBottom: "24px"
              }}
            >
              Scheduled Time: {new Date(waitingInfo.scheduledAt).toLocaleString()}
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <button
                type="button"
                className="manage-create-btn"
                onClick={() => handleJoinClass(waitingInfo.classItem)}
              >
                Refresh / Retry Join
              </button>
              <button
                type="button"
                className="cancel-course-button"
                onClick={() => setWaitingInfo(null)}
              >
                Close Waiting Room
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Live Class Modal */}
      {showScheduleModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px"
          }}
          onClick={() => setShowScheduleModal(false)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              maxWidth: "580px",
              width: "100%",
              padding: "30px",
              boxShadow: "0 20px 45px rgba(0,0,0,0.2)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px"
              }}
            >
              <h2 style={{ fontSize: "20px", color: "#1e293b" }}>Schedule Live Class</h2>
              <button
                type="button"
                onClick={() => setShowScheduleModal(false)}
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  color: "#64748b"
                }}
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit}>
              <div className="form-group">
                <label>Course *</label>
                <select
                  value={scheduleForm.course}
                  onChange={(e) =>
                    setScheduleForm({ ...scheduleForm, course: e.target.value })
                  }
                  required
                >
                  <option value="">Select course</option>
                  {courses.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Class Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Live Q&A and Project Review"
                  value={scheduleForm.title}
                  onChange={(e) =>
                    setScheduleForm({ ...scheduleForm, title: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  placeholder="What will be covered in this live session?"
                  value={scheduleForm.description}
                  onChange={(e) =>
                    setScheduleForm({ ...scheduleForm, description: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={scheduleForm.scheduledAt}
                    onChange={(e) =>
                      setScheduleForm({ ...scheduleForm, scheduledAt: e.target.value })
                    }
                    min={new Date().toISOString().slice(0, 16)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Duration (Minutes)</label>
                  <input
                    type="number"
                    min={15}
                    max={240}
                    value={scheduleForm.duration}
                    onChange={(e) =>
                      setScheduleForm({ ...scheduleForm, duration: e.target.value })
                    }
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
                <button
                  type="submit"
                  className="manage-create-btn"
                  style={{ flex: 1 }}
                  disabled={scheduling}
                >
                  {scheduling ? "Scheduling..." : "Confirm Schedule"}
                </button>
                <button
                  type="button"
                  className="cancel-course-button"
                  onClick={() => setShowScheduleModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Class Listings */}
      {loading ? (
        <div className="manage-loading">Loading live classes...</div>
      ) : classes.length === 0 ? (
        <div className="manage-empty">
          <Video size={48} />
          <h2>No Live Classes Scheduled</h2>
          <p>
            {isInstructor
              ? "Schedule your first live session to connect interactively with your learners."
              : "There are no live classes scheduled for your enrolled courses right now."}
          </p>
          {isInstructor && (
            <button
              className="manage-create-btn"
              onClick={() => setShowScheduleModal(true)}
            >
              <Plus size={18} />
              Schedule Live Class
            </button>
          )}
        </div>
      ) : (
        <div className="manage-course-list">
          {classes.map((cls) => {
            const isLive = cls.status === "live";
            const isCompleted = cls.status === "completed";
            const scheduledTime = new Date(cls.scheduledAt);

            return (
              <div className="manage-course-card" key={cls._id}>
                <div
                  className="manage-course-image"
                  style={{
                    background: isLive ? "#fee2e2" : "#eef2ff",
                    color: isLive ? "#dc2626" : "#4f46e5"
                  }}
                >
                  {isLive ? <Radio size={36} className="animate-pulse" /> : <Video size={36} />}
                </div>

                <div className="manage-course-info">
                  <div className="manage-course-top">
                    <span className="manage-category">
                      {cls.course?.title || "Course Session"}
                    </span>
                    <span
                      className={`course-status ${
                        isLive ? "published" : isCompleted ? "draft" : "pending"
                      }`}
                      style={{
                        background: isLive ? "#fee2e2" : undefined,
                        color: isLive ? "#dc2626" : undefined
                      }}
                    >
                      {isLive ? "🔴 LIVE NOW" : cls.status.toUpperCase()}
                    </span>
                  </div>

                  <h3>{cls.title}</h3>
                  <p>{cls.description || "Interactive live session."}</p>

                  <div className="manage-course-meta">
                    <span>
                      <Calendar size={14} />
                      {scheduledTime.toLocaleDateString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric"
                      })}
                    </span>
                    <span>
                      <Clock size={14} />
                      {scheduledTime.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}{" "}
                      ({cls.duration} mins)
                    </span>
                    {cls.instructor?.name && (
                      <span>
                        <Users size={14} />
                        Instructor: {cls.instructor.name}
                      </span>
                    )}
                  </div>
                </div>

                <div className="manage-course-actions">
                  {!isCompleted && (
                    <button
                      type="button"
                      className="manage-create-btn"
                      style={{
                        background: isLive ? "#dc2626" : "#4f46e5",
                        padding: "10px 16px"
                      }}
                      onClick={() => handleJoinClass(cls)}
                      disabled={actionId === cls._id}
                    >
                      {isLive ? <Radio size={16} /> : <Play size={16} />}
                      {isLive ? "Join Live Class" : isInstructor ? "Start Class" : "Join Class"}
                    </button>
                  )}

                  {isInstructor && isLive && (
                    <button
                      type="button"
                      className="delete-course-btn"
                      onClick={() => handleEndClass(cls._id)}
                      title="End class"
                    >
                      End
                    </button>
                  )}

                  {isInstructor && !isLive && !isCompleted && (
                    <button
                      type="button"
                      className="delete-course-btn"
                      onClick={() => handleDeleteClass(cls._id)}
                      title="Delete scheduled class"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}