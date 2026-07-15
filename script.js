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
  const referenceWidth = 532;
  const referenceHeight = 629;
  const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  let canvasWidth = 0;
  let canvasHeight = 0;
  let designScale = 1;
  let designLeft = 0;
  let designTop = 0;
  let animationFrame;
  let reducedMotion = motionPreference.matches;
  let circuitVisible = false;

  const routes = [
    { alpha: 0.34, width: 0.75, path: [[-40, 486], [75, 486], [104, 477], [123, 447], [128, 405], [145, 379], [178, 370], [250, 370]] },
    { alpha: 0.18, width: 0.55, path: [[-30, 485], [78, 485], [110, 469], [125, 430], [129, 392], [154, 365], [197, 360], [250, 360]] },
    { alpha: 0.26, width: 0.65, path: [[124, 371], [207, 371], [242, 369], [278, 369], [365, 369], [407, 370], [690, 370]] },
    { alpha: 0.18, width: 0.55, path: [[118, 380], [205, 380], [248, 375], [364, 375], [409, 379], [690, 379]] },
    { alpha: 0.16, width: 0.5, path: [[128, 390], [212, 390], [248, 383], [368, 383], [416, 389], [690, 389]] },
    { alpha: 0.2, width: 0.55, path: [[138, 350], [191, 350], [220, 356], [250, 360]] },
    { alpha: 0.25, width: 0.65, path: [[203, 261], [203, 320], [208, 345], [224, 360], [250, 368]] },
    { alpha: 0.12, width: 0.5, path: [[192, 281], [192, 326], [201, 352], [224, 370]] },
    { alpha: 0.13, width: 0.5, path: [[204, 261], [218, 232], [246, 209], [273, 208]] },
    { alpha: 0.16, width: 0.55, path: [[333, 208], [356, 208], [382, 224], [402, 242], [402, 348], [376, 370]] },
    { alpha: 0.24, width: 0.65, path: [[402, 52], [402, 182], [402, 224], [402, 333], [397, 350], [375, 370]] },
    { alpha: 0.17, width: 0.5, path: [[391, 224], [391, 326], [386, 347], [370, 363]] },
    { alpha: 0.2, width: 0.55, path: [[402, 224], [560, 224], [590, 216], [620, 195], [690, 195]] },
    { alpha: 0.17, width: 0.5, path: [[402, 258], [439, 258], [450, 257], [510, 257], [532, 249], [548, 224], [690, 224]] },
    { alpha: 0.14, width: 0.5, path: [[402, 282], [436, 282], [452, 281], [690, 281]] },
    { alpha: 0.18, width: 0.55, path: [[402, 346], [424, 345], [444, 324], [454, 312]] },
    { alpha: 0.18, width: 0.55, path: [[496, 302], [536, 302], [572, 290], [690, 290]] },
    { alpha: 0.2, width: 0.55, path: [[402, 395], [420, 407], [445, 409], [690, 409]] },
    { alpha: 0.18, width: 0.55, path: [[402, 421], [429, 421], [448, 437], [454, 446]] },
    { alpha: 0.17, width: 0.5, path: [[496, 446], [544, 446], [572, 456], [690, 456]] },
    { alpha: 0.28, width: 0.7, path: [[402, 392], [402, 479], [404, 500], [418, 514], [440, 522], [449, 522], [470, 527], [486, 545], [489, 565], [489, 581], [690, 581]] },
    { alpha: 0.13, width: 0.5, path: [[414, 392], [414, 470], [416, 493], [430, 504], [455, 504], [478, 513]] },
    { alpha: 0.14, width: 0.5, path: [[319, 511], [326, 540], [346, 566], [375, 579], [455, 579], [476, 568], [489, 547]] },
    { alpha: 0.12, width: 0.5, path: [[281, 445], [281, 492], [281, 552]] },
    { alpha: 0.12, width: 0.5, path: [[202, 394], [202, 486]] },
  ];

  const satellites = [
    { x: 402, y: 138, radius: 38, alpha: 0.33, inner: 9 },
    { x: 303, y: 208, radius: 29, alpha: 0.09, inner: 0 },
    { x: 475, y: 302, radius: 21, alpha: 0.12, inner: 7 },
    { x: 475, y: 446, radius: 21, alpha: 0.15, inner: 7 },
    { x: 202, y: 558, radius: 52, alpha: 0.1, inner: 11 },
  ];

  const fixedNodes = [
    [402, 52, 1.8, 0.45], [402, 176, 1.3, 0.95], [402, 239, 1.5, 0.88],
    [402, 258, 1.4, 0.52], [402, 289, 2.1, 0.88], [402, 315, 1.45, 0.7],
    [402, 346, 1.45, 0.7], [415, 370, 3.6, 0.9], [508, 370, 3.6, 0.9],
    [202, 261, 1.5, 0.78], [202, 290, 1.7, 0.75], [202, 323, 1.25, 0.76],
    [191, 487, 1.4, 0.74], [202, 487, 1.5, 0.9], [202, 508, 1.4, 0.67],
    [489, 565, 1.25, 0.65], [489, 581, 1.5, 0.72], [75, 486, 1.2, 0.66],
    [288, 179, 1.2, 0.48], [275, 209, 1.05, 0.78], [304, 237, 0.9, 0.28],
    [350, 240, 0.8, 0.28], [434, 321, 1.05, 0.58], [508, 258, 1.1, 0.55],
  ];

  function resizeStatementCanvas() {
    const bounds = statementCanvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvasWidth = bounds.width;
    canvasHeight = bounds.height;
    statementCanvas.width = Math.round(canvasWidth * dpr);
    statementCanvas.height = Math.round(canvasHeight * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);

    const compact = canvasWidth < 800;
    designScale = canvasHeight / referenceHeight * (compact ? 1 : 0.92);
    const coreScreenX = canvasWidth * (compact ? 0.87 : 0.7);
    const coreScreenY = canvasHeight * 0.56;
    designLeft = coreScreenX - 304 * designScale;
    designTop = coreScreenY - 370 * designScale;
  }

  function roundedRoute(points) {
    const path = new Path2D();
    path.moveTo(points[0][0], points[0][1]);

    for (let index = 1; index < points.length - 1; index += 1) {
      const [x, y] = points[index];
      const [nextX, nextY] = points[index + 1];
      path.quadraticCurveTo(x, y, (x + nextX) / 2, (y + nextY) / 2);
    }

    const last = points[points.length - 1];
    path.lineTo(last[0], last[1]);
    return path;
  }

  function strokeRoute(route, brightness = 1) {
    context.save();
    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = route.width;
    context.strokeStyle = `rgba(226, 232, 228, ${route.alpha * brightness})`;
    context.stroke(roundedRoute(route.path));
    context.restore();
  }

  function drawPoint(x, y, radius, alpha, glow = 0) {
    context.save();
    context.fillStyle = `rgba(247, 249, 246, ${alpha})`;
    if (glow) {
      context.shadowColor = `rgba(247, 249, 246, ${alpha})`;
      context.shadowBlur = glow;
    }
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  function drawSatellites(time) {
    satellites.forEach((satellite, index) => {
      context.beginPath();
      context.arc(satellite.x, satellite.y, satellite.radius, 0, Math.PI * 2);
      context.lineWidth = index === 0 ? 0.8 : 0.55;
      context.strokeStyle = `rgba(226, 232, 228, ${satellite.alpha})`;
      context.stroke();

      if (satellite.inner) {
        context.beginPath();
        context.arc(satellite.x, satellite.y, satellite.inner, 0, Math.PI * 2);
        context.lineWidth = 0.55;
        context.strokeStyle = `rgba(226, 232, 228, ${satellite.alpha * 0.7})`;
        context.stroke();
        drawPoint(satellite.x, satellite.y, 1.8, index === 0 ? 0.9 : 0.72, 4);
      }

      const orbit = time * (0.00008 + index * 0.00001) + index * 1.7;
      drawPoint(
        satellite.x + Math.cos(orbit) * satellite.radius,
        satellite.y + Math.sin(orbit) * satellite.radius,
        0.85,
        0.6,
        2,
      );
    });
  }

  function drawMicroDetails() {
    context.save();
    context.fillStyle = "rgba(226, 232, 228, 0.15)";
    for (let row = 0; row < 9; row += 1) {
      for (let column = 0; column < 14; column += 1) {
        if ((row + column * 2) % 5 !== 0) continue;
        context.fillRect(347 + column * 8, 255 + row * 11, 0.7, 0.7);
      }
    }

    context.setLineDash([1, 4]);
    context.lineWidth = 0.5;
    context.strokeStyle = "rgba(226, 232, 228, 0.16)";
    context.beginPath();
    context.moveTo(180, 370);
    context.lineTo(660, 370);
    context.moveTo(281, 395);
    context.lineTo(281, 553);
    context.stroke();
    context.restore();

    [[181, 323], [190, 291], [218, 247], [353, 238], [365, 259], [418, 321], [433, 321], [414, 397], [415, 420], [292, 466], [324, 469], [346, 491]].forEach(([x, y], index) => {
      if (index % 3 === 0) {
        context.fillStyle = "rgba(235, 239, 236, 0.52)";
        context.fillRect(x, y, 1.2, 4);
      } else {
        drawPoint(x, y, 0.7, 0.35);
      }
    });
  }

  function drawCore(time) {
    const pulse = reducedMotion ? 1 : 1 + Math.sin(time * 0.0011) * 0.025;
    const radius = 54 * pulse;

    const outerGlow = context.createRadialGradient(304, 370, 30, 304, 370, 104);
    outerGlow.addColorStop(0, "rgba(255, 255, 255, 0.11)");
    outerGlow.addColorStop(0.42, "rgba(230, 237, 232, 0.055)");
    outerGlow.addColorStop(1, "rgba(230, 237, 232, 0)");
    context.fillStyle = outerGlow;
    context.beginPath();
    context.arc(304, 370, 104, 0, Math.PI * 2);
    context.fill();

    const coreFill = context.createRadialGradient(304, 370, 0, 304, 370, radius);
    coreFill.addColorStop(0, "rgba(22, 27, 24, 0.96)");
    coreFill.addColorStop(0.72, "rgba(13, 16, 14, 0.98)");
    coreFill.addColorStop(1, "rgba(9, 11, 10, 1)");
    context.fillStyle = coreFill;
    context.beginPath();
    context.arc(304, 370, radius - 1.8, 0, Math.PI * 2);
    context.fill();

    context.save();
    context.setLineDash([1, 2.6]);
    context.lineWidth = 0.65;
    context.strokeStyle = "rgba(235, 239, 236, 0.42)";
    context.beginPath();
    context.arc(304, 370, 74, 0, Math.PI * 2);
    context.stroke();
    context.restore();

    context.save();
    context.shadowColor = "rgba(248, 250, 247, 0.92)";
    context.shadowBlur = 11;
    context.strokeStyle = "rgba(250, 251, 249, 0.95)";
    context.lineWidth = 1.55;
    context.beginPath();
    context.arc(304, 370, radius, 0, Math.PI * 2);
    context.stroke();
    context.restore();

    context.beginPath();
    context.arc(304, 370, radius - 2.2, 0, Math.PI * 2);
    context.lineWidth = 0.6;
    context.strokeStyle = "rgba(217, 224, 219, 0.5)";
    context.stroke();

    context.save();
    context.setLineDash([1, 4]);
    context.lineWidth = 0.55;
    context.strokeStyle = "rgba(241, 244, 241, 0.52)";
    context.beginPath();
    context.moveTo(229, 370);
    context.lineTo(379, 370);
    context.stroke();
    context.restore();
    drawPoint(304, 370, 1.45, 0.92, 4);
  }

  function drawMovingSignals(time) {
    if (reducedMotion) return;
    const horizontalProgress = (time * 0.000055) % 1;
    const verticalProgress = (time * 0.000038 + 0.35) % 1;
    drawPoint(376 + horizontalProgress * 160, 370, 1.7, 0.88, 6);
    drawPoint(402, 52 + verticalProgress * 294, 1.15, 0.78, 4);
  }

  function renderStatementCircuit(time = 0) {
    animationFrame = undefined;
    context.clearRect(0, 0, canvasWidth, canvasHeight);

    const coreX = designLeft + 304 * designScale;
    const coreY = designTop + 370 * designScale;
    const ambient = context.createRadialGradient(coreX, coreY, 0, coreX, coreY, 250 * designScale);
    ambient.addColorStop(0, "rgba(202, 211, 204, 0.09)");
    ambient.addColorStop(0.48, "rgba(102, 112, 105, 0.025)");
    ambient.addColorStop(1, "rgba(11, 13, 12, 0)");
    context.fillStyle = ambient;
    context.fillRect(0, 0, canvasWidth, canvasHeight);

    context.save();
    context.translate(designLeft, designTop);
    context.scale(designScale, designScale);
    routes.forEach((route, index) => strokeRoute(route, index % 5 === 0 ? 1.2 : 1));
    drawMicroDetails();
    drawSatellites(time);
    fixedNodes.forEach(([x, y, radius, alpha], index) => drawPoint(x, y, radius, alpha, index % 6 === 0 ? 4 : 1.5));
    drawMovingSignals(time);
    drawCore(time);
    context.restore();

    if (!reducedMotion && circuitVisible) animationFrame = window.requestAnimationFrame(renderStatementCircuit);
  }

  function refreshStatementCircuit() {
    if (animationFrame) window.cancelAnimationFrame(animationFrame);
    animationFrame = undefined;
    resizeStatementCanvas();
    renderStatementCircuit();
  }

  window.addEventListener("resize", refreshStatementCircuit);
  motionPreference.addEventListener?.("change", (event) => {
    reducedMotion = event.matches;
    refreshStatementCircuit();
  });
  const circuitObserver = new IntersectionObserver(([entry]) => {
    circuitVisible = entry.isIntersecting;
    if (circuitVisible && !animationFrame && !reducedMotion) {
      animationFrame = window.requestAnimationFrame(renderStatementCircuit);
    } else if (!circuitVisible && animationFrame) {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = undefined;
    }
  }, { rootMargin: "160px 0px" });

  circuitObserver.observe(statementCanvas);
  refreshStatementCircuit();
}
