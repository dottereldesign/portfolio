const carousels = document.querySelectorAll("[data-toolkit-carousel]");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const carouselSpeed = 42;

carousels.forEach((carousel) => {
  const viewport = carousel.querySelector("[data-toolkit-viewport]");
  const track = carousel.querySelector("[data-toolkit-track]");

  if (!viewport || !track) return;

  const originalItems = [...track.children];
  if (!originalItems.length) return;

  const duplicateItems = originalItems.map((item) => {
    const duplicate = item.cloneNode(true);
    duplicate.setAttribute("aria-hidden", "true");
    duplicate.setAttribute("inert", "");
    return duplicate;
  });

  track.append(...duplicateItems);
  carousel.classList.add("toolkit-carousel--enhanced");

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

  if ("IntersectionObserver" in window) {
    carousel.classList.add("toolkit-carousel--offscreen");
    new IntersectionObserver(([entry]) => {
      carousel.classList.toggle("toolkit-carousel--offscreen", !entry.isIntersecting);
    }, { threshold: 0.08 }).observe(carousel);
  }

  measure();
});
