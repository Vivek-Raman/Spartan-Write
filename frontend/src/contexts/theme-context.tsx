import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ThemePreference = "system" | "light" | "dark" | "high-contrast";

interface ThemeContextValue {
  themePreference: ThemePreference;
  setThemePreference: (preference: ThemePreference) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const THEME_STORAGE_KEY = "latex-tool-theme";
const ACCESSIBILITY_STORAGE_KEY = "latex-tool-accessibility";

function readLegacyHighContrast(): boolean {
  try {
    const stored = localStorage.getItem(ACCESSIBILITY_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as { highContrast?: boolean };
      return Boolean(parsed.highContrast);
    }
  } catch {
    /* ignore */
  }
  return false;
}

function getInitialThemePreference(): ThemePreference {
  if (typeof window === "undefined") return "system";
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "system" || stored === "high-contrast") {
    return stored;
  }
  if (readLegacyHighContrast()) {
    return "high-contrast";
  }
  if (stored === "light" || stored === "dark") {
    return stored;
  }
  return "system";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>(
    getInitialThemePreference
  );
  const [systemDark, setSystemDark] = useState(() =>
    typeof window !== "undefined" && window.matchMedia
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
      : false
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => setSystemDark(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const isDark = useMemo(() => {
    switch (themePreference) {
      case "light":
        return false;
      case "dark":
      case "high-contrast":
        return true;
      case "system":
        return systemDark;
      default:
        return systemDark;
    }
  }, [themePreference, systemDark]);

  useEffect(() => {
    const root = document.documentElement;
    const useDarkClass =
      themePreference === "dark" ||
      themePreference === "high-contrast" ||
      (themePreference === "system" && systemDark);

    if (useDarkClass) root.classList.add("dark");
    else root.classList.remove("dark");

    if (themePreference === "high-contrast") root.classList.add("high-contrast");
    else root.classList.remove("high-contrast");

    localStorage.setItem(THEME_STORAGE_KEY, themePreference);
  }, [themePreference, systemDark]);

  const setThemePreference = (preference: ThemePreference) => {
    setThemePreferenceState(preference);
  };

  return (
    <ThemeContext.Provider value={{ themePreference, setThemePreference, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
