function ThemeToggle({ theme, onToggleTheme }) {
  const isDarkTheme = theme === 'dark';

  return (
    <button
      type="button"
      className="theme-toggle"
      aria-pressed={isDarkTheme}
      onClick={onToggleTheme}
    >
      {isDarkTheme ? 'Switch to Light' : 'Switch to Dark'}
    </button>
  );
}

export default ThemeToggle;
