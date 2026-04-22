export function initMobileNav() {
  const navToggle = document.querySelector(".nav-toggle");
  const siteNav = document.querySelector(".site-nav");

  if (!navToggle || !siteNav) return;

  const desktopMedia = matchMedia("(min-width: 1021px)");

  function setOpen(nextOpen) {
    siteNav.classList.toggle("open", nextOpen);
    navToggle.setAttribute("aria-expanded", nextOpen ? "true" : "false");
  }

  navToggle.addEventListener("click", () => {
    const isOpen = siteNav.classList.contains("open");
    setOpen(!isOpen);
  });

  document.addEventListener("click", (event) => {
    if (!siteNav.classList.contains("open")) return;
    const target = event.target;
    if (!(target instanceof Node)) return;
    if (siteNav.contains(target) || navToggle.contains(target)) return;
    setOpen(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setOpen(false);
      navToggle.focus();
    }
  });

  if (typeof desktopMedia.addEventListener === "function") {
    desktopMedia.addEventListener("change", (event) => {
      if (event.matches) {
        setOpen(false);
      }
    });
  }
}

export function initDesktopSubmenus() {
  if (matchMedia("(max-width: 1020px)").matches) return;

  const submenuParents = document.querySelectorAll(".menu-item.has-submenu");
  submenuParents.forEach((item) => {
    let closeTimer = null;

    function openSubmenu() {
      if (closeTimer) {
        clearTimeout(closeTimer);
        closeTimer = null;
      }
      item.classList.add("submenu-open");
    }

    function closeSubmenuWithDelay() {
      if (closeTimer) clearTimeout(closeTimer);
      closeTimer = setTimeout(() => {
        item.classList.remove("submenu-open");
        closeTimer = null;
      }, 140);
    }

    item.addEventListener("pointerenter", openSubmenu);
    item.addEventListener("pointerleave", closeSubmenuWithDelay);
    item.addEventListener("focusin", openSubmenu);
    item.addEventListener("focusout", (event) => {
      const next = event.relatedTarget;
      if (!(next instanceof Node) || !item.contains(next)) {
        closeSubmenuWithDelay();
      }
    });
  });
}

export function initActiveLinks() {
  function normalizePath(path) {
    if (!path) return "/";
    const [pathname] = path.split("#");
    const [cleanPath] = pathname.split("?");
    if (cleanPath === "/") return "/";
    return cleanPath.replace(/\/index\.html$/i, "/").replace(/\/+$/, "") || "/";
  }

  const currentPath = normalizePath(window.location.pathname);

  document.querySelectorAll(".site-nav a, .breadcrumb-nav a").forEach((link) => {
    const href = link.getAttribute("href");
    if (!href) return;

    const url = new URL(href, window.location.origin);
    const linkPath = normalizePath(url.pathname);

    if (linkPath === currentPath) {
      link.classList.add("is-active");
      link.setAttribute("aria-current", "page");
      link.closest(".menu-item")?.classList.add("is-active-ancestor");
      link.closest(".submenu-item")?.closest(".menu-item")?.classList.add("is-active-ancestor");
    }
  });
}
