import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../auth/AuthContext";

export function TeacherLayout() {
  const { logout, payload } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  useEffect(() => {
    closeMenu();
  }, [location.pathname]);

  useEffect(() => {
    function onResize() {
      if (window.innerWidth > 768) {
        setMenuOpen(false);
      }
    }

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div className="app-shell">
      <button
        className="mobile-menu-btn"
        type="button"
        onClick={() => setMenuOpen((prev) => !prev)}
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        aria-expanded={menuOpen}
      >
        <span className="mobile-menu-btn__icon">☰</span>
        <span className="mobile-menu-btn__text">Menu</span>
      </button>

      {menuOpen ? (
        <button
          className="sidebar-backdrop"
          type="button"
          aria-label="Close menu"
          onClick={closeMenu}
        />
      ) : null}

      <aside className={`app-sidebar ${menuOpen ? "open" : ""}`}>
        <div className="app-brand">
          <div className="app-brand-title">Teacher Portal</div>

          <div className="app-brand-user">
            <span className="app-brand-sub">{payload?.uname}</span>

            <button
              className="logout-btn logout-btn--small"
              onClick={handleLogout}
              title="Logout"
              type="button"
            >
              Logout
            </button>
          </div>
        </div>

        <nav className="app-menu">
          <NavLink
            to="/teacher/home"
            className={({ isActive }) => "menu-card" + (isActive ? " active" : "")}
            onClick={closeMenu}
          >
            Home
          </NavLink>

          <NavLink
            to="/teacher/terms"
            className={({ isActive }) => "menu-card" + (isActive ? " active" : "")}
            onClick={closeMenu}
          >
            Terms
          </NavLink>

          <NavLink
            to="/teacher/students"
            className={({ isActive }) => "menu-card" + (isActive ? " active" : "")}
            onClick={closeMenu}
          >
            Students
          </NavLink>

          <NavLink
            to="/teacher/subjects"
            className={({ isActive }) => "menu-card" + (isActive ? " active" : "")}
            onClick={closeMenu}
          >
            Registrations & Grades
          </NavLink>

          <NavLink
            to="/teacher/exams"
            className={({ isActive }) => "menu-card" + (isActive ? " active" : "")}
            onClick={closeMenu}
          >
            Exams
          </NavLink>

          <NavLink
            to="/teacher/me"
            className={({ isActive }) => "menu-card" + (isActive ? " active" : "")}
            onClick={closeMenu}
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