import { createMotionScenes } from "./scenes.js";
import { clamp01, getLoopPoint, smoothStep } from "../lib/motion.js";

const motionStudy = document.querySelector("[data-motion-study]");

if (motionStudy) {
  const svgDemo = motionStudy.querySelector("[data-track-svg]");
  const canvasDemo = motionStudy.querySelector("[data-track-canvas]");
  const threeDemo = motionStudy.querySelector("[data-track-three]");
  const designBoardDemo = motionStudy.querySelector("[data-design-board]");
  const developAssemblyDemo = motionStudy.querySelector("[data-develop-assembly]");
  const laptopThreeDemo = motionStudy.querySelector("[data-track-laptop]");
  const motionRegions = [
    svgDemo,
    canvasDemo,
    threeDemo,
    designBoardDemo,
    developAssemblyDemo,
    laptopThreeDemo,
  ]
    .filter(Boolean)
    .map((element) => element.closest(".capability-card__visual, .motion-approach__stage") || element);
  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const animationDurationMs = 5800;
  const developScrambleTokens = [
    "R",
    "U",
    "F'",
    "L2",
    "D",
    "B'",
    "R2",
    "U'",
    "F2",
    "D'",
    "L",
    "B2",
  ];
  const developTiming = {
    solvedHoldMs: 1500,
    moveMs: 520,
    scrambledHoldMs: 0,
    finalHoldMs: 1500,
  };
  const developCycleDurationMs = developTiming.solvedHoldMs
    + developScrambleTokens.length * developTiming.moveMs
    + developTiming.scrambledHoldMs
    + developScrambleTokens.length * developTiming.moveMs
    + developTiming.finalHoldMs;
  const developCubeStep = 0.7;
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
  let developRig;
  let developCubies = [];
  let developMovePlan = [];
  let developSnapshots = [];
  let developScratchQuaternion;
  let developTurnLight;
  let laptopThreeRenderer;
  let laptopThreeScene;
  let laptopThreeCamera;
  let laptopThreeCurve;
  let laptopThreeBall;
  let laptopThreeBallLight;
  const laptopBallMotion = {
    phase: 0.09,
    lastFrameAt: performance.now(),
    crestSpeed: 0.032,
    gravityEnergy: 0.1,
    minY: -0.78,
    maxY: 0.78,
  };

  const resizeCanvasDemo = () => {
    if (!canvasDemo) return;
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
    if (!canvasDemo) return;
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

  const resizeThreeViewport = (canvas, renderer, camera, viewHeight = 2.65) => {
    if (!canvas || !renderer || !camera) return;
    const bounds = canvas.getBoundingClientRect();
    const width = Math.max(1, bounds.width);
    const height = Math.max(1, bounds.height);
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
    resizeThreeViewport(developAssemblyDemo, developRenderer, developCamera, 4.35);
    resizeThreeViewport(laptopThreeDemo, laptopThreeRenderer, laptopThreeCamera, 3.35);
  };

  const renderThreePrototype = (
    renderer,
    scene,
    camera,
    curve,
    ball,
    ballLight,
    phase,
    ballDepthOffset = 0.12,
    lightDepthOffset = 0.45,
  ) => {
    if (!renderer || !scene || !camera || !curve || !ball) return;
    const point = curve.getPointAt(phase);
    ball.position.copy(point);
    ball.position.z += ballDepthOffset;
    ball.rotation.y = phase * Math.PI * 6;
    if (ballLight) {
      ballLight.position.copy(ball.position);
      ballLight.position.z += lightDepthOffset;
    }
    renderer.render(scene, camera);
  };

  const advanceLaptopBall = (now, shouldAnimate) => {
    if (!shouldAnimate || !laptopThreeCurve) {
      laptopBallMotion.lastFrameAt = now;
      return laptopBallMotion.phase;
    }

    const deltaSeconds = Math.min(
      1 / 20,
      Math.max(0, (now - laptopBallMotion.lastFrameAt) / 1000),
    );
    laptopBallMotion.lastFrameAt = now;

    const point = laptopThreeCurve.getPointAt(laptopBallMotion.phase);
    const heightRange = Math.max(0.001, laptopBallMotion.maxY - laptopBallMotion.minY);
    const dropFromCrest = clamp01((laptopBallMotion.maxY - point.y) / heightRange);
    const speed = Math.sqrt(
      laptopBallMotion.crestSpeed ** 2
        + laptopBallMotion.gravityEnergy * dropFromCrest,
    );

    laptopBallMotion.phase = (laptopBallMotion.phase + speed * deltaSeconds) % 1;
    return laptopBallMotion.phase;
  };

  const renderThreeDemos = (phase, laptopPhase = phase) => {
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
      laptopPhase,
      0,
      0.08,
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
    if (
      !developRenderer
      || !developScene
      || !developCamera
      || !developRig
      || !developSnapshots.length
    ) return;

    const scrambleMoveCount = developScrambleTokens.length;
    const scrambleDuration = scrambleMoveCount * developTiming.moveMs;
    const solveStart = developTiming.solvedHoldMs
      + scrambleDuration
      + developTiming.scrambledHoldMs;
    const solveDuration = scrambleMoveCount * developTiming.moveMs;
    const elapsed = clamp01(phase) * developCycleDurationMs;
    let snapshotIndex = 0;
    let activeMoveIndex = -1;
    let moveProgress = 0;

    if (elapsed < developTiming.solvedHoldMs) {
      snapshotIndex = 0;
    } else if (elapsed < developTiming.solvedHoldMs + scrambleDuration) {
      const localTime = elapsed - developTiming.solvedHoldMs;
      activeMoveIndex = Math.floor(localTime / developTiming.moveMs);
      moveProgress = (localTime % developTiming.moveMs) / developTiming.moveMs;
      snapshotIndex = activeMoveIndex;
    } else if (elapsed < solveStart) {
      snapshotIndex = scrambleMoveCount;
    } else if (elapsed < solveStart + solveDuration) {
      const localTime = elapsed - solveStart;
      const solveMoveIndex = Math.floor(localTime / developTiming.moveMs);
      activeMoveIndex = scrambleMoveCount + solveMoveIndex;
      moveProgress = (localTime % developTiming.moveMs) / developTiming.moveMs;
      snapshotIndex = activeMoveIndex;
    } else {
      snapshotIndex = developMovePlan.length;
    }

    const snapshot = developSnapshots[snapshotIndex];
    const activeMove = developMovePlan[activeMoveIndex];
    const easedProgress = activeMove ? smoothStep(moveProgress) : 0;

    if (activeMove) {
      developScratchQuaternion.setFromAxisAngle(
        activeMove.axisVector,
        activeMove.angle * easedProgress,
      );
    }

    developCubies.forEach((cubie, index) => {
      const state = snapshot[index];
      const isTurning = activeMove
        && Math.round(state.position[activeMove.axisName]) === activeMove.layer;
      cubie.group.position.copy(state.position);
      cubie.group.quaternion.copy(state.quaternion);
      if (isTurning) {
        cubie.group.position.applyQuaternion(developScratchQuaternion);
        cubie.group.quaternion.premultiply(developScratchQuaternion);
      }
      cubie.group.position.multiplyScalar(developCubeStep);
    });

    const loopAngle = phase * Math.PI * 2;
    developRig.rotation.x = -0.04 + Math.cos(loopAngle) * 0.025;
    developRig.rotation.y = -0.12 + Math.sin(loopAngle) * 0.065;
    developRig.position.y = Math.sin(loopAngle) * 0.025;

    if (developTurnLight) {
      const turnEnergy = activeMove ? Math.sin(moveProgress * Math.PI) : 0;
      developTurnLight.intensity = turnEnergy * 5.4;
      developTurnLight.position.set(0, 0, 1.7);
      if (activeMove) {
        developTurnLight.position[activeMove.axisName] =
          activeMove.layer * developCubeStep * 1.15;
      }
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
    const developPhase = shouldAnimate
      ? (elapsed % developCycleDurationMs) / developCycleDurationMs
      : 0;
    const laptopPhase = advanceLaptopBall(now, shouldAnimate);

    const conceptPhase = shouldAnimate ? phase : 0.58;
    renderCanvasDemo(phase);
    renderThreeDemos(phase, laptopPhase);
    renderDesignDemo(conceptPhase);
    renderDevelopDemo(developPhase);

    if (shouldAnimate) animationFrame = window.requestAnimationFrame(renderFrame);
  };

  const requestMotionFrame = () => {
    if (!animationFrame) animationFrame = window.requestAnimationFrame(renderFrame);
  };

  const updateMotionState = () => {
    const shouldAnimate = studyIsVisible
      && !document.hidden
      && !reducedMotionQuery.matches;
    laptopBallMotion.lastFrameAt = performance.now();

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
  if (canvasDemo) resizeObserver.observe(canvasDemo);
  if (threeDemo) resizeObserver.observe(threeDemo);
  if (designBoardDemo) resizeObserver.observe(designBoardDemo);
  resizeObserver.observe(developAssemblyDemo);
  resizeObserver.observe(laptopThreeDemo);

  const updateStudyVisibility = () => {
    const isVisible = motionRegions.some((region) => {
      const bounds = region.getBoundingClientRect();
      return bounds.bottom >= -160 && bounds.top <= window.innerHeight + 160;
    });
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


  createMotionScenes({
    designBoardDemo,
    developAssemblyDemo,
    developCubeStep,
    developScrambleTokens,
    laptopBallMotion,
    laptopThreeDemo,
    threeDemo,
  }).then((scenes) => {
    ({
      designCamera,
      designNotes,
      designRenderer,
      designScene,
      developCamera,
      developCubies,
      developMovePlan,
      developRenderer,
      developRig,
      developScene,
      developScratchQuaternion,
      developSnapshots,
      developTurnLight,
      laptopThreeBall,
      laptopThreeBallLight,
      laptopThreeCamera,
      laptopThreeCurve,
      laptopThreeRenderer,
      laptopThreeScene,
      threeBall,
      threeBallLight,
      threeCamera,
      threeCurve,
      threeRenderer,
      threeScene,
    } = scenes);
    resizeThreeDemos();
    renderThreeDemos(0.09);
    renderDesignDemo(0.58);
    renderDevelopDemo(0);
    requestMotionFrame();
  }).catch((error) => {
    console.error("Capability motion scenes failed to initialise.", error);
    threeDemo?.classList.add("is-unavailable");
    designBoardDemo?.classList.add("is-unavailable");
    developAssemblyDemo.classList.add("is-unavailable");
    laptopThreeDemo.classList.add("is-unavailable");
  });
}
