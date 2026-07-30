const motionStudy = document.querySelector("[data-motion-study]");

if (motionStudy) {
  const svgDemo = motionStudy.querySelector("[data-track-svg]");
  const canvasDemo = motionStudy.querySelector("[data-track-canvas]");
  const threeDemo = motionStudy.querySelector("[data-track-three]");
  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const animationDurationMs = 5800;
  let studyIsVisible = false;
  let animationFrame;
  let animationStartedAt = performance.now();
  let canvasWidth = 0;
  let canvasHeight = 0;
  let threeRenderer;
  let threeScene;
  let threeCamera;
  let threeBall;

  const getTrackPoint = (phase) => {
    const angle = phase * Math.PI * 2;
    return {
      x: 0.5 + Math.sin(angle) * 0.34,
      y: 0.5 - Math.sin(angle * 2) * 0.155,
    };
  };

  const resizeCanvasDemo = () => {
    const bounds = canvasDemo.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvasWidth = Math.max(1, bounds.width);
    canvasHeight = Math.max(1, bounds.height);
    canvasDemo.width = Math.round(canvasWidth * dpr);
    canvasDemo.height = Math.round(canvasHeight * dpr);
    const context = canvasDemo.getContext("2d");
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const drawCanvasBall = (context, x, y, radius, opacity = 1) => {
    context.save();
    context.globalAlpha = opacity;
    context.shadowColor = "rgba(255, 211, 132, 0.48)";
    context.shadowBlur = radius * 0.75;
    context.shadowOffsetY = radius * 0.22;
    const fill = context.createRadialGradient(
      x - radius * 0.3,
      y - radius * 0.34,
      radius * 0.08,
      x,
      y,
      radius,
    );
    fill.addColorStop(0, "#ffffff");
    fill.addColorStop(0.52, "#fff7df");
    fill.addColorStop(1, "#d5ae64");
    context.fillStyle = fill;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
    context.restore();
  };

  const renderCanvasDemo = (phase) => {
    const context = canvasDemo.getContext("2d");
    context.clearRect(0, 0, canvasWidth, canvasHeight);
    const radius = canvasWidth * 0.03;

    for (let index = 5; index >= 1; index -= 1) {
      const trailPhase = (phase - index * 0.009 + 1) % 1;
      const trailPoint = getTrackPoint(trailPhase);
      drawCanvasBall(
        context,
        trailPoint.x * canvasWidth,
        trailPoint.y * canvasHeight,
        radius * (0.48 + index * 0.035),
        (6 - index) * 0.025,
      );
    }

    const point = getTrackPoint(phase);
    drawCanvasBall(
      context,
      point.x * canvasWidth,
      point.y * canvasHeight,
      radius,
    );
  };

  const resizeThreeDemo = () => {
    if (!threeRenderer || !threeCamera) return;
    const bounds = threeDemo.getBoundingClientRect();
    threeRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    threeRenderer.setSize(Math.max(1, bounds.width), Math.max(1, bounds.height), false);
    threeCamera.updateProjectionMatrix();
  };

  const renderThreeDemo = (phase) => {
    if (!threeRenderer || !threeScene || !threeCamera || !threeBall) return;
    const point = getTrackPoint(phase);
    threeBall.position.set(
      (point.x - 0.5) * 2,
      (0.5 - point.y) * 2,
      0,
    );
    threeBall.rotation.y = phase * Math.PI * 4;
    threeRenderer.render(threeScene, threeCamera);
  };

  const renderFrame = (now) => {
    animationFrame = undefined;
    const shouldAnimate = studyIsVisible
      && !document.hidden
      && !reducedMotionQuery.matches;
    const phase = shouldAnimate
      ? ((now - animationStartedAt) % animationDurationMs) / animationDurationMs
      : 0.09;

    renderCanvasDemo(phase);
    renderThreeDemo(phase);

    if (shouldAnimate) animationFrame = window.requestAnimationFrame(renderFrame);
  };

  const requestMotionFrame = () => {
    if (!animationFrame) animationFrame = window.requestAnimationFrame(renderFrame);
  };

  const updateMotionState = () => {
    const shouldAnimate = studyIsVisible
      && !document.hidden
      && !reducedMotionQuery.matches;

    if (svgDemo) {
      if (shouldAnimate) svgDemo.unpauseAnimations();
      else svgDemo.pauseAnimations();
    }

    if (shouldAnimate) {
      animationStartedAt = performance.now();
      requestMotionFrame();
    } else {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      animationFrame = undefined;
      requestMotionFrame();
    }
  };

  const resizeObserver = new ResizeObserver(() => {
    resizeCanvasDemo();
    resizeThreeDemo();
    requestMotionFrame();
  });
  resizeObserver.observe(canvasDemo);
  resizeObserver.observe(threeDemo);

  const visibilityObserver = new IntersectionObserver(([entry]) => {
    studyIsVisible = entry.isIntersecting;
    updateMotionState();
  }, { rootMargin: "160px 0px", threshold: 0.08 });
  visibilityObserver.observe(motionStudy);

  document.addEventListener("visibilitychange", updateMotionState);
  reducedMotionQuery.addEventListener("change", updateMotionState);

  resizeCanvasDemo();
  renderCanvasDemo(0.09);

  import("./assets/vendor/laptop-runtime.min.js?v=20260730-1").then(({
    AmbientLight,
    Mesh,
    MeshStandardMaterial,
    OrthographicCamera,
    PointLight,
    Scene,
    SphereGeometry,
    SRGBColorSpace,
    WebGLRenderer,
  }) => {
    threeRenderer = new WebGLRenderer({
      alpha: true,
      antialias: true,
      canvas: threeDemo,
      powerPreference: "high-performance",
    });
    threeRenderer.setClearColor(0x000000, 0);
    threeRenderer.outputColorSpace = SRGBColorSpace;

    threeScene = new Scene();
    threeCamera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    threeCamera.position.z = 3;

    const ambientLight = new AmbientLight(0xfff2d5, 1.65);
    const pointLight = new PointLight(0xffffff, 18, 8);
    pointLight.position.set(-0.55, 0.75, 2.4);
    threeScene.add(ambientLight, pointLight);

    const ballGeometry = new SphereGeometry(0.072, 36, 24);
    const ballMaterial = new MeshStandardMaterial({
      color: 0xfff3d2,
      emissive: 0x2a1705,
      emissiveIntensity: 0.12,
      metalness: 0.08,
      roughness: 0.32,
    });
    threeBall = new Mesh(ballGeometry, ballMaterial);
    threeScene.add(threeBall);

    resizeThreeDemo();
    renderThreeDemo(0.09);
    requestMotionFrame();
  }).catch(() => {
    threeDemo.classList.add("is-unavailable");
  });
}
