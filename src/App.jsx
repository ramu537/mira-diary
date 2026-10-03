import { useCallback, useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { configureAccessTokenProvider } from "./api/client";
import AppShell from "./components/AppShell";
import DomainIntelligenceDialog from "./components/DomainIntelligenceDialog";
import AiDiaryCaptureModal from "./components/AiDiaryCaptureModal";
import AiMemorySearchDialog from "./components/AiMemorySearchDialog";
import LoginScreen from "./components/LoginScreen";
import { ErrorState, LoadingState } from "./components/PageState";
import Toast from "./components/Toast";
import { auth, googleProvider, signInWithPopup, signOut } from "./config/firebase";
import { useDiaryManager } from "./hooks/useDiaryManager";
import { useExperienceManager } from "./hooks/useExperienceManager";
import { diaryApi } from "./api/diary";
import { experienceApi } from "./api/experiences";
import EntryPage from "./pages/EntryPage";
import InsightsPage from "./pages/InsightsPage";
import TimelinePage from "./pages/TimelinePage";
import ExperienceEditorPage from "./pages/ExperienceEditorPage";
import ExperiencesPage from "./pages/ExperiencesPage";
import ExplorePage from "./pages/ExplorePage";
import PublicExperiencePage from "./pages/PublicExperiencePage";

function loginMessage(error) {
  const code = error?.code || "";
  if (code === "auth/popup-closed-by-user") return "Sign-in was closed before it finished. Try again when you are ready.";
  if (code === "auth/popup-blocked") return "Your browser blocked the sign-in window. Allow pop-ups for Mira and try again.";
  if (code === "auth/network-request-failed") return "Could not reach Google authentication. Check your connection and try again.";
  return "Could not sign you in right now. Please try again.";
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
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
  const experienceManager = useExperienceManager(user);
  const [toast, setToast] = useState(null);
  const [intelligenceOpen, setIntelligenceOpen] = useState(false);
  const [aiCaptureOpen, setAiCaptureOpen] = useState(false);
  const [aiSearchOpen, setAiSearchOpen] = useState(false);
  const closeToast = useCallback(() => setToast(null), []);
  const showError = useCallback((error) => setToast({ tone: "error", message: error?.message || "The entry could not be saved." }), []);
  const showNotice = useCallback((value, tone = "success") => setToast({ tone, message: typeof value === "string" ? value : value?.message || "The request could not be completed." }), []);

  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setAiSearchOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function openDate(date) { manager.actions.selectDate(date, showError); navigate("/entry"); }
  async function deleteEntry(date) {
    try { await manager.actions.deleteEntry(date); setToast({ tone: "success", message: "Diary entry deleted." }); return true; }
    catch (error) { showError(error); return false; }
  }

  useEffect(() => {
    const date = new URLSearchParams(location.search).get("date");
    if (date && /^\\d{4}-\\d{2}-\\d{2}$/.test(date) && manager.ready)
      manager.actions.selectDate(date, showError);
  }, [location.search, manager.ready, showError]);

  const isPublicRoute = location.pathname === "/explore" || location.pathname.startsWith("/shared/");
  if (isPublicRoute) {
    return <Routes><Route path="/explore" element={<ExplorePage />} /><Route path="/shared/:slug" element={<PublicExperiencePage />} /></Routes>;
  }

  if (authLoading) {
    return <LoadingState />;
  }

  if (!user) {
    return <LoginScreen onLogin={handleLogin} error={authError} loading={signingIn} />;
  }

  const entryProps = { entry: manager.currentEntry, entries: manager.entries, selectedDate: manager.selectedDate, today: manager.today, saveState: manager.saveState, deleting: manager.deleting, onDateChange: openDate, onChange: (patch) => manager.actions.updateEntry(manager.selectedDate, patch, showError), onFlush: () => manager.actions.flushEntry(manager.selectedDate, showError), onDelete: deleteEntry };
  let content;
  const inExperiences = location.pathname === "/" || location.pathname.startsWith("/experiences");
  if (inExperiences && !experienceManager.ready && !experienceManager.error) content = <LoadingState />;
  else if (inExperiences && !experienceManager.ready && experienceManager.error) content = <ErrorState message={experienceManager.error} onRetry={experienceManager.retry} />;
  else if (!inExperiences && !manager.ready && manager.loading) content = <LoadingState />;
  else if (!inExperiences && !manager.ready && manager.loadError) content = <ErrorState message={manager.loadError} onRetry={manager.retry} />;
  else content = <Routes><Route path="/" element={<Navigate to="/experiences" replace />} /><Route path="/entry" element={<EntryPage {...entryProps} />} /><Route path="/timeline" element={<TimelinePage entries={manager.entries} today={manager.today} onOpen={openDate} />} /><Route path="/insights" element={<InsightsPage entries={manager.entries} today={manager.today} />} /><Route path="/experiences" element={<ExperiencesPage key={user.uid} manager={experienceManager} />} /><Route path="/experiences/new" element={<ExperienceEditorPage manager={experienceManager} onNotice={showNotice} />} /><Route path="/experiences/new/:kind" element={<ExperienceEditorPage manager={experienceManager} onNotice={showNotice} />} /><Route path="/experiences/:id" element={<ExperienceEditorPage manager={experienceManager} onNotice={showNotice} />} /><Route path="*" element={<Navigate to="/" replace />} /></Routes>;

  return (
    <>
      <AppShell
        user={user}
        onSignOut={handleSignOut}
        loading={manager.loading || experienceManager.loading}
        onToday={() => openDate(manager.today)}
        onOpenIntelligence={() => setIntelligenceOpen(true)}
        onOpenAiCapture={() => setAiCaptureOpen(true)}
        onOpenAiSearch={() => setAiSearchOpen(true)}
        intelligenceLabel={inExperiences ? "Experience intelligence" : "Diary intelligence"}
      >
        {content}
      </AppShell>
      <DomainIntelligenceDialog revision={inExperiences ? experienceManager.experiences : manager.entries} key={inExperiences ? "experiences" : "diary"} open={intelligenceOpen} title={inExperiences ? "Experience intelligence" : "Diary intelligence"} description={inExperiences ? "See coverage, unfinished stories and sharing readiness without exposing your story text." : "Reflect on consistency and self-ratings without turning personal writing into a diagnosis."} date={inExperiences ? manager.today : manager.selectedDate} load={inExperiences ? experienceApi.analyze : diaryApi.analyze} refresh={inExperiences ? experienceApi.refreshAnalysis : diaryApi.refreshAnalysis} onClose={() => setIntelligenceOpen(false)} />
      <AiDiaryCaptureModal
        open={aiCaptureOpen}
        initialDate={manager.selectedDate || manager.today}
        targetDomain={inExperiences ? 'EXPERIENCE' : 'DIARY'}
        onClose={() => setAiCaptureOpen(false)}
        onSuccess={(msg) => {
          manager.retry();
          experienceManager.retry();
          setToast({ tone: "success", message: msg });
        }}
      />
      <AiMemorySearchDialog
        open={aiSearchOpen}
        onClose={() => setAiSearchOpen(false)}
        onSelectDate={(d) => openDate(d)}
      />
      <Toast toast={toast} onClose={closeToast} />
    </>
  );
}
