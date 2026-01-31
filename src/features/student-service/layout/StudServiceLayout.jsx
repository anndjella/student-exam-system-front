import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../../auth/AuthContext";

export function StudServiceLayout() {
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
          <div className="app-brand-title">Teacher Portal</div>

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
            <NavLink to="/ss/home" className={({isActive}) => "menu-card" + (isActive ? " active" : "")}>
             Home
            </NavLink>
            
              <NavLink
              to="/ss/students"
              className={({ isActive }) => "menu-card" + (isActive ? " active" : "")}
            >
              Students
            </NavLink>

            <NavLink
              to="/ss/teachers"
              className={({ isActive }) => "menu-card" + (isActive ? " active" : "")}
            >
              Teachers
            </NavLink>

             <NavLink
              to="/ss/enrollments"
              className={({ isActive }) => "menu-card" + (isActive ? " active" : "")}
            >
              Enrollments
            </NavLink>

            <NavLink to="/ss/terms" className={({isActive}) => "menu-card" + (isActive ? " active" : "")}>
             Terms
            </NavLink>

          <NavLink
            to="/ss/me"
            className={({ isActive }) => "menu-card" + (isActive ? " active" : "")}
          >
            My profile
          </NavLink>
          <NavLink
            to="/ss/subjects"
            className={({ isActive }) => "menu-card" + (isActive ? " active" : "")}
          >
            Subjects
          </NavLink>
          
        </nav>      
      </aside>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
