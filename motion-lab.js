const motionStudy = document.querySelector("[data-motion-study]");

if (motionStudy) {
  const svgDemo = motionStudy.querySelector("[data-track-svg]");
  const canvasDemo = motionStudy.querySelector("[data-track-canvas]");
  const threeDemo = motionStudy.querySelector("[data-track-three]");
  const laptopThreeDemo = motionStudy.querySelector("[data-track-laptop]");
  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const animationDurationMs = 5800;
  let studyIsVisible = null;
  let animationFrame;
  let animationStartedAt = performance.now();
  let canvasWidth = 0;
  let canvasHeight = 0;
  let threeRenderer;
  let threeScene;
  let threeCamera;
  let threeCurve;
  let threeBall;
  let threeBallLight;
  let laptopThreeRenderer;
  let laptopThreeScene;
  let laptopThreeCamera;
  let laptopThreeCurve;
  let laptopThreeBall;
  let laptopThreeBallLight;

  const getLoopPoint = (phase, width, height) => {
    const angle = phase * Math.PI * 2;
    return {
      x: width * (0.5 + Math.sin(angle) * 0.36),
      y: height * (0.5 - Math.sin(angle * 2) * 0.23),
    };
  };

  const resizeCanvasDemo = () => {
    const bounds = canvasDemo.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvasWidth = Math.max(1, bounds.width);
    canvasHeight = Math.max(1, bounds.height);
    canvasDemo.width = Math.round(canvasWidth * dpr);
    canvasDemo.height = Math.round(canvasHeight * dpr);
    canvasDemo.getContext("2d").setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const drawCanvasTrack = (context) => {
    context.beginPath();
    for (let index = 0; index <= 320; index += 1) {
      const point = getLoopPoint(index / 320, canvasWidth, canvasHeight);
      if (index === 0) context.moveTo(point.x, point.y);
      else context.lineTo(point.x, point.y);
    }
    context.closePath();

    context.save();
    context.lineCap = "round";
    context.lineJoin = "round";
    context.shadowColor = "rgba(87, 176, 255, 0.28)";
    context.shadowBlur = canvasWidth * 0.035;
    context.strokeStyle = "rgba(20, 43, 62, 0.95)";
    context.lineWidth = canvasWidth * 0.055;
    context.stroke();
    context.shadowBlur = 0;
    context.strokeStyle = "rgba(119, 181, 224, 0.72)";
    context.lineWidth = canvasWidth * 0.026;
    context.stroke();
    context.strokeStyle = "rgba(8, 18, 27, 0.96)";
    context.lineWidth = canvasWidth * 0.015;
    context.stroke();
    context.setLineDash([canvasWidth * 0.015, canvasWidth * 0.025]);
    context.lineDashOffset = -canvasWidth * 0.02;
    context.strokeStyle = "rgba(156, 216, 255, 0.68)";
    context.lineWidth = Math.max(1, canvasWidth * 0.003);
    context.stroke();
    context.restore();
  };

  const drawCanvasBall = (context, x, y, radius, opacity = 1) => {
    context.save();
    context.globalAlpha = opacity;
    context.shadowColor = "rgba(255, 211, 132, 0.55)";
    context.shadowBlur = radius * 1.2;
    context.shadowOffsetY = radius * 0.25;
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
    drawCanvasTrack(context);

    const radius = canvasWidth * 0.034;
    for (let index = 7; index >= 1; index -= 1) {
      const trailPhase = (phase - index * 0.008 + 1) % 1;
      const trailPoint = getLoopPoint(trailPhase, canvasWidth, canvasHeight);
      drawCanvasBall(
        context,
        trailPoint.x,
        trailPoint.y,
        radius * (0.38 + index * 0.025),
        (8 - index) * 0.022,
      );
    }

    const point = getLoopPoint(phase, canvasWidth, canvasHeight);
    drawCanvasBall(context, point.x, point.y, radius);
  };

  const resizeThreeViewport = (canvas, renderer, camera) => {
    if (!canvas || !renderer || !camera) return;
    const bounds = canvas.getBoundingClientRect();
    const width = Math.max(1, bounds.width);
    const height = Math.max(1, bounds.height);
    const viewHeight = 2.65;
    const viewWidth = viewHeight * (width / height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    camera.left = -viewWidth / 2;
    camera.right = viewWidth / 2;
    camera.top = viewHeight / 2;
    camera.bottom = -viewHeight / 2;
    camera.updateProjectionMatrix();
  };

  const resizeThreeDemos = () => {
    resizeThreeViewport(threeDemo, threeRenderer, threeCamera);
    resizeThreeViewport(laptopThreeDemo, laptopThreeRenderer, laptopThreeCamera);
  };

  const renderThreePrototype = (renderer, scene, camera, curve, ball, ballLight, phase) => {
    if (!renderer || !scene || !camera || !curve || !ball) return;
    const point = curve.getPointAt(phase);
    ball.position.copy(point);
    ball.position.z += 0.12;
    ball.rotation.y = phase * Math.PI * 6;
    if (ballLight) {
      ballLight.position.copy(ball.position);
      ballLight.position.z += 0.45;
    }
    renderer.render(scene, camera);
  };

  const renderThreeDemos = (phase) => {
    renderThreePrototype(
      threeRenderer,
      threeScene,
      threeCamera,
      threeCurve,
      threeBall,
      threeBallLight,
      phase,
    );
    renderThreePrototype(
      laptopThreeRenderer,
      laptopThreeScene,
      laptopThreeCamera,
      laptopThreeCurve,
      laptopThreeBall,
      laptopThreeBallLight,
      phase,
    );
  };

  const renderFrame = (now) => {
    animationFrame = undefined;
    const shouldAnimate = studyIsVisible
      && !document.hidden
      && !reducedMotionQuery.matches;
    const elapsed = Math.max(0, now - animationStartedAt);
    const phase = shouldAnimate
      ? (elapsed % animationDurationMs) / animationDurationMs
      : 0.09;

    renderCanvasDemo(phase);
    renderThreeDemos(phase);

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
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      animationFrame = undefined;
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
    resizeThreeDemos();
    requestMotionFrame();
  });
  resizeObserver.observe(canvasDemo);
  resizeObserver.observe(threeDemo);
  resizeObserver.observe(laptopThreeDemo);

  const updateStudyVisibility = () => {
    const bounds = motionStudy.getBoundingClientRect();
    const isVisible = bounds.bottom >= -160
      && bounds.top <= window.innerHeight + 160;
    if (isVisible === studyIsVisible) return;
    studyIsVisible = isVisible;
    updateMotionState();
  };

  document.addEventListener("visibilitychange", updateMotionState);
  reducedMotionQuery.addEventListener("change", updateMotionState);
  window.addEventListener("scroll", updateStudyVisibility, { passive: true });
  window.addEventListener("resize", updateStudyVisibility, { passive: true });
  window.addEventListener("load", updateStudyVisibility, { once: true });

  resizeCanvasDemo();
  renderCanvasDemo(0.09);
  updateStudyVisibility();

  import("./assets/vendor/laptop-runtime.min.js?v=20260730-2").then(({
    AmbientLight,
    CatmullRomCurve3,
    DirectionalLight,
    Mesh,
    MeshStandardMaterial,
    OrthographicCamera,
    PointLight,
    Scene,
    SphereGeometry,
    SRGBColorSpace,
    TubeGeometry,
    Vector3,
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
    threeCamera = new OrthographicCamera(-2, 2, 1.3, -1.3, 0.1, 10);
    threeCamera.position.z = 5;

    const curvePoints = [];
    for (let index = 0; index < 256; index += 1) {
      const angle = (index / 256) * Math.PI * 2;
      curvePoints.push(new Vector3(
        Math.sin(angle) * 1.7,
        Math.sin(angle * 2) * 0.78,
        Math.cos(angle) * 0.13,
      ));
    }
    threeCurve = new CatmullRomCurve3(curvePoints, true, "centripetal");

    const trackShadow = new Mesh(
      new TubeGeometry(threeCurve, 320, 0.15, 16, true),
      new MeshStandardMaterial({
        color: 0x171513,
        metalness: 0.9,
        roughness: 0.36,
      }),
    );
    const trackRail = new Mesh(
      new TubeGeometry(threeCurve, 320, 0.095, 16, true),
      new MeshStandardMaterial({
        color: 0xa79886,
        metalness: 0.94,
        roughness: 0.24,
      }),
    );
    threeScene.add(trackShadow, trackRail);

    const ambientLight = new AmbientLight(0xffe9c7, 1.35);
    const directionalLight = new DirectionalLight(0xffffff, 4.8);
    directionalLight.position.set(-1.8, 2.4, 3.5);
    threeScene.add(ambientLight, directionalLight);

    threeBall = new Mesh(
      new SphereGeometry(0.19, 36, 24),
      new MeshStandardMaterial({
        color: 0xfff3d2,
        emissive: 0x2a1705,
        emissiveIntensity: 0.14,
        metalness: 0.08,
        roughness: 0.3,
      }),
    );
    threeBallLight = new PointLight(0xffcc85, 5.5, 1.65);
    threeScene.add(threeBall, threeBallLight);

    laptopThreeRenderer = new WebGLRenderer({
      alpha: true,
      antialias: true,
      canvas: laptopThreeDemo,
      powerPreference: "high-performance",
    });
    laptopThreeRenderer.setClearColor(0x000000, 0);
    laptopThreeRenderer.outputColorSpace = SRGBColorSpace;

    laptopThreeScene = new Scene();
    laptopThreeCamera = new OrthographicCamera(-2, 2, 1.3, -1.3, 0.1, 10);
    laptopThreeCamera.position.z = 5;
    laptopThreeCurve = new CatmullRomCurve3(curvePoints, true, "centripetal");

    const laptopTrackEdge = new Mesh(
      new TubeGeometry(laptopThreeCurve, 320, 0.15, 16, true),
      new MeshStandardMaterial({
        color: 0x080909,
        metalness: 0.35,
        roughness: 0.72,
      }),
    );
    const laptopTrackMetal = new Mesh(
      new TubeGeometry(laptopThreeCurve, 320, 0.105, 16, true),
      new MeshStandardMaterial({
        color: 0x73777d,
        metalness: 0.7,
        roughness: 0.52,
      }),
    );
    laptopThreeScene.add(laptopTrackEdge, laptopTrackMetal);

    const laptopAmbientLight = new AmbientLight(0xe8e7e1, 2.2);
    const laptopKeyLight = new DirectionalLight(0xff5a24, 2.4);
    const laptopFillLight = new DirectionalLight(0x8791d8, 0.68);
    laptopKeyLight.position.set(4, 5, 6);
    laptopFillLight.position.set(-5, 2, 3);
    laptopThreeScene.add(laptopAmbientLight, laptopKeyLight, laptopFillLight);

    laptopThreeBall = new Mesh(
      new SphereGeometry(0.19, 36, 24),
      new MeshStandardMaterial({
        color: 0xfff3d2,
        emissive: 0x2a1705,
        emissiveIntensity: 0.14,
        metalness: 0.08,
        roughness: 0.3,
      }),
    );
    laptopThreeBallLight = new PointLight(0xffcc85, 5.5, 1.65);
    laptopThreeScene.add(laptopThreeBall, laptopThreeBallLight);

    resizeThreeDemos();
    renderThreeDemos(0.09);
    requestMotionFrame();
  }).catch(() => {
    threeDemo.classList.add("is-unavailable");
    laptopThreeDemo.classList.add("is-unavailable");
  });
}
