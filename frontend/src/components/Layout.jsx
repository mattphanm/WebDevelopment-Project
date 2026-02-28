import { useEffect } from 'react';
import Header from './Header';

function Layout({ theme, onToggleTheme, children }) {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <>
      <Header theme={theme} onToggleTheme={onToggleTheme} />
      <main className="app-main">
        {children}
      </main>
      <footer>
        <p>This is not financial advice.</p>
      </footer>
    </>
  );
}

export default Layout;
