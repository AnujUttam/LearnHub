import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Award,
  BookOpen,
  Save,
  HelpCircle
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

export default function QuizEditor() {
  const { quizId } = useParams();
  const isEditing = Boolean(quizId);
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditing);

  const [form, setForm] = useState({
    title: "",
    description: "",
    course: "",
    duration: 30,
    passingMarks: 5,
    questions: [
      {
        questionText: "",
        options: ["", ""],
        correctAnswer: 0,
        marks: 1
      }
    ]
  });

  // Load instructor courses
  useEffect(() => {
    const loadCourses = async () => {
      try {
        const res = await api.get("/courses/instructor/my-courses");
        setCourses(res.data.courses || []);
        if (!isEditing && res.data.courses?.length > 0) {
          setForm((prev) => ({
            ...prev,
            course: res.data.courses[0]._id
          }));
        }
      } catch (err) {
        toast.error("Unable to load your courses");
      }
    };

    loadCourses();
  }, [isEditing]);

  // Load quiz if editing
  useEffect(() => {
    if (!quizId) return;

    const loadQuiz = async () => {
      try {
        setFetching(true);
        const res = await api.get(`/quizzes/${quizId}`);
        const q = res.data.quiz;
        if (q) {
          setForm({
            title: q.title || "",
            description: q.description || "",
            course: q.course?._id || q.course || "",
            duration: q.duration || 30,
            passingMarks: q.passingMarks || 0,
            questions: q.questions?.length
              ? q.questions.map((item) => ({
                  questionText: item.questionText || "",
                  options: item.options?.length ? [...item.options] : ["", ""],
                  correctAnswer: item.correctAnswer ?? 0,
                  marks: item.marks || 1
                }))
              : [
                  {
                    questionText: "",
                    options: ["", ""],
                    correctAnswer: 0,
                    marks: 1
                  }
                ]
          });
        }
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to load quiz");
        navigate("/dashboard/instructor/quizzes");
      } finally {
        setFetching(false);
      }
    };

    loadQuiz();
  }, [quizId, navigate]);

  const handleQuestionChange = (qIndex, field, value) => {
    setForm((prev) => {
      const updatedQuestions = [...prev.questions];
      updatedQuestions[qIndex] = {
        ...updatedQuestions[qIndex],
        [field]: value
      };
      return { ...prev, questions: updatedQuestions };
    });
  };

  const handleOptionChange = (qIndex, optIndex, value) => {
    setForm((prev) => {
      const updatedQuestions = [...prev.questions];
      const opts = [...updatedQuestions[qIndex].options];
      opts[optIndex] = value;
      updatedQuestions[qIndex] = {
        ...updatedQuestions[qIndex],
        options: opts
      };
      return { ...prev, questions: updatedQuestions };
    });
  };

  const addOption = (qIndex) => {
    setForm((prev) => {
      const updatedQuestions = [...prev.questions];
      if (updatedQuestions[qIndex].options.length >= 6) {
        toast.error("Maximum 6 options allowed per question");
        return prev;
      }
      updatedQuestions[qIndex] = {
        ...updatedQuestions[qIndex],
        options: [...updatedQuestions[qIndex].options, ""]
      };
      return { ...prev, questions: updatedQuestions };
    });
  };

  const removeOption = (qIndex, optIndex) => {
    setForm((prev) => {
      const updatedQuestions = [...prev.questions];
      const opts = updatedQuestions[qIndex].options.filter(
        (_, i) => i !== optIndex
      );
      if (opts.length < 2) {
        toast.error("A question must have at least 2 options");
        return prev;
      }
      let correct = updatedQuestions[qIndex].correctAnswer;
      if (correct === optIndex) {
        correct = 0;
      } else if (correct > optIndex) {
        correct -= 1;
      }
      updatedQuestions[qIndex] = {
        ...updatedQuestions[qIndex],
        options: opts,
        correctAnswer: correct
      };
      return { ...prev, questions: updatedQuestions };
    });
  };

  const addQuestion = () => {
    setForm((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          questionText: "",
          options: ["", ""],
          correctAnswer: 0,
          marks: 1
        }
      ]
    }));
  };

  const removeQuestion = (qIndex) => {
    if (form.questions.length <= 1) {
      toast.error("Quiz must have at least 1 question");
      return;
    }
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== qIndex)
    }));
  };

  const calculateTotalMarks = () => {
    return form.questions.reduce(
      (sum, q) => sum + (Number(q.marks) || 1),
      0
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title.trim()) {
      toast.error("Please enter a quiz title");
      return;
    }

    if (!form.course) {
      toast.error("Please select a course for this quiz");
      return;
    }

    // Validate each question
    for (let i = 0; i < form.questions.length; i++) {
      const q = form.questions[i];
      if (!q.questionText.trim()) {
        toast.error(`Question ${i + 1} is missing text`);
        return;
      }
      if (q.options.some((opt) => !opt.trim())) {
        toast.error(`All options in Question ${i + 1} must be filled out`);
        return;
      }
      if (q.correctAnswer < 0 || q.correctAnswer >= q.options.length) {
        toast.error(`Select a valid correct answer for Question ${i + 1}`);
        return;
      }
    }

    const totalMarks = calculateTotalMarks();
    if (Number(form.passingMarks) > totalMarks) {
      toast.error("Passing marks cannot exceed total marks");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        course: form.course,
        duration: Number(form.duration) || 30,
        passingMarks: Number(form.passingMarks) || 0,
        questions: form.questions.map((q) => ({
          questionText: q.questionText.trim(),
          options: q.options.map((o) => o.trim()),
          correctAnswer: Number(q.correctAnswer),
          marks: Number(q.marks) || 1
        }))
      };

      if (isEditing) {
        await api.put(`/quizzes/${quizId}`, payload);
        toast.success("Quiz updated successfully!");
      } else {
        await api.post("/quizzes", payload);
        toast.success("Quiz created successfully!");
      }

      navigate("/dashboard/instructor/quizzes");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save quiz");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="manage-loading">Loading quiz details...</div>;
  }

  const totalMarks = calculateTotalMarks();

  return (
    <div className="create-course-page">
      <div className="create-course-header">
        <div>
          <button
            type="button"
            className="back-button"
            onClick={() => navigate("/dashboard/instructor/quizzes")}
          >
            <ArrowLeft size={17} />
            Back to Quizzes
          </button>
          <h1>{isEditing ? "Edit Quiz" : "Create New Quiz"}</h1>
          <p>
            {isEditing
              ? "Update quiz questions, timer, and passing threshold."
              : "Design assessment questions to test your students' comprehension."}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="create-course-grid">
          {/* Main Form: Details and Questions */}
          <div className="create-course-main">
            {/* Basic Info */}
            <div className="form-section">
              <div className="form-section-heading">
                <div className="section-icon">
                  <HelpCircle size={20} />
                </div>
                <div>
                  <h2>Quiz Overview</h2>
                  <p>Specify the course and basic quiz information.</p>
                </div>
              </div>

              <div className="form-group">
                <label>
                  Associated Course <span>*</span>
                </label>
                <select
                  value={form.course}
                  onChange={(e) =>
                    setForm({ ...form, course: e.target.value })
                  }
                  disabled={isEditing}
                  required
                >
                  <option value="">Select a course</option>
                  {courses.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.title}
                    </option>
                  ))}
                </select>
                {courses.length === 0 && (
                  <small style={{ color: "#ef4444" }}>
                    You have no courses yet. Please create a course first.
                  </small>
                )}
              </div>

              <div className="form-group">
                <label>
                  Quiz Title <span>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. JavaScript Async & Promises Assessment"
                  value={form.title}
                  onChange={(e) =>
                    setForm({ ...form, title: e.target.value })
                  }
                  maxLength={150}
                  required
                />
              </div>

              <div className="form-group">
                <label>Instructions / Description</label>
                <textarea
                  placeholder="Provide instructions or background for students..."
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Duration (Minutes)</label>
                  <div className="input-with-icon">
                    <Clock size={17} />
                    <input
                      type="number"
                      min={1}
                      max={180}
                      value={form.duration}
                      onChange={(e) =>
                        setForm({ ...form, duration: e.target.value })
                      }
                      style={{ paddingLeft: "38px" }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Passing Marks</label>
                  <div className="input-with-icon">
                    <Award size={17} />
                    <input
                      type="number"
                      min={0}
                      max={totalMarks}
                      value={form.passingMarks}
                      onChange={(e) =>
                        setForm({ ...form, passingMarks: e.target.value })
                      }
                      style={{ paddingLeft: "38px" }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Questions Section */}
            <div className="form-section">
              <div
                className="form-section-heading"
                style={{
                  justifyContent: "space-between",
                  marginBottom: "20px"
                }}
              >
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  <div className="section-icon">
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <h2>Questions ({form.questions.length})</h2>
                    <p>Add questions, set option choices, and mark the correct answer.</p>
                  </div>
                </div>

                <button
                  type="button"
                  className="manage-create-btn"
                  onClick={addQuestion}
                  style={{ padding: "8px 14px", fontSize: "13px" }}
                >
                  <Plus size={16} />
                  Add Question
                </button>
              </div>

              {form.questions.map((q, qIndex) => (
                <div
                  key={qIndex}
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    padding: "20px",
                    marginBottom: "20px"
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "12px"
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 700,
                        color: "#4f46e5",
                        fontSize: "14px"
                      }}
                    >
                      Question {qIndex + 1}
                    </span>

                    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <label style={{ fontSize: "12px", color: "#64748b" }}>
                          Marks:
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={50}
                          value={q.marks}
                          onChange={(e) =>
                            handleQuestionChange(
                              qIndex,
                              "marks",
                              Number(e.target.value) || 1
                            )
                          }
                          style={{
                            width: "60px",
                            padding: "6px 8px",
                            border: "1px solid #cbd5e1",
                            borderRadius: "6px",
                            fontSize: "13px"
                          }}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => removeQuestion(qIndex)}
                        style={{
                          background: "#fee2e2",
                          color: "#ef4444",
                          border: "none",
                          borderRadius: "6px",
                          padding: "6px 10px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          fontSize: "12px"
                        }}
                        title="Delete question"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <input
                      type="text"
                      placeholder="Enter question text..."
                      value={q.questionText}
                      onChange={(e) =>
                        handleQuestionChange(
                          qIndex,
                          "questionText",
                          e.target.value
                        )
                      }
                      style={{ background: "#ffffff" }}
                      required
                    />
                  </div>

                  <div style={{ marginTop: "14px" }}>
                    <small
                      style={{
                        display: "block",
                        marginBottom: "10px",
                        color: "#64748b",
                        fontWeight: 600
                      }}
                    >
                      Answer Options (select radio for correct answer):
                    </small>

                    <div style={{ display: "grid", gap: "10px" }}>
                      {q.options.map((option, optIndex) => (
                        <div
                          key={optIndex}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            background:
                              q.correctAnswer === optIndex ? "#eef2ff" : "#ffffff",
                            border:
                              q.correctAnswer === optIndex
                                ? "1px solid #6366f1"
                                : "1px solid #cbd5e1",
                            borderRadius: "8px",
                            padding: "8px 12px"
                          }}
                        >
                          <input
                            type="radio"
                            name={`correct-${qIndex}`}
                            checked={q.correctAnswer === optIndex}
                            onChange={() =>
                              handleQuestionChange(
                                qIndex,
                                "correctAnswer",
                                optIndex
                              )
                            }
                            style={{
                              width: "18px",
                              height: "18px",
                              accentColor: "#4f46e5",
                              cursor: "pointer"
                            }}
                            title="Mark as correct answer"
                          />
                          <span
                            style={{
                              fontWeight: 700,
                              color:
                                q.correctAnswer === optIndex
                                  ? "#4f46e5"
                                  : "#64748b",
                              minWidth: "22px"
                            }}
                          >
                            {String.fromCharCode(65 + optIndex)}.
                          </span>
                          <input
                            type="text"
                            placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                            value={option}
                            onChange={(e) =>
                              handleOptionChange(
                                qIndex,
                                optIndex,
                                e.target.value
                              )
                            }
                            style={{
                              border: "none",
                              outline: "none",
                              background: "transparent",
                              padding: "4px",
                              flex: 1
                            }}
                            required
                          />
                          {q.options.length > 2 && (
                            <button
                              type="button"
                              onClick={() => removeOption(qIndex, optIndex)}
                              style={{
                                border: "none",
                                background: "transparent",
                                color: "#94a3b8",
                                cursor: "pointer",
                                padding: "4px"
                              }}
                              title="Remove option"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {q.options.length < 6 && (
                      <button
                        type="button"
                        onClick={() => addOption(qIndex)}
                        style={{
                          marginTop: "10px",
                          background: "transparent",
                          border: "1px dashed #94a3b8",
                          borderRadius: "6px",
                          padding: "6px 12px",
                          color: "#4f46e5",
                          cursor: "pointer",
                          fontSize: "12px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px"
                        }}
                      >
                        <Plus size={14} />
                        Add Option
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar Summary */}
          <aside className="create-course-sidebar">
            <div className="preview-card" style={{ padding: "20px" }}>
              <h3 style={{ marginBottom: "15px", fontSize: "16px" }}>
                Quiz Summary
              </h3>

              <div style={{ display: "grid", gap: "12px", fontSize: "13px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748b" }}>Total Questions:</span>
                  <strong>{form.questions.length}</strong>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748b" }}>Total Marks:</span>
                  <strong style={{ color: "#4f46e5" }}>{totalMarks}</strong>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748b" }}>Passing Marks:</span>
                  <strong>{form.passingMarks}</strong>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748b" }}>Duration:</span>
                  <strong>{form.duration} min</strong>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="create-submit-button"
              disabled={loading || courses.length === 0}
            >
              <Save size={18} />
              {loading
                ? "Saving Quiz..."
                : isEditing
                ? "Update Quiz"
                : "Create Quiz"}
            </button>

            <button
              type="button"
              className="cancel-course-button"
              onClick={() => navigate("/dashboard/instructor/quizzes")}
            >
              Cancel
            </button>
          </aside>
        </div>
      </form>
    </div>
  );
}