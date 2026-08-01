export const createLaptopArtwork = ({
  CanvasTexture,
  DoubleSide,
  LinearFilter,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  SRGBColorSpace,
  renderer,
  requestRender,
  screenApps,
  usesCompactRendering,
}) => {
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

    const createBinaryStickerTexture = () => {
      const stickerCanvas = document.createElement("canvas");
      const context = stickerCanvas.getContext("2d");
      const width = 768;
      const height = 320;
      const cardX = 34;
      const cardY = 34;
      const cardWidth = width - cardX * 2;
      const cardHeight = height - cardY * 2;
      stickerCanvas.width = width;
      stickerCanvas.height = height;
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";

      context.save();
      context.shadowColor = "rgba(0, 0, 0, 0.5)";
      context.shadowBlur = 24;
      context.shadowOffsetY = 12;
      addRoundedRect(context, cardX, cardY, cardWidth, cardHeight, 24);
      context.fillStyle = "#0d0e0e";
      context.fill();
      context.restore();

      const backing = context.createLinearGradient(cardX, cardY, width - cardX, height - cardY);
      backing.addColorStop(0, "#181a1a");
      backing.addColorStop(0.62, "#0d0e0e");
      backing.addColorStop(1, "#202222");
      addRoundedRect(context, cardX, cardY, cardWidth, cardHeight, 24);
      context.fillStyle = backing;
      context.fill();
      context.lineWidth = 7;
      context.strokeStyle = "rgba(239, 240, 232, 0.86)";
      context.stroke();

      context.save();
      addRoundedRect(context, cardX, cardY, cardWidth, cardHeight, 24);
      context.clip();
      context.globalAlpha = 0.11;
      for (let index = 0; index < 90; index += 1) {
        const px = cardX + ((index * 137) % cardWidth);
        const py = cardY + ((index * 83) % cardHeight);
        context.fillStyle = index % 4 ? "#ffffff" : "#0a0a0a";
        context.fillRect(px, py, 2 + index % 4, 1 + index % 2);
      }
      context.restore();

      context.fillStyle = "#f2f1eb";
      context.font = '700 49px "Arial Narrow", Arial, sans-serif';
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText("BINARY: IT'S AS EASY AS", width / 2, 104);

      context.save();
      context.translate(width / 2, 201);
      context.rotate(-0.014);
      addRoundedRect(context, -242, -47, 484, 94, 10);
      context.fillStyle = "#78d8ec";
      context.fill();
      context.lineWidth = 5;
      context.strokeStyle = "#b9f3ff";
      context.stroke();
      context.fillStyle = "#101516";
      context.font = '800 66px "Courier New", monospace';
      context.fillText("{01.10.11}", 0, 4);
      context.restore();

      const texture = new CanvasTexture(stickerCanvas);
      texture.colorSpace = SRGBColorSpace;
      texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      return texture;
    };

    const createKiwiStickerTexture = () => {
      const stickerCanvas = document.createElement("canvas");
      const context = stickerCanvas.getContext("2d");
      const width = 720;
      const height = 500;
      stickerCanvas.width = width;
      stickerCanvas.height = height;
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";

      context.save();
      context.lineCap = "round";
      context.lineJoin = "round";
      context.shadowColor = "rgba(0, 0, 0, 0.42)";
      context.shadowBlur = 20;
      context.shadowOffsetY = 12;

      context.strokeStyle = "#b58455";
      context.lineWidth = 16;
      context.beginPath();
      context.moveTo(424, 348);
      context.quadraticCurveTo(410, 405, 382, 438);
      context.moveTo(500, 344);
      context.quadraticCurveTo(505, 401, 530, 430);
      context.stroke();

      context.lineWidth = 11;
      context.beginPath();
      context.moveTo(382, 438);
      context.lineTo(342, 447);
      context.moveTo(382, 438);
      context.lineTo(390, 458);
      context.moveTo(530, 430);
      context.lineTo(497, 451);
      context.moveTo(530, 430);
      context.lineTo(567, 441);
      context.stroke();

      const bodyGradient = context.createRadialGradient(418, 214, 18, 470, 270, 225);
      bodyGradient.addColorStop(0, "#c39769");
      bodyGradient.addColorStop(0.46, "#9d704a");
      bodyGradient.addColorStop(1, "#5f412f");
      context.beginPath();
      context.moveTo(260, 218);
      context.bezierCurveTo(306, 116, 503, 91, 619, 206);
      context.bezierCurveTo(695, 282, 637, 391, 489, 407);
      context.bezierCurveTo(347, 423, 244, 350, 237, 271);
      context.bezierCurveTo(234, 246, 242, 226, 260, 218);
      context.closePath();
      context.fillStyle = bodyGradient;
      context.fill();
      context.lineWidth = 8;
      context.strokeStyle = "rgba(58, 37, 27, 0.72)";
      context.stroke();

      const headGradient = context.createRadialGradient(234, 190, 10, 255, 218, 92);
      headGradient.addColorStop(0, "#b8895f");
      headGradient.addColorStop(1, "#664532");
      context.beginPath();
      context.ellipse(246, 211, 75, 70, -0.14, 0, Math.PI * 2);
      context.fillStyle = headGradient;
      context.fill();
      context.lineWidth = 7;
      context.strokeStyle = "rgba(58, 37, 27, 0.7)";
      context.stroke();

      const beakGradient = context.createLinearGradient(40, 205, 194, 214);
      beakGradient.addColorStop(0, "#d7b98c");
      beakGradient.addColorStop(0.72, "#b48a58");
      beakGradient.addColorStop(1, "#7a583c");
      context.beginPath();
      context.moveTo(193, 196);
      context.bezierCurveTo(151, 199, 92, 207, 27, 230);
      context.bezierCurveTo(88, 228, 151, 224, 203, 219);
      context.closePath();
      context.fillStyle = beakGradient;
      context.fill();
      context.lineWidth = 5;
      context.strokeStyle = "rgba(72, 48, 31, 0.62)";
      context.stroke();

      context.save();
      context.globalAlpha = 0.34;
      context.strokeStyle = "#ead1ad";
      context.lineWidth = 5;
      for (let index = 0; index < 14; index += 1) {
        const startX = 308 + (index % 7) * 43;
        const startY = 185 + Math.floor(index / 7) * 88 + (index % 2) * 12;
        context.beginPath();
        context.moveTo(startX, startY);
        context.quadraticCurveTo(startX + 23, startY - 13, startX + 48, startY + 5);
        context.stroke();
      }
      context.restore();

      context.beginPath();
      context.arc(218, 189, 10, 0, Math.PI * 2);
      context.fillStyle = "#14110f";
      context.fill();
      context.beginPath();
      context.arc(215, 186, 3.2, 0, Math.PI * 2);
      context.fillStyle = "#fff7e9";
      context.fill();
      context.restore();

      const texture = new CanvasTexture(stickerCanvas);
      texture.colorSpace = SRGBColorSpace;
      texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      return texture;
    };

    const createStickerTexture = (spec) => {
      if (spec.shape === "binary") return createBinaryStickerTexture();
      if (spec.shape === "kiwi") return createKiwiStickerTexture();

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
      const portraitContext = portraitCanvas.getContext("2d", { willReadFrequently: true });
      const portraitSourceCanvas = document.createElement("canvas");
      const portraitSourceContext = portraitSourceCanvas.getContext("2d", { willReadFrequently: true });
      const portraitImage = new Image();
      const width = 1470;
      const height = 1000;
      const sharpenForCompactDisplay = usesCompactRendering();
      portraitCanvas.width = width;
      portraitCanvas.height = height;
      portraitSourceCanvas.width = width;
      portraitSourceCanvas.height = height;
      portraitContext.imageSmoothingEnabled = true;
      portraitContext.imageSmoothingQuality = "high";
      portraitSourceContext.imageSmoothingEnabled = true;
      portraitSourceContext.imageSmoothingQuality = "high";

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

      const featherPortraitEdges = (x, y, drawWidth, drawHeight) => {
        const padding = 5;
        const left = Math.max(0, Math.floor(x) - padding);
        const top = Math.max(0, Math.floor(y) - padding);
        const right = Math.min(width, Math.ceil(x + drawWidth) + padding);
        const bottom = Math.min(height, Math.ceil(y + drawHeight) + padding);
        const regionWidth = right - left;
        const regionHeight = bottom - top;
        if (regionWidth < 3 || regionHeight < 3) return;

        const imageData = portraitContext.getImageData(left, top, regionWidth, regionHeight);
        const pixels = imageData.data;
        const sourceAlpha = new Uint8ClampedArray(regionWidth * regionHeight);
        const horizontalAlpha = new Float32Array(regionWidth * regionHeight);
        const radius = sharpenForCompactDisplay ? 2 : 3;

        for (let index = 0; index < sourceAlpha.length; index += 1) {
          sourceAlpha[index] = pixels[index * 4 + 3];
        }

        for (let row = 0; row < regionHeight; row += 1) {
          let sum = 0;
          for (let column = -radius; column <= radius; column += 1) {
            sum += sourceAlpha[row * regionWidth + Math.max(0, Math.min(regionWidth - 1, column))];
          }
          for (let column = 0; column < regionWidth; column += 1) {
            horizontalAlpha[row * regionWidth + column] = sum / (radius * 2 + 1);
            const outgoing = Math.max(0, column - radius);
            const incoming = Math.min(regionWidth - 1, column + radius + 1);
            sum += sourceAlpha[row * regionWidth + incoming] - sourceAlpha[row * regionWidth + outgoing];
          }
        }

        for (let column = 0; column < regionWidth; column += 1) {
          let sum = 0;
          for (let row = -radius; row <= radius; row += 1) {
            sum += horizontalAlpha[Math.max(0, Math.min(regionHeight - 1, row)) * regionWidth + column];
          }
          for (let row = 0; row < regionHeight; row += 1) {
            const index = row * regionWidth + column;
            const softenedAlpha = sum / (radius * 2 + 1);
            pixels[index * 4 + 3] = Math.round(Math.min(sourceAlpha[index], softenedAlpha));
            const outgoing = Math.max(0, row - radius);
            const incoming = Math.min(regionHeight - 1, row + radius + 1);
            sum += horizontalAlpha[incoming * regionWidth + column] - horizontalAlpha[outgoing * regionWidth + column];
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
        portraitSourceContext.clearRect(0, 0, width, height);
        portraitSourceContext.save();
        portraitSourceContext.filter = "brightness(1.06) contrast(0.94) saturate(0.7) sepia(0.06)";
        portraitSourceContext.drawImage(portraitImage, drawX, drawY, drawWidth, drawHeight);
        portraitSourceContext.restore();

        portraitSourceContext.save();
        portraitSourceContext.globalCompositeOperation = "source-atop";
        const emberReflection = portraitSourceContext.createLinearGradient(
          drawX + drawWidth * 0.28,
          drawY + drawHeight * 0.16,
          drawX + drawWidth,
          drawY + drawHeight * 0.82,
        );
        emberReflection.addColorStop(0, "rgba(255, 90, 36, 0)");
        emberReflection.addColorStop(0.58, "rgba(255, 90, 36, 0.025)");
        emberReflection.addColorStop(1, "rgba(255, 90, 36, 0.13)");
        portraitSourceContext.fillStyle = emberReflection;
        portraitSourceContext.fillRect(drawX, drawY, drawWidth, drawHeight);
        portraitSourceContext.restore();

        portraitContext.save();
        portraitContext.globalAlpha = 0.13;
        portraitContext.filter = "blur(8px) brightness(1.18)";
        portraitContext.drawImage(portraitSourceCanvas, 0, 0);
        portraitContext.restore();

        portraitContext.save();
        portraitContext.globalAlpha = 0.68;
        portraitContext.drawImage(portraitSourceCanvas, 0, 0);
        portraitContext.restore();
        sharpenPortrait(drawX, drawY, drawWidth, drawHeight);
        featherPortraitEdges(drawX, drawY, drawWidth, drawHeight);

        portraitContext.save();
        portraitContext.globalCompositeOperation = "destination-out";
        const legFade = portraitContext.createLinearGradient(0, dockY - 112, 0, dockY + 30);
        legFade.addColorStop(0, "rgba(0, 0, 0, 0)");
        legFade.addColorStop(0.5, "rgba(0, 0, 0, 0.15)");
        legFade.addColorStop(0.78, "rgba(0, 0, 0, 0.72)");
        legFade.addColorStop(1, "rgba(0, 0, 0, 1)");
        portraitContext.fillStyle = legFade;
        portraitContext.fillRect(drawX - 24, dockY - 112, drawWidth + 48, 154);
        portraitContext.restore();

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

    const createScreenGlassTexture = () => {
      const glassCanvas = document.createElement("canvas");
      const glassContext = glassCanvas.getContext("2d");
      const width = 735;
      const height = 500;
      glassCanvas.width = width;
      glassCanvas.height = height;

      const reflection = glassContext.createLinearGradient(0, 0, width, height);
      reflection.addColorStop(0, "rgba(255, 255, 255, 0.035)");
      reflection.addColorStop(0.22, "rgba(255, 255, 255, 0.008)");
      reflection.addColorStop(0.56, "rgba(255, 255, 255, 0)");
      reflection.addColorStop(0.8, "rgba(255, 90, 36, 0.018)");
      reflection.addColorStop(1, "rgba(255, 255, 255, 0.012)");
      glassContext.fillStyle = reflection;
      glassContext.fillRect(0, 0, width, height);

      const edgeVignette = glassContext.createRadialGradient(
        width * 0.52,
        height * 0.45,
        height * 0.12,
        width * 0.52,
        height * 0.45,
        width * 0.68,
      );
      edgeVignette.addColorStop(0, "rgba(0, 0, 0, 0)");
      edgeVignette.addColorStop(0.72, "rgba(0, 0, 0, 0.018)");
      edgeVignette.addColorStop(1, "rgba(0, 0, 0, 0.18)");
      glassContext.fillStyle = edgeVignette;
      glassContext.fillRect(0, 0, width, height);

      glassContext.save();
      for (let y = 1; y < height; y += 3) {
        for (let x = (y * 7) % 3; x < width; x += 3) {
          const noise = ((x * 17 + y * 31) % 29) / 29;
          glassContext.fillStyle = noise > 0.5
            ? `rgba(255, 255, 255, ${0.006 + noise * 0.006})`
            : `rgba(0, 0, 0, ${0.004 + noise * 0.005})`;
          glassContext.fillRect(x, y, 1, 1);
        }
      }
      glassContext.restore();

      const texture = new CanvasTexture(glassCanvas);
      texture.colorSpace = SRGBColorSpace;
      texture.flipY = false;
      texture.generateMipmaps = false;
      texture.minFilter = LinearFilter;
      texture.magFilter = LinearFilter;
      texture.anisotropy = 1;
      return texture;
    };

  return {
    addRoundedRect,
    createLidSticker,
    createPortraitOverlayTexture,
    createScreenGlassTexture,
    getDockLayout,
    loadScreenIcon,
  };
};
