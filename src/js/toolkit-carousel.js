const carousels = document.querySelectorAll("[data-toolkit-carousel]");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

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

  let previousTime = 0;
  let loopDistance = 0;
  let pointerIsDown = false;
  let isVisible = !("IntersectionObserver" in window);

  const measure = () => {
    const firstDuplicate = track.children[originalItems.length];
    loopDistance = firstDuplicate?.offsetLeft || track.scrollWidth / 2;

    if (loopDistance > 0 && viewport.scrollLeft >= loopDistance) {
      viewport.scrollLeft %= loopDistance;
    }
  };

  const shouldPause = () => (
    reducedMotion.matches
    || document.hidden
    || !isVisible
    || pointerIsDown
    || carousel.matches(":hover")
    || carousel.contains(document.activeElement)
  );

  const animate = (time) => {
    if (!previousTime) previousTime = time;
    const elapsed = Math.min(time - previousTime, 64);
    previousTime = time;

    if (!shouldPause() && loopDistance > 0) {
      viewport.scrollLeft += elapsed * 0.028;

      if (viewport.scrollLeft >= loopDistance) {
        viewport.scrollLeft -= loopDistance;
      }
    }

    window.requestAnimationFrame(animate);
  };

  viewport.addEventListener("pointerdown", () => { pointerIsDown = true; });
  window.addEventListener("pointerup", () => { pointerIsDown = false; }, { passive: true });
  window.addEventListener("pointercancel", () => { pointerIsDown = false; }, { passive: true });
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
    new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      previousTime = 0;
    }, { threshold: 0.08 }).observe(carousel);
  }

  measure();
  window.requestAnimationFrame(animate);
});
