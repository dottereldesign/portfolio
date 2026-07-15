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
  import("three").then(async ({ Scene, PerspectiveCamera, WebGLRenderer, AmbientLight, DirectionalLight, Group, MathUtils, MeshStandardMaterial, MeshBasicMaterial, PlaneGeometry, Mesh, BackSide, CanvasTexture, SRGBColorSpace }) => {
    const { GLTFLoader } = await import("https://unpkg.com/three@0.181.2/examples/jsm/loaders/GLTFLoader.js");
    const modelHost = heroModelCanvas.parentElement;
    const scene = new Scene();
    // Keep the full laptop inside the depth range while it rotates on scroll.
    const camera = new PerspectiveCamera(28, 1, 0.1, 250);
    const renderer = new WebGLRenderer({ alpha: true, antialias: true, canvas: heroModelCanvas });
    const laptop = new Group();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let modelReady = false;
    let targetRotation = -0.45;
    let targetLift = 0;
    let frame;

    scene.add(new AmbientLight(0xe8e7e1, 2.2));

    const keyLight = new DirectionalLight(0xd8ff3e, 2.4);
    keyLight.position.set(4, 5, 6);
    scene.add(keyLight);

    const fillLight = new DirectionalLight(0x9fa8ff, 1.5);
    fillLight.position.set(-5, 2, 3);
    scene.add(fillLight);
    scene.add(laptop);

    const screenApps = [
      { label: "Git", short: "G", icon: "https://api.iconify.design/logos/git-icon.svg", color: "#f05032" },
      { label: "Codex", short: "Cx", icon: "https://api.iconify.design/simple-icons/openai.svg?color=%23f3f3ee", color: "#f3f3ee" },
      { label: "HTML", short: "5", icon: "https://api.iconify.design/simple-icons/html5.svg?color=%23e44d26", color: "#e44d26" },
      { label: "CSS", short: "3", icon: "https://api.iconify.design/simple-icons/css.svg?color=%231572b6", color: "#1572b6" },
      { label: "JavaScript", short: "JS", icon: "https://api.iconify.design/logos/javascript.svg", color: "#f7df1e" },
      { label: "PHP", short: "php", icon: "https://api.iconify.design/logos/php.svg", color: "#777bb4" },
      { label: "Vite", short: "V", icon: "https://api.iconify.design/logos/vitejs.svg", color: "#bd34fe" },
      { label: "WordPress", short: "W", icon: "https://api.iconify.design/simple-icons/wordpress.svg?color=%2321759b", color: "#21759b" },
      { label: "Figma", short: "F", icon: "https://api.iconify.design/logos/figma.svg", color: "#a259ff" },
      { label: "Slack", short: "S", icon: "https://api.iconify.design/logos/slack-icon.svg", color: "#36c5f0" },
      { label: "Postman", short: "P", icon: "https://api.iconify.design/logos/postman-icon.svg", color: "#ff6c37" },
      { label: "Photoshop", short: "Ps", icon: "https://api.iconify.design/logos/adobe-photoshop.svg", color: "#31a8ff" },
      { label: "LocalWP", short: "L", icon: "https://api.iconify.design/simple-icons/local.svg?color=%23ffffff", color: "#46d6ad" },
      { label: "VS Code", short: "<>_", icon: "https://api.iconify.design/logos/visual-studio-code.svg", color: "#23a8f2" },
      { label: "Terminal", short: ">_", icon: "https://api.iconify.design/lucide/terminal.svg?color=%23d8ff3e", color: "#d8ff3e" },
      { label: "Chrome", short: "C", icon: "https://api.iconify.design/logos/chrome.svg", color: "#4285f4" },
    ];

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

    const createLaptopScreenTexture = () => {
      const screenCanvas = document.createElement("canvas");
      const context = screenCanvas.getContext("2d");
      const staticScreenCanvas = document.createElement("canvas");
      const staticContext = staticScreenCanvas.getContext("2d");
      const iconImages = new Map();
      const wallpaperImage = new Image();
      const footballVideo = document.createElement("video");
      const width = 1470;
      const height = 1000;
      let wallpaperLayout;
      let footballIsInView = true;
      let footballFallbackTimer;
      let lastFootballTime = -1;
      let neonStartTime;
      let lastScreenFrameTime = 0;
      const neonOutlineLength = 3406.23;
      const neonRevealDuration = 2600;
      const neonHoldDuration = 300;
      const neonFadeDuration = 850;
      const neonAnimationDuration = neonRevealDuration + neonHoldDuration + neonFadeDuration;
      // Traced from the transparent edge of the 365 × 937 wallpaper portrait.
      const neonOutlinePath = typeof Path2D === "function" ? new Path2D("M189.85,5.87 L202.63,9.03 L214.05,15.62 L223.31,24.99 L229.25,36.74 L232.08,49.63 L234.46,62.62 L237.17,75.49 L235.05,88.52 L231.32,101.19 L226.94,113.65 L226.26,126.56 L236.79,134.14 L248.93,139.39 L261.04,144.67 L273.08,150.14 L285.20,155.41 L296.62,162.00 L305.38,171.82 L311.99,183.26 L317.31,195.36 L321.54,207.88 L325.32,220.54 L328.85,233.28 L332.26,246.06 L335.68,258.82 L338.96,271.63 L340.76,284.66 L339.18,297.71 L342.96,310.36 L346.27,323.15 L349.09,336.06 L351.66,349.02 L353.06,362.17 L353.53,375.38 L353.00,388.58 L352.29,401.79 L352.30,415.00 L353.11,428.19 L352.85,441.40 L353.80,454.58 L355.90,467.62 L356.24,480.80 L353.44,493.70 L346.67,504.90 L336.01,512.64 L323.53,516.14 L322.86,504.96 L323.67,495.37 L313.49,492.25 L312.71,479.08 L313.29,465.88 L315.65,452.90 L320.63,440.65 L322.42,427.64 L320.81,414.53 L317.63,401.70 L313.41,389.17 L309.02,376.71 L305.68,363.92 L303.57,350.88 L301.33,337.85 L298.60,324.91 L295.06,312.19 L289.30,300.31 L283.26,299.66 L282.33,312.85 L282.02,326.07 L282.26,339.28 L283.51,352.43 L285.10,365.56 L287.28,378.59 L290.54,391.39 L292.77,404.42 L293.38,417.62 L293.89,430.82 L294.90,444.01 L296.75,457.10 L297.16,470.28 L295.57,483.41 L294.37,496.56 L292.98,509.71 L291.17,522.81 L288.95,535.83 L285.78,548.67 L282.54,561.48 L280.32,574.50 L279.27,587.68 L279.86,600.87 L281.69,613.96 L283.77,627.02 L285.28,640.15 L285.91,653.35 L285.47,666.55 L283.52,679.62 L280.87,692.57 L278.83,705.64 L277.68,718.80 L276.64,731.98 L275.36,745.13 L271.52,757.71 L264.05,768.57 L264.29,781.50 L266.40,794.50 L264.48,807.52 L258.18,819.08 L252.70,831.05 L248.65,843.62 L240.16,853.38 L227.19,854.45 L214.61,850.56 L206.70,840.62 L207.64,827.50 L208.61,814.34 L207.87,801.14 L208.86,788.01 L212.78,775.39 L213.41,762.30 L211.03,749.31 L213.54,736.45 L215.90,723.56 L214.30,710.44 L212.29,697.41 L200.97,698.13 L189.26,704.22 L185.85,716.36 L187.70,729.45 L188.98,742.61 L189.94,755.79 L190.64,768.99 L189.98,782.19 L190.45,795.36 L192.89,808.36 L191.94,821.46 L189.69,834.45 L190.75,847.61 L192.56,860.70 L195.66,873.55 L196.05,886.73 L195.99,899.94 L195.82,913.13 L188.67,923.85 L176.80,929.48 L163.75,931.50 L150.54,931.86 L137.46,930.31 L129.73,920.58 L131.13,907.57 L138.04,896.35 L141.78,883.83 L145.97,871.47 L151.62,859.80 L148.72,846.94 L143.27,835.03 L136.38,823.98 L135.99,810.79 L132.45,798.15 L127.73,785.82 L125.28,772.84 L123.21,759.79 L120.41,746.86 L117.68,733.93 L115.70,720.87 L114.63,707.69 L114.12,694.49 L113.14,681.31 L111.76,668.17 L110.28,655.04 L108.14,641.99 L105.96,628.96 L102.84,616.12 L100.47,603.12 L98.71,590.02 L97.11,576.89 L95.39,563.78 L93.33,550.73 L91.21,537.68 L89.26,524.61 L86.35,511.72 L83.64,498.80 L83.11,485.60 L84.20,472.44 L86.24,459.38 L86.94,446.19 L87.18,432.97 L88.25,419.80 L90.09,406.71 L90.39,393.51 L90.07,380.29 L90.58,367.09 L91.97,353.94 L92.32,340.74 L91.43,327.55 L90.24,314.38 L87.75,301.44 L80.79,309.80 L75.21,321.78 L71.88,334.56 L69.34,347.52 L67.36,360.60 L65.71,373.71 L62.70,386.57 L58.83,399.21 L54.83,411.81 L51.56,424.62 L49.00,437.58 L49.31,450.73 L54.11,463.01 L57.95,475.62 L59.15,488.78 L59.49,501.99 L55.70,514.48 L52.06,527.08 L40.04,528.14 L28.62,521.53 L19.60,512.00 L14.65,499.79 L12.72,486.73 L13.87,473.59 L16.15,460.57 L16.40,447.37 L16.47,434.16 L16.85,420.95 L16.44,407.74 L15.88,394.52 L15.33,381.31 L15.61,368.11 L17.32,355.00 L20.08,342.08 L23.05,329.20 L27.21,316.66 L28.55,303.72 L26.45,290.82 L29.31,277.91 L32.88,265.19 L36.50,252.47 L40.10,239.75 L43.41,226.96 L46.75,214.17 L50.78,201.59 L56.34,189.60 L63.31,178.39 L72.97,169.43 L84.18,162.45 L96.07,156.67 L107.85,150.68 L119.63,144.68 L131.40,138.66 L142.45,131.50 L144.89,119.13 L141.40,106.40 L136.46,94.15 L133.89,81.19 L134.63,68.13 L139.00,55.68 L141.59,42.72 L146.06,30.31 L153.97,19.79 L164.46,11.82 L176.74,7.02 Z") : null;
      screenCanvas.width = width;
      screenCanvas.height = height;
      staticScreenCanvas.width = width;
      staticScreenCanvas.height = height;

      footballVideo.autoplay = !reducedMotion;
      footballVideo.loop = true;
      footballVideo.muted = true;
      footballVideo.playsInline = true;
      footballVideo.preload = "auto";
      footballVideo.disablePictureInPicture = true;
      footballVideo.setAttribute("muted", "");
      footballVideo.setAttribute("playsinline", "");

      const texture = new CanvasTexture(screenCanvas);
      texture.colorSpace = SRGBColorSpace;
      texture.flipY = false;
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

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
          wallpaperLayout = { drawX, drawY, drawWidth, drawHeight };

          context.save();
          context.globalAlpha = 0.72;
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

      const drawFootball = () => {
        if (!wallpaperLayout || footballVideo.readyState < 2) return;

        const { drawX, drawY, drawWidth, drawHeight } = wallpaperLayout;
        const centerX = drawX + drawWidth * 0.488;
        const centerY = drawY + drawHeight * 0.694;
        const frameSize = drawWidth * 0.38;
        const radius = frameSize * 0.48;
        const backdrop = context.createRadialGradient(centerX, centerY, radius * 0.82, centerX, centerY, radius);

        backdrop.addColorStop(0, "rgba(7, 9, 7, 1)");
        backdrop.addColorStop(0.88, "rgba(7, 9, 7, 1)");
        backdrop.addColorStop(1, "rgba(7, 9, 7, 0)");
        context.fillStyle = backdrop;
        context.beginPath();
        context.arc(centerX, centerY, radius, 0, Math.PI * 2);
        context.fill();

        context.save();
        context.beginPath();
        context.arc(centerX, centerY, radius, 0, Math.PI * 2);
        context.clip();
        context.globalCompositeOperation = "screen";
        context.globalAlpha = 0.72;
        context.filter = "grayscale(1) brightness(0.82) contrast(0.92)";
        context.drawImage(footballVideo, centerX - frameSize / 2, centerY - frameSize / 2, frameSize, frameSize);
        context.restore();

        const footballVignette = context.createRadialGradient(
          centerX - radius * 0.18,
          centerY - radius * 0.2,
          radius * 0.12,
          centerX,
          centerY,
          radius,
        );
        footballVignette.addColorStop(0, "rgba(7, 9, 7, 0)");
        footballVignette.addColorStop(0.62, "rgba(7, 9, 7, 0.05)");
        footballVignette.addColorStop(1, "rgba(7, 9, 7, 0.46)");
        context.fillStyle = footballVignette;
        context.beginPath();
        context.arc(centerX, centerY, radius, 0, Math.PI * 2);
        context.fill();
      };

      const drawNeonOutline = (time = performance.now()) => {
        if (reducedMotion || !neonOutlinePath || neonStartTime === undefined || !wallpaperLayout) return;

        const elapsed = time - neonStartTime;
        if (elapsed < 0 || elapsed >= neonAnimationDuration) return;

        const revealProgress = Math.min(elapsed / neonRevealDuration, 1);
        const easedReveal = revealProgress < 0.5
          ? 4 * revealProgress ** 3
          : 1 - ((-2 * revealProgress + 2) ** 3) / 2;
        const fadeStart = neonRevealDuration + neonHoldDuration;
        const opacity = elapsed <= fadeStart
          ? 1
          : Math.max(0, 1 - (elapsed - fadeStart) / neonFadeDuration);
        const { drawX, drawY, drawWidth, drawHeight } = wallpaperLayout;

        context.save();
        context.translate(drawX, drawY);
        context.scale(drawWidth / wallpaperImage.naturalWidth, drawHeight / wallpaperImage.naturalHeight);
        context.lineCap = "round";
        context.lineJoin = "round";
        context.setLineDash([neonOutlineLength, neonOutlineLength]);
        context.lineDashOffset = neonOutlineLength * (1 - easedReveal);

        context.strokeStyle = `rgba(255, 255, 255, ${0.18 * opacity})`;
        context.lineWidth = 8;
        context.shadowColor = `rgba(255, 255, 255, ${0.8 * opacity})`;
        context.shadowBlur = 24;
        context.stroke(neonOutlinePath);

        context.strokeStyle = `rgba(255, 255, 255, ${0.96 * opacity})`;
        context.lineWidth = 1.6;
        context.shadowColor = `rgba(255, 255, 255, ${0.96 * opacity})`;
        context.shadowBlur = 8;
        context.stroke(neonOutlinePath);
        context.restore();
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

      const drawStaticHomeScreen = () => {
        context.clearRect(0, 0, width, height);
        drawWallpaper();

        const dockApps = screenApps;
        const dockWidth = 1040;
        const dockHeight = 62;
        const dockX = (width - dockWidth) / 2;
        const dockY = height - 170;
        addRoundedRect(context, dockX, dockY, dockWidth, dockHeight, 22);
        context.fillStyle = "rgba(20, 24, 20, 0.84)";
        context.fill();
        context.strokeStyle = "rgba(255, 255, 255, 0.15)";
        context.lineWidth = 1.5;
        context.stroke();

        dockApps.forEach((app, index) => {
          const size = 42;
          const x = dockX + 42 + index * 61;
          const y = dockY + 10;
          addRoundedRect(context, x, y, size, size, 12);
          context.fillStyle = "rgba(255, 255, 255, 0.045)";
          context.fill();
          drawIcon(app, x, y, size, true);
        });
      };

      const drawScreenFrame = (time = performance.now()) => {
        context.clearRect(0, 0, width, height);
        context.drawImage(staticScreenCanvas, 0, 0);
        drawFootball();
        drawNeonOutline(time);
      };

      const cacheStaticScreen = () => {
        drawStaticHomeScreen();
        staticContext.clearRect(0, 0, width, height);
        staticContext.drawImage(screenCanvas, 0, 0);
        drawScreenFrame();
      };

      const updateScreenFrame = (time = performance.now()) => {
        drawScreenFrame(time);
        lastScreenFrameTime = time;
        texture.needsUpdate = true;
        requestRender();
      };

      const startNeonAnimation = () => {
        if (reducedMotion || !neonOutlinePath || neonStartTime !== undefined) return;

        neonStartTime = performance.now();

        const tick = (time) => {
          if (time - lastScreenFrameTime > 24) updateScreenFrame(time);

          if (time - neonStartTime < neonAnimationDuration) {
            requestAnimationFrame(tick);
          } else {
            updateScreenFrame(time);
          }
        };

        requestAnimationFrame(tick);
      };

      const updateFootballVisibility = () => {
        if (reducedMotion || footballVideo.readyState < 2) return;

        if (footballIsInView && !document.hidden) {
          footballVideo.play().catch(() => {});
        } else {
          footballVideo.pause();
        }
      };

      cacheStaticScreen();

      wallpaperImage.onload = () => {
        cacheStaticScreen();
        texture.needsUpdate = true;
        requestRender();
        startNeonAnimation();
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

      footballVideo.addEventListener("loadeddata", () => {
        updateScreenFrame();

        if (reducedMotion) return;

        if ("requestVideoFrameCallback" in footballVideo) {
          const handleFootballFrame = (time) => {
            updateScreenFrame(time);
            footballVideo.requestVideoFrameCallback(handleFootballFrame);
          };
          footballVideo.requestVideoFrameCallback(handleFootballFrame);
        } else {
          const startFootballFallback = () => {
            if (footballFallbackTimer) return;
            footballFallbackTimer = window.setInterval(() => {
              if (footballVideo.currentTime !== lastFootballTime) {
                lastFootballTime = footballVideo.currentTime;
                updateScreenFrame();
              }
            }, 1000 / 60);
          };
          const stopFootballFallback = () => {
            window.clearInterval(footballFallbackTimer);
            footballFallbackTimer = undefined;
          };

          footballVideo.addEventListener("play", startFootballFallback);
          footballVideo.addEventListener("pause", stopFootballFallback);
        }

        updateFootballVisibility();
      }, { once: true });

      if ("IntersectionObserver" in window) {
        const footballVisibility = new IntersectionObserver(([entry]) => {
          footballIsInView = entry.isIntersecting;
          updateFootballVisibility();
        });
        footballVisibility.observe(modelHost);
      }

      document.addEventListener("visibilitychange", updateFootballVisibility);
      footballVideo.src = "assets/football-spin-loop.mp4";
      footballVideo.load();

      return texture;
    };

    const resize = () => {
      const bounds = modelHost.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      renderer.setPixelRatio(dpr);
      renderer.setSize(bounds.width, bounds.height, false);
      const aspect = bounds.width / bounds.height;
      const portraitCameraZ = 78 + Math.max(0, 1.1 - aspect) * 80;
      const compactCameraZ = window.innerWidth <= 800 ? 88 : 78;
      camera.aspect = aspect;
      camera.position.z = MathUtils.clamp(Math.max(compactCameraZ, portraitCameraZ), 78, 108);
      camera.updateProjectionMatrix();
    };

    const updateScroll = () => {
      const bounds = document.querySelector(".hero").getBoundingClientRect();
      const progress = MathUtils.clamp(-bounds.top / Math.max(1, bounds.height), 0, 1);
      targetRotation = -0.45 + progress * Math.PI * 0.95;
      targetLift = progress * (window.innerWidth <= 800 ? 5 : -10);
    };

    new GLTFLoader().load("assets/macbook.glb", ({ scene: loadedScene }) => {
      const baseMetal = new MeshStandardMaterial({ color: 0x9da1a5, metalness: 0.82, roughness: 0.3 });
      const darkPlastic = new MeshStandardMaterial({ color: 0x080909, metalness: 0.35, roughness: 0.72 });
      const logo = new MeshBasicMaterial({ color: 0xd8ff3e });

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

      const screenTexture = createLaptopScreenTexture();
      const screen = new Mesh(new PlaneGeometry(29.4, 20), new MeshBasicMaterial({ color: 0xffffff, map: screenTexture, side: BackSide, toneMapped: false }));
      screen.position.set(0, 10.5, -0.11);
      screen.rotation.set(Math.PI, 0, 0);
      loadedScene.add(screen);
      laptop.add(loadedScene);
      modelReady = true;
      requestRender();
    });

    const render = () => {
      frame = undefined;
      if (!modelReady) return;
      laptop.rotation.y = reducedMotion ? targetRotation : MathUtils.lerp(laptop.rotation.y, targetRotation, 0.075);
      laptop.position.y = reducedMotion ? targetLift : MathUtils.lerp(laptop.position.y, targetLift, 0.075);
      laptop.rotation.z = MathUtils.lerp(laptop.rotation.z, -0.05, 0.075);
      renderer.render(scene, camera);

      if (!reducedMotion && (Math.abs(laptop.rotation.y - targetRotation) > 0.001 || Math.abs(laptop.position.y - targetLift) > 0.001)) {
        requestRender();
      }
    };

    const requestRender = () => {
      if (!frame) frame = window.requestAnimationFrame(render);
    };

    camera.position.set(0, 0.1, 78);
    resize();
    updateScroll();
    window.addEventListener("resize", () => { resize(); updateScroll(); requestRender(); });
    window.addEventListener("scroll", () => { updateScroll(); requestRender(); }, { passive: true });
    requestRender();
  }).catch(() => {
    heroModelCanvas.parentElement.classList.add("hero__model--unavailable");
  });
}
