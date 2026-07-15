const title = document.querySelector(".hero__title span");
const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

function scrambleText(element) {
  const text = element.textContent.trim();

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  element.textContent = "";

  const letters = [...text].map((character) => {
    const letter = document.createElement("span");
    letter.className = "scramble-character";
    letter.setAttribute("aria-hidden", "true");
    const isSpace = character === " ";
    if (isSpace) letter.classList.add("scramble-space");
    const finalCharacter = isSpace ? "" : character;
    letter.classList.add("is-resolved");
    const glyph = document.createElement("span");
    glyph.className = "scramble-glyph";
    glyph.textContent = finalCharacter;
    letter.appendChild(glyph);
    element.appendChild(letter);

    // Preserve the natural width of each final glyph, then add one shared
    // visual gap so the finished word reads like normal typesetting.
    const finalWidth = isSpace ? parseFloat(getComputedStyle(element).fontSize) * 0.3 : glyph.getBoundingClientRect().width;
    const gap = parseFloat(getComputedStyle(element).fontSize) * 0.06;
    letter.style.width = `${finalWidth + gap}px`;
    letter.style.textAlign = "left";
    letter.classList.remove("is-resolved");

    const state = {
      character,
      letter,
      glyph,
      finalWidth,
      resolveAt: isSpace ? 0 : randomBetween(10, 42),
    };

    if (!isSpace) setRandomGlyph(state);

    return state;
  });

  const frameDelay = 42;
  let currentChange = 0;
  let lastChange = 0;

  function setRandomGlyph(letter) {
    letter.glyph.textContent = characters[randomBetween(0, characters.length - 1)];
    letter.glyph.style.transform = "none";
    const randomWidth = letter.glyph.getBoundingClientRect().width;
    const scale = Math.min(1, letter.finalWidth / randomWidth);
    letter.glyph.style.transform = `scaleX(${scale})`;
  }

  function animate(now) {
    if (now - lastChange < frameDelay) {
      window.requestAnimationFrame(animate);
      return;
    }

    lastChange = now;
    currentChange += 1;

    letters.forEach((letter) => {
      if (letter.resolveAt <= currentChange) {
        letter.glyph.textContent = letter.character === " " ? "" : letter.character;
        letter.glyph.style.transform = "none";
        letter.letter.classList.add("is-resolved");
      }
    });

    const unresolved = letters.filter(({ resolveAt }) => resolveAt > currentChange);

    if (!unresolved.length) return;

    const active = unresolved[randomBetween(0, unresolved.length - 1)];
    setRandomGlyph(active);

    window.requestAnimationFrame(animate);
  }

  window.requestAnimationFrame(animate);
}

if (title) {
  if (document.fonts?.ready) {
    document.fonts.ready.then(() => scrambleText(title));
  } else {
    scrambleText(title);
  }
}

const timeline = document.querySelector("[data-timeline]");

if (timeline) {
  const events = [...timeline.querySelectorAll(".timeline-event")];
  const progress = timeline.querySelector(".timeline__progress");
  let scrollFrame;

  const updateTimeline = () => {
    const bounds = timeline.getBoundingClientRect();
    const travel = Math.max(1, bounds.height);
    const viewportPoint = window.innerHeight * 0.55;
    const progressAmount = Math.min(100, Math.max(0, ((viewportPoint - bounds.top) / travel) * 100));
    progress.style.height = `${progressAmount}%`;
    scrollFrame = undefined;
  };

  const revealEvents = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("is-visible");
    });
  }, { threshold: 0.25, rootMargin: "0px 0px -8% 0px" });

  events.forEach((event) => revealEvents.observe(event));

  const onScroll = () => {
    if (!scrollFrame) scrollFrame = window.requestAnimationFrame(updateTimeline);
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", updateTimeline);
  updateTimeline();
}

const statementCanvas = document.querySelector(".statement__canvas");

