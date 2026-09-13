import { useCallback, useEffect, useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { configureAccessTokenProvider } from "./api/client";
import AppShell from "./components/AppShell";
import LoginScreen from "./components/LoginScreen";
import { ErrorState, LoadingState } from "./components/PageState";
import Toast from "./components/Toast";
import { auth, googleProvider, signInWithPopup, signOut } from "./config/firebase";
import { useDiaryManager } from "./hooks/useDiaryManager";
import EntryPage from "./pages/EntryPage";
import InsightsPage from "./pages/InsightsPage";
import TimelinePage from "./pages/TimelinePage";

function loginMessage(error) {
  const code = error?.code || "";
  if (code === "auth/popup-closed-by-user") return "Sign-in was closed before it finished. Try again when you are ready.";
  if (code === "auth/popup-blocked") return "Your browser blocked the sign-in window. Allow pop-ups for Mira and try again.";
  if (code === "auth/network-request-failed") return "Could not reach Google authentication. Check your connection and try again.";
  return "Could not sign you in right now. Please try again.";
}

export default function App() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        configureAccessTokenProvider(async () => currentUser.getIdToken());
      } else {
        configureAccessTokenProvider(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  async function handleLogin() {
    setAuthError("");
    setSigningIn(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setAuthError(loginMessage(err));
    } finally {
      setSigningIn(false);
    }
  }

  async function handleSignOut() {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Sign-out error:", err);
    }
  }

  const manager = useDiaryManager(user);
  const [toast, setToast] = useState(null);
  const closeToast = useCallback(() => setToast(null), []);
  const showError = useCallback((error) => setToast({ tone: "error", message: error?.message || "The entry could not be saved." }), []);

  function openDate(date) { manager.actions.selectDate(date, showError); navigate("/"); }
  async function deleteEntry(date) {
    try { await manager.actions.deleteEntry(date); setToast({ tone: "success", message: "Diary entry deleted." }); return true; }
    catch (error) { showError(error); return false; }
  }

  if (authLoading) {
    return <LoadingState />;
  }

  if (!user) {
    return <LoginScreen onLogin={handleLogin} error={authError} loading={signingIn} />;
  }

  const entryProps = { entry: manager.currentEntry, entries: manager.entries, selectedDate: manager.selectedDate, today: manager.today, saveState: manager.saveState, deleting: manager.deleting, onDateChange: openDate, onChange: (patch) => manager.actions.updateEntry(manager.selectedDate, patch, showError), onFlush: () => manager.actions.flushEntry(manager.selectedDate, showError), onDelete: deleteEntry };
  let content;
  if (!manager.ready && manager.loading) content = <LoadingState />;
  else if (!manager.ready && manager.loadError) content = <ErrorState message={manager.loadError} onRetry={manager.retry} />;
  else content = <Routes><Route path="/" element={<EntryPage {...entryProps} />} /><Route path="/timeline" element={<TimelinePage entries={manager.entries} today={manager.today} onOpen={openDate} />} /><Route path="/insights" element={<InsightsPage entries={manager.entries} today={manager.today} />} /><Route path="*" element={<Navigate to="/" replace />} /></Routes>;

  return (
    <>
      <AppShell user={user} onSignOut={handleSignOut} loading={manager.loading} onToday={() => openDate(manager.today)}>
        {content}
      </AppShell>
      <Toast toast={toast} onClose={closeToast} />
    </>
  );
}


