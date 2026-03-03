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

          <div className="app-brand-user">
            <span className="app-brand-sub">{payload?.uname}</span>

            <button
              className="logout-btn logout-btn--small"
              onClick={handleLogout}
              title="Logout"
            >
              Logout
            </button>
          </div>
        </div>

        <nav className="app-menu">
            <NavLink to="/student/home" className={({isActive}) => "menu-card" + (isActive ? " active" : "")}>
             Home
            </NavLink>

            <NavLink
            to="/student/terms"
             className={({ isActive }) => "menu-card" + (isActive ? " active" : "")}
              >
                Terms
              </NavLink>

          <NavLink
            to="/student/subjects"
            className={({ isActive }) => "menu-card" + (isActive ? " active" : "")}
          >
            My Subjects
          </NavLink>

          <NavLink
            to="/student/registrations"
            className={({ isActive }) => "menu-card" + (isActive ? " active" : "")}
          >
            My Registrations
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
      </aside>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