if (statementCanvas) {
  const context = statementCanvas.getContext("2d");
  let canvasWidth = 0;
  let canvasHeight = 0;
  let canvasScale = 1;
  let canvasFrame;
  let reduceCanvasMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const circuitPaths = [
    [[0.38, 0.55], [0.48, 0.55], [0.53, 0.49], [0.63, 0.49], [0.69, 0.43], [0.86, 0.43], [1.02, 0.43]],
    [[0.4, 0.75], [0.5, 0.75], [0.56, 0.68], [0.67, 0.68], [0.71, 0.59], [0.92, 0.59], [1.02, 0.59]],
    [[0.48, 0.24], [0.55, 0.24], [0.61, 0.31], [0.72, 0.31], [0.77, 0.37], [0.99, 0.37]],
    [[0.6, 0.55], [0.6, 0.38], [0.6, 0.19], [0.6, 0.02]],
    [[0.67, 0.55], [0.67, 0.79], [0.67, 0.94], [0.82, 0.94], [0.88, 0.87], [1.02, 0.87]],
    [[0.53, 0.61], [0.47, 0.69], [0.47, 0.84], [0.39, 0.91], [0.24, 0.91], [0.16, 0.84], [0.04, 0.84]],
    [[0.54, 0.45], [0.47, 0.36], [0.39, 0.36], [0.32, 0.29], [0.32, 0.16], [0.24, 0.09], [0.13, 0.09]],
    [[0.72, 0.55], [0.78, 0.49], [0.9, 0.49], [0.97, 0.42], [1.03, 0.42]],
  ];

  const nodes = [
    [0.6, 0.02, 1], [0.6, 0.19, 0.9], [0.48, 0.24, 0.5], [0.72, 0.31, 0.55],
    [0.67, 0.79, 0.7], [0.82, 0.94, 0.9], [0.24, 0.91, 0.8], [0.04, 0.84, 0.8],
    [0.32, 0.16, 0.5], [0.13, 0.09, 0.8], [0.86, 0.43, 0.7], [0.92, 0.59, 0.85],
    [0.98, 0.37, 0.65], [0.97, 0.42, 0.8],
  ];

  const rings = [
    [0.78, 0.25, 0.075], [0.89, 0.56, 0.05], [0.83, 0.77, 0.04],
    [0.39, 0.88, 0.1], [0.58, 0.34, 0.06], [0.72, 0.16, 0.045],
  ];

  function resizeStatementCanvas() {
    const bounds = statementCanvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvasWidth = bounds.width;
    canvasHeight = bounds.height;
    canvasScale = Math.min(canvasWidth, canvasHeight) / 600;
    statementCanvas.width = Math.floor(canvasWidth * dpr);
    statementCanvas.height = Math.floor(canvasHeight * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function point([x, y]) {
    return [x * canvasWidth, y * canvasHeight];
  }

  function drawPath(path, color, width = 1, dash = []) {
    context.beginPath();
    context.setLineDash(dash);
    context.lineWidth = width;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = color;
    const points = path.map(point);
    context.moveTo(points[0][0], points[0][1]);
    for (let index = 1; index < points.length; index += 1) {
      const [x, y] = points[index];
      const [nextX, nextY] = points[index + 1] || points[index];
      const midpointX = (x + nextX) / 2;
      const midpointY = (y + nextY) / 2;
      context.lineTo(midpointX, midpointY);
      context.quadraticCurveTo(x, y, midpointX, midpointY);
    }
    const lastPoint = points[points.length - 1];
    context.lineTo(lastPoint[0], lastPoint[1]);
    context.stroke();
    context.setLineDash([]);
  }

  function drawNode(x, y, radius, alpha, time) {
    const pulse = reduceCanvasMotion ? 1 : 0.85 + Math.sin(time * 0.0015 + x * 9) * 0.15;
    context.beginPath();
    context.arc(x, y, radius * 4 * canvasScale, 0, Math.PI * 2);
    context.fillStyle = `rgba(232, 231, 225, ${alpha * 0.06 * pulse})`;
    context.fill();
    context.beginPath();
    context.arc(x, y, radius * canvasScale, 0, Math.PI * 2);
    context.fillStyle = `rgba(245, 248, 242, ${alpha * pulse})`;
    context.fill();
  }

  function drawRing(x, y, radius, time) {
    const [centerX, centerY] = point([x, y]);
    const actualRadius = radius * canvasWidth;
    context.beginPath();
    context.arc(centerX, centerY, actualRadius, 0, Math.PI * 2);
    context.lineWidth = 1;
    context.strokeStyle = "rgba(232, 231, 225, 0.18)";
    context.stroke();
    context.beginPath();
    context.arc(centerX, centerY, actualRadius * 0.11, 0, Math.PI * 2);
    context.fillStyle = "rgba(232, 231, 225, 0.82)";
    context.fill();
    const orbit = (time * 0.00015 + x) % (Math.PI * 2);
    drawNode(centerX + Math.cos(orbit) * actualRadius, centerY + Math.sin(orbit) * actualRadius, 1.2, 0.8, time);
  }

  function drawCore(time) {
    const coreX = canvasWidth < 700 ? 0.76 : 0.61;
    const [centerX, centerY] = point([coreX, 0.55]);
    const pulse = reduceCanvasMotion ? 1 : 1 + Math.sin(time * 0.0012) * 0.035;
    const radius = Math.min(canvasWidth, canvasHeight) * 0.09 * pulse;
    const glow = context.createRadialGradient(centerX, centerY, radius * 0.2, centerX, centerY, radius * 2.8);
    glow.addColorStop(0, "rgba(255, 255, 255, 0.18)");
    glow.addColorStop(0.24, "rgba(225, 234, 226, 0.08)");
    glow.addColorStop(1, "rgba(225, 234, 226, 0)");
    context.fillStyle = glow;
    context.beginPath();
    context.arc(centerX, centerY, radius * 2.8, 0, Math.PI * 2);
    context.fill();
    context.beginPath();
    context.arc(centerX, centerY, radius, 0, Math.PI * 2);
    context.lineWidth = 1.5;
    context.strokeStyle = "rgba(248, 250, 245, 0.92)";
    context.shadowColor = "rgba(248, 250, 245, 0.9)";
    context.shadowBlur = 15 * canvasScale;
    context.stroke();
    context.shadowBlur = 0;
    context.beginPath();
    context.arc(centerX, centerY, radius * 1.26, 0, Math.PI * 2);
    context.setLineDash([1, 5]);
    context.lineWidth = 1;
    context.strokeStyle = "rgba(232, 231, 225, 0.32)";
    context.stroke();
    context.setLineDash([]);
    drawNode(centerX, centerY, 1.7, 1, time);
  }

  function drawCircuitScene(time = 0) {
    context.clearRect(0, 0, canvasWidth, canvasHeight);
    const visualFade = context.createLinearGradient(canvasWidth * 0.35, 0, canvasWidth, 0);
    visualFade.addColorStop(0, "rgba(11, 13, 12, 0)");
    visualFade.addColorStop(0.2, "rgba(11, 13, 12, 0.3)");
    visualFade.addColorStop(1, "rgba(11, 13, 12, 0)");
    context.fillStyle = visualFade;
    context.fillRect(canvasWidth * 0.35, 0, canvasWidth * 0.65, canvasHeight);

    circuitPaths.forEach((path, index) => {
      drawPath(path, index % 3 === 0 ? "rgba(232, 231, 225, 0.38)" : "rgba(232, 231, 225, 0.17)", index % 3 === 0 ? 1.1 : 0.7);
      if (index % 2 === 0) drawPath(path, "rgba(232, 231, 225, 0.24)", 0.6, [1, 6]);
    });

    rings.forEach(([x, y, radius]) => drawRing(x, y, radius, time));
    nodes.forEach(([x, y, alpha]) => {
      const [nodeX, nodeY] = point([x, y]);
      drawNode(nodeX, nodeY, 1.2, alpha, time);
    });

    const centralX = canvasWidth * (canvasWidth < 700 ? 0.76 : 0.61);
    const centralY = canvasHeight * 0.55;
    const movingDot = (time * 0.00005) % 1;
    drawNode(centralX + canvasWidth * 0.32 * movingDot, centralY - canvasHeight * 0.12 * movingDot, 1.2, 0.85, time);
    drawCore(time);

    if (!reduceCanvasMotion) canvasFrame = window.requestAnimationFrame(drawCircuitScene);
  }

  resizeStatementCanvas();
  drawCircuitScene();
  window.addEventListener("resize", resizeStatementCanvas);
  window.matchMedia("(prefers-reduced-motion: reduce)").addEventListener?.("change", (event) => {
    reduceCanvasMotion = event.matches;
    if (!canvasFrame) drawCircuitScene();
  });
}
