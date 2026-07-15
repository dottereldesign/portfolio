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
  const referenceSize = 760;
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
    { alpha: 0.25, width: 0.75, path: [[380, 92], [380, 668]] },
    { alpha: 0.25, width: 0.75, path: [[92, 380], [668, 380]] },
  ];

  const nodes = [
    { x: 380, y: 112, radius: 52, type: "top" },
    { x: 108, y: 380, radius: 52, type: "left" },
    { x: 652, y: 380, radius: 52, type: "right" },
    { x: 380, y: 648, radius: 52, type: "bottom" },
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
    designScale = Math.min(
      canvasWidth / referenceSize * (compact ? 0.92 : 0.8),
      canvasHeight / referenceSize * (compact ? 0.88 : 0.95),
    );
    const coreScreenX = canvasWidth * (compact ? 0.72 : 0.72);
    const coreScreenY = canvasHeight * (compact ? 0.54 : 0.53);
    designLeft = coreScreenX - 380 * designScale;
    designTop = coreScreenY - 380 * designScale;
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

  function drawOrbitFrame(node, time) {
    const { x, y, radius } = node;
    const phase = reducedMotion ? 0 : time * 0.00018;
    const pulse = reducedMotion ? 0 : Math.sin(time * 0.0012 + x) * 2;
    context.save();
    context.setLineDash([1.2, 4.5]);
    context.lineDashOffset = -phase * 18;
    context.lineWidth = 0.65;
    context.strokeStyle = `rgba(226, 232, 228, ${0.28 + Math.max(0, pulse) * 0.015})`;
    context.beginPath();
    context.arc(x, y, radius + pulse, 0, Math.PI * 2);
    context.stroke();
    context.setLineDash([]);
    context.lineWidth = 0.55;
    context.strokeStyle = "rgba(226, 232, 228, 0.18)";
    context.beginPath();
    context.arc(x, y, radius * 0.68, 0, Math.PI * 2);
    context.stroke();
    context.restore();

    [0, Math.PI / 2, Math.PI, Math.PI * 1.5].forEach((angle, index) => {
      const orbitAngle = angle + phase * (index % 2 ? -1 : 1);
      drawPoint(x + Math.cos(orbitAngle) * (radius + pulse), y + Math.sin(orbitAngle) * (radius + pulse), 1.5, 0.7, 2);
    });
  }

  function drawTopNode(node, time) {
    const { x, y } = node;
    const rotation = reducedMotion ? 0 : time * 0.00022;
    const pulse = reducedMotion ? 0 : Math.sin(time * 0.0014) * 2;
    context.save();
    context.translate(x, y);
    context.rotate(rotation);
    context.strokeStyle = "rgba(239, 243, 240, 0.68)";
    context.lineWidth = 0.7;
    context.beginPath();
    context.moveTo(0, -34 - pulse);
    context.lineTo(34 + pulse, 0);
    context.lineTo(0, 34 + pulse);
    context.lineTo(-34 - pulse, 0);
    context.closePath();
    context.moveTo(0, -22);
    context.lineTo(22, 0);
    context.lineTo(0, 22);
    context.lineTo(-22, 0);
    context.closePath();
    context.stroke();
    context.beginPath();
    context.moveTo(-46, 0);
    context.lineTo(46, 0);
    context.moveTo(0, -46);
    context.lineTo(0, 46);
    context.strokeStyle = "rgba(239, 243, 240, 0.35)";
    context.stroke();
    context.restore();
    drawPoint(x, y, 5, 0.95, 9);
    drawPoint(x, y - 44, 1.5, 0.8, 3);
  }

  function drawLeftNode(node, time) {
    const { x, y } = node;
    const size = 27;
    const scan = reducedMotion ? 0 : Math.sin(time * 0.0011) * 16;
    context.save();
    context.translate(x, y);
    context.rotate(reducedMotion ? 0 : Math.sin(time * 0.00035) * 0.035);
    context.strokeStyle = "rgba(239, 243, 240, 0.68)";
    context.lineWidth = 0.8;
    [[-size, -size, 1, 1], [size, -size, -1, 1], [-size, size, 1, -1], [size, size, -1, -1]].forEach(([cornerX, cornerY, directionX, directionY]) => {
      context.beginPath();
      context.moveTo(cornerX, cornerY + directionY * 13);
      context.lineTo(cornerX, cornerY);
      context.lineTo(cornerX + directionX * 13, cornerY);
      context.stroke();
    });
    context.beginPath();
    context.moveTo(-10, -9);
    context.lineTo(-21, 0);
    context.lineTo(-10, 9);
    context.moveTo(10, -9);
    context.lineTo(21, 0);
    context.lineTo(10, 9);
    context.stroke();
    context.strokeStyle = "rgba(239, 243, 240, 0.32)";
    context.beginPath();
    context.moveTo(-size + 4, scan);
    context.lineTo(size - 4, scan);
    context.stroke();
    context.restore();
    drawPoint(x, y, 1.7, 0.84, 3);
  }

  function drawRightNode(node, time) {
    const { x, y } = node;
    const phase = reducedMotion ? 0.5 : (time * 0.00035) % 1;
    context.save();
    context.strokeStyle = "rgba(239, 243, 240, 0.68)";
    context.lineWidth = 0.7;
    context.beginPath();
    context.moveTo(x - 22, y - 13);
    context.lineTo(x + 13, y - 13);
    context.quadraticCurveTo(x + 29, y - 13, x + 29, y);
    context.quadraticCurveTo(x + 29, y + 13, x + 13, y + 13);
    context.lineTo(x - 15, y + 13);
    context.quadraticCurveTo(x - 29, y + 13, x - 29, y + 24);
    context.quadraticCurveTo(x - 29, y + 34, x - 14, y + 34);
    context.lineTo(x + 16, y + 34);
    context.stroke();
    context.restore();

    const packetX = x - 23 + ((phase * 68) % 68);
    const packetY = phase < 0.5 ? y - 13 : y + 34;
    drawPoint(packetX, packetY, 4.5, 0.92, 6);
    drawPoint(x - 23, y - 13, 2, 0.58, 2);
    drawPoint(x + 18, y + 34, 2, 0.58, 2);
    drawPoint(x, y, 1.5, 0.78, 2);
  }

  function drawBottomNode(node, time) {
    const { x, y } = node;
    const rotation = reducedMotion ? 0 : time * 0.0003;
    context.save();
    context.strokeStyle = "rgba(239, 243, 240, 0.5)";
    context.lineWidth = 0.65;
    [0, Math.PI / 3, Math.PI * 2 / 3].forEach((angle) => {
      context.save();
      context.translate(x, y);
      context.rotate(angle + rotation);
      context.beginPath();
      context.ellipse(0, 0, 30, 12, 0, 0, Math.PI * 2);
      context.stroke();
      context.restore();
    });
    context.restore();
    drawPoint(x, y, 4.2, 0.92, 6);
    [0, Math.PI / 3, Math.PI * 2 / 3].forEach((angle, index) => {
      const electronAngle = angle + rotation * (index % 2 ? -1 : 1);
      drawPoint(x + Math.cos(electronAngle) * 30, y + Math.sin(electronAngle) * 12, 2.4, 0.86, 4);
    });
  }

  function drawNodes(time) {
    nodes.forEach((node) => {
      drawOrbitFrame(node, time);
      if (node.type === "top") drawTopNode(node, time);
      if (node.type === "left") drawLeftNode(node, time);
      if (node.type === "right") drawRightNode(node, time);
      if (node.type === "bottom") drawBottomNode(node, time);
    });
  }

  function drawCentralOrbit(time) {
    const rotation = reducedMotion ? 0 : time * 0.00008;
    const pulse = reducedMotion ? 0 : Math.sin(time * 0.0007) * 3;
    context.save();
    context.translate(380, 380);
    context.rotate(rotation);
    context.setLineDash([1.5, 5]);
    context.lineDashOffset = -rotation * 90;
    context.lineWidth = 0.72;
    context.strokeStyle = "rgba(226, 232, 228, 0.3)";
    context.beginPath();
    context.arc(0, 0, 164 + pulse, 0, Math.PI * 2);
    context.stroke();
    context.setLineDash([1, 4]);
    context.lineWidth = 0.55;
    context.strokeStyle = "rgba(226, 232, 228, 0.2)";
    context.beginPath();
    context.arc(0, 0, 124 + pulse * 0.4, 0, Math.PI * 2);
    context.stroke();
    context.restore();

    [0, Math.PI / 2, Math.PI, Math.PI * 1.5].forEach((angle) => {
      const orbitAngle = angle + rotation * 12;
      drawPoint(380 + Math.cos(orbitAngle) * (164 + pulse), 380 + Math.sin(orbitAngle) * (164 + pulse), 1.5, 0.72, 2);
    });
  }

  function drawAxisDetails() {
    context.save();
    context.setLineDash([1, 4]);
    context.lineWidth = 0.55;
    context.strokeStyle = "rgba(241, 244, 241, 0.44)";
    context.beginPath();
    context.moveTo(230, 380);
    context.lineTo(530, 380);
    context.moveTo(380, 230);
    context.lineTo(380, 530);
    context.stroke();
    context.restore();
    [[230, 380], [300, 380], [460, 380], [530, 380], [380, 230], [380, 300], [380, 460], [380, 530]].forEach(([x, y]) => drawPoint(x, y, 1.6, 0.78, 2));
  }

  function drawCore(time) {
    const pulse = reducedMotion ? 1 : 1 + Math.sin(time * 0.0011) * 0.025;
    const radius = 34 * pulse;

    const outerGlow = context.createRadialGradient(380, 380, 20, 380, 380, 108);
    outerGlow.addColorStop(0, "rgba(255, 255, 255, 0.16)");
    outerGlow.addColorStop(0.42, "rgba(230, 237, 232, 0.06)");
    outerGlow.addColorStop(1, "rgba(230, 237, 232, 0)");
    context.fillStyle = outerGlow;
    context.beginPath();
    context.arc(380, 380, 108, 0, Math.PI * 2);
    context.fill();

    const coreFill = context.createRadialGradient(380, 380, 0, 380, 380, radius);
    coreFill.addColorStop(0, "rgba(22, 27, 24, 0.98)");
    coreFill.addColorStop(0.72, "rgba(13, 16, 14, 0.99)");
    coreFill.addColorStop(1, "rgba(9, 11, 10, 1)");
    context.fillStyle = coreFill;
    context.beginPath();
    context.arc(380, 380, radius - 1.8, 0, Math.PI * 2);
    context.fill();

    context.save();
    context.setLineDash([1, 3.5]);
    context.lineWidth = 0.65;
    context.strokeStyle = "rgba(235, 239, 236, 0.42)";
    context.beginPath();
    context.arc(380, 380, 70, 0, Math.PI * 2);
    context.stroke();
    context.restore();

    context.save();
    context.shadowColor = "rgba(248, 250, 247, 0.92)";
    context.shadowBlur = 12;
    context.strokeStyle = "rgba(250, 251, 249, 0.96)";
    context.lineWidth = 1.55;
    context.beginPath();
    context.arc(380, 380, radius, 0, Math.PI * 2);
    context.stroke();
    context.restore();
    drawPoint(380, 380, 1.6, 0.96, 5);
  }

  function drawDominoBall(x, alpha = 0.56, glow = 2, radius = 2.2) {
    drawPoint(x, 380, radius, alpha, glow);
  }

  function smoothStep(value) {
    return value * value * (3 - 2 * value);
  }

  function drawMomentumTransfer(time) {
    const dominoPositions = [236, 276, 316, 356, 404, 444, 484, 524];
    const segmentCount = dominoPositions.length - 1;

    if (reducedMotion) {
      dominoPositions.forEach((x) => drawDominoBall(x, 0.48, 1.5, 2));
      return;
    }

    const cycle = (time % 8200) / 8200;
    const forward = cycle < 0.5;
    const pingPong = forward ? cycle * 2 : 2 - cycle * 2;
    const travel = Math.min(segmentCount - 0.001, pingPong * segmentCount);
    const segment = Math.min(segmentCount - 1, Math.floor(travel));
    const local = smoothStep(travel - segment);

    dominoPositions.forEach((position, index) => {
      let restingPosition = position;

      if (forward && index < segment) {
        restingPosition = dominoPositions[index + 1];
      } else if (!forward && index > segment + 1) {
        restingPosition = dominoPositions[index - 1];
      }

      if (forward && index === segment) {
        restingPosition = dominoPositions[index] + (dominoPositions[index + 1] - dominoPositions[index]) * local;
      } else if (!forward && index === segment + 1) {
        restingPosition = dominoPositions[segment] + (dominoPositions[segment + 1] - dominoPositions[segment]) * local;
      }

      drawDominoBall(restingPosition, index === segment || (!forward && index === segment + 1) ? 0.2 : 0.48, 1.5, 2);
    });

    const activePosition = forward
      ? dominoPositions[segment] + (dominoPositions[segment + 1] - dominoPositions[segment]) * local
      : dominoPositions[segment] + (dominoPositions[segment + 1] - dominoPositions[segment]) * local;
    const stretch = Math.sin(local * Math.PI) * 0.22;
    context.save();
    context.translate(activePosition, 380);
    context.scale(forward ? 1 + stretch : 1 - stretch * 0.35, forward ? 1 - stretch * 0.35 : 1 + stretch);
    context.fillStyle = "rgba(248, 250, 247, 0.96)";
    context.shadowColor = "rgba(248, 250, 247, 0.95)";
    context.shadowBlur = 8;
    context.beginPath();
    context.arc(0, 0, 3.4, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  function renderStatementCircuit(time = 0) {
    animationFrame = undefined;
    context.clearRect(0, 0, canvasWidth, canvasHeight);

    const coreX = designLeft + 380 * designScale;
    const coreY = designTop + 380 * designScale;
    const ambient = context.createRadialGradient(coreX, coreY, 0, coreX, coreY, 270 * designScale);
    ambient.addColorStop(0, "rgba(202, 211, 204, 0.11)");
    ambient.addColorStop(0.48, "rgba(102, 112, 105, 0.028)");
    ambient.addColorStop(1, "rgba(11, 13, 12, 0)");
    context.fillStyle = ambient;
    context.fillRect(0, 0, canvasWidth, canvasHeight);

    context.save();
    context.translate(designLeft, designTop);
    context.scale(designScale, designScale);
    routes.forEach((route) => strokeRoute(route));
    drawCentralOrbit(time);
    drawCore(time);
    drawAxisDetails();
    drawMomentumTransfer(time);
    drawNodes(time);
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
