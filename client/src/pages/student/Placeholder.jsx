
import { useLocation } from "react-router-dom";

export default function Placeholder() {
  const location = useLocation();
  const title = location.pathname.split("/").pop();

  return (
    <div className="dashboard-panel">
      <h2>{title.replace("-", " ")}</h2>
      <p>This section will be implemented in the next development steps.</p>
    </div>
  );
}
