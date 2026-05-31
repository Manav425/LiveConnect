import { create } from "zustand";

export const useThemeStore = create((set) => ({
  theme: localStorage.getItem("LiveConnect-theme") || "coffee",
  setTheme: (theme) => {
    localStorage.setItem("LiveConnect-theme", theme);
    set({ theme });
  },
}));