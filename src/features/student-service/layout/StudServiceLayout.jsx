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
          <div className="app-brand-title">Student service Portal</div>
          <div className="app-brand-sub">{payload?.uname}</div>
        </div>

        <nav className="app-menu">
            <NavLink to="/ss/home" className={({isActive}) => "menu-card" + (isActive ? " active" : "")}>
             Home
            </NavLink>
          <NavLink
            to="/ss/me"
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
