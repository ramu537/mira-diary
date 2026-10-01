import { BarChart3, BookHeart, CalendarDays, Feather, LibraryBig, LogOut, PenLine, Search, Sparkles, User } from "lucide-react";
import { Link, NavLink } from "react-router-dom";

const navigation = [
  { to: "/experiences", label: "Your journal", icon: LibraryBig },
  { to: "/entry", label: "Private diary", icon: PenLine },
  { to: "/timeline", label: "Timeline", icon: CalendarDays },
  { to: "/insights", label: "Insights", icon: BarChart3 },
];

function Brand() {
  return (
    <div className="brand" aria-label="Mira Diary Manager">
      <span className="brand-mark" aria-hidden="true"><BookHeart size={21} strokeWidth={2.1} /></span>
      <span className="brand-copy"><strong>Mira</strong><small>Experiences</small></span>
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

export default function AppShell({ user, onSignOut, loading, onOpenIntelligence, onOpenAiCapture, onOpenAiSearch, intelligenceLabel = "Journal intelligence", children }) {
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
            <div><strong>Keep what mattered</strong><small>Daily notes and lived stories</small></div>
          </div>
        </div>
      </aside>

      <div className="app-column">
        <header className="topbar">
          <div className="topbar-brand"><Brand /></div>
          <span className="topbar-context">Journal</span>

          <div className="topbar-actions">
            <button className="icon-button" type="button" onClick={onOpenAiSearch} aria-label="Search memory" title="AI Vector Memory Search (Ctrl+K)"><Search size={18} /></button>
            <button className="icon-button topbar-intelligence" type="button" onClick={onOpenIntelligence} aria-label={`Open ${intelligenceLabel.toLowerCase()}`} title={intelligenceLabel}><Sparkles size={18} /></button>
            <button className="button button--ghost" type="button" onClick={onOpenAiCapture} aria-label="AI Reflection" title="Quick AI reflection" style={{ gap: "0.375rem", display: "inline-flex", alignItems: "center" }}>
              <Sparkles size={16} /> <span>AI Note</span>
            </button>
            <Link className="button button--primary topbar-action" to="/experiences/new">
              <PenLine size={17} />New entry
            </Link>

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
        <div style={{ position: "fixed", bottom: "1.25rem", right: "1.25rem", display: "flex", gap: "0.75rem", zIndex: 40 }} className="mobile-only-actions">
          <button className="mobile-add" type="button" onClick={onOpenAiCapture} aria-label="AI Reflection" style={{ background: "var(--surface-raised, #ffffff)", color: "var(--accent-strong, #3b82f6)", border: "1px solid var(--border-default, #cbd5e1)" }}>
            <Sparkles size={22} strokeWidth={2.2} />
          </button>
        </div>
      </div>
    </div>
  );
}
