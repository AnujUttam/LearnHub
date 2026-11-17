
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../../store/authSlice";
import { GraduationCap, User, Mail, Lock } from "lucide-react";
import toast from "react-hot-toast";

export default function Signup() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((state) => state.auth);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim() || !form.email || !form.password) {
      toast.error("Please fill all fields");
      return;
    }

    if (form.password.length < 6) {
      toast.error("Password must contain at least 6 characters");
      return;
    }

    try {
      await dispatch(registerUser(form)).unwrap();
      toast.success("Account created successfully!");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error || "Registration failed");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="brand">
          <GraduationCap size={38} />
          <h1>LearnHub</h1>
        </div>

        <h2>Create Your Account</h2>
        <p className="auth-subtitle">
          Start your learning journey with us.
        </p>

        <form onSubmit={handleSubmit}>
          <label>Full Name</label>
          <div className="input-box">
            <User size={18} />
            <input
              placeholder="Enter your name"
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
            />
          </div>

          <label>Email Address</label>
          <div className="input-box">
            <Mail size={18} />
            <input
              type="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
            />
          </div>

          <label>Password</label>
          <div className="input-box">
            <Lock size={18} />
            <input
              type="password"
              placeholder="Create password"
              value={form.password}
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
            />
          </div>

          <label>Account Type</label>
          <select
            value={form.role}
            onChange={(e) =>
              setForm({ ...form, role: e.target.value })
            }
          >
            <option value="student">Student</option>
            <option value="instructor">Instructor</option>
          </select>

          <button className="auth-button" disabled={loading}>
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
