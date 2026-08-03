const modelHost = document.querySelector("[data-laptop-enhancement]");

if (modelHost) {
  const interactionEvents = ["pointermove", "pointerdown", "touchstart", "wheel", "keydown"];
  let hasStarted = false;
  let fallbackTimer;

  const startLaptop = () => {
    if (hasStarted) return;
    hasStarted = true;
    window.clearTimeout(fallbackTimer);
    interactionEvents.forEach((eventName) => window.removeEventListener(eventName, startLaptop));
    modelHost.classList.add("hero__model--loading");

    import("./hero-laptop.js").catch(() => {
      modelHost.classList.remove("hero__model--loading");
      modelHost.classList.add("hero__model--unavailable");
    });
  };

  interactionEvents.forEach((eventName) => {
    window.addEventListener(eventName, startLaptop, { once: true, passive: true });
  });

  // Keep the initial page lightweight. A real interaction starts the 3D
  // enhancement immediately; an idle visitor still receives it after the
  // critical loading and reading window has passed.
  fallbackTimer = window.setTimeout(() => {
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(startLaptop, { timeout: 2000 });
    } else {
      startLaptop();
    }
  }, 30000);
}
