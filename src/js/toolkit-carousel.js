const carousels = document.querySelectorAll("[data-toolkit-carousel]");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const carouselSpeed = 42;
const revealDuration = 760;
const revealStep = 48;

carousels.forEach((carousel) => {
  const viewport = carousel.querySelector("[data-toolkit-viewport]");
  const track = carousel.querySelector("[data-toolkit-track]");

  if (!viewport || !track) return;

  const originalItems = [...track.children];
  if (!originalItems.length) return;

  const canObserve = "IntersectionObserver" in window;
  if (canObserve) carousel.classList.add("toolkit-carousel--offscreen");
  if (!reducedMotion.matches) carousel.classList.add("toolkit-carousel--reveal-ready");

  originalItems.forEach((item, index) => {
    item.style.setProperty("--toolkit-reveal-index", index);
  });

  const duplicateItems = originalItems.map((item) => {
    const duplicate = item.cloneNode(true);
    duplicate.setAttribute("aria-hidden", "true");
    duplicate.setAttribute("inert", "");
    return duplicate;
  });

  track.append(...duplicateItems);
  carousel.classList.add("toolkit-carousel--enhanced");

  let hasRevealed = false;
  const reveal = () => {
    if (hasRevealed || reducedMotion.matches) return;
    hasRevealed = true;
    carousel.classList.add("toolkit-carousel--revealed");

    const cleanupDelay = revealDuration + ((originalItems.length - 1) * revealStep) + 120;
    window.setTimeout(() => {
      carousel.classList.remove("toolkit-carousel--reveal-ready", "toolkit-carousel--revealed");
      carousel.classList.add("toolkit-carousel--reveal-complete");
    }, cleanupDelay);
  };

  const measure = () => {
    const firstDuplicate = track.children[originalItems.length];
    const loopDistance = firstDuplicate?.offsetLeft || track.scrollWidth / 2;

    track.style.setProperty("--toolkit-loop-translate", `${-loopDistance}px`);
    track.style.setProperty("--toolkit-loop-duration", `${loopDistance / carouselSpeed}s`);
  };

  viewport.addEventListener("pointerdown", () => {
    carousel.classList.add("toolkit-carousel--interacting");
  });
  window.addEventListener("pointerup", () => {
    carousel.classList.remove("toolkit-carousel--interacting");
  }, { passive: true });
  window.addEventListener("pointercancel", () => {
    carousel.classList.remove("toolkit-carousel--interacting");
  }, { passive: true });
  viewport.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    viewport.scrollBy({
      left: viewport.clientWidth * (event.key === "ArrowLeft" ? -0.6 : 0.6),
      behavior: reducedMotion.matches ? "auto" : "smooth",
    });
  });

  if ("ResizeObserver" in window) {
    new ResizeObserver(measure).observe(viewport);
  } else {
    window.addEventListener("resize", measure, { passive: true });
  }

  if (canObserve) {
    new IntersectionObserver(([entry]) => {
      carousel.classList.toggle("toolkit-carousel--offscreen", !entry.isIntersecting);
      if (entry.isIntersecting) reveal();
    }, { threshold: 0.16 }).observe(carousel);
  } else {
    reveal();
  }

  measure();
});
