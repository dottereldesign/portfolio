import { createLaptopArtwork } from "./laptop-artwork.js";
import { createLaptopScreen } from "./laptop-screen.js";

const heroModelCanvas = document.querySelector(".hero__model-canvas");

if (heroModelCanvas) {
  import("../../assets/vendor/laptop-runtime.min.js?v=20260731-1").then(({ Scene, PerspectiveCamera, WebGLRenderer, AmbientLight, DirectionalLight, Group, MathUtils, MeshStandardMaterial, MeshBasicMaterial, PlaneGeometry, Mesh, BackSide, DoubleSide, CanvasTexture, LinearFilter, SRGBColorSpace, Raycaster, Vector2, Color, GLTFLoader }) => {
    const modelHost = heroModelCanvas.parentElement;
    const hero = document.querySelector(".hero");
    const capabilitiesSection = document.querySelector(".capabilities");
    const capabilitiesIntro = capabilitiesSection?.querySelector(".capabilities__intro");
    const workSection = document.querySelector("#work");
    const workHeading = workSection?.querySelector(".work-heading");

    if (!hero || !capabilitiesSection || !workSection || !workHeading) throw new Error("Laptop stage is incomplete");

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
    const laptopEntranceDurationMs = 1250;
    const laptopEntranceDelayMs = 100;
    let laptopEntranceStartedAt;
    let laptopEntranceProgress = reducedMotion ? 1 : 0;
    let modelReady = false;
    let modelHasPainted = false;
    let heroIsVisible = true;
    let capabilitiesAreVisible = false;
    let workIsVisible = false;
    let targetMotionScroll = window.scrollY;
    let currentMotionScroll = window.scrollY;
    let lastMotionFrameTime;
    let motionMetrics;
    let motionState = {
      phase: "hero",
      hostX: 0,
      hostY: 0,
      hostScale: 1,
      rotationX: 0,
      rotationY: -0.45,
      rotationZ: -0.05,
      lift: 0,
      lidRotation: 0,
      stickerTimeline: 0,
    };
    let heroScrollDirty = false;
    let frame;
    let screenMesh;
    let screenController;
    let lidGroup;
    let lidOpenRotationX = 0;
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

    const heroGlowColor = new Color(0xff5a24);
    const capabilitiesGlowColor = new Color(0x5d61d8);
    const keyLight = new DirectionalLight(heroGlowColor, 2.4);
    keyLight.position.set(4, 5, 6);
    scene.add(keyLight);

    // Keep the cool side definition without letting the lid flash white as its
    // broad face crosses the light during the hero-to-capabilities turn.
    const fillLight = new DirectionalLight(0x8791d8, 0.68);
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
      { label: "JavaScript", short: "JS", icon: "https://api.iconify.design/logos/javascript.svg", color: "#f7df1e", x: -11.8, y: 15.7, width: 4.3, height: 4.3, rotation: -0.12, shape: "rounded" },
      { label: "CSS", short: "CSS", icon: "https://api.iconify.design/logos/css-3.svg", color: "#1572b6", x: 11.5, y: 15.4, width: 3.9, height: 4.4, rotation: 0.11, shape: "shield" },
      { label: "HTML", short: "HTML", icon: "https://api.iconify.design/logos/html-5.svg", color: "#e34f26", x: -9.8, y: 8.8, width: 3.8, height: 4.3, rotation: 0.1, shape: "shield" },
      { label: "PHP", short: "PHP", icon: "https://api.iconify.design/logos/php.svg", color: "#777bb4", x: 8.5, y: 9.1, width: 5.7, height: 3.6, rotation: -0.1, shape: "pill" },
      { label: "Git", short: "GIT", icon: "https://api.iconify.design/logos/git-icon.svg", color: "#f05032", x: -5.1, y: 4.5, width: 3.8, height: 3.8, rotation: -0.17, shape: "diamond" },
      { label: "Vite", short: "V", icon: "https://api.iconify.design/logos/vitejs.svg", color: "#646cff", x: 4.5, y: 4.2, width: 3.9, height: 4.1, rotation: 0.13, shape: "rounded" },
      { label: "WordPress", short: "W", icon: "https://api.iconify.design/logos/wordpress-icon.svg", color: "#21759b", x: 12.1, y: 4.9, width: 3.5, height: 3.5, rotation: -0.06, shape: "circle" },
      { label: "Kiwi bird", x: -12.1, y: 4.1, width: 6.1, height: 4.25, rotation: -0.08, shape: "kiwi" },
      { label: "Binary: it's as easy as 01.10.11", x: 0, y: 16.8, width: 12.4, height: 4.5, rotation: -0.04, shape: "binary" },
    ];

    const {
      addRoundedRect,
      createLidSticker,
      createPortraitOverlayTexture,
      createScreenGlassTexture,
      getDockLayout,
      loadScreenIcon,
    } = createLaptopArtwork({
      CanvasTexture,
      DoubleSide,
      LinearFilter,
      Mesh,
      MeshBasicMaterial,
      PlaneGeometry,
      SRGBColorSpace,
      renderer,
      requestRender: () => requestRender(),
      screenApps,
      usesCompactRendering,
    });

    const { createLaptopScreenTexture } = createLaptopScreen({
      CanvasTexture,
      LinearFilter,
      MathUtils,
      SRGBColorSpace,
      addRoundedRect,
      getDockLayout,
      loadScreenIcon,
      reducedMotion,
      requestRender: () => requestRender(),
      screenApps,
      usesCompactRendering,
    });

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
      if (!coarsePointerQuery.matches) return;
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
      const portraitCameraZ = (usesStackedHeroLayout() ? 78 : 100) + Math.max(0, 1.1 - aspect) * 80;
      const compactCameraZ = usesStackedHeroLayout() ? 85 : 100;
      camera.aspect = aspect;
      camera.position.z = MathUtils.clamp(Math.max(compactCameraZ, portraitCameraZ), 78, 130);
      camera.updateProjectionMatrix();
    };

    const quinticEase = (value) => {
      const progress = MathUtils.clamp(value, 0, 1);
      return progress * progress * progress * (progress * (progress * 6 - 15) + 10);
    };

    const HERO_LANDING_SYNC_START = 0.58;
    const HERO_LANDING_SYNC_END = 0.65;
    const progressBetween = (value, start, end) => quinticEase((value - start) / Math.max(1, end - start));

    const getDocumentBounds = (element) => {
      const bounds = element.getBoundingClientRect();
      return {
        top: bounds.top + window.scrollY,
        bottom: bounds.bottom + window.scrollY,
        height: bounds.height,
      };
    };

    const refreshMotionMetrics = () => {
      const heroBounds = getDocumentBounds(hero);
      const capabilitiesBounds = getDocumentBounds(capabilitiesSection);
      const capabilitiesIntroBounds = getDocumentBounds(capabilitiesIntro || capabilitiesSection);
      const workBounds = getDocumentBounds(workSection);
      const workHeadingBounds = getDocumentBounds(workHeading);
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const heroFlightEnd = heroBounds.bottom;
      const workTop = workBounds.top;
      // Let the capabilities laptop leave with its section before the Made by me
      // grid arrives. The laptop is not reused as a project-section visual.
      const workEnterStart = Math.max(
        heroFlightEnd + viewportHeight * 0.44,
        workTop - viewportHeight * 0.5,
      );
      const workEnterEnd = Math.max(workEnterStart + viewportHeight * 0.36, workTop - viewportHeight * 0.14);
      const capabilitiesLandingCenter = MathUtils.clamp(
        capabilitiesIntroBounds.top + capabilitiesIntroBounds.height * 0.52 - heroFlightEnd,
        viewportHeight * 0.3,
        viewportHeight * 0.47,
      );

      motionMetrics = {
        viewportHeight,
        viewportWidth,
        heroFlightStart: heroBounds.top,
        heroFlightEnd,
        capabilitiesTop: capabilitiesBounds.top,
        capabilitiesBottom: capabilitiesBounds.bottom,
        capabilitiesLandingCenter,
        workEnterStart,
        workEnterEnd,
        workTop,
        workBottom: workBounds.bottom,
        workHeadingBottom: workHeadingBounds.bottom,
      };
    };

    const resolveLaptopMotion = (smoothedScrollPosition, pageScrollPosition = smoothedScrollPosition) => {
      if (!motionMetrics) refreshMotionMetrics();

      const metrics = motionMetrics;
      const viewportHeight = metrics.viewportHeight;
      const viewportWidth = metrics.viewportWidth;
      const initialDesktopOffset = viewportWidth >= 1101 ? Math.min(112, viewportHeight * 0.085) : 0;
      const heroFlightDistance = Math.max(1, metrics.heroFlightEnd - metrics.heroFlightStart);
      const pageHeroProgress = MathUtils.clamp(
        (pageScrollPosition - metrics.heroFlightStart) / heroFlightDistance,
        0,
        1,
      );
      // The opening sweep keeps its soft response. Before the laptop reaches the
      // capabilities section, control passes progressively to the browser's real
      // scroll position. This prevents the fixed WebGL layer from hovering while
      // its destination section has already moved underneath it.
      const landingScrollSync = quinticEase(
        (pageHeroProgress - HERO_LANDING_SYNC_START)
          / (HERO_LANDING_SYNC_END - HERO_LANDING_SYNC_START),
      );
      const heroScrollPosition = MathUtils.lerp(
        smoothedScrollPosition,
        pageScrollPosition,
        landingScrollSync,
      );
      const heroProgress = progressBetween(heroScrollPosition, metrics.heroFlightStart, metrics.heroFlightEnd);

      if (reducedMotion) {
        return {
          phase: "reduced-motion",
          hostX: 0,
          hostY: -pageScrollPosition + initialDesktopOffset,
          hostScale: 1,
          rotationX: 0,
          rotationY: -0.45,
          rotationZ: -0.05,
          lift: 0,
          lidRotation: 0,
          stickerTimeline: 0,
        };
      }

      if (usesStackedHeroLayout()) {
        return {
          phase: heroProgress < 1 ? "mobile-hero-flight" : "mobile-hero-exit",
          hostX: 0,
          hostY: -pageScrollPosition,
          hostScale: 1,
          rotationX: 0,
          rotationY: MathUtils.lerp(-0.45, -0.45 + Math.PI * 0.95, heroProgress),
          rotationZ: -0.05,
          lift: MathUtils.lerp(0, 5, heroProgress),
          lidRotation: 0,
          stickerTimeline: 0,
        };
      }

      const isWideDesktop = viewportWidth >= 1101;
      const capabilitiesHostX = viewportWidth <= 1100 ? -viewportWidth * 0.06 : Math.min(40, viewportWidth * 0.03);
      const capabilitiesHostY = metrics.capabilitiesLandingCenter - viewportHeight * 0.55;
      const capabilitiesScale = isWideDesktop ? 0.6 : 0.44;
      const capabilitiesRotationY = Math.PI - 0.35;
      // Give both poses enough room to clear the viewport without turning edge-on.
      const offscreenHostX = capabilitiesHostX + viewportWidth * 0.72;

      if (pageScrollPosition <= metrics.heroFlightEnd) {
        const flightArc = Math.sin(heroProgress * Math.PI) * viewportHeight * 0.08;
        return {
          phase: heroProgress < 0.999 ? "hero-to-capabilities" : "capabilities-landed",
          hostX: MathUtils.lerp(0, capabilitiesHostX, heroProgress),
          hostY: MathUtils.lerp(initialDesktopOffset, capabilitiesHostY, heroProgress) + flightArc,
          hostScale: MathUtils.lerp(1, capabilitiesScale, heroProgress),
          rotationX: MathUtils.lerp(0, -0.12, heroProgress),
          rotationY: MathUtils.lerp(-0.45, capabilitiesRotationY, heroProgress),
          rotationZ: MathUtils.lerp(-0.05, 0.035, heroProgress),
          lift: MathUtils.lerp(0, -4, heroProgress),
          lidRotation: 0,
          stickerTimeline: heroProgress,
          landingScrollSync,
        };
      }

      if (pageScrollPosition < metrics.workEnterStart) {
        return {
          phase: "capabilities-track-with-section",
          hostX: capabilitiesHostX,
          hostY: capabilitiesHostY - (pageScrollPosition - metrics.heroFlightEnd),
          hostScale: capabilitiesScale,
          rotationX: -0.12,
          rotationY: capabilitiesRotationY,
          rotationZ: 0.035,
          lift: -4,
          lidRotation: 0,
          stickerTimeline: 1,
          landingScrollSync: 1,
        };
      }

      if (pageScrollPosition <= metrics.workEnterEnd) {
        const exitProgress = progressBetween(pageScrollPosition, metrics.workEnterStart, metrics.workEnterEnd);
        return {
          phase: "work-slide-out",
          hostX: MathUtils.lerp(capabilitiesHostX, offscreenHostX, exitProgress),
          hostY: capabilitiesHostY - (pageScrollPosition - metrics.heroFlightEnd),
          hostScale: capabilitiesScale,
          rotationX: -0.12,
          rotationY: capabilitiesRotationY,
          rotationZ: 0.035,
          lift: -3,
          lidRotation: 0,
          stickerTimeline: 1,
          landingScrollSync: 1,
        };
      }

      return {
        phase: "work-offscreen",
        hostX: offscreenHostX,
        hostY: capabilitiesHostY - (pageScrollPosition - metrics.heroFlightEnd),
        hostScale: capabilitiesScale,
        rotationX: -0.12,
        rotationY: capabilitiesRotationY,
        rotationZ: 0.035,
        lift: -3,
        lidRotation: 0,
        stickerTimeline: 1,
        landingScrollSync: 1,
      };
    };

    const applyLaptopMotion = (smoothedScrollPosition, pageScrollPosition = smoothedScrollPosition) => {
      motionState = resolveLaptopMotion(smoothedScrollPosition, pageScrollPosition);
      const capabilitiesGlowProgress = motionMetrics
        ? MathUtils.clamp(
          (pageScrollPosition - motionMetrics.heroFlightStart)
            / Math.max(1, motionMetrics.heroFlightEnd - motionMetrics.heroFlightStart),
          0,
          1,
        )
        : 0;
      keyLight.color.copy(heroGlowColor).lerp(capabilitiesGlowColor, capabilitiesGlowProgress);
      laptop.rotation.set(motionState.rotationX, motionState.rotationY, motionState.rotationZ);
      laptop.position.y = motionState.lift;
      if (lidGroup) lidGroup.rotation.x = lidOpenRotationX + motionState.lidRotation;
      const entranceOffset = motionMetrics
        ? (1 - quinticEase(laptopEntranceProgress))
          * motionMetrics.viewportWidth
          * (usesStackedHeroLayout() ? 1 : 0.78)
        : 0;
      modelHost.style.setProperty("--model-shift-x", `${(motionState.hostX + entranceOffset).toFixed(2)}px`);
      modelHost.style.setProperty("--model-shift-y", `${motionState.hostY.toFixed(2)}px`);
      modelHost.style.setProperty("--model-scale", motionState.hostScale.toFixed(4));
      modelHost.dataset.motionPhase = motionState.phase;
    };

    // Regression note: a78bc97 added a second per-channel convergence/lock after the
    // scroll timeline. That made a moving viewport-relative target bounce and snap.
    // Keep one smoothed scalar for the opening sweep, then synchronize the landing
    // to the real page scroll so the laptop behaves like part of its section.
    modelHost.__getLaptopMotionState = () => ({
      ...motionState,
      currentScroll: currentMotionScroll,
      targetScroll: targetMotionScroll,
      entranceProgress: laptopEntranceProgress,
      metrics: motionMetrics ? { ...motionMetrics } : null,
    });

    const updateScroll = () => {
      targetMotionScroll = window.scrollY;
      moveModelToPageOverlay();
    };

    const laptopModelUrl = new URL("assets/macbook.glb", document.baseURI);
    const laptopLoadTimeoutMs = 12000;
    const fetchLaptopModel = async (retry = false) => {
      const requestUrl = new URL(laptopModelUrl);
      if (retry) requestUrl.searchParams.set("retry", Date.now().toString());

      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), laptopLoadTimeoutMs);

      try {
        const response = await fetch(requestUrl, {
          cache: retry ? "reload" : "default",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`Laptop model request failed with ${response.status}`);

        const modelData = await response.arrayBuffer();
        const resourcePath = new URL(".", laptopModelUrl).href;
        return await new Promise((resolve, reject) => {
          new GLTFLoader().parse(modelData, resourcePath, resolve, reject);
        });
      } finally {
        window.clearTimeout(timeout);
      }
    };

    const loadLaptopModel = async () => {
      try {
        return await fetchLaptopModel();
      } catch {
        return fetchLaptopModel(true);
      }
    };

    loadLaptopModel().then(({ scene: loadedScene }) => {
      const baseMetal = new MeshStandardMaterial({ color: 0x73777d, metalness: 0.7, roughness: 0.52 });
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

      const screenGlass = new Mesh(screenGeometry, new MeshBasicMaterial({
        color: 0xffffff,
        depthWrite: false,
        map: createScreenGlassTexture(),
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
        side: BackSide,
        toneMapped: false,
        transparent: true,
      }));
      screenGlass.position.copy(screen.position);
      screenGlass.position.z += 0.024;
      screenGlass.rotation.copy(screen.rotation);
      screenGlass.renderOrder = 3;
      loadedScene.add(screenGlass);

      const stickerGroup = new Group();
      lidStickerSpecs.forEach((spec, index) => {
        const sticker = createLidSticker(spec, index);
        stickerGroup.add(sticker);
        stickerMeshes.push(sticker);
      });
      loadedScene.add(stickerGroup);

      lidGroup = loadedScene.getObjectByName("_top");
      if (lidGroup) {
        lidOpenRotationX = lidGroup.rotation.x;
        loadedScene.updateMatrixWorld(true);
        [screen, portraitOverlay, screenGlass, stickerGroup].forEach((lidLayer) => lidGroup.attach(lidLayer));
        loadedScene.updateMatrixWorld(true);
      }

      laptop.add(loadedScene);
      modelReady = true;
      requestRender();
    }).catch(() => {
      modelHost.classList.add("hero__model--unavailable");
    });

    const render = () => {
      frame = undefined;
      if (!modelReady) return;
      if (heroScrollDirty) {
        updateScroll();
        heroScrollDirty = false;
      }
      const now = performance.now();
      const elapsedSeconds = lastMotionFrameTime === undefined
        ? 1 / 60
        : MathUtils.clamp((now - lastMotionFrameTime) / 1000, 1 / 240, 1 / 20);
      const motionResponse = 9.5;
      const motionEase = 1 - Math.exp(-motionResponse * elapsedSeconds);
      lastMotionFrameTime = now;
      if (laptopEntranceProgress < 1) {
        if (laptopEntranceStartedAt === undefined) {
          if (targetMotionScroll > 10) laptopEntranceProgress = 1;
          else laptopEntranceStartedAt = now + laptopEntranceDelayMs;
        }

        if (laptopEntranceStartedAt !== undefined) {
          laptopEntranceProgress = MathUtils.clamp(
            (now - laptopEntranceStartedAt) / laptopEntranceDurationMs,
            0,
            1,
          );
        }
      }
      const scrollDifference = targetMotionScroll - currentMotionScroll;
      const pageHeroProgress = motionMetrics
        ? (targetMotionScroll - motionMetrics.heroFlightStart)
          / Math.max(1, motionMetrics.heroFlightEnd - motionMetrics.heroFlightStart)
        : 0;
      const landingTracksPageDirectly = pageHeroProgress >= HERO_LANDING_SYNC_END;
      if (reducedMotion || usesStackedHeroLayout() || landingTracksPageDirectly) {
        currentMotionScroll = targetMotionScroll;
      }
      else if (Math.abs(scrollDifference) <= 0.01) currentMotionScroll = targetMotionScroll;
      else currentMotionScroll += scrollDifference * motionEase;

      applyLaptopMotion(currentMotionScroll, targetMotionScroll);

      stickerMeshes.forEach((sticker, index) => {
        const stagger = stickerMeshes.length > 1 ? 0.72 / (stickerMeshes.length - 1) : 0;
        const start = index * stagger;
        const end = start + 0.28;
        const targetReveal = MathUtils.clamp((motionState.stickerTimeline - start) / (end - start), 0, 1);
        const reveal = 1 - Math.pow(1 - targetReveal, 3);
        sticker.userData.currentReveal = reveal;
        sticker.visible = reveal > 0.005;
        sticker.material.opacity = MathUtils.clamp(reveal * 1.35, 0, 1);
        sticker.scale.setScalar(0.68 + reveal * 0.32);
        sticker.position.z = sticker.userData.baseZ - (1 - reveal) * 0.35;
        sticker.rotation.z = sticker.userData.baseRotation + (1 - reveal) * 0.28 * sticker.userData.revealDirection;
      });

      if (laptopEntranceProgress >= 1) screenController?.startDockReveal(now);
      const dockIsAnimating = screenController?.update(now) ?? false;
      renderer.render(scene, camera);

      if (!modelHasPainted) {
        modelHasPainted = true;
        modelHost.classList.add("hero__model--ready");
      }

      if (
        Math.abs(targetMotionScroll - currentMotionScroll) > 0.01
        || dockIsAnimating
        || laptopEntranceProgress < 1
      ) {
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
          if (entry.target === workSection) workIsVisible = entry.isIntersecting;
        });

        if (heroIsVisible || capabilitiesAreVisible || workIsVisible) {
          heroScrollDirty = true;
          requestRender();
        }
      }, { rootMargin: "20% 0px" });

      modelVisibility.observe(hero);
      modelVisibility.observe(capabilitiesSection);
      modelVisibility.observe(workSection);
    }

    camera.position.set(0, 0.1, usesStackedHeroLayout() ? 85 : 100);
    resize();
    refreshMotionMetrics();
    updateScroll();
    currentMotionScroll = targetMotionScroll;
    window.addEventListener("resize", () => {
      resize();
      motionMetrics = undefined;
      refreshMotionMetrics();
      updateScroll();
      currentMotionScroll = targetMotionScroll;
      requestRender();
    });
    window.addEventListener("scroll", () => {
      setDockHover(-1);
      // Capture the browser's scroll position in the scroll event itself. The
      // following animation frame can then place the landed laptop before paint,
      // instead of displaying one stale frame and correcting it afterward.
      targetMotionScroll = window.scrollY;
      requestRender();
    }, { passive: true });
    requestRender();
  }).catch(() => {
    heroModelCanvas.closest(".hero__model")?.classList.add("hero__model--unavailable");
  });
}
