
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import {
  BookOpen,
  Image,
  IndianRupee,
  FileText,
  Layers,
  BarChart3,
  ArrowLeft,
  PlusCircle,
  GraduationCap
} from "lucide-react";

import api from "../../services/api";

export default function CreateCourse() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    price: 0,
    level: "beginner",
    thumbnail: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title.trim() || !form.description.trim()) {
      toast.error("Please fill all required fields");
      return;
    }

    if (Number(form.price) < 0) {
      toast.error("Price cannot be negative");
      return;
    }

    try {
      setLoading(true);

      const courseData = {
        ...form,
        title: form.title.trim(),
        description: form.description.trim(),
        price: Number(form.price)
      };

      const response = await api.post("/courses", courseData);

      toast.success(
        response.data.message || "Course created successfully!"
      );

      navigate("/dashboard/manage-courses");

    } catch (error) {
      console.error("Course Creation Error:", error.response?.data || error);

      toast.error(
        error.response?.data?.message || "Course creation failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const formattedLevel =
    form.level.charAt(0).toUpperCase() + form.level.slice(1);

  return (
    <div className="create-course-page">

      {/* Page Header */}
      <div className="create-course-header">
        <div>
          <button
            type="button"
            className="back-button"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft size={17} />
            Back to Dashboard
          </button>

          <h1>Create a New Course</h1>

          <p>
            Share your knowledge and create an amazing learning experience.
          </p>
        </div>

        <div className="create-header-icon">
          <GraduationCap size={42} />
        </div>
      </div>

      <form onSubmit={handleSubmit}>

        <div className="create-course-grid">

          {/* Main Form */}
          <div className="create-course-main">

            {/* Basic Information */}
            <div className="form-section">

              <div className="form-section-heading">
                <div className="section-icon">
                  <BookOpen size={20} />
                </div>

                <div>
                  <h2>Course Information</h2>
                  <p>Enter the basic details of your course.</p>
                </div>
              </div>

              <div className="form-group">
                <label>
                  Course Title <span>*</span>
                </label>

                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="e.g. Complete MERN Stack Development"
                  maxLength={100}
                  required
                />

                <small>
                  Choose a clear and attractive course title.
                </small>
              </div>

              <div className="form-group">
                <label>
                  Course Description <span>*</span>
                </label>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="What will students learn in this course?"
                  rows={6}
                  required
                />

                <small>
                  Explain the topics and skills students will learn.
                </small>
              </div>

              <div className="form-row">

                <div className="form-group">
                  <label>Category</label>

                  <div className="input-with-icon">
                    <Layers size={18} />

                    <select
                      name="category"
                      value={form.category}
                      onChange={handleChange}
                    >
                      <option value="">Select category</option>
                      <option value="Web Development">Web Development</option>
                      <option value="App Development">App Development</option>
                      <option value="Programming">Programming</option>
                      <option value="Data Science">Data Science</option>
                      <option value="AI & ML">AI & ML</option>
                      <option value="Database">Database</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Difficulty Level</label>

                  <div className="input-with-icon">
                    <BarChart3 size={18} />

                    <select
                      name="level"
                      value={form.level}
                      onChange={handleChange}
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>

              </div>
            </div>

            {/* Pricing */}
            <div className="form-section">

              <div className="form-section-heading">
                <div className="section-icon">
                  <IndianRupee size={20} />
                </div>

                <div>
                  <h2>Course Pricing</h2>
                  <p>Set a price for your course.</p>
                </div>
              </div>

              <div className="form-group">
                <label>Course Price</label>

                <div className="price-input">
                  <span>₹</span>

                  <input
                    type="number"
                    name="price"
                    min="0"
                    value={form.price}
                    onChange={handleChange}
                    placeholder="0"
                  />
                </div>

                <small>
                  Set 0 if you want to offer this course for free.
                </small>
              </div>

              <div className="pricing-preview">
                <div>
                  <span>Student course price</span>

                  <h3>
                    {Number(form.price) === 0
                      ? "Free"
                      : `₹${Number(form.price).toLocaleString("en-IN")}`}
                  </h3>
                </div>

                <span className="free-badge">
                  {Number(form.price) === 0
                    ? "Free Course"
                    : "Paid Course"}
                </span>
              </div>

            </div>

            {/* Thumbnail */}
            <div className="form-section">

              <div className="form-section-heading">
                <div className="section-icon">
                  <Image size={20} />
                </div>

                <div>
                  <h2>Course Thumbnail</h2>
                  <p>Add an image to make your course attractive.</p>
                </div>
              </div>

              <div className="form-group">
                <label>Thumbnail Image URL</label>

                <input
                  type="url"
                  name="thumbnail"
                  value={form.thumbnail}
                  onChange={handleChange}
                  placeholder="https://example.com/course-image.jpg"
                />

                <small>
                  Paste a publicly accessible image URL.
                </small>
              </div>

              {form.thumbnail && (
                <div className="thumbnail-preview">
                  <img
                    src={form.thumbnail}
                    alt="Course preview"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                    onLoad={(e) => {
                      e.currentTarget.style.display = "block";
                    }}
                  />
                </div>
              )}

            </div>

          </div>

          {/* Right Sidebar */}
          <aside className="create-course-sidebar">

            {/* Course Preview */}
            <div className="preview-card">

              <div className="preview-card-header">
                <Image size={18} />
                Course Preview
              </div>

              <div className="preview-image">
                {form.thumbnail ? (
                  <img
                    src={form.thumbnail}
                    alt="Course preview"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="preview-placeholder">
                    <GraduationCap size={42} />
                    <span>Course Thumbnail</span>
                  </div>
                )}
              </div>

              <div className="preview-content">

                <span className="preview-category">
                  {form.category || "Course Category"}
                </span>

                <h3>
                  {form.title || "Your Course Title"}
                </h3>

                <p>
                  {form.description ||
                    "Your course description will appear here."}
                </p>

                <div className="preview-bottom">
                  <span>{formattedLevel}</span>

                  <strong>
                    {Number(form.price) === 0
                      ? "Free"
                      : `₹${Number(form.price).toLocaleString("en-IN")}`}
                  </strong>
                </div>

              </div>
            </div>

            {/* Publish Information */}
            <div className="publish-info">

              <div className="publish-info-icon">
                <FileText size={20} />
              </div>

              <h3>Ready to create?</h3>

              <p>
                Your course will be saved as a draft. You can publish it
                after adding the required course content.
              </p>

            </div>

            {/* Actions */}
            <button
              type="submit"
              className="create-submit-button"
              disabled={loading}
            >
              <PlusCircle size={19} />
              {loading ? "Creating Course..." : "Create Course"}
            </button>

            <button
              type="button"
              className="cancel-course-button"
              onClick={() => navigate("/dashboard")}
            >
              Cancel
            </button>

          </aside>

        </div>
      </form>
    </div>
  );
}
