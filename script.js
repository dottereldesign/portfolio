const root = document.documentElement;
const themeToggle = document.querySelector("[data-theme-toggle]");
const themeColorMeta = document.querySelector('meta[name="theme-color"]');
const themeMotionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
const themeStorageKey = "jw-theme";

const storeValue = (key, value) => {
  try {
    window.localStorage.setItem(key, value);
  } catch {}
};

const applyTheme = (theme, { persist = true } = {}) => {
  const nextTheme = theme === "light" ? "light" : "dark";
  const isDark = nextTheme === "dark";

  root.dataset.theme = nextTheme;
  root.style.colorScheme = nextTheme;
  themeToggle?.setAttribute("aria-pressed", String(isDark));
  themeToggle?.setAttribute("aria-label", isDark ? "Switch to light theme" : "Switch to dark theme");
  if (themeColorMeta) themeColorMeta.content = isDark ? "#10110f" : "#efebe2";
  if (persist) storeValue(themeStorageKey, nextTheme);
};

try {
  window.localStorage.removeItem("jw-theme-colors");
  window.localStorage.removeItem("jw-theme-toggle-size");
} catch {}

applyTheme(root.dataset.theme, { persist: false });

themeToggle?.addEventListener("click", () => {
  const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
  const updateTheme = () => applyTheme(nextTheme);

  if (document.startViewTransition && !themeMotionPreference.matches) {
    document.startViewTransition(updateTheme);
  } else {
    updateTheme();
  }
});

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
  let timelineIsNearby = false;
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

  const timelineVisibility = new IntersectionObserver(([entry]) => {
    timelineIsNearby = entry.isIntersecting;
    if (timelineIsNearby) updateTimeline();
  }, { rootMargin: "100% 0px" });

  timelineVisibility.observe(timeline);

  const onScroll = () => {
    if (!timelineIsNearby) return;
    if (!scrollFrame) scrollFrame = window.requestAnimationFrame(updateTimeline);
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", updateTimeline);
  updateTimeline();
}

const capabilities = document.querySelector("[data-capabilities-reveal]");

if (capabilities) {
  capabilities.classList.add("capabilities--reveal-ready");

  const revealCapabilities = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealCapabilities.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2, rootMargin: "0px 0px -8% 0px" });

  revealCapabilities.observe(capabilities);
}

const heroModelCanvas = document.querySelector(".hero__model-canvas");

