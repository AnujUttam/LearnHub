import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardList,
  Plus,
  Search,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  Users,
  Clock,
  Award,
  CheckCircle,
  XCircle,
  X
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

export default function InstructorQuizzes() {
  const navigate = useNavigate();

  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionId, setActionId] = useState(null);

  // Attempts Modal State
  const [selectedQuizAttempts, setSelectedQuizAttempts] = useState(null);
  const [loadingAttempts, setLoadingAttempts] = useState(false);

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      const res = await api.get("/quizzes/instructor/my-quizzes");
      setQuizzes(res.data.quizzes || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to load quizzes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuizzes();
  }, []);

  const handlePublish = async (quiz) => {
    try {
      setActionId(quiz._id);
      await api.patch(`/quizzes/${quiz._id}/publish`);
      toast.success(
        quiz.isPublished
          ? "Quiz unpublished"
          : "Quiz published successfully"
      );
      setQuizzes((prev) =>
        prev.map((q) =>
          q._id === quiz._id ? { ...q, isPublished: !q.isPublished } : q
        )
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update quiz status");
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (quizId) => {
    if (!window.confirm("Are you sure you want to delete this quiz? All student attempts will also be removed.")) {
      return;
    }

    try {
      setActionId(quizId);
      await api.delete(`/quizzes/${quizId}`);
      toast.success("Quiz deleted successfully");
      setQuizzes((prev) => prev.filter((q) => q._id !== quizId));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete quiz");
    } finally {
      setActionId(null);
    }
  };

  const handleViewAttempts = async (quizId) => {
    try {
      setLoadingAttempts(true);
      const res = await api.get(`/quizzes/${quizId}/attempts`);
      setSelectedQuizAttempts(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load attempts");
    } finally {
      setLoadingAttempts(false);
    }
  };

  const filteredQuizzes = quizzes.filter((q) => {
    const titleMatch = q.title?.toLowerCase().includes(search.toLowerCase());
    const courseMatch = q.course?.title
      ?.toLowerCase()
      .includes(search.toLowerCase());
    return titleMatch || courseMatch;
  });

  const totalAttempts = quizzes.reduce(
    (sum, q) => sum + (q.attemptsCount || 0),
    0
  );

  return (
    <div className="manage-courses-page">
      {/* Header */}
      <div className="manage-courses-header">
        <div>
          <h1>Quiz Management</h1>
          <p>Create and manage quizzes for your courses, view student submissions.</p>
        </div>

        <button
          className="manage-create-btn"
          onClick={() => navigate("/dashboard/instructor/quizzes/create")}
        >
          <Plus size={18} />
          Create New Quiz
        </button>
      </div>

      {/* Stats Cards */}
      <div className="manage-stats">
        <div className="manage-stat-card">
          <ClipboardList size={24} />
          <div>
            <span>Total Quizzes</span>
            <h2>{quizzes.length}</h2>
          </div>
        </div>

        <div className="manage-stat-card">
          <Eye size={24} />
          <div>
            <span>Published</span>
            <h2>{quizzes.filter((q) => q.isPublished).length}</h2>
          </div>
        </div>

        <div className="manage-stat-card">
          <Users size={24} />
          <div>
            <span>Total Attempts</span>
            <h2>{totalAttempts}</h2>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px"
        }}
      >
        <div className="course-search" style={{ width: "320px" }}>
          <Search size={18} />
          <input
            placeholder="Search quiz or course..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Loading & Empty States */}
      {loading ? (
        <div className="manage-loading">Loading your quizzes...</div>
      ) : filteredQuizzes.length === 0 ? (
        <div className="manage-empty">
          <ClipboardList size={48} />
          <h2>No Quizzes Found</h2>
          <p>
            {search
              ? "No quizzes match your search."
              : "Create your first quiz to assess student comprehension."}
          </p>
          <button
            className="manage-create-btn"
            onClick={() => navigate("/dashboard/instructor/quizzes/create")}
          >
            <Plus size={18} />
            Create Quiz
          </button>
        </div>
      ) : (
        <div className="manage-course-list">
          {filteredQuizzes.map((quiz) => (
            <div className="manage-course-card" key={quiz._id}>
              <div
                className="manage-course-image"
                style={{ background: "#eef2ff", color: "#4f46e5" }}
              >
                <ClipboardList size={38} />
              </div>

              <div className="manage-course-info">
                <div className="manage-course-top">
                  <span className="manage-category">
                    {quiz.course?.title || "General Course"}
                  </span>
                  <span
                    className={
                      quiz.isPublished
                        ? "course-status published"
                        : "course-status draft"
                    }
                  >
                    {quiz.isPublished ? "Published" : "Draft"}
                  </span>
                </div>

                <h3>{quiz.title}</h3>
                <p>{quiz.description || "No description provided."}</p>

                <div className="manage-course-meta">
                  <span>
                    <Clock size={14} />
                    {quiz.duration || 30} mins
                  </span>
                  <span>
                    <Award size={14} />
                    {quiz.totalMarks || 0} Total Marks
                  </span>
                  <span>
                    <CheckCircle size={14} />
                    Pass: {quiz.passingMarks || 0}
                  </span>
                  <span>
                    <Users size={14} />
                    {quiz.attemptsCount || 0} Student Attempts
                  </span>
                </div>
              </div>

              <div className="manage-course-actions">
                <button
                  type="button"
                  className="publish-btn"
                  onClick={() => handleViewAttempts(quiz._id)}
                  title="View Student Results"
                >
                  <Users size={15} />
                  Results ({quiz.attemptsCount || 0})
                </button>

                <button
                  type="button"
                  className="publish-btn"
                  onClick={() =>
                    navigate(`/dashboard/instructor/quizzes/edit/${quiz._id}`)
                  }
                  title="Edit Quiz"
                >
                  <Pencil size={15} />
                  Edit
                </button>

                <button
                  type="button"
                  className="publish-btn"
                  disabled={actionId === quiz._id}
                  onClick={() => handlePublish(quiz)}
                >
                  {quiz.isPublished ? <EyeOff size={15} /> : <Eye size={15} />}
                  {quiz.isPublished ? "Unpublish" : "Publish"}
                </button>

                <button
                  type="button"
                  className="delete-course-btn"
                  disabled={actionId === quiz._id}
                  onClick={() => handleDelete(quiz._id)}
                  title="Delete Quiz"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Attempts Modal */}
      {(selectedQuizAttempts || loadingAttempts) && (
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
          onClick={() => setSelectedQuizAttempts(null)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              maxWidth: "750px",
              width: "100%",
              maxHeight: "85vh",
              overflowY: "auto",
              padding: "26px",
              boxShadow: "0 20px 45px rgba(0,0,0,0.2)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid #e2e8f0",
                paddingBottom: "15px",
                marginBottom: "20px"
              }}
            >
              <div>
                <h2 style={{ fontSize: "20px", color: "#1e293b" }}>
                  Student Attempts: {selectedQuizAttempts?.quiz?.title}
                </h2>
                <p style={{ fontSize: "13px", color: "#64748b" }}>
                  Total Submissions: {selectedQuizAttempts?.count || 0}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedQuizAttempts(null)}
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

            {loadingAttempts ? (
              <p style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
                Loading student results...
              </p>
            ) : selectedQuizAttempts?.attempts?.length === 0 ? (
              <p
                style={{
                  textAlign: "center",
                  padding: "40px",
                  color: "#64748b",
                  background: "#f8fafc",
                  borderRadius: "10px"
                }}
              >
                No students have submitted this quiz yet.
              </p>
            ) : (
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
                    <tr style={{ background: "#f1f5f9", color: "#475569" }}>
                      <th style={{ padding: "12px" }}>Student</th>
                      <th style={{ padding: "12px" }}>Score</th>
                      <th style={{ padding: "12px" }}>Percentage</th>
                      <th style={{ padding: "12px" }}>Status</th>
                      <th style={{ padding: "12px" }}>Submitted At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedQuizAttempts?.attempts?.map((att) => (
                      <tr
                        key={att._id}
                        style={{ borderBottom: "1px solid #f1f5f9" }}
                      >
                        <td style={{ padding: "12px" }}>
                          <strong>{att.student?.name || "Student"}</strong>
                          <div style={{ fontSize: "11px", color: "#64748b" }}>
                            {att.student?.email}
                          </div>
                        </td>
                        <td style={{ padding: "12px" }}>
                          <strong>{att.score}</strong> / {att.totalMarks}
                        </td>
                        <td style={{ padding: "12px" }}>{att.percentage}%</td>
                        <td style={{ padding: "12px" }}>
                          <span
                            className={
                              att.passed
                                ? "result-passed"
                                : "result-failed"
                            }
                            style={{
                              padding: "4px 8px",
                              borderRadius: "6px",
                              fontSize: "11px",
                              background: att.passed ? "#dcfce7" : "#fee2e2"
                            }}
                          >
                            {att.passed ? "Passed" : "Failed"}
                          </span>
                        </td>
                        <td style={{ padding: "12px", color: "#64748b" }}>
                          {att.submittedAt
                            ? new Date(att.submittedAt).toLocaleDateString()
                            : "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}