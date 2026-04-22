export function initHeaderOffset() {
  const root = document.documentElement;
  const siteHeader = document.querySelector(".site-header");

  function syncHeaderOffset() {
    if (!siteHeader) return;
    root.style.setProperty("--header-offset", `${siteHeader.offsetHeight}px`);
  }

  syncHeaderOffset();
  addEventListener("resize", syncHeaderOffset);
}
