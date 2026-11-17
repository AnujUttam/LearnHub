import { useEffect, useState } from "react";
import { Users, Search, BookOpen, CheckCircle, Clock } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

export default function InstructorStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("all");

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const res = await api.get("/users/instructor/students");
        setStudents(res.data.students || []);
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to load students");
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const coursesList = Array.from(
    new Set(students.map((s) => s.courseTitle).filter(Boolean))
  );

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.studentName?.toLowerCase().includes(search.toLowerCase()) ||
      s.studentEmail?.toLowerCase().includes(search.toLowerCase());

    const matchesCourse =
      selectedCourse === "all" || s.courseTitle === selectedCourse;

    return matchesSearch && matchesCourse;
  });

  return (
    <div className="manage-courses-page">
      <div className="manage-courses-header">
        <div>
          <h1>Enrolled Students</h1>
          <p>View and track students enrolled across all your published courses.</p>
        </div>
      </div>

      {/* Filter and Search Controls */}
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
          <div className="course-search" style={{ width: "300px" }}>
            <Search size={18} />
            <input
              placeholder="Search student name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
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
            <option value="all">All Courses ({students.length})</option>
            {coursesList.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div style={{ fontSize: "13px", color: "#64748b" }}>
          Showing <strong>{filteredStudents.length}</strong> of{" "}
          <strong>{students.length}</strong> enrollments
        </div>
      </div>

      {loading ? (
        <div className="manage-loading">Loading student enrollments...</div>
      ) : filteredStudents.length === 0 ? (
        <div className="manage-empty">
          <Users size={48} />
          <h2>No Students Found</h2>
          <p>
            {search || selectedCourse !== "all"
              ? "No student enrollments match your filter criteria."
              : "Students will appear here once they enroll in your courses."}
          </p>
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
                  <th style={{ padding: "14px 18px" }}>Student</th>
                  <th style={{ padding: "14px 18px" }}>Course</th>
                  <th style={{ padding: "14px 18px" }}>Enrolled Date</th>
                  <th style={{ padding: "14px 18px" }}>Learning Progress</th>
                  <th style={{ padding: "14px 18px" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((item) => (
                  <tr
                    key={item.id}
                    style={{ borderBottom: "1px solid #f1f5f9", transition: "0.2s" }}
                  >
                    <td style={{ padding: "14px 18px" }}>
                      <strong style={{ display: "block", color: "#1e293b", fontSize: "14px" }}>
                        {item.studentName}
                      </strong>
                      <span style={{ color: "#64748b", fontSize: "12px" }}>
                        {item.studentEmail}
                      </span>
                    </td>

                    <td style={{ padding: "14px 18px" }}>
                      <span style={{ fontWeight: 600, color: "#4f46e5" }}>
                        {item.courseTitle}
                      </span>
                    </td>

                    <td style={{ padding: "14px 18px", color: "#64748b" }}>
                      {item.enrolledAt
                        ? new Date(item.enrolledAt).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric"
                          })
                        : "N/A"}
                    </td>

                    <td style={{ padding: "14px 18px", minWidth: "160px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", fontSize: "12px" }}>
                        <span>{item.completedLessonsCount} lessons</span>
                        <strong style={{ color: "#4f46e5" }}>{item.progress}%</strong>
                      </div>
                      <div style={{ height: "6px", background: "#e2e8f0", borderRadius: "10px", overflow: "hidden" }}>
                        <div
                          style={{
                            height: "100%",
                            width: `${item.progress}%`,
                            background: item.progress === 100 ? "#16a34a" : "#4f46e5",
                            borderRadius: "10px"
                          }}
                        />
                      </div>
                    </td>

                    <td style={{ padding: "14px 18px" }}>
                      <span
                        style={{
                          padding: "4px 9px",
                          borderRadius: "20px",
                          fontSize: "11px",
                          fontWeight: 600,
                          background: item.progress === 100 ? "#dcfce7" : "#e0e7ff",
                          color: item.progress === 100 ? "#15803d" : "#4338ca"
                        }}
                      >
                        {item.progress === 100 ? "Completed" : "In Progress"}
                      </span>
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