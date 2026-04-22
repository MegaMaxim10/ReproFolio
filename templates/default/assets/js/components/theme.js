export function initThemeToggle() {
  const root = document.documentElement;
  const toggle = document.getElementById("theme-toggle");
  const saved = localStorage.getItem("theme");
  const prefersDark = matchMedia("(prefers-color-scheme: dark)").matches;

  function updateThemeToggleLabel() {
    if (!toggle) return;
    const isDark = root.dataset.theme === "dark";
    toggle.dataset.mode = isDark ? "dark" : "light";
    toggle.setAttribute("aria-label", `Switch to ${isDark ? "light" : "dark"} mode`);
  }

  root.dataset.theme = saved || (prefersDark ? "dark" : "light");
  updateThemeToggleLabel();

  toggle?.addEventListener("click", () => {
    root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
    localStorage.setItem("theme", root.dataset.theme);
    updateThemeToggleLabel();
  });
}
