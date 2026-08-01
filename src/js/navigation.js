const siteHeader = document.querySelector(".site-header");

if (siteHeader) {
  let headerScrollFrame;

  const updateHeaderDock = () => {
    siteHeader.classList.toggle("site-header--docked", window.scrollY > 8);
    headerScrollFrame = undefined;
  };

  window.addEventListener("scroll", () => {
    if (!headerScrollFrame) headerScrollFrame = window.requestAnimationFrame(updateHeaderDock);
  }, { passive: true });

  updateHeaderDock();
}

const quickLinks = document.querySelector("[data-quick-links]");
const quickLinksToggle = quickLinks?.querySelector("[data-quick-links-toggle]");
const quickLinksMenu = quickLinks?.querySelector("[data-quick-links-menu]");

if (quickLinks && quickLinksToggle && quickLinksMenu) {
  const closeQuickLinks = ({ restoreFocus = false } = {}) => {
    quickLinks.classList.remove("is-open");
    quickLinksToggle.setAttribute("aria-expanded", "false");
    quickLinksToggle.setAttribute("aria-label", "Open portfolio links");
    if (restoreFocus) quickLinksToggle.focus();
  };

  quickLinksToggle.addEventListener("click", () => {
    const willOpen = !quickLinks.classList.contains("is-open");
    quickLinks.classList.toggle("is-open", willOpen);
    quickLinksToggle.setAttribute("aria-expanded", String(willOpen));
    quickLinksToggle.setAttribute("aria-label", willOpen ? "Close portfolio links" : "Open portfolio links");
  });

  quickLinksMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => closeQuickLinks());
  });

  document.addEventListener("pointerdown", (event) => {
    if (quickLinks.classList.contains("is-open") && !quickLinks.contains(event.target)) {
      closeQuickLinks();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && quickLinks.classList.contains("is-open")) {
      closeQuickLinks({ restoreFocus: true });
    }
  });

  window.matchMedia("(min-width: 1025px)").addEventListener("change", (event) => {
    if (event.matches) closeQuickLinks();
  });
}
