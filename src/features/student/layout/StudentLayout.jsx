import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../../auth/AuthContext";

export function StudentLayout() {
  const { logout } = useAuth();
  const { payload } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="app-brand">
          <div className="app-brand-title">Student Portal</div>
          <div className="app-brand-sub">{payload?.uname}</div>
        </div>

        <nav className="app-menu">
            <NavLink to="/student/home" className={({isActive}) => "menu-card" + (isActive ? " active" : "")}>
             Home
            </NavLink>
          <NavLink
            to="/student/subjects"
            className={({ isActive }) => "menu-card" + (isActive ? " active" : "")}
          >
            My Subjects
          </NavLink>

          <NavLink
            to="/student/exams"
            className={({ isActive }) => "menu-card" + (isActive ? " active" : "")}
          >
            My Exams
          </NavLink>
          <NavLink
            to="/student/me"
            className={({ isActive }) => "menu-card" + (isActive ? " active" : "")}
          >
            My profile
          </NavLink>
          
        </nav>

        <div className="app-sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
