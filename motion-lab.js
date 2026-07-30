const motionStudy = document.querySelector("[data-motion-study]");

if (motionStudy) {
  const svgDemo = motionStudy.querySelector("[data-track-svg]");
  const canvasDemo = motionStudy.querySelector("[data-track-canvas]");
  const threeDemo = motionStudy.querySelector("[data-track-three]");
  const designBoardDemo = motionStudy.querySelector("[data-design-board]");
  const developAssemblyDemo = motionStudy.querySelector("[data-develop-assembly]");
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
  let designRenderer;
  let designScene;
  let designCamera;
  let designNotes = [];
  let developRenderer;
  let developScene;
  let developCamera;
  let developBlocks = [];
  let developGlowMaterial;
  let developPulseLight;
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

  const clamp01 = (value) => Math.max(0, Math.min(1, value));
  const smoothStep = (value) => {
    const amount = clamp01(value);
    return amount * amount * (3 - 2 * amount);
  };
  const easeOutBack = (value) => {
    const amount = clamp01(value) - 1;
    const overshoot = 1.35;
    return 1 + (overshoot + 1) * amount ** 3 + overshoot * amount ** 2;
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
    resizeThreeViewport(designBoardDemo, designRenderer, designCamera);
    resizeThreeViewport(developAssemblyDemo, developRenderer, developCamera);
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

  const renderDesignDemo = (phase) => {
    if (!designRenderer || !designScene || !designCamera) return;
    designNotes.forEach((note, index) => {
      const {
        group,
        pin,
        targetX,
        targetY,
        targetRotation,
        entryX,
        entryY,
      } = note;
      const start = 0.04 + index * 0.085;
      const enter = smoothStep((phase - start) / 0.13);
      const pinProgress = smoothStep((phase - start - 0.075) / 0.065);
      const leave = smoothStep((phase - 0.86) / 0.11);
      const presence = enter * (1 - leave);

      group.visible = presence > 0.001;
      group.position.set(
        targetX + entryX * (1 - enter) + entryX * 0.3 * leave,
        targetY + entryY * (1 - enter) + 0.5 * leave,
        0.15 + 0.9 * (1 - enter) + 0.4 * leave,
      );
      group.rotation.z = targetRotation
        + Math.sign(entryX) * 0.24 * (1 - enter)
        - Math.sign(entryX) * 0.12 * leave;
      group.scale.setScalar(Math.max(0.001, (0.84 + enter * 0.16) * (1 - leave)));
      pin.scale.setScalar(Math.max(0.001, pinProgress * (1 - leave)));
      pin.position.z = 0.11 + 0.42 * (1 - pinProgress);
    });

    designRenderer.render(designScene, designCamera);
  };

  const renderDevelopDemo = (phase) => {
    if (!developRenderer || !developScene || !developCamera) return;
    developBlocks.forEach((block, index) => {
      const start = 0.035 + index * 0.055;
      const rawEnter = clamp01((phase - start) / 0.17);
      const enter = easeOutBack(rawEnter);
      const leave = smoothStep((phase - 0.86) / 0.11);
      const { group, material, from, target, rotation } = block;

      group.visible = rawEnter > 0.001 && leave < 0.999;
      group.position.set(
        from.x + (target.x - from.x) * enter + (from.x - target.x) * 0.28 * leave,
        from.y + (target.y - from.y) * enter + (from.y - target.y) * 0.28 * leave,
        from.z + (target.z - from.z) * enter + 0.45 * leave,
      );
      group.rotation.set(
        rotation.x * (1 - enter),
        rotation.y * (1 - enter),
        rotation.z * (1 - enter),
      );
      group.scale.setScalar(Math.max(0.001, 1 - leave));

      const snapPulse = Math.max(0, 1 - Math.abs(rawEnter - 0.86) / 0.14);
      material.emissiveIntensity = 0.025 + snapPulse * 0.38;
    });

    const assembled = smoothStep((phase - 0.43) / 0.12)
      * (1 - smoothStep((phase - 0.86) / 0.1));
    if (developPulseLight) {
      const sweep = clamp01((phase - 0.48) / 0.28);
      developPulseLight.intensity = assembled * Math.sin(sweep * Math.PI) * 5;
      developPulseLight.position.set(-1.35 + sweep * 2.7, 0.18, 0.75);
    }

    developRenderer.render(developScene, developCamera);
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

    const conceptPhase = shouldAnimate ? phase : 0.58;
    renderCanvasDemo(phase);
    renderThreeDemos(phase);
    renderDesignDemo(conceptPhase);
    renderDevelopDemo(conceptPhase);

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
  resizeObserver.observe(designBoardDemo);
  resizeObserver.observe(developAssemblyDemo);
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

  import("./assets/vendor/laptop-runtime.min.js?v=20260730-3").then(({
    AmbientLight,
    BoxGeometry,
    CatmullRomCurve3,
    CanvasTexture,
    DirectionalLight,
    Group,
    Mesh,
    MeshBasicMaterial,
    MeshStandardMaterial,
    OrthographicCamera,
    PlaneGeometry,
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

    const createNoteTexture = ({
      background,
      title,
      subtitle,
      accent,
      kind,
    }) => {
      const noteCanvas = document.createElement("canvas");
      noteCanvas.width = 512;
      noteCanvas.height = 320;
      const context = noteCanvas.getContext("2d");
      context.fillStyle = background;
      context.fillRect(0, 0, noteCanvas.width, noteCanvas.height);
      context.fillStyle = accent;
      context.fillRect(0, 0, 18, noteCanvas.height);
      context.fillStyle = "#242522";
      context.font = "700 34px Arial, sans-serif";
      context.fillText(title, 48, 64);
      context.fillStyle = "rgba(36, 37, 34, 0.62)";
      context.font = "600 18px Arial, sans-serif";
      context.fillText(subtitle, 48, 94);

      if (kind === "flow") {
        context.strokeStyle = "#535650";
        context.lineWidth = 6;
        context.beginPath();
        context.moveTo(72, 196);
        context.lineTo(205, 150);
        context.lineTo(334, 208);
        context.lineTo(444, 158);
        context.stroke();
        [72, 205, 334, 444].forEach((x, index) => {
          const y = [196, 150, 208, 158][index];
          context.fillStyle = index === 2 ? accent : "#f7f2df";
          context.beginPath();
          context.arc(x, y, 18, 0, Math.PI * 2);
          context.fill();
          context.strokeStyle = "#535650";
          context.lineWidth = 4;
          context.stroke();
        });
      } else if (kind === "wireframe") {
        context.strokeStyle = "#565852";
        context.lineWidth = 5;
        context.strokeRect(58, 124, 394, 154);
        context.beginPath();
        context.moveTo(58, 158);
        context.lineTo(452, 158);
        context.moveTo(172, 158);
        context.lineTo(172, 278);
        context.stroke();
        context.fillStyle = accent;
        context.fillRect(196, 184, 214, 38);
        context.fillStyle = "rgba(86, 88, 82, 0.45)";
        context.fillRect(196, 236, 96, 18);
        context.fillRect(304, 236, 106, 18);
      } else if (kind === "type") {
        context.fillStyle = "#343632";
        context.font = "700 92px Georgia, serif";
        context.fillText("Aa", 58, 232);
        context.fillStyle = accent;
        [0, 1, 2, 3].forEach((index) => {
          context.fillRect(230, 142 + index * 34, 192 - index * 25, 12);
        });
      } else {
        context.strokeStyle = "#50524d";
        context.lineWidth = 8;
        context.beginPath();
        context.arc(116, 201, 58, 0, Math.PI * 2);
        context.stroke();
        context.strokeStyle = accent;
        context.beginPath();
        context.moveTo(82, 201);
        context.lineTo(108, 226);
        context.lineTo(154, 174);
        context.stroke();
        context.fillStyle = "#343632";
        context.font = "700 34px Arial, sans-serif";
        context.fillText("7.2 : 1", 222, 198);
        context.fillStyle = "rgba(36, 37, 34, 0.62)";
        context.font = "600 18px Arial, sans-serif";
        context.fillText("CONTRAST PASSES", 222, 228);
      }

      const texture = new CanvasTexture(noteCanvas);
      texture.colorSpace = SRGBColorSpace;
      return texture;
    };

    designRenderer = new WebGLRenderer({
      alpha: true,
      antialias: true,
      canvas: designBoardDemo,
      powerPreference: "high-performance",
    });
    designRenderer.setClearColor(0x000000, 0);
    designRenderer.outputColorSpace = SRGBColorSpace;

    designScene = new Scene();
    designCamera = new OrthographicCamera(-2, 2, 1.3, -1.3, 0.1, 10);
    designCamera.position.z = 5;

    const designBoardFrame = new Mesh(
      new BoxGeometry(3.55, 2.1, 0.14),
      new MeshStandardMaterial({
        color: 0x73777d,
        metalness: 0.7,
        roughness: 0.52,
      }),
    );
    const designBoardSurface = new Mesh(
      new PlaneGeometry(3.34, 1.89),
      new MeshStandardMaterial({
        color: 0x1c1e1c,
        metalness: 0.05,
        roughness: 0.94,
      }),
    );
    designBoardSurface.position.z = 0.075;
    designScene.add(designBoardFrame, designBoardSurface);

    const notePinGeometry = new SphereGeometry(0.072, 20, 14);
    const noteSpecs = [
      {
        title: "USER FLOW",
        subtitle: "UX / JOURNEY",
        background: "#efe2a8",
        accent: "#e16030",
        kind: "flow",
        x: -1.03,
        y: 0.47,
        rotation: -0.045,
        entryX: -2.2,
        entryY: 0.65,
      },
      {
        title: "HOMEPAGE",
        subtitle: "UI / WIREFRAME",
        background: "#dce7e3",
        accent: "#4f70bb",
        kind: "wireframe",
        x: 0.87,
        y: 0.49,
        rotation: 0.05,
        entryX: 2.25,
        entryY: 0.5,
      },
      {
        title: "TYPE + SPACE",
        subtitle: "UI / SYSTEM",
        background: "#ece8dc",
        accent: "#d15a36",
        kind: "type",
        x: -0.86,
        y: -0.47,
        rotation: 0.035,
        entryX: -2.1,
        entryY: -0.7,
      },
      {
        title: "ACCESSIBILITY",
        subtitle: "UX / CHECK",
        background: "#d8ded0",
        accent: "#5b7160",
        kind: "access",
        x: 0.96,
        y: -0.45,
        rotation: -0.04,
        entryX: 2.2,
        entryY: -0.65,
      },
    ];
    designNotes = noteSpecs.map((spec, index) => {
      const group = new Group();
      const note = new Mesh(
        new PlaneGeometry(1.32, 0.82),
        new MeshStandardMaterial({
          color: 0xffffff,
          map: createNoteTexture(spec),
          metalness: 0,
          roughness: 0.88,
        }),
      );
      const pin = new Mesh(
        notePinGeometry,
        new MeshStandardMaterial({
          color: index % 2 === 0 ? 0xff5a24 : 0xfff3d2,
          metalness: 0.12,
          roughness: 0.28,
        }),
      );
      pin.position.set(0.5, 0.3, 0.11);
      group.add(note, pin);
      designScene.add(group);
      return {
        group,
        pin,
        targetX: spec.x,
        targetY: spec.y,
        targetRotation: spec.rotation,
        entryX: spec.entryX,
        entryY: spec.entryY,
      };
    });

    const designAmbientLight = new AmbientLight(0xf2eee4, 1.8);
    const designKeyLight = new DirectionalLight(0xffffff, 3.8);
    const designWarmLight = new DirectionalLight(0xff7a45, 0.7);
    designKeyLight.position.set(-2, 3, 5);
    designWarmLight.position.set(4, -1, 3);
    designScene.add(designAmbientLight, designKeyLight, designWarmLight);

    const createModuleTexture = (label, variant = 0) => {
      const moduleCanvas = document.createElement("canvas");
      moduleCanvas.width = 512;
      moduleCanvas.height = 192;
      const context = moduleCanvas.getContext("2d");
      context.clearRect(0, 0, moduleCanvas.width, moduleCanvas.height);
      context.fillStyle = "rgba(255, 255, 255, 0.9)";
      context.font = "700 40px ui-monospace, monospace";
      context.fillText(label, 32, 62);
      context.fillStyle = "rgba(255, 255, 255, 0.34)";
      const widths = variant % 2 === 0
        ? [380, 284, 334]
        : [310, 402, 244];
      widths.forEach((width, index) => {
        context.fillRect(32, 92 + index * 27, width, 8);
      });
      context.fillStyle = "#ff7a45";
      context.fillRect(452, 30, 24, 24);
      const texture = new CanvasTexture(moduleCanvas);
      texture.colorSpace = SRGBColorSpace;
      return texture;
    };

    developRenderer = new WebGLRenderer({
      alpha: true,
      antialias: true,
      canvas: developAssemblyDemo,
      powerPreference: "high-performance",
    });
    developRenderer.setClearColor(0x000000, 0);
    developRenderer.outputColorSpace = SRGBColorSpace;

    developScene = new Scene();
    developCamera = new OrthographicCamera(-2, 2, 1.3, -1.3, 0.1, 10);
    developCamera.position.z = 5;

    const developFrame = new Mesh(
      new BoxGeometry(3.55, 2.1, 0.12),
      new MeshStandardMaterial({
        color: 0x111419,
        metalness: 0.45,
        roughness: 0.7,
      }),
    );
    developGlowMaterial = new MeshBasicMaterial({
      color: 0x080a0d,
    });
    const developGlowPanel = new Mesh(
      new PlaneGeometry(3.3, 1.86),
      developGlowMaterial,
    );
    developGlowPanel.position.z = 0.07;
    developScene.add(developFrame, developGlowPanel);

    const blockSpecs = [
      { label: "APP / BUILD", w: 3.12, h: 0.27, x: 0, y: 0.76, from: [-2.6, 1.7, 1.2] },
      { label: "NAV", w: 0.6, h: 1.08, x: -1.25, y: -0.05, from: [-2.7, -1.3, 0.9] },
      { label: "</>", w: 2.38, h: 0.46, x: 0.38, y: 0.34, from: [2.8, 1.45, 1.1] },
      { label: "{ }", w: 0.7, h: 0.44, x: -0.47, y: -0.31, from: [-2.3, 1.55, 0.8] },
      { label: "API", w: 0.7, h: 0.44, x: 0.33, y: -0.31, from: [2.5, -1.55, 1.25] },
      { label: "UI", w: 0.7, h: 0.44, x: 1.13, y: -0.31, from: [2.7, 0.3, 0.75] },
      { label: "BUILD OK", w: 2.38, h: 0.17, x: 0.38, y: -0.75, from: [-2.5, -1.65, 1.05] },
    ];
    developBlocks = blockSpecs.map((spec, index) => {
      const group = new Group();
      const material = new MeshStandardMaterial({
        color: index % 3 === 1 ? 0x4f5359 : 0x73777d,
        emissive: 0xff5a24,
        emissiveIntensity: 0.025,
        metalness: 0.7,
        roughness: 0.52,
      });
      const block = new Mesh(
        new BoxGeometry(spec.w, spec.h, 0.16),
        material,
      );
      const labelPlate = new Mesh(
        new PlaneGeometry(spec.w * 0.86, Math.max(0.08, spec.h * 0.62)),
        new MeshBasicMaterial({
          map: createModuleTexture(spec.label, index),
          transparent: true,
          toneMapped: false,
        }),
      );
      labelPlate.position.z = 0.083;
      group.add(block, labelPlate);
      developScene.add(group);
      return {
        group,
        material,
        from: { x: spec.from[0], y: spec.from[1], z: spec.from[2] },
        target: { x: spec.x, y: spec.y, z: 0.18 },
        rotation: {
          x: (index % 2 === 0 ? 1 : -1) * 0.28,
          y: (index % 3 - 1) * 0.38,
          z: (index % 2 === 0 ? -1 : 1) * 0.24,
        },
      };
    });

    const developAmbientLight = new AmbientLight(0xe8e7e1, 1.55);
    const developKeyLight = new DirectionalLight(0xffffff, 4.2);
    const developFillLight = new DirectionalLight(0x8791d8, 0.95);
    developPulseLight = new PointLight(0xff5a24, 0, 2.6);
    developKeyLight.position.set(-2, 3.5, 5);
    developFillLight.position.set(4, -1, 3);
    developScene.add(
      developAmbientLight,
      developKeyLight,
      developFillLight,
      developPulseLight,
    );

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

    const laptopTrackMetal = new Mesh(
      new TubeGeometry(laptopThreeCurve, 320, 0.135, 20, true),
      new MeshStandardMaterial({
        color: 0x73777d,
        metalness: 0.7,
        roughness: 0.52,
      }),
    );
    laptopThreeScene.add(laptopTrackMetal);

    const laptopAmbientLight = new AmbientLight(0xe8e7e1, 1.8);
    const laptopKeyLight = new DirectionalLight(0xffffff, 4.6);
    const laptopWarmRimLight = new DirectionalLight(0xff5a24, 0.72);
    const laptopFillLight = new DirectionalLight(0x8791d8, 0.8);
    laptopKeyLight.position.set(-2.5, 3.5, 5);
    laptopWarmRimLight.position.set(4, 1, 3);
    laptopFillLight.position.set(-4, -1, 3);
    laptopThreeScene.add(
      laptopAmbientLight,
      laptopKeyLight,
      laptopWarmRimLight,
      laptopFillLight,
    );

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
    renderDesignDemo(0.58);
    renderDevelopDemo(0.58);
    requestMotionFrame();
  }).catch((error) => {
    console.error("Capability motion scenes failed to initialise.", error);
    threeDemo.classList.add("is-unavailable");
    designBoardDemo.classList.add("is-unavailable");
    developAssemblyDemo.classList.add("is-unavailable");
    laptopThreeDemo.classList.add("is-unavailable");
  });
}
