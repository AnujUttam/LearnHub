import { useEffect, useState } from "react";
import { BookOpen, Search, Eye, EyeOff, Trash2, ArrowLeft, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../services/api";

export default function ManageCoursesAdmin() {
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionId, setActionId] = useState(null);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await api.get("/users/admin/courses");
      setCourses(res.data.courses || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleTogglePublish = async (course) => {
    try {
      setActionId(course._id);
      await api.put(`/courses/${course._id}`, {
        isPublished: !course.isPublished
      });
      toast.success(
        course.isPublished ? "Course unpublished" : "Course published"
      );
      setCourses((prev) =>
        prev.map((c) =>
          c._id === course._id ? { ...c, isPublished: !c.isPublished } : c
        )
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update course status");
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (courseId) => {
    if (!window.confirm("Are you sure you want to delete this course from the platform? This cannot be undone.")) {
      return;
    }

    try {
      setActionId(courseId);
      await api.delete(`/courses/${courseId}`);
      toast.success("Course removed successfully");
      setCourses((prev) => prev.filter((c) => c._id !== courseId));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete course");
    } finally {
      setActionId(null);
    }
  };

  const filteredCourses = courses.filter((c) => {
    const titleMatch = c.title?.toLowerCase().includes(search.toLowerCase());
    const instructorMatch = c.instructor?.name
      ?.toLowerCase()
      .includes(search.toLowerCase());
    const emailMatch = c.instructor?.email
      ?.toLowerCase()
      .includes(search.toLowerCase());
    return titleMatch || instructorMatch || emailMatch;
  });

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
          <h1>Platform Course Moderation</h1>
          <p>Review curricula, publication statuses, and moderate content across all instructors.</p>
        </div>
      </div>

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
        <div className="course-search" style={{ width: "320px" }}>
          <Search size={18} />
          <input
            placeholder="Search by course title or instructor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ fontSize: "13px", color: "#64748b" }}>
          Total Courses: <strong>{filteredCourses.length}</strong>
        </div>
      </div>

      {loading ? (
        <div className="manage-loading">Loading platform courses...</div>
      ) : filteredCourses.length === 0 ? (
        <div className="manage-empty">
          <BookOpen size={48} />
          <h2>No Courses Found</h2>
          <p>No courses match your search criteria.</p>
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
                  <th style={{ padding: "14px 18px" }}>Course Title</th>
                  <th style={{ padding: "14px 18px" }}>Instructor</th>
                  <th style={{ padding: "14px 18px" }}>Category & Price</th>
                  <th style={{ padding: "14px 18px" }}>Enrolled</th>
                  <th style={{ padding: "14px 18px" }}>Status</th>
                  <th style={{ padding: "14px 18px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCourses.map((c) => (
                  <tr
                    key={c._id}
                    style={{ borderBottom: "1px solid #f1f5f9", transition: "0.2s" }}
                  >
                    <td style={{ padding: "14px 18px", maxWidth: "280px" }}>
                      <strong style={{ display: "block", color: "#1e293b", fontSize: "14px" }}>
                        {c.title}
                      </strong>
                      <span style={{ color: "#64748b", fontSize: "11px" }}>
                        {c.lessons?.length || 0} Lessons
                      </span>
                    </td>

                    <td style={{ padding: "14px 18px" }}>
                      <strong style={{ display: "block", color: "#334155" }}>
                        {c.instructor?.name || "Instructor"}
                      </strong>
                      <span style={{ color: "#64748b", fontSize: "11px" }}>
                        {c.instructor?.email}
                      </span>
                    </td>

                    <td style={{ padding: "14px 18px" }}>
                      <span style={{ display: "block", fontWeight: 600, color: "#4f46e5" }}>
                        {c.category}
                      </span>
                      <span style={{ fontSize: "12px", color: "#64748b" }}>
                        {c.price === 0 ? "Free" : `₹${c.price}`}
                      </span>
                    </td>

                    <td style={{ padding: "14px 18px", color: "#475569" }}>
                      <strong>{c.enrolledStudents?.length || 0}</strong> students
                    </td>

                    <td style={{ padding: "14px 18px" }}>
                      <span
                        className={
                          c.isPublished
                            ? "course-status published"
                            : "course-status draft"
                        }
                      >
                        {c.isPublished ? "Published" : "Draft"}
                      </span>
                    </td>

                    <td style={{ padding: "14px 18px", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "8px" }}>
                        <button
                          type="button"
                          className="publish-btn"
                          disabled={actionId === c._id}
                          onClick={() => handleTogglePublish(c)}
                        >
                          {c.isPublished ? <EyeOff size={14} /> : <Eye size={14} />}
                          {c.isPublished ? "Unpublish" : "Publish"}
                        </button>

                        <button
                          type="button"
                          className="delete-course-btn"
                          disabled={actionId === c._id}
                          onClick={() => handleDelete(c._id)}
                          title="Remove course"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}