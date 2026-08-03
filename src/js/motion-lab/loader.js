const motionStudy = document.querySelector("[data-motion-study]");

if (motionStudy) {
  let hasStarted = false;

  const startMotionStudy = () => {
    if (hasStarted) return;
    hasStarted = true;
    import("./controller.js").catch(() => {
      motionStudy.querySelectorAll("canvas").forEach((canvas) => {
        canvas.classList.add("is-unavailable");
      });
    });
  };

  if ("IntersectionObserver" in window) {
    const motionStudyObserver = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      motionStudyObserver.disconnect();
      startMotionStudy();
    }, { rootMargin: "0px 0px -10% 0px" });

    motionStudyObserver.observe(motionStudy);
  } else {
    startMotionStudy();
  }
}
