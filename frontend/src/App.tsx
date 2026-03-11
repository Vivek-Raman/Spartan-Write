import { Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { useAccessibility } from "./contexts/accessibility-context";
import Onboarding from "./pages/onboarding";
import Home from "./pages/home";
import Editor from "./pages/editor";
import NewProject from "./pages/new-project";
import Settings from "./pages/settings";
import ErrorFatal from "./pages/error-fatal";
import Dashboard from "./pages/dashboard";

function ScreenReaderAnnouncer() {
  const { screenReader } = useAccessibility();
  
  if (!screenReader) return null;
  
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
      id="screen-reader-announcer"
    />
  );
}

function App() {
  return (
    <main className="min-h-svh">
      <Toaster />
      <ScreenReaderAnnouncer />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/editor" element={<Editor />} />
        <Route path="/new-project" element={<NewProject />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/error" element={<ErrorFatal />} />
      </Routes>
    </main>
  );
}

export default App;
