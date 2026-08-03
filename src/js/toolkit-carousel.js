const carousels = document.querySelectorAll("[data-toolkit-carousel]");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

carousels.forEach((carousel) => {
  const viewport = carousel.querySelector("[data-toolkit-viewport]");
  const previous = carousel.querySelector("[data-toolkit-previous]");
  const next = carousel.querySelector("[data-toolkit-next]");
  const firstItem = carousel.querySelector(".toolkit-carousel__item");

  if (!viewport || !previous || !next || !firstItem) return;

  let updateFrame = 0;

  const updateControls = () => {
    const maximum = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
    previous.disabled = viewport.scrollLeft <= 2;
    next.disabled = viewport.scrollLeft >= maximum - 2;
  };

  const scheduleControlUpdate = () => {
    window.cancelAnimationFrame(updateFrame);
    updateFrame = window.requestAnimationFrame(updateControls);
  };

  const move = (direction) => {
    const styles = window.getComputedStyle(viewport.querySelector(".toolkit-carousel__track"));
    const gap = Number.parseFloat(styles.columnGap || styles.gap) || 0;
    const visibleItems = Math.max(1, Math.floor(viewport.clientWidth / (firstItem.offsetWidth + gap)));
    const distance = (firstItem.offsetWidth + gap) * Math.max(1, visibleItems - 1);

    viewport.scrollBy({
      left: distance * direction,
      behavior: reducedMotion.matches ? "auto" : "smooth",
    });
  };

  previous.addEventListener("click", () => move(-1));
  next.addEventListener("click", () => move(1));
  viewport.addEventListener("scroll", scheduleControlUpdate, { passive: true });
  viewport.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    move(event.key === "ArrowLeft" ? -1 : 1);
  });

  if ("ResizeObserver" in window) {
    new ResizeObserver(scheduleControlUpdate).observe(viewport);
  } else {
    window.addEventListener("resize", scheduleControlUpdate, { passive: true });
  }

  updateControls();
});
