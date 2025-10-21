import { useEffect, useState } from "react";

export function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = savedTheme || (prefersDark ? "dark" : "light");
    
    setTheme(initialTheme);
    document.documentElement.classList.toggle("dark", initialTheme === "dark");
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    
    // Animação suave na troca de tema
    document.documentElement.style.transition = "background-color 0.3s ease, color 0.3s ease";
    document.documentElement.classList.toggle("dark", newTheme === "dark");
    setTimeout(() => {
      document.documentElement.style.transition = "";
    }, 300);
  };

  return { theme, toggleTheme };
}