if (heroModelCanvas) {
  import("three").then(async ({ Scene, PerspectiveCamera, WebGLRenderer, AmbientLight, DirectionalLight, Group, MathUtils, MeshStandardMaterial, MeshBasicMaterial, PlaneGeometry, Mesh, BackSide, DoubleSide, CanvasTexture, LinearFilter, SRGBColorSpace, Raycaster, Vector2 }) => {
    const { GLTFLoader } = await import("https://unpkg.com/three@0.181.2/examples/jsm/loaders/GLTFLoader.js");
    const modelHost = heroModelCanvas.parentElement;
    const hero = document.querySelector(".hero");
    const capabilitiesSection = document.querySelector(".capabilities");

    if (!hero || !capabilitiesSection) throw new Error("Laptop stage is incomplete");

    const scene = new Scene();
    const stackedHeroQuery = window.matchMedia("(max-width: 800px), (max-width: 1024px) and (max-aspect-ratio: 1/1)");
    const coarsePointerQuery = window.matchMedia("(pointer: coarse)");
    const usesStackedHeroLayout = () => stackedHeroQuery.matches;
    const usesCompactRendering = () => usesStackedHeroLayout() || coarsePointerQuery.matches;
    // Keep the full laptop inside the depth range while it rotates on scroll.
    const camera = new PerspectiveCamera(28, 1, 0.1, 250);
    const renderer = new WebGLRenderer({
      alpha: true,
      antialias: true,
      canvas: heroModelCanvas,
      powerPreference: "high-performance",
    });
    renderer.setClearColor(0x000000, 0);
    const laptop = new Group();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let modelReady = false;
    let modelHasPainted = false;
    let heroIsVisible = true;
    let capabilitiesAreVisible = false;
    let targetRotation = -0.45;
    let targetRotationX = 0;
    let targetRotationZ = -0.05;
    let targetLift = 0;
    let targetHostX = 0;
    let targetHostY = 0;
    let targetHostScale = 1;
    let currentHostX = 0;
    let currentHostY = 0;
    let currentHostScale = 1;
    let stickerTimeline = 0;
    let heroScrollDirty = false;
    let frame;
    let screenMesh;
    let screenController;
    const stickerMeshes = [];
    const dockRaycaster = new Raycaster();
    const dockPointer = new Vector2();
    let dockPointerFrame;
    let latestDockPointer;
    let hoveredDockIndex = -1;

    const moveModelToPageOverlay = () => {
      if (hero.nextElementSibling !== modelHost) hero.insertAdjacentElement("afterend", modelHost);
    };

    scene.add(new AmbientLight(0xe8e7e1, 2.2));

    const keyLight = new DirectionalLight(0xff5a24, 2.4);
    keyLight.position.set(4, 5, 6);
    scene.add(keyLight);

    const fillLight = new DirectionalLight(0x9fa8ff, 1.5);
    fillLight.position.set(-5, 2, 3);
    scene.add(fillLight);
    scene.add(laptop);

    const screenApps = [
      { label: "Git", short: "G", icon: "https://api.iconify.design/logos/git-icon.svg", color: "#f05032" },
      { label: "Codex", short: "Cx", icon: "https://api.iconify.design/simple-icons/openai.svg?color=%23f3f3ee", color: "#f3f3ee" },
      { label: "WordPress", short: "W", icon: "https://api.iconify.design/simple-icons/wordpress.svg?color=%2321759b", color: "#21759b" },
      { label: "Figma", short: "F", icon: "https://api.iconify.design/logos/figma.svg", color: "#a259ff" },
      { label: "Slack", short: "S", icon: "https://api.iconify.design/logos/slack-icon.svg", color: "#36c5f0" },
      { label: "Postman", short: "P", icon: "https://api.iconify.design/logos/postman-icon.svg", color: "#ff6c37" },
      { label: "Photoshop", short: "Ps", icon: "https://api.iconify.design/logos/adobe-photoshop.svg", color: "#31a8ff" },
      { label: "LocalWP", short: "L", icon: "https://api.iconify.design/simple-icons/local.svg?color=%2353BB7D", color: "#53BB7D" },
      { label: "VS Code", short: "<>_", icon: "https://api.iconify.design/logos/visual-studio-code.svg", color: "#23a8f2" },
      { label: "Terminal", short: ">_", icon: "https://api.iconify.design/lucide/terminal.svg?color=%23ff5a24", color: "#ff5a24" },
      { label: "Chrome", short: "C", icon: "https://api.iconify.design/logos/chrome.svg", color: "#4285f4" },
    ];

    const lidStickerSpecs = [
      { label: "JavaScript", short: "JS", icon: "https://api.iconify.design/logos/javascript.svg", color: "#f7df1e", x: -8.9, y: 15.7, width: 4.3, height: 4.3, rotation: -0.12, shape: "rounded" },
      { label: "CSS", short: "CSS", icon: "https://api.iconify.design/logos/css-3.svg", color: "#1572b6", x: 7.8, y: 15.4, width: 3.9, height: 4.4, rotation: 0.11, shape: "shield" },
      { label: "HTML", short: "HTML", icon: "https://api.iconify.design/logos/html-5.svg", color: "#e34f26", x: -9.8, y: 8.8, width: 3.8, height: 4.3, rotation: 0.1, shape: "shield" },
      { label: "PHP", short: "PHP", icon: "https://api.iconify.design/logos/php.svg", color: "#777bb4", x: 8.5, y: 9.1, width: 5.7, height: 3.6, rotation: -0.1, shape: "pill" },
      { label: "Git", short: "GIT", icon: "https://api.iconify.design/logos/git-icon.svg", color: "#f05032", x: -5.1, y: 4.5, width: 3.8, height: 3.8, rotation: -0.17, shape: "diamond" },
      { label: "Vite", short: "V", icon: "https://api.iconify.design/logos/vitejs.svg", color: "#646cff", x: 4.5, y: 4.2, width: 3.9, height: 4.1, rotation: 0.13, shape: "rounded" },
      { label: "WordPress", short: "W", icon: "https://api.iconify.design/logos/wordpress-icon.svg", color: "#21759b", x: 12.1, y: 4.9, width: 3.5, height: 3.5, rotation: -0.06, shape: "circle" },
    ];

    const getDockLayout = (width, height) => {
      const iconSize = 42;
      const iconGap = 19;
      const dockPadding = 42;
      const dockHeight = 62;
      const dockWidth =
        dockPadding * 2 + screenApps.length * iconSize + Math.max(0, screenApps.length - 1) * iconGap;

      return {
        dockHeight,
        dockWidth,
        dockX: (width - dockWidth) / 2,
        dockY: height - 170,
        dockPadding,
        iconGap,
        iconSize,
      };
    };

    const addRoundedRect = (context, x, y, width, height, radius) => {
      const corner = Math.min(radius, width / 2, height / 2);
      context.beginPath();
      context.moveTo(x + corner, y);
      context.arcTo(x + width, y, x + width, y + height, corner);
      context.arcTo(x + width, y + height, x, y + height, corner);
      context.arcTo(x, y + height, x, y, corner);
      context.arcTo(x, y, x + width, y, corner);
      context.closePath();
    };

    const loadScreenIcon = async (url) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Icon request failed with ${response.status}`);
      const source = await response.text();
      const objectUrl = URL.createObjectURL(new Blob([source], { type: "image/svg+xml" }));
      const image = new Image();

      try {
        await new Promise((resolve, reject) => {
          image.onload = resolve;
          image.onerror = reject;
          image.src = objectUrl;
        });
      } finally {
        URL.revokeObjectURL(objectUrl);
      }

      return image;
    };

    const createStickerTexture = (spec) => {
      const stickerCanvas = document.createElement("canvas");
      const context = stickerCanvas.getContext("2d");
      const size = 384;
      const inset = 42;
      stickerCanvas.width = size;
      stickerCanvas.height = size;
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";

      const drawShape = () => {
        const x = inset;
        const y = inset;
        const width = size - inset * 2;
        const height = size - inset * 2;
        context.beginPath();

        if (spec.shape === "circle") {
          context.arc(size / 2, size / 2, width / 2, 0, Math.PI * 2);
        } else if (spec.shape === "diamond") {
          context.moveTo(size / 2, y);
          context.lineTo(x + width, size / 2);
          context.lineTo(size / 2, y + height);
          context.lineTo(x, size / 2);
          context.closePath();
        } else if (spec.shape === "shield") {
          context.moveTo(x + width * 0.14, y);
          context.lineTo(x + width * 0.86, y);
          context.lineTo(x + width * 0.8, y + height * 0.76);
          context.quadraticCurveTo(size / 2, y + height, size / 2, y + height);
          context.quadraticCurveTo(size / 2, y + height, x + width * 0.2, y + height * 0.76);
          context.closePath();
        } else {
          addRoundedRect(context, x, y, width, height, spec.shape === "pill" ? height / 2 : 58);
        }
      };

      const drawSticker = (iconImage) => {
        context.clearRect(0, 0, size, size);
        context.save();
        context.shadowColor = "rgba(0, 0, 0, 0.42)";
        context.shadowBlur = 22;
        context.shadowOffsetY = 11;
        drawShape();
        context.fillStyle = "#f3f0e7";
        context.fill();
        context.restore();

        const backing = context.createLinearGradient(0, inset, size, size - inset);
        backing.addColorStop(0, "#fffdf5");
        backing.addColorStop(0.62, "#eeeae0");
        backing.addColorStop(1, "#d9d4c9");
        drawShape();
        context.fillStyle = backing;
        context.fill();
        context.lineWidth = 8;
        context.strokeStyle = "rgba(255, 255, 255, 0.92)";
        context.stroke();

        context.save();
        drawShape();
        context.clip();
        context.globalAlpha = 0.13;
        for (let index = 0; index < 34; index += 1) {
          const px = inset + ((index * 83) % (size - inset * 2));
          const py = inset + ((index * 137) % (size - inset * 2));
          context.fillStyle = index % 3 ? "#ffffff" : "#77736a";
          context.fillRect(px, py, 2 + index % 3, 1 + index % 2);
        }
        context.restore();

        if (iconImage) {
          const iconBox = size * (spec.shape === "pill" ? 0.57 : 0.54);
          const ratio = Math.min(iconBox / iconImage.naturalWidth, iconBox / iconImage.naturalHeight);
          const width = iconImage.naturalWidth * ratio;
          const height = iconImage.naturalHeight * ratio;
          context.drawImage(iconImage, (size - width) / 2, (size - height) / 2, width, height);
        } else {
          context.fillStyle = spec.color;
          context.font = `800 ${spec.short.length > 2 ? 76 : 104}px Arial, sans-serif`;
          context.textAlign = "center";
          context.textBaseline = "middle";
          context.fillText(spec.short, size / 2, size / 2 + 5);
        }
      };

      drawSticker();

      const texture = new CanvasTexture(stickerCanvas);
      texture.colorSpace = SRGBColorSpace;
      texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());

      loadScreenIcon(spec.icon).then((iconImage) => {
        drawSticker(iconImage);
        texture.needsUpdate = true;
        requestRender();
      }).catch(() => {});

      return texture;
    };

    const createLidSticker = (spec, index) => {
      const geometry = new PlaneGeometry(spec.width, spec.height);
      const material = new MeshBasicMaterial({
        alphaTest: 0.02,
        depthWrite: false,
        map: createStickerTexture(spec),
        opacity: 0,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
        side: DoubleSide,
        toneMapped: false,
        transparent: true,
      });
      const sticker = new Mesh(geometry, material);
      sticker.position.set(spec.x, spec.y, -0.49);
      sticker.rotation.set(0, Math.PI, spec.rotation);
      sticker.scale.setScalar(0.68);
      sticker.visible = false;
      sticker.renderOrder = 4 + index;
      sticker.userData.baseRotation = spec.rotation;
      sticker.userData.baseZ = -0.49;
      sticker.userData.revealDirection = index % 2 ? -1 : 1;
      sticker.userData.currentReveal = 0;
      return sticker;
    };

    const createPortraitOverlayTexture = () => {
      const portraitCanvas = document.createElement("canvas");
      const portraitContext = portraitCanvas.getContext("2d");
      const portraitImage = new Image();
      const width = 1470;
      const height = 1000;
      const sharpenForCompactDisplay = usesCompactRendering();
      portraitCanvas.width = width;
      portraitCanvas.height = height;
      portraitContext.imageSmoothingEnabled = true;
      portraitContext.imageSmoothingQuality = "high";

      const texture = new CanvasTexture(portraitCanvas);
      texture.colorSpace = SRGBColorSpace;
      texture.flipY = false;
      texture.generateMipmaps = !sharpenForCompactDisplay;
      if (sharpenForCompactDisplay) texture.minFilter = LinearFilter;
      texture.magFilter = LinearFilter;
      texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());

      const sharpenPortrait = (x, y, drawWidth, drawHeight) => {
        if (!sharpenForCompactDisplay) return;

        const left = Math.max(0, Math.floor(x));
        const top = Math.max(0, Math.floor(y));
        const right = Math.min(width, Math.ceil(x + drawWidth));
        const bottom = Math.min(height, Math.ceil(y + drawHeight));
        const regionWidth = right - left;
        const regionHeight = bottom - top;

        if (regionWidth < 3 || regionHeight < 3) return;

        const imageData = portraitContext.getImageData(left, top, regionWidth, regionHeight);
        const pixels = imageData.data;
        const source = new Uint8ClampedArray(pixels);
        const rowStride = regionWidth * 4;
        const strength = 0.38;

        for (let row = 1; row < regionHeight - 1; row += 1) {
          for (let column = 1; column < regionWidth - 1; column += 1) {
            const index = row * rowStride + column * 4;
            const leftIndex = index - 4;
            const rightIndex = index + 4;
            const topIndex = index - rowStride;
            const bottomIndex = index + rowStride;

            if (
              source[index + 3] < 160 ||
              source[leftIndex + 3] < 96 ||
              source[rightIndex + 3] < 96 ||
              source[topIndex + 3] < 96 ||
              source[bottomIndex + 3] < 96
            ) continue;

            for (let channel = 0; channel < 3; channel += 1) {
              const center = source[index + channel];
              const neighbourAverage = (
                source[leftIndex + channel] +
                source[rightIndex + channel] +
                source[topIndex + channel] +
                source[bottomIndex + channel]
              ) / 4;
              pixels[index + channel] = center + (center - neighbourAverage) * strength;
            }
          }
        }

        portraitContext.putImageData(imageData, left, top);
      };

      const drawPortrait = () => {
        const maxWidth = 680;
        const maxHeight = 980;
        const scale = Math.min(maxWidth / portraitImage.naturalWidth, maxHeight / portraitImage.naturalHeight);
        const drawWidth = portraitImage.naturalWidth * scale;
        const drawHeight = portraitImage.naturalHeight * scale;
        const drawX = (width - drawWidth) / 2;
        const drawY = 64;
        const { dockHeight, dockWidth, dockX, dockY } = getDockLayout(width, height);

        portraitContext.clearRect(0, 0, width, height);
        portraitContext.save();
        portraitContext.globalAlpha = 0.65;
        portraitContext.filter = "brightness(1.12) contrast(0.92) saturate(0.78)";
        portraitContext.drawImage(portraitImage, drawX, drawY, drawWidth, drawHeight);
        portraitContext.restore();
        sharpenPortrait(drawX, drawY, drawWidth, drawHeight);

        portraitContext.save();
        portraitContext.globalCompositeOperation = "destination-out";
        portraitContext.fillStyle = "#000";
        addRoundedRect(portraitContext, dockX - 4, dockY - 4, dockWidth + 8, dockHeight + 8, 26);
        portraitContext.fill();
        portraitContext.restore();

        texture.needsUpdate = true;
        requestRender();
      };

      portraitImage.onload = drawPortrait;
      portraitImage.src = "assets/laptop-wallper.png";

      return texture;
    };

    const createLaptopScreenTexture = () => {
      const screenCanvas = document.createElement("canvas");
      const context = screenCanvas.getContext("2d");
      const staticScreenCanvas = document.createElement("canvas");
      const staticContext = staticScreenCanvas.getContext("2d");
      const iconImages = new Map();
      const wallpaperImage = new Image();
      const width = 1470;
      const height = 1000;
      let hoverTargetIndex = -1;
      let animatedHoverIndex = -1;
      let hoverLift = 0;
      let lastHoverFrameTime = performance.now();
      let toastIndex = -1;
      let toastOpacity = 0;
      let toastTimers = [];
      const optimizeForCompactHero = usesCompactRendering();
      const textureScale = optimizeForCompactHero ? 0.5 : 1;
      screenCanvas.width = Math.round(width * textureScale);
      screenCanvas.height = Math.round(height * textureScale);
      staticScreenCanvas.width = screenCanvas.width;
      staticScreenCanvas.height = screenCanvas.height;
      context.setTransform(textureScale, 0, 0, textureScale, 0, 0);
      staticContext.setTransform(textureScale, 0, 0, textureScale, 0, 0);

      const texture = new CanvasTexture(screenCanvas);
      texture.colorSpace = SRGBColorSpace;
      texture.flipY = false;
      texture.generateMipmaps = false;
      texture.minFilter = LinearFilter;
      texture.magFilter = LinearFilter;
      texture.anisotropy = 1;

      const drawCanvasAtLogicalSize = (targetContext, sourceCanvas) => {
        targetContext.drawImage(sourceCanvas, 0, 0, sourceCanvas.width, sourceCanvas.height, 0, 0, width, height);
      };

      const drawWallpaper = () => {
        context.fillStyle = "#070907";
        context.fillRect(0, 0, width, height);

        if (wallpaperImage.complete && wallpaperImage.naturalWidth) {
          const maxWidth = 680;
          const maxHeight = 980;
          const scale = Math.min(maxWidth / wallpaperImage.naturalWidth, maxHeight / wallpaperImage.naturalHeight);
          const drawWidth = wallpaperImage.naturalWidth * scale;
          const drawHeight = wallpaperImage.naturalHeight * scale;
          const drawX = (width - drawWidth) / 2;
          const drawY = 64;

          context.save();
          context.globalAlpha = 0.2;
          context.filter = "brightness(0.82) contrast(0.92) saturate(0.68)";
          context.drawImage(wallpaperImage, drawX, drawY, drawWidth, drawHeight);
          context.restore();

          const portraitVignette = context.createRadialGradient(
            drawX + drawWidth * 0.5,
            drawY + drawHeight * 0.44,
            drawWidth * 0.18,
            drawX + drawWidth * 0.5,
            drawY + drawHeight * 0.44,
            drawHeight * 0.62,
          );
          portraitVignette.addColorStop(0, "rgba(7, 9, 7, 0)");
          portraitVignette.addColorStop(0.62, "rgba(7, 9, 7, 0.08)");
          portraitVignette.addColorStop(1, "rgba(7, 9, 7, 0.58)");
          context.fillStyle = portraitVignette;
          context.fillRect(drawX - 72, drawY - 48, drawWidth + 144, drawHeight + 96);
        }

        context.fillStyle = "rgba(3, 4, 3, 0.76)";
        context.fillRect(0, 0, width, 58);
        context.strokeStyle = "rgba(255, 255, 255, 0.08)";
        context.beginPath();
        context.moveTo(0, 58.5);
        context.lineTo(width, 58.5);
        context.stroke();

        context.textBaseline = "middle";
        context.font = "500 14px ui-monospace, SFMono-Regular, Menlo, monospace";

        const date = new Intl.DateTimeFormat("en-NZ", { weekday: "short", hour: "2-digit", minute: "2-digit" }).format(new Date()).toUpperCase();
        context.textAlign = "right";
        context.fillStyle = "rgba(241, 241, 236, 0.72)";
        context.fillText(`●  ${date}`, width - 34, 29);
        context.textAlign = "left";
      };

      const drawFallbackIcon = (app, x, y, size, compact = false) => {
        const fontSize = compact ? size * 0.38 : size * (app.short.length > 2 ? 0.28 : 0.43);
        context.font = `700 ${fontSize}px Arial, sans-serif`;
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillStyle = app.color;
        context.fillText(app.short, x + size / 2, y + size / 2 + 2);
        context.textAlign = "left";
      };

      const drawIcon = (app, x, y, size, compact = false) => {
        const image = iconImages.get(app.label);
        if (!image) {
          drawFallbackIcon(app, x, y, size, compact);
          return;
        }

        const padding = compact ? size * 0.18 : size * 0.2;
        const maxSize = size - padding * 2;
        const ratio = Math.min(maxSize / image.naturalWidth, maxSize / image.naturalHeight);
        const drawWidth = image.naturalWidth * ratio;
        const drawHeight = image.naturalHeight * ratio;
        context.drawImage(image, x + (size - drawWidth) / 2, y + (size - drawHeight) / 2, drawWidth, drawHeight);
      };

      const drawDockIcons = () => {
        const { dockX, dockY, dockPadding, iconGap, iconSize } = getDockLayout(width, height);

        screenApps.forEach((app, index) => {
          const lift = index === animatedHoverIndex ? hoverLift : 0;
          const scale = 1 + lift * 0.045;
          const size = iconSize * scale;
          const baseX = dockX + dockPadding + index * (iconSize + iconGap);
          const x = baseX - (size - iconSize) / 2;
          const y = dockY + 10 - lift * 22 - (size - iconSize) / 2;

          context.save();
          if (lift > 0) {
            context.shadowColor = "rgba(140, 207, 227, 0.16)";
            context.shadowBlur = 9 * lift;
            context.shadowOffsetY = 4 * lift;
          }
          addRoundedRect(context, x, y, size, size, 12 * scale);
          context.fillStyle = lift > 0
            ? `rgba(255, 255, 255, ${0.045 + lift * 0.04})`
            : "rgba(255, 255, 255, 0.045)";
          context.fill();
          drawIcon(app, x, y, size, true);
          context.restore();
        });
      };

      const drawToast = () => {
        if (toastIndex < 0 || toastOpacity <= 0) return;

        const { dockX, dockY, dockPadding, dockWidth, iconGap, iconSize } = getDockLayout(width, height);
        const label = screenApps[toastIndex]?.label || "App";
        const toastHeight = 56;
        const horizontalPadding = 24;
        const iconCenter = dockX + dockPadding + toastIndex * (iconSize + iconGap) + iconSize / 2;

        context.save();
        context.globalAlpha = toastOpacity;
        context.font = "500 25px ui-monospace, SFMono-Regular, Menlo, monospace";
        context.textAlign = "center";
        context.textBaseline = "middle";
        const toastWidth = Math.ceil(context.measureText(label).width + horizontalPadding * 2);
        const toastX = MathUtils.clamp(iconCenter - toastWidth / 2, dockX + 8, dockX + dockWidth - toastWidth - 8);
        const toastY = dockY - 72;

        context.shadowColor = "rgba(0, 0, 0, 0.34)";
        context.shadowBlur = 18;
        context.shadowOffsetY = 8;
        addRoundedRect(context, toastX, toastY, toastWidth, toastHeight, 16);
        context.fillStyle = "rgba(8, 10, 9, 0.94)";
        context.fill();
        context.shadowColor = "transparent";
        context.strokeStyle = "rgba(232, 231, 225, 0.2)";
        context.lineWidth = 1;
        context.stroke();
        context.fillStyle = "rgba(232, 231, 225, 0.9)";
        context.fillText(label, toastX + toastWidth / 2, toastY + toastHeight / 2 + 0.5);
        context.restore();
      };

      const drawStaticHomeScreen = () => {
        context.clearRect(0, 0, width, height);
        drawWallpaper();

        const { dockHeight, dockWidth, dockX, dockY } = getDockLayout(width, height);
        addRoundedRect(context, dockX, dockY, dockWidth, dockHeight, 22);
        context.fillStyle = "rgba(20, 24, 20, 0.84)";
        context.fill();
        context.strokeStyle = "rgba(255, 255, 255, 0.15)";
        context.lineWidth = 1.5;
        context.stroke();
      };

      const drawScreenFrame = () => {
        context.clearRect(0, 0, width, height);
        drawCanvasAtLogicalSize(context, staticScreenCanvas);
        drawDockIcons();
        drawToast();
      };

      const repaintInteraction = () => {
        drawScreenFrame();
        texture.needsUpdate = true;
        requestRender();
      };

      const setHovered = (index) => {
        if (index === hoverTargetIndex) return;
        hoverTargetIndex = index;

        if (index >= 0) {
          animatedHoverIndex = index;
          hoverLift = reducedMotion ? 1 : Math.min(hoverLift, 0.08);
        } else if (reducedMotion) {
          animatedHoverIndex = -1;
          hoverLift = 0;
        }

        lastHoverFrameTime = performance.now();
        if (reducedMotion) repaintInteraction();
        else requestRender();
      };

      const update = (now) => {
        if (reducedMotion) return false;

        const targetLift = hoverTargetIndex >= 0 ? 1 : 0;
        const delta = Math.min(0.05, Math.max(0.001, (now - lastHoverFrameTime) / 1000));
        const easing = 1 - Math.exp(-(targetLift > hoverLift ? 15 : 20) * delta);
        const nextLift = MathUtils.lerp(hoverLift, targetLift, easing);
        const changed = Math.abs(nextLift - hoverLift) > 0.001;
        hoverLift = Math.abs(nextLift - targetLift) < 0.004 ? targetLift : nextLift;
        lastHoverFrameTime = now;

        if (changed) {
          drawScreenFrame();
          texture.needsUpdate = true;
        }

        if (targetLift === 0 && hoverLift === 0) animatedHoverIndex = -1;
        return Math.abs(hoverLift - targetLift) > 0.004;
      };

      const showToast = (index) => {
        toastTimers.forEach((timer) => window.clearTimeout(timer));
        toastTimers = [];
        toastIndex = index;
        toastOpacity = reducedMotion ? 1 : 0.35;
        repaintInteraction();

        if (!reducedMotion) {
          toastTimers.push(window.setTimeout(() => {
            toastOpacity = 1;
            repaintInteraction();
          }, 45));
          toastTimers.push(window.setTimeout(() => {
            toastOpacity = 0.45;
            repaintInteraction();
          }, 1450));
        }
        toastTimers.push(window.setTimeout(() => {
          toastOpacity = 0;
          toastIndex = -1;
          repaintInteraction();
        }, 1620));
      };

      const getDockIndexAtUv = (uv) => {
        if (!uv) return -1;
        const x = uv.x * width;
        const y = uv.y * height;
        const { dockHeight, dockX, dockY, dockPadding, iconGap, iconSize } = getDockLayout(width, height);
        const iconStep = iconSize + iconGap;
        const firstCenter = dockX + dockPadding + iconSize / 2;
        const lastCenter = firstCenter + (screenApps.length - 1) * iconStep;

        if (
          x < firstCenter - iconStep / 2
          || x > lastCenter + iconStep / 2
          || y < dockY - 24
          || y > dockY + dockHeight + 28
        ) return -1;

        return MathUtils.clamp(Math.round((x - firstCenter) / iconStep), 0, screenApps.length - 1);
      };

      const cacheStaticScreen = () => {
        drawStaticHomeScreen();
        staticContext.clearRect(0, 0, width, height);
        drawCanvasAtLogicalSize(staticContext, screenCanvas);
        drawScreenFrame();
      };

      cacheStaticScreen();

      wallpaperImage.onload = () => {
        cacheStaticScreen();
        texture.needsUpdate = true;
        requestRender();
      };
      wallpaperImage.src = "assets/laptop-wallper.png";

      Promise.allSettled(screenApps.filter((app) => app.icon).map(async (app) => {
        const image = await loadScreenIcon(app.icon);
        iconImages.set(app.label, image);
      })).then(() => {
        cacheStaticScreen();
        texture.needsUpdate = true;
        requestRender();
      });

      return { getDockIndexAtUv, setHovered, showToast, texture, update };
    };

    const pointerIsOverForegroundContent = (clientX, clientY) => {
      const foreground = document.elementFromPoint(clientX, clientY);
      return Boolean(foreground?.closest(".site-header, .hero__side-rail, .cta"));
    };

    const getDockIndexAtPoint = (clientX, clientY) => {
      if (!screenMesh || !screenController || !modelReady || !heroIsVisible || pointerIsOverForegroundContent(clientX, clientY)) return -1;

      const bounds = heroModelCanvas.getBoundingClientRect();
      if (
        clientX < bounds.left || clientX > bounds.right
        || clientY < bounds.top || clientY > bounds.bottom
        || bounds.width <= 0 || bounds.height <= 0
      ) return -1;

      dockPointer.set(
        ((clientX - bounds.left) / bounds.width) * 2 - 1,
        -((clientY - bounds.top) / bounds.height) * 2 + 1,
      );
      camera.updateMatrixWorld();
      screenMesh.updateWorldMatrix(true, false);
      dockRaycaster.setFromCamera(dockPointer, camera);
      const hit = dockRaycaster.intersectObject(screenMesh, false)[0];
      return screenController.getDockIndexAtUv(hit?.uv);
    };

    const setDockHover = (index) => {
      if (index === hoveredDockIndex) return;
      hoveredDockIndex = index;
      screenController?.setHovered(index);
      document.documentElement.classList.toggle("is-laptop-dock-hovered", index >= 0);
    };

    const updateDockHover = () => {
      dockPointerFrame = undefined;
      if (!latestDockPointer) return;
      setDockHover(getDockIndexAtPoint(latestDockPointer.x, latestDockPointer.y));
    };

    window.addEventListener("pointermove", (event) => {
      if (coarsePointerQuery.matches) return;
      latestDockPointer = { x: event.clientX, y: event.clientY };
      if (!dockPointerFrame) dockPointerFrame = window.requestAnimationFrame(updateDockHover);
    }, { passive: true });

    window.addEventListener("pointerleave", () => {
      latestDockPointer = undefined;
      setDockHover(-1);
    });

    window.addEventListener("click", (event) => {
      const dockIndex = getDockIndexAtPoint(event.clientX, event.clientY);
      if (dockIndex < 0) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      setDockHover(dockIndex);
      screenController.showToast(dockIndex);
    }, true);

    const resize = () => {
      const width = modelHost.offsetWidth;
      const height = modelHost.offsetHeight;
      const maxDpr = usesCompactRendering() ? 1.25 : 2;
      const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
      renderer.setPixelRatio(dpr);
      renderer.setSize(width, height, false);
      const aspect = width / height;
      const portraitCameraZ = 78 + Math.max(0, 1.1 - aspect) * 80;
      const compactCameraZ = usesStackedHeroLayout() ? 85 : 78;
      camera.aspect = aspect;
      camera.position.z = MathUtils.clamp(Math.max(compactCameraZ, portraitCameraZ), 78, 108);
      camera.updateProjectionMatrix();
    };

    const updateScroll = () => {
      const bounds = hero.getBoundingClientRect();
      const progress = MathUtils.clamp(-bounds.top / Math.max(1, bounds.height), 0, 1);
      const smoothProgress = progress * progress * (3 - 2 * progress);
      moveModelToPageOverlay();

      if (reducedMotion) {
        targetRotation = -0.45;
        targetRotationX = 0;
        targetRotationZ = -0.05;
        targetLift = 0;
        targetHostX = 0;
        targetHostY = bounds.top;
        targetHostScale = 1;
        stickerTimeline = 0;
        return;
      }

      if (usesStackedHeroLayout()) {
        targetRotation = -0.45 + progress * Math.PI * 0.95;
        targetRotationX = 0;
        targetRotationZ = -0.05;
        targetLift = progress * 5;
        targetHostX = 0;
        targetHostY = bounds.top;
        currentHostY = targetHostY;
        targetHostScale = 1;
        stickerTimeline = 0;
        return;
      }

      const capabilitiesBounds = capabilitiesSection.getBoundingClientRect();
      const settleProgress = MathUtils.clamp((progress - 0.58) / 0.42, 0, 1);
      const settleEase = settleProgress * settleProgress * (3 - 2 * settleProgress);
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const arcCenterY = viewportHeight * 0.55 + Math.sin(progress * Math.PI) * viewportHeight * 0.16;
      const landingCenterY = capabilitiesBounds.top + Math.min(275, viewportHeight * 0.31);
      const targetCenterY = MathUtils.lerp(arcCenterY, landingCenterY, settleEase);

      targetRotation = MathUtils.lerp(-0.45, Math.PI - 0.35, smoothProgress);
      targetRotationX = MathUtils.lerp(0, -0.12, settleEase);
      targetRotationZ = MathUtils.lerp(-0.05, 0.035, settleEase);
      targetLift = MathUtils.lerp(0, -4, smoothProgress);
      targetHostX = viewportWidth * 0.19 * settleEase;
      targetHostY = targetCenterY - viewportHeight * 0.55;
      targetHostScale = MathUtils.lerp(1, 0.5, settleEase);
      stickerTimeline = settleEase;
    };

    new GLTFLoader().load("assets/macbook.glb", ({ scene: loadedScene }) => {
      const baseMetal = new MeshStandardMaterial({ color: 0x9da1a5, metalness: 0.82, roughness: 0.3 });
      const darkPlastic = new MeshStandardMaterial({ color: 0x080909, metalness: 0.35, roughness: 0.72 });
      const logo = new MeshBasicMaterial({ color: 0xff5a24 });
      const webcam = loadedScene.getObjectByName("camera");

      if (webcam) webcam.visible = false;

      loadedScene.children.forEach((part) => {
        part.children?.forEach((mesh) => {
          if (!mesh.isMesh) return;
          mesh.material = part.name === "_top" && mesh.name === "logo" ? logo : part.name === "_top" && mesh.name === "lid" || part.name === "_bottom" && mesh.name === "base" ? baseMetal : darkPlastic;
        });
      });
      loadedScene.rotation.set(0.1, 0.35, -0.08);
      loadedScene.scale.setScalar(1.1);
      loadedScene.position.set(0, -3.4, 0);
      loadedScene.position.z = -10;

      screenController = createLaptopScreenTexture();
      const screenGeometry = new PlaneGeometry(29.4, 20);
      const screen = new Mesh(screenGeometry, new MeshBasicMaterial({ color: 0xffffff, map: screenController.texture, side: BackSide, toneMapped: false }));
      screen.position.set(0, 10.5, -0.11);
      screen.rotation.set(Math.PI, 0, 0);
      screen.renderOrder = 1;
      loadedScene.add(screen);
      screenMesh = screen;

      const portraitTexture = createPortraitOverlayTexture();
      const portraitOverlay = new Mesh(screenGeometry, new MeshBasicMaterial({
        alphaTest: 0.01,
        color: 0xffffff,
        depthWrite: false,
        map: portraitTexture,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
        side: BackSide,
        toneMapped: false,
        transparent: true,
      }));
      portraitOverlay.position.copy(screen.position);
      portraitOverlay.position.z += 0.012;
      portraitOverlay.rotation.copy(screen.rotation);
      portraitOverlay.renderOrder = 2;
      loadedScene.add(portraitOverlay);

      const stickerGroup = new Group();
      lidStickerSpecs.forEach((spec, index) => {
        const sticker = createLidSticker(spec, index);
        stickerGroup.add(sticker);
        stickerMeshes.push(sticker);
      });
      loadedScene.add(stickerGroup);

      laptop.add(loadedScene);
      modelReady = true;
      requestRender();
    });

    const render = () => {
      frame = undefined;
      if (!modelReady) return;
      if (heroScrollDirty) {
        updateScroll();
        heroScrollDirty = false;
      }
      const motionEase = usesCompactRendering() ? 0.16 : 0.075;
      laptop.rotation.y = reducedMotion ? targetRotation : MathUtils.lerp(laptop.rotation.y, targetRotation, motionEase);
      laptop.rotation.x = reducedMotion ? targetRotationX : MathUtils.lerp(laptop.rotation.x, targetRotationX, motionEase);
      laptop.position.y = reducedMotion ? targetLift : MathUtils.lerp(laptop.position.y, targetLift, motionEase);
      laptop.rotation.z = reducedMotion ? targetRotationZ : MathUtils.lerp(laptop.rotation.z, targetRotationZ, motionEase);

      currentHostX = reducedMotion ? targetHostX : MathUtils.lerp(currentHostX, targetHostX, motionEase);
      currentHostY = reducedMotion ? targetHostY : MathUtils.lerp(currentHostY, targetHostY, motionEase);
      currentHostScale = reducedMotion ? targetHostScale : MathUtils.lerp(currentHostScale, targetHostScale, motionEase);
      modelHost.style.setProperty("--model-shift-x", `${currentHostX.toFixed(2)}px`);
      modelHost.style.setProperty("--model-shift-y", `${currentHostY.toFixed(2)}px`);
      modelHost.style.setProperty("--model-scale", currentHostScale.toFixed(4));

      let stickersAreMoving = false;
      stickerMeshes.forEach((sticker, index) => {
        const start = index * 0.105;
        const end = start + 0.26;
        const targetReveal = MathUtils.clamp((stickerTimeline - start) / (end - start), 0, 1);
        const easedReveal = 1 - Math.pow(1 - targetReveal, 3);
        sticker.userData.currentReveal = reducedMotion
          ? easedReveal
          : MathUtils.lerp(sticker.userData.currentReveal, easedReveal, 0.18);

        const reveal = sticker.userData.currentReveal;
        const slap = Math.sin(MathUtils.clamp(reveal, 0, 1) * Math.PI) * 0.08;
        sticker.visible = reveal > 0.005;
        sticker.material.opacity = MathUtils.clamp(reveal * 1.35, 0, 1);
        sticker.scale.setScalar(0.68 + reveal * 0.32 + slap);
        sticker.position.z = sticker.userData.baseZ - (1 - reveal) * 0.35;
        sticker.rotation.z = sticker.userData.baseRotation + (1 - reveal) * 0.28 * sticker.userData.revealDirection;
        stickersAreMoving ||= Math.abs(reveal - easedReveal) > 0.002;
      });

      const dockIsAnimating = screenController?.update(performance.now()) ?? false;
      renderer.render(scene, camera);

      if (!modelHasPainted) {
        modelHasPainted = true;
        modelHost.classList.add("hero__model--ready");
      }

      if (!reducedMotion && (
        Math.abs(laptop.rotation.y - targetRotation) > 0.001
        || Math.abs(laptop.rotation.x - targetRotationX) > 0.001
        || Math.abs(laptop.rotation.z - targetRotationZ) > 0.001
        || Math.abs(laptop.position.y - targetLift) > 0.001
        || Math.abs(currentHostX - targetHostX) > 0.1
        || Math.abs(currentHostY - targetHostY) > 0.1
        || Math.abs(currentHostScale - targetHostScale) > 0.001
        || stickersAreMoving
        || dockIsAnimating
      )) {
        requestRender();
      }
    };

    const requestRender = () => {
      if (!frame) frame = window.requestAnimationFrame(render);
    };

    if ("IntersectionObserver" in window) {
      const modelVisibility = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.target === hero) heroIsVisible = entry.isIntersecting;
          if (entry.target === capabilitiesSection) capabilitiesAreVisible = entry.isIntersecting;
        });

        if (heroIsVisible || capabilitiesAreVisible) {
          heroScrollDirty = true;
          requestRender();
        }
      }, { rootMargin: "20% 0px" });

      modelVisibility.observe(hero);
      modelVisibility.observe(capabilitiesSection);
    }

    camera.position.set(0, 0.1, 78);
    resize();
    updateScroll();
    window.addEventListener("resize", () => { resize(); updateScroll(); requestRender(); });
    window.addEventListener("scroll", () => {
      if (!heroIsVisible && !capabilitiesAreVisible) return;
      setDockHover(-1);
      heroScrollDirty = true;
      requestRender();
    }, { passive: true });
    requestRender();
  }).catch(() => {
    heroModelCanvas.closest(".hero__model")?.classList.add("hero__model--unavailable");
  });
}
