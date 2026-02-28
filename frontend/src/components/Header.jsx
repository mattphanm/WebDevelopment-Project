import { NavLink } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

function Header({ theme, onToggleTheme }) {
  return (
    <header className="header">
      <div className="logo">
        <span className="logo-mark" aria-hidden="true">
          BI
        </span>
        <div>
          <p className="logo-name">BestInvest</p>
          <p className="logo-tagline">Invest Wisely</p>
        </div>
      </div>

      <div className="header-right">
        <nav className="nav" aria-label="Main navigation">
          <NavLink to="/dashboard" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            Dashboard
          </NavLink>
          <NavLink
            to="/recommendations"
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            Recommendations
          </NavLink>
          <NavLink to="/plans" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            My Plans
          </NavLink>
        </nav>
        <ThemeToggle theme={theme} onToggleTheme={onToggleTheme} />
      </div>
    </header>
  );
}

export default Header;
