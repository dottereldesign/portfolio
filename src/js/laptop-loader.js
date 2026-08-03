const modelHost = document.querySelector("[data-laptop-enhancement]");

if (modelHost) {
  const interactionEvents = ["pointermove", "pointerdown", "touchstart", "wheel", "keydown"];
  let hasStarted = false;
  let autoLoadTimer;

  const startLaptop = () => {
    if (hasStarted) return;
    hasStarted = true;
    window.clearTimeout(autoLoadTimer);
    window.removeEventListener("load", scheduleAutoLoad);
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

  function scheduleAutoLoad() {
    autoLoadTimer = window.setTimeout(() => {
      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(startLaptop, { timeout: 2500 });
      } else {
        startLaptop();
      }
    }, 8000);
  }

  if (document.readyState === "complete") scheduleAutoLoad();
  else window.addEventListener("load", scheduleAutoLoad, { once: true });
}
