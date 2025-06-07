import { Outlet, Link } from 'react-router-dom';

export function Layout() {
  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">AudioVibe Studio</h1>
          <nav className="app-nav">
            <Link to="/" className="nav-link">Upload</Link>
            <Link to="/editor" className="nav-link">Editor</Link>
            <Link to="/export" className="nav-link">Export</Link>
          </nav>
        </div>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}