import { initThemeToggle } from "./components/theme.js";
import { initMobileNav, initDesktopSubmenus, initActiveLinks } from "./components/navigation.js";
import { initHeaderOffset } from "./components/layout.js";

function initTemplateRuntime() {
  initThemeToggle();
  initMobileNav();
  initDesktopSubmenus();
  initHeaderOffset();
  initActiveLinks();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initTemplateRuntime, { once: true });
} else {
  initTemplateRuntime();
}
