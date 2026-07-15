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
  import("three").then(async ({ Scene, PerspectiveCamera, WebGLRenderer, AmbientLight, DirectionalLight, Group, MathUtils, MeshStandardMaterial, MeshBasicMaterial, PlaneGeometry, Mesh, BackSide, CanvasTexture, LinearFilter, SRGBColorSpace }) => {
    const { GLTFLoader } = await import("https://unpkg.com/three@0.181.2/examples/jsm/loaders/GLTFLoader.js");
    const modelHost = heroModelCanvas.parentElement;
    const hero = modelHost.closest(".hero");
    const scene = new Scene();
    const stackedHeroQuery = window.matchMedia("(max-width: 800px), (max-width: 1024px) and (max-aspect-ratio: 1/1)");
    const coarsePointerQuery = window.matchMedia("(pointer: coarse)");
    const usesStackedHeroLayout = () => stackedHeroQuery.matches;
    const usesCompactRendering = () => usesStackedHeroLayout() || coarsePointerQuery.matches;
    // Keep the full laptop inside the depth range while it rotates on scroll.
    const camera = new PerspectiveCamera(28, 1, 0.1, 250);
    const renderer = new WebGLRenderer({
      alpha: true,
      antialias: !usesCompactRendering(),
      canvas: heroModelCanvas,
      powerPreference: "high-performance",
    });
    const laptop = new Group();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let modelReady = false;
    let heroIsVisible = true;
    let targetRotation = -0.45;
    let targetLift = 0;
    let heroScrollDirty = false;
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
      const optimizeForCompactHero = usesCompactRendering();
      const textureScale = optimizeForCompactHero ? 0.5 : 1;
      let wallpaperLayout;
      let footballIsInView = true;
      let footballFallbackTimer;
      let footballResumeTimer;
      let lastFootballTime = -1;
      screenCanvas.width = Math.round(width * textureScale);
      screenCanvas.height = Math.round(height * textureScale);
      staticScreenCanvas.width = screenCanvas.width;
      staticScreenCanvas.height = screenCanvas.height;
      context.setTransform(textureScale, 0, 0, textureScale, 0, 0);
      staticContext.setTransform(textureScale, 0, 0, textureScale, 0, 0);

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

      const drawScreenFrame = () => {
        context.clearRect(0, 0, width, height);
        drawCanvasAtLogicalSize(context, staticScreenCanvas);
        drawFootball();
      };

      const cacheStaticScreen = () => {
        drawStaticHomeScreen();
        staticContext.clearRect(0, 0, width, height);
        drawCanvasAtLogicalSize(staticContext, screenCanvas);
        drawScreenFrame();
      };

      const updateFootballFrame = () => {
        drawScreenFrame();
        texture.needsUpdate = true;
        requestRender();
      };

      const updateFootballVisibility = () => {
        if (reducedMotion || footballVideo.readyState < 2) return;

        if (footballIsInView && !document.hidden) {
          footballVideo.play().catch(() => {});
        } else {
          footballVideo.pause();
        }
      };

      const pauseFootballForInteraction = () => {
        if (!optimizeForCompactHero || reducedMotion || footballVideo.readyState < 2) return;

        if (!footballVideo.paused) footballVideo.pause();
        window.clearTimeout(footballResumeTimer);
        footballResumeTimer = window.setTimeout(updateFootballVisibility, 180);
      };

      if (optimizeForCompactHero) {
        window.addEventListener("touchstart", pauseFootballForInteraction, { passive: true });
        window.addEventListener("scroll", pauseFootballForInteraction, { passive: true });
      }

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

      footballVideo.addEventListener("loadeddata", () => {
        updateFootballFrame();

        if (reducedMotion) return;

        if ("requestVideoFrameCallback" in footballVideo) {
          const handleFootballFrame = () => {
            updateFootballFrame();
            footballVideo.requestVideoFrameCallback(handleFootballFrame);
          };
          footballVideo.requestVideoFrameCallback(handleFootballFrame);
        } else {
          const startFootballFallback = () => {
            if (footballFallbackTimer) return;
            footballFallbackTimer = window.setInterval(() => {
              if (footballVideo.currentTime !== lastFootballTime) {
                lastFootballTime = footballVideo.currentTime;
                updateFootballFrame();
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
      const maxDpr = usesCompactRendering() ? 1.25 : 2;
      const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
      renderer.setPixelRatio(dpr);
      renderer.setSize(bounds.width, bounds.height, false);
      const aspect = bounds.width / bounds.height;
      const portraitCameraZ = 78 + Math.max(0, 1.1 - aspect) * 80;
      const compactCameraZ = usesStackedHeroLayout() ? 85 : 78;
      camera.aspect = aspect;
      camera.position.z = MathUtils.clamp(Math.max(compactCameraZ, portraitCameraZ), 78, 108);
      camera.updateProjectionMatrix();
    };

    const updateScroll = () => {
      const bounds = hero.getBoundingClientRect();
      const progress = MathUtils.clamp(-bounds.top / Math.max(1, bounds.height), 0, 1);
      targetRotation = -0.45 + progress * Math.PI * 0.95;
      targetLift = progress * (usesStackedHeroLayout() ? 5 : -10);
    };

    new GLTFLoader().load("assets/macbook.glb", ({ scene: loadedScene }) => {
      const baseMetal = new MeshStandardMaterial({ color: 0x9da1a5, metalness: 0.82, roughness: 0.3 });
      const darkPlastic = new MeshStandardMaterial({ color: 0x080909, metalness: 0.35, roughness: 0.72 });
      const logo = new MeshBasicMaterial({ color: 0xd8ff3e });
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
      if (heroScrollDirty) {
        updateScroll();
        heroScrollDirty = false;
      }
      const motionEase = usesCompactRendering() ? 0.16 : 0.075;
      laptop.rotation.y = reducedMotion ? targetRotation : MathUtils.lerp(laptop.rotation.y, targetRotation, motionEase);
      laptop.position.y = reducedMotion ? targetLift : MathUtils.lerp(laptop.position.y, targetLift, motionEase);
      laptop.rotation.z = MathUtils.lerp(laptop.rotation.z, -0.05, motionEase);
      renderer.render(scene, camera);

      if (!reducedMotion && (Math.abs(laptop.rotation.y - targetRotation) > 0.001 || Math.abs(laptop.position.y - targetLift) > 0.001)) {
        requestRender();
      }
    };

    const requestRender = () => {
      if (!frame) frame = window.requestAnimationFrame(render);
    };

    if ("IntersectionObserver" in window) {
      const heroVisibility = new IntersectionObserver(([entry]) => {
        heroIsVisible = entry.isIntersecting;
        if (heroIsVisible) {
          heroScrollDirty = true;
          requestRender();
        }
      }, { rootMargin: "20% 0px" });

      heroVisibility.observe(hero);
    }

    camera.position.set(0, 0.1, 78);
    resize();
    updateScroll();
    window.addEventListener("resize", () => { resize(); updateScroll(); requestRender(); });
    window.addEventListener("scroll", () => {
      if (!heroIsVisible) return;
      heroScrollDirty = true;
      requestRender();
    }, { passive: true });
    requestRender();
  }).catch(() => {
    heroModelCanvas.parentElement.classList.add("hero__model--unavailable");
  });
}
