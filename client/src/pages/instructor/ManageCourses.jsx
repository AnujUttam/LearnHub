import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  BookOpen,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Users,
  Video,
  Upload,
  PlayCircle,
  X,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

export default function ManageCourses() {
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);

  // Lesson Upload Modal
  const [activeCourseForLesson, setActiveCourseForLesson] = useState(null);
  const [uploadingLesson, setUploadingLesson] = useState(false);
  const [lessonForm, setLessonForm] = useState({
    title: "",
    duration: 10,
    isPreview: false,
    videoFile: null
  });

  // Expandable lessons drawer state: courseId -> boolean
  const [expandedCourse, setExpandedCourse] = useState(null);

  const loadCourses = async () => {
    try {
      const response = await api.get("/courses/instructor/my-courses");
      setCourses(response.data.courses || []);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to load courses"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const handlePublish = async (course) => {
    try {
      setActionId(course._id);

      await api.put(`/courses/${course._id}`, {
        isPublished: !course.isPublished
      });

      toast.success(
        course.isPublished
          ? "Course unpublished"
          : "Course published successfully"
      );

      await loadCourses();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to update course"
      );
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (courseId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this course?"
    );

    if (!confirmed) return;

    try {
      setActionId(courseId);
      await api.delete(`/courses/${courseId}`);
      setCourses((prev) => prev.filter((course) => course._id !== courseId));
      toast.success("Course deleted successfully");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to delete course"
      );
    } finally {
      setActionId(null);
    }
  };

  const handleLessonUpload = async (e) => {
    e.preventDefault();

    if (!lessonForm.title.trim()) {
      toast.error("Please enter a lesson title");
      return;
    }

    if (!lessonForm.videoFile) {
      toast.error("Please select a video file");
      return;
    }

    try {
      setUploadingLesson(true);

      const formData = new FormData();
      formData.append("title", lessonForm.title.trim());
      formData.append("duration", Number(lessonForm.duration) * 60); // store in seconds
      formData.append("isPreview", String(lessonForm.isPreview));
      formData.append("video", lessonForm.videoFile);

      await api.post(`/lessons/${activeCourseForLesson._id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      toast.success("Lesson video uploaded successfully!");
      setActiveCourseForLesson(null);
      setLessonForm({
        title: "",
        duration: 10,
        isPreview: false,
        videoFile: null
      });

      await loadCourses();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to upload lesson video"
      );
    } finally {
      setUploadingLesson(false);
    }
  };

  if (loading) {
    return <div className="manage-loading">Loading your courses...</div>;
  }

  return (
    <div className="manage-courses-page">
      <div className="manage-courses-header">
        <div>
          <h1>My Courses</h1>
          <p>Manage, add video lessons, and publish your learning curricula.</p>
        </div>

        <button
          className="manage-create-btn"
          onClick={() => navigate("/dashboard/create-course")}
        >
          <Plus size={18} />
          Create Course
        </button>
      </div>

      <div className="manage-stats">
        <div className="manage-stat-card">
          <BookOpen size={23} />
          <div>
            <span>Total Courses</span>
            <h2>{courses.length}</h2>
          </div>
        </div>

        <div className="manage-stat-card">
          <Eye size={23} />
          <div>
            <span>Published</span>
            <h2>{courses.filter((c) => c.isPublished).length}</h2>
          </div>
        </div>

        <div className="manage-stat-card">
          <EyeOff size={23} />
          <div>
            <span>Drafts</span>
            <h2>{courses.filter((c) => !c.isPublished).length}</h2>
          </div>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="manage-empty">
          <BookOpen size={48} />
          <h2>No courses created yet</h2>
          <p>Start sharing your knowledge by creating your first course.</p>

          <button
            className="manage-create-btn"
            onClick={() => navigate("/dashboard/create-course")}
          >
            <Plus size={18} />
            Create Your First Course
          </button>
        </div>
      ) : (
        <div className="manage-course-list">
          {courses.map((course) => {
            const isExpanded = expandedCourse === course._id;
            const lessonsCount = course.lessons?.length || 0;

            return (
              <div
                key={course._id}
                style={{
                  background: "white",
                  border: "1px solid #e8eaf2",
                  borderRadius: "14px",
                  overflow: "hidden"
                }}
              >
                <div className="manage-course-card" style={{ border: "none" }}>
                  <div className="manage-course-image">
                    {course.thumbnail ? (
                      <img src={course.thumbnail} alt={course.title} />
                    ) : (
                      <BookOpen size={35} />
                    )}
                  </div>

                  <div className="manage-course-info">
                    <div className="manage-course-top">
                      <span className="manage-category">
                        {course.category || "General"}
                      </span>

                      <span
                        className={
                          course.isPublished
                            ? "course-status published"
                            : "course-status draft"
                        }
                      >
                        {course.isPublished ? "Published" : "Draft"}
                      </span>
                    </div>

                    <h3>{course.title}</h3>
                    <p>{course.description}</p>

                    <div className="manage-course-meta">
                      <span>{course.level}</span>
                      <span>
                        {course.price === 0 ? "Free" : `₹${course.price}`}
                      </span>
                      <span>
                        <Users size={14} />
                        {course.enrolledStudents?.length || 0} Students
                      </span>
                      <span>
                        <Video size={14} />
                        {lessonsCount} Lessons
                      </span>
                    </div>
                  </div>

                  <div className="manage-course-actions">
                    <button
                      type="button"
                      className="publish-btn"
                      style={{ background: "#eef2ff", color: "#4f46e5" }}
                      onClick={() => {
                        setActiveCourseForLesson(course);
                        setLessonForm({
                          title: "",
                          duration: 10,
                          isPreview: false,
                          videoFile: null
                        });
                      }}
                    >
                      <Upload size={15} />
                      Add Lesson
                    </button>

                    <button
                      type="button"
                      className="publish-btn"
                      onClick={() =>
                        setExpandedCourse(isExpanded ? null : course._id)
                      }
                    >
                      {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                      Lessons ({lessonsCount})
                    </button>

                    <button
                      type="button"
                      className="publish-btn"
                      disabled={actionId === course._id}
                      onClick={() => handlePublish(course)}
                    >
                      {course.isPublished ? <EyeOff size={16} /> : <Eye size={16} />}
                      {course.isPublished ? "Unpublish" : "Publish"}
                    </button>

                    <button
                      type="button"
                      className="delete-course-btn"
                      disabled={actionId === course._id}
                      onClick={() => handleDelete(course._id)}
                      title="Delete course"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>

                {/* Lessons Accordion */}
                {isExpanded && (
                  <div
                    style={{
                      padding: "16px 24px 24px",
                      background: "#f8fafc",
                      borderTop: "1px solid #edf0f5"
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "14px"
                      }}
                    >
                      <h4 style={{ fontSize: "14px", color: "#334155" }}>
                        Course Curriculum ({lessonsCount} Lessons)
                      </h4>

                      <button
                        type="button"
                        className="manage-create-btn"
                        style={{ padding: "6px 12px", fontSize: "12px" }}
                        onClick={() => {
                          setActiveCourseForLesson(course);
                          setLessonForm({
                            title: "",
                            duration: 10,
                            isPreview: false,
                            videoFile: null
                          });
                        }}
                      >
                        <Plus size={14} /> Add Video Lesson
                      </button>
                    </div>

                    {lessonsCount === 0 ? (
                      <p style={{ fontSize: "13px", color: "#64748b" }}>
                        No video lessons added to this course yet. Click "Add Video Lesson" above to upload your first MP4/WebM video.
                      </p>
                    ) : (
                      <div style={{ display: "grid", gap: "8px" }}>
                        {course.lessons.map((lesson, idx) => (
                          <div
                            key={lesson._id || idx}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              background: "#ffffff",
                              padding: "10px 14px",
                              borderRadius: "8px",
                              border: "1px solid #e2e8f0",
                              fontSize: "13px"
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <PlayCircle size={17} color="#4f46e5" />
                              <strong style={{ color: "#1e293b" }}>
                                {idx + 1}. {lesson.title}
                              </strong>
                              {lesson.isPreview && (
                                <span
                                  style={{
                                    fontSize: "10px",
                                    background: "#e0e7ff",
                                    color: "#4338ca",
                                    padding: "2px 6px",
                                    borderRadius: "4px"
                                  }}
                                >
                                  Free Preview
                                </span>
                              )}
                            </div>

                            <span style={{ color: "#64748b", fontSize: "12px" }}>
                              {Math.round((lesson.duration || 0) / 60)} min
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Lesson Modal */}
      {activeCourseForLesson && (
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
          onClick={() => !uploadingLesson && setActiveCourseForLesson(null)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              maxWidth: "520px",
              width: "100%",
              padding: "28px",
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
              <div>
                <h2 style={{ fontSize: "19px", color: "#1e293b", margin: 0 }}>
                  Upload Video Lesson
                </h2>
                <p style={{ fontSize: "12px", color: "#64748b", margin: "4px 0 0" }}>
                  Adding to: {activeCourseForLesson.title}
                </p>
              </div>

              <button
                type="button"
                onClick={() => !uploadingLesson && setActiveCourseForLesson(null)}
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  color: "#64748b"
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleLessonUpload}>
              <div className="form-group">
                <label>Lesson Title *</label>
                <input
                  type="text"
                  placeholder="e.g. 01. Introduction to Redux Toolkit"
                  value={lessonForm.title}
                  onChange={(e) =>
                    setLessonForm({ ...lessonForm, title: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Duration (Minutes)</label>
                <input
                  type="number"
                  min={1}
                  max={300}
                  value={lessonForm.duration}
                  onChange={(e) =>
                    setLessonForm({
                      ...lessonForm,
                      duration: Number(e.target.value) || 10
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label>Select Video File (MP4, WebM, MKV) *</label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) =>
                    setLessonForm({
                      ...lessonForm,
                      videoFile: e.target.files[0]
                    })
                  }
                  required
                />
                <small>Max file size: 100MB</small>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  margin: "16px 0"
                }}
              >
                <input
                  type="checkbox"
                  id="previewCheck"
                  checked={lessonForm.isPreview}
                  onChange={(e) =>
                    setLessonForm({
                      ...lessonForm,
                      isPreview: e.target.checked
                    })
                  }
                  style={{ width: "16px", height: "16px" }}
                />
                <label
                  htmlFor="previewCheck"
                  style={{ fontSize: "13px", color: "#334155", margin: 0, cursor: "pointer" }}
                >
                  Allow Free Preview (Students can watch before purchasing)
                </label>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                <button
                  type="submit"
                  className="manage-create-btn"
                  style={{ flex: 1 }}
                  disabled={uploadingLesson}
                >
                  <Upload size={16} />
                  {uploadingLesson ? "Uploading Video..." : "Upload Lesson"}
                </button>

                <button
                  type="button"
                  className="cancel-course-button"
                  onClick={() => setActiveCourseForLesson(null)}
                  disabled={uploadingLesson}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}