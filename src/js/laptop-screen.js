export const createLaptopScreen = ({
  CanvasTexture,
  LinearFilter,
  MathUtils,
  SRGBColorSpace,
  addRoundedRect,
  getDockLayout,
  loadScreenIcon,
  reducedMotion,
  requestRender,
  screenApps,
  usesCompactRendering,
}) => {
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
      const dockRevealProgresses = screenApps.map(() => reducedMotion ? 1 : 0);
      const dockRevealStaggerMs = 65;
      const dockIconRevealDurationMs = 340;
      let dockRevealStartedAt;
      let dockRevealComplete = reducedMotion;
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
          const reveal = dockRevealProgresses[index];
          if (reveal <= 0.001) return;

          const revealEase = 1 - Math.pow(1 - reveal, 3);
          const scale = 0.76 + revealEase * 0.24;
          const size = iconSize * scale;
          const baseX = dockX + dockPadding + index * (iconSize + iconGap);
          const x = baseX - (size - iconSize) / 2;
          const y = dockY + 10 - (size - iconSize) / 2;

          context.save();
          context.globalAlpha = revealEase;
          addRoundedRect(context, x, y, size, size, 12 * scale);
          context.fillStyle = "rgba(255, 255, 255, 0.045)";
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
        toastTimers.forEach((timer) => window.clearTimeout(timer));
        toastTimers = [];
        toastIndex = index;
        toastOpacity = index >= 0 ? 1 : 0;
        repaintInteraction();
      };

      const update = (now) => {
        if (reducedMotion) return false;

        let changed = false;
        let isAnimating = false;

        if (dockRevealStartedAt !== undefined && !dockRevealComplete) {
          dockRevealProgresses.forEach((progress, index) => {
            const iconStart = dockRevealStartedAt + index * dockRevealStaggerMs;
            const nextProgress = MathUtils.clamp(
              (now - iconStart) / dockIconRevealDurationMs,
              0,
              1,
            );
            if (Math.abs(nextProgress - progress) > 0.001) changed = true;
            dockRevealProgresses[index] = nextProgress;
          });
          dockRevealComplete = dockRevealProgresses.every((progress) => progress >= 1);
          if (!dockRevealComplete) isAnimating = true;
        }

        if (changed) {
          drawScreenFrame();
          texture.needsUpdate = true;
        }

        return isAnimating;
      };

      const startDockReveal = (now) => {
        if (dockRevealComplete || dockRevealStartedAt !== undefined) return;
        dockRevealStartedAt = now;
        requestRender();
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

        const index = MathUtils.clamp(Math.round((x - firstCenter) / iconStep), 0, screenApps.length - 1);
        return dockRevealProgresses[index] >= 0.55 ? index : -1;
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

      return { getDockIndexAtUv, setHovered, showToast, startDockReveal, texture, update };
    };

  return { createLaptopScreenTexture };
};
