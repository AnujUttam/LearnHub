
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Search } from "lucide-react";
import toast from "react-hot-toast";
import { getAllCourses } from "../../services/courseService";

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const data = await getAllCourses();
        setCourses(data.courses || []);
      } catch (error) {
        toast.error(error.response?.data?.message || "Unable to load courses");
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, []);

  const filteredCourses = courses.filter((course) =>
    course.title.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <p>Loading courses...</p>;

  return (
    <div>
      <div className="courses-heading">
        <div>
          <h1>Explore Courses</h1>
          <p>Discover courses and grow your skills.</p>
        </div>

        <div className="course-search">
          <Search size={18} />
          <input
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {filteredCourses.length === 0 ? (
        <div className="dashboard-panel">
          <BookOpen size={35} />
          <h2>No courses found</h2>
          <p>Published courses will appear here.</p>
        </div>
      ) : (
        <div className="courses-grid">
          {filteredCourses.map((course) => (
            <div className="course-card" key={course._id}>
              {course.thumbnail ? (
                <img src={course.thumbnail} alt={course.title} />
              ) : (
                <div className="course-placeholder">
                  <BookOpen size={40} />
                </div>
              )}

              <div className="course-card-content">
                <span>{course.category || "General"}</span>
                <h3>{course.title}</h3>
                <p>{course.description}</p>
                <p className="course-instructor">
                  By {course.instructor?.name || "Instructor"}
                </p>
                <h3>
                  {course.price === 0 ? "Free" : `₹${course.price}`}
                </h3>
                <Link to={`/dashboard/courses/${course._id}`}>
                  View Course
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
