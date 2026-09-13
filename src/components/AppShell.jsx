import { BarChart3, BookHeart, CalendarDays, Feather, LogOut, PenLine, User } from "lucide-react";
import { NavLink } from "react-router-dom";

const navigation = [
  { to: "/", label: "Entry", icon: PenLine, end: true },
  { to: "/timeline", label: "Timeline", icon: CalendarDays },
  { to: "/insights", label: "Insights", icon: BarChart3 },
];

function Brand() {
  return (
    <div className="brand" aria-label="Mira Diary Manager">
      <span className="brand-mark" aria-hidden="true"><BookHeart size={21} strokeWidth={2.1} /></span>
      <span className="brand-copy"><strong>Mira</strong><small>Diary</small></span>
    </div>
  );
}

function Navigation({ mobile = false }) {
  return (
    <nav className={mobile ? "mobile-navigation" : "side-navigation"} aria-label="Diary manager">
      {navigation.map(({ to, label, icon: Icon, end }) => (
        <NavLink key={to} to={to} end={end}>
          <Icon size={mobile ? 20 : 18} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export default function AppShell({ user, onSignOut, loading, onToday, children }) {
  return (
    <div className="app-frame">
      <aside className="sidebar">
        <Brand />
        <Navigation />

        <div className="sidebar-bottom">
          {user && (
            <div className="sidebar-user">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || "User"} className="user-avatar" />
              ) : (
                <div className="user-avatar-placeholder"><User size={16} /></div>
              )}
              <div className="user-info">
                <span className="user-name">{user.displayName || "Account"}</span>
                <span className="user-email">{user.email || ""}</span>
              </div>
              <button
                type="button"
                className="user-signout-btn"
                onClick={onSignOut}
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}

          <div className="sidebar-note">
            <span><Feather size={16} /></span>
            <div><strong>A few honest lines count</strong><small>No perfect record required</small></div>
          </div>
        </div>
      </aside>

      <div className="app-column">
        <header className="topbar">
          <div className="topbar-brand"><Brand /></div>
          <span className="topbar-context">A private place to notice and remember</span>

          <div className="topbar-actions">
            <button className="button button--primary topbar-action" type="button" onClick={onToday}>
              <PenLine size={17} />Today’s entry
            </button>

            {user && (
              <div className="topbar-user">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || "User"} className="user-avatar topbar-user-avatar" />
                ) : (
                  <div className="user-avatar-placeholder topbar-user-avatar"><User size={14} /></div>
                )}
                <button
                  type="button"
                  className="user-signout-btn topbar-signout-btn"
                  onClick={onSignOut}
                  title="Sign Out"
                  aria-label="Sign Out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            )}
          </div>

          {loading && <span className="route-progress" aria-label="Loading diary" />}
        </header>

        <main className="main-content">{children}</main>
        <Navigation mobile />
      </div>
    </div>
  );
}
