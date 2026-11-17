import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  BookOpen,
  CheckCircle,
  PlayCircle,
  Clock,
  Layers,
  BarChart3,
  IndianRupee,
  Lock,
  ArrowLeft,
  ShieldCheck
} from "lucide-react";
import toast from "react-hot-toast";
import { getCourseById } from "../../services/courseService";
import api from "../../services/api";

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function CourseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);

  useEffect(() => {
    const loadCourseAndEnrollment = async () => {
      try {
        setLoading(true);
        const [courseData, myCoursesRes] = await Promise.all([
          getCourseById(id),
          api.get("/enrollments/my-courses").catch(() => ({ data: { enrollments: [] } }))
        ]);

        setCourse(courseData.course);

        const enrollments = myCoursesRes.data?.enrollments || [];
        const enrolled = enrollments.some(
          (e) => (e.course?._id || e.course) === id
        );
        setIsEnrolled(enrolled);
      } catch (error) {
        toast.error(error.response?.data?.message || "Course not found");
      } finally {
        setLoading(false);
      }
    };

    loadCourseAndEnrollment();
  }, [id]);

  const handleFreeEnroll = async () => {
    try {
      setEnrolling(true);
      await api.post("/enrollments", { courseId: id });
      toast.success("Successfully enrolled in free course!");
      setIsEnrolled(true);
      navigate(`/dashboard/learn/${id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Enrollment failed");
    } finally {
      setEnrolling(false);
    }
  };

  const handlePaidEnroll = async () => {
    try {
      setEnrolling(true);

      // 1. Create order on backend
      const orderRes = await api.post("/payments/create-order", {
        courseId: id
      });

      const { orderId, amount, currency, keyId } = orderRes.data;

      // 2. Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded || !window.Razorpay) {
        // Fallback test verification simulation for offline development
        const confirmed = window.confirm(
          `Razorpay checkout script is unreachable (offline/sandbox). Proceed with development test payment for ₹${course.price}?`
        );
        if (confirmed) {
          await api.post("/payments/verify", {
            razorpayOrderId: orderId,
            razorpayPaymentId: `pay_test_${Date.now()}`,
            razorpaySignature: "test_dev_signature",
            courseId: id
          });
          toast.success("Test payment verified! Course enrolled.");
          setIsEnrolled(true);
          navigate(`/dashboard/learn/${id}`);
        }
        return;
      }

      // 3. Open Razorpay Modal
      const options = {
        key: keyId,
        amount,
        currency,
        name: "LearnHub LMS",
        description: course.title,
        order_id: orderId,
        prefill: {
          name: user?.name || "Student",
          email: user?.email || "student@learnhub.com"
        },
        theme: {
          color: "#4f46e5"
        },
        handler: async (response) => {
          try {
            toast.loading("Verifying payment...", { id: "verify-toast" });
            await api.post("/payments/verify", {
              razorpayOrderId: response.razorpay_order_id || orderId,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              courseId: id
            });

            toast.success("Payment verified! Course unlocked.", { id: "verify-toast" });
            setIsEnrolled(true);
            navigate(`/dashboard/learn/${id}`);
          } catch (verErr) {
            toast.error(
              verErr.response?.data?.message || "Payment verification failed",
              { id: "verify-toast" }
            );
          }
        },
        modal: {
          ondismiss: () => {
            toast("Payment checkout cancelled", { icon: "ℹ️" });
          }
        }
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.on("payment.failed", (response) => {
        toast.error(response.error?.description || "Payment transaction failed");
      });
      razorpayInstance.open();

    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to initiate payment");
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) return <div className="manage-loading">Loading course details...</div>;
  if (!course) return <div className="manage-empty">Course not found.</div>;

  const isFree = course.price === 0;

  return (
    <div className="create-course-page">
      <div className="create-course-header">
        <div>
          <button
            type="button"
            className="back-button"
            onClick={() => navigate("/dashboard/courses")}
          >
            <ArrowLeft size={17} />
            Back to Courses
          </button>
          <h1>{course.title}</h1>
          <p>{course.category} • Created by {course.instructor?.name || "Instructor"}</p>
        </div>
      </div>

      <div className="create-course-grid">
        {/* Main Details */}
        <div className="create-course-main">
          {/* Overview */}
          <div className="form-section">
            <h2 style={{ fontSize: "19px", marginBottom: "14px", color: "#1e293b" }}>
              About This Course
            </h2>
            <p style={{ color: "#475569", lineHeight: "1.7", whiteSpace: "pre-line" }}>
              {course.description}
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: "14px",
                marginTop: "24px",
                paddingTop: "20px",
                borderTop: "1px solid #e2e8f0"
              }}
            >
              <div>
                <span style={{ fontSize: "12px", color: "#64748b" }}>Level</span>
                <strong style={{ display: "block", fontSize: "14px", textTransform: "capitalize" }}>
                  {course.level}
                </strong>
              </div>
              <div>
                <span style={{ fontSize: "12px", color: "#64748b" }}>Category</span>
                <strong style={{ display: "block", fontSize: "14px" }}>
                  {course.category}
                </strong>
              </div>
              <div>
                <span style={{ fontSize: "12px", color: "#64748b" }}>Total Lessons</span>
                <strong style={{ display: "block", fontSize: "14px" }}>
                  {course.lessons?.length || 0} Lessons
                </strong>
              </div>
              <div>
                <span style={{ fontSize: "12px", color: "#64748b" }}>Enrolled Students</span>
                <strong style={{ display: "block", fontSize: "14px" }}>
                  {course.enrolledStudents?.length || 0}
                </strong>
              </div>
            </div>
          </div>

          {/* Curriculum */}
          <div className="form-section">
            <h2 style={{ fontSize: "19px", marginBottom: "16px", color: "#1e293b" }}>
              Course Curriculum ({course.lessons?.length || 0} Lessons)
            </h2>

            {course.lessons?.length > 0 ? (
              <div style={{ display: "grid", gap: "10px" }}>
                {course.lessons.map((lesson, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "14px 18px",
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: "10px"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <PlayCircle size={20} color="#4f46e5" />
                      <div>
                        <strong style={{ fontSize: "14px", color: "#1e293b" }}>
                          {index + 1}. {lesson.title}
                        </strong>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#64748b" }}>
                      {isEnrolled ? (
                        <span style={{ fontSize: "12px", color: "#16a34a", display: "flex", alignItems: "center", gap: "4px" }}>
                          <CheckCircle size={14} /> Unlocked
                        </span>
                      ) : lesson.isPreview ? (
                        <span style={{ fontSize: "12px", color: "#4f46e5" }}>
                          Preview Available
                        </span>
                      ) : (
                        <span style={{ fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}>
                          <Lock size={13} /> Locked
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: "#64748b" }}>No lessons added to this course yet.</p>
            )}
          </div>
        </div>

        {/* Right Purchase Sidebar */}
        <aside className="create-course-sidebar">
          <div className="preview-card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ height: "180px", background: "#eef2ff", overflow: "hidden" }}>
              {course.thumbnail ? (
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <div
                  style={{
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#4f46e5"
                  }}
                >
                  <BookOpen size={48} />
                </div>
              )}
            </div>

            <div style={{ padding: "24px" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "16px" }}>
                <h2 style={{ fontSize: "32px", color: "#1e293b", margin: 0 }}>
                  {isFree ? "Free" : `₹${course.price.toLocaleString("en-IN")}`}
                </h2>
                {!isFree && (
                  <span style={{ fontSize: "13px", color: "#64748b" }}>one-time payment</span>
                )}
              </div>

              {isEnrolled ? (
                <div>
                  <div
                    style={{
                      background: "#dcfce7",
                      color: "#15803d",
                      padding: "10px",
                      borderRadius: "8px",
                      fontWeight: 600,
                      fontSize: "13px",
                      textAlign: "center",
                      marginBottom: "12px"
                    }}
                  >
                    ✓ You are enrolled in this course
                  </div>

                  <Link
                    to={`/dashboard/learn/${course._id}`}
                    className="manage-create-btn"
                    style={{ width: "100%", textDecoration: "none" }}
                  >
                    <PlayCircle size={18} />
                    Go to Learning Portal
                  </Link>
                </div>
              ) : isFree ? (
                <button
                  type="button"
                  className="manage-create-btn"
                  style={{ width: "100%" }}
                  onClick={handleFreeEnroll}
                  disabled={enrolling}
                >
                  {enrolling ? "Enrolling..." : "Enroll for Free"}
                </button>
              ) : (
                <button
                  type="button"
                  className="manage-create-btn"
                  style={{ width: "100%" }}
                  onClick={handlePaidEnroll}
                  disabled={enrolling}
                >
                  <ShieldCheck size={18} />
                  {enrolling ? "Processing..." : `Buy Now for ₹${course.price}`}
                </button>
              )}

              <div style={{ marginTop: "20px", display: "grid", gap: "8px", fontSize: "12px", color: "#64748b" }}>
                <div>• Full lifetime access to all lessons</div>
                <div>• Verified certificate on completion</div>
                <div>• Access to interactive quizzes and live classes</div>
                <div>• Secure 256-bit encrypted checkout</div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}