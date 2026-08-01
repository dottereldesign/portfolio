import { invertMoveToken } from "../lib/motion.js";

export const createMotionScenes = ({
  designBoardDemo,
  developAssemblyDemo,
  developCubeStep,
  developScrambleTokens,
  laptopBallMotion,
  laptopThreeDemo,
  threeDemo,
}) => import("../../../assets/vendor/laptop-runtime.min.js?v=20260731-1").then(({
  AmbientLight,
  BackSide,
  BoxGeometry,
  CatmullRomCurve3,
  CanvasTexture,
  DirectionalLight,
  Group,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  OrthographicCamera,
  PlaneGeometry,
  PointLight,
  Quaternion,
  RoundedBoxGeometry,
  Scene,
  SphereGeometry,
  SRGBColorSpace,
  TubeGeometry,
  Vector3,
  WebGLRenderer,
}) => {
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
    const curvePoints = [];
    for (let index = 0; index < 256; index += 1) {
      const angle = (index / 256) * Math.PI * 2;
      curvePoints.push(new Vector3(
        Math.sin(angle) * 1.7,
        Math.sin(angle * 2) * 0.78,
        Math.cos(angle) * 0.13,
      ));
    }

    if (threeDemo) {
    threeRenderer = new WebGLRenderer({
      alpha: true,
      antialias: true,
      canvas: threeDemo,
      powerPreference: "high-performance",
    });
    threeRenderer.setClearColor(0x000000, 0);
    threeRenderer.outputColorSpace = SRGBColorSpace;

    threeScene = new Scene();
    threeCamera = new OrthographicCamera(-2, 2, 1.3, -1.3, 0.1, 10);
    threeCamera.position.z = 5;

    threeCurve = new CatmullRomCurve3(curvePoints, true, "centripetal");

    const trackShadow = new Mesh(
      new TubeGeometry(threeCurve, 320, 0.15, 16, true),
      new MeshStandardMaterial({
        color: 0x171513,
        metalness: 0.9,
        roughness: 0.36,
      }),
    );
    const trackRail = new Mesh(
      new TubeGeometry(threeCurve, 320, 0.095, 16, true),
      new MeshStandardMaterial({
        color: 0xa79886,
        metalness: 0.94,
        roughness: 0.24,
      }),
    );
    threeScene.add(trackShadow, trackRail);

    const ambientLight = new AmbientLight(0xffe9c7, 1.35);
    const directionalLight = new DirectionalLight(0xffffff, 4.8);
    directionalLight.position.set(-1.8, 2.4, 3.5);
    threeScene.add(ambientLight, directionalLight);

    threeBall = new Mesh(
      new SphereGeometry(0.19, 36, 24),
      new MeshStandardMaterial({
        color: 0xfff3d2,
        emissive: 0x2a1705,
        emissiveIntensity: 0.14,
        metalness: 0.08,
        roughness: 0.3,
      }),
    );
    threeBallLight = new PointLight(0xffcc85, 5.5, 1.65);
    threeScene.add(threeBall, threeBallLight);
    }

    const createNoteTexture = ({
      background,
      title,
      subtitle,
      accent,
      kind,
    }) => {
      const noteCanvas = document.createElement("canvas");
      noteCanvas.width = 512;
      noteCanvas.height = 320;
      const context = noteCanvas.getContext("2d");
      context.fillStyle = background;
      context.fillRect(0, 0, noteCanvas.width, noteCanvas.height);
      context.fillStyle = accent;
      context.fillRect(0, 0, 18, noteCanvas.height);
      context.fillStyle = "#242522";
      context.font = "700 34px Arial, sans-serif";
      context.fillText(title, 48, 64);
      context.fillStyle = "rgba(36, 37, 34, 0.62)";
      context.font = "600 18px Arial, sans-serif";
      context.fillText(subtitle, 48, 94);

      if (kind === "flow") {
        context.strokeStyle = "#535650";
        context.lineWidth = 6;
        context.beginPath();
        context.moveTo(72, 196);
        context.lineTo(205, 150);
        context.lineTo(334, 208);
        context.lineTo(444, 158);
        context.stroke();
        [72, 205, 334, 444].forEach((x, index) => {
          const y = [196, 150, 208, 158][index];
          context.fillStyle = index === 2 ? accent : "#f7f2df";
          context.beginPath();
          context.arc(x, y, 18, 0, Math.PI * 2);
          context.fill();
          context.strokeStyle = "#535650";
          context.lineWidth = 4;
          context.stroke();
        });
      } else if (kind === "wireframe") {
        context.strokeStyle = "#565852";
        context.lineWidth = 5;
        context.strokeRect(58, 124, 394, 154);
        context.beginPath();
        context.moveTo(58, 158);
        context.lineTo(452, 158);
        context.moveTo(172, 158);
        context.lineTo(172, 278);
        context.stroke();
        context.fillStyle = accent;
        context.fillRect(196, 184, 214, 38);
        context.fillStyle = "rgba(86, 88, 82, 0.45)";
        context.fillRect(196, 236, 96, 18);
        context.fillRect(304, 236, 106, 18);
      } else if (kind === "type") {
        context.fillStyle = "#343632";
        context.font = "700 92px Georgia, serif";
        context.fillText("Aa", 58, 232);
        context.fillStyle = accent;
        [0, 1, 2, 3].forEach((index) => {
          context.fillRect(230, 142 + index * 34, 192 - index * 25, 12);
        });
      } else {
        context.strokeStyle = "#50524d";
        context.lineWidth = 8;
        context.beginPath();
        context.arc(116, 201, 58, 0, Math.PI * 2);
        context.stroke();
        context.strokeStyle = accent;
        context.beginPath();
        context.moveTo(82, 201);
        context.lineTo(108, 226);
        context.lineTo(154, 174);
        context.stroke();
        context.fillStyle = "#343632";
        context.font = "700 34px Arial, sans-serif";
        context.fillText("7.2 : 1", 222, 198);
        context.fillStyle = "rgba(36, 37, 34, 0.62)";
        context.font = "600 18px Arial, sans-serif";
        context.fillText("CONTRAST PASSES", 222, 228);
      }

      const texture = new CanvasTexture(noteCanvas);
      texture.colorSpace = SRGBColorSpace;
      return texture;
    };

    if (designBoardDemo) {
      designRenderer = new WebGLRenderer({
      alpha: true,
      antialias: true,
      canvas: designBoardDemo,
      powerPreference: "high-performance",
      });
      designRenderer.setClearColor(0x000000, 0);
      designRenderer.outputColorSpace = SRGBColorSpace;

      designScene = new Scene();
      designCamera = new OrthographicCamera(-2, 2, 1.3, -1.3, 0.1, 10);
      designCamera.position.z = 5;

    const designBoardFrame = new Mesh(
      new BoxGeometry(3.55, 2.1, 0.14),
      new MeshStandardMaterial({
        color: 0x73777d,
        metalness: 0.7,
        roughness: 0.52,
      }),
    );
    const designBoardSurface = new Mesh(
      new PlaneGeometry(3.34, 1.89),
      new MeshStandardMaterial({
        color: 0x1c1e1c,
        metalness: 0.05,
        roughness: 0.94,
      }),
    );
    designBoardSurface.position.z = 0.075;
    designScene.add(designBoardFrame, designBoardSurface);

    const notePinGeometry = new SphereGeometry(0.072, 20, 14);
    const noteSpecs = [
      {
        title: "USER FLOW",
        subtitle: "UX / JOURNEY",
        background: "#efe2a8",
        accent: "#e16030",
        kind: "flow",
        x: -1.03,
        y: 0.47,
        rotation: -0.045,
        entryX: -2.2,
        entryY: 0.65,
      },
      {
        title: "HOMEPAGE",
        subtitle: "UI / WIREFRAME",
        background: "#dce7e3",
        accent: "#4f70bb",
        kind: "wireframe",
        x: 0.87,
        y: 0.49,
        rotation: 0.05,
        entryX: 2.25,
        entryY: 0.5,
      },
      {
        title: "TYPE + SPACE",
        subtitle: "UI / SYSTEM",
        background: "#ece8dc",
        accent: "#d15a36",
        kind: "type",
        x: -0.86,
        y: -0.47,
        rotation: 0.035,
        entryX: -2.1,
        entryY: -0.7,
      },
      {
        title: "ACCESSIBILITY",
        subtitle: "UX / CHECK",
        background: "#d8ded0",
        accent: "#5b7160",
        kind: "access",
        x: 0.96,
        y: -0.45,
        rotation: -0.04,
        entryX: 2.2,
        entryY: -0.65,
      },
    ];
    designNotes = noteSpecs.map((spec, index) => {
      const group = new Group();
      const note = new Mesh(
        new PlaneGeometry(1.32, 0.82),
        new MeshStandardMaterial({
          color: 0xffffff,
          map: createNoteTexture(spec),
          metalness: 0,
          roughness: 0.88,
        }),
      );
      const pin = new Mesh(
        notePinGeometry,
        new MeshStandardMaterial({
          color: index % 2 === 0 ? 0xff5a24 : 0xfff3d2,
          metalness: 0.12,
          roughness: 0.28,
        }),
      );
      pin.position.set(0.5, 0.3, 0.11);
      group.add(note, pin);
      designScene.add(group);
      return {
        group,
        pin,
        targetX: spec.x,
        targetY: spec.y,
        targetRotation: spec.rotation,
        entryX: spec.entryX,
        entryY: spec.entryY,
      };
    });

    const designAmbientLight = new AmbientLight(0xf2eee4, 1.8);
    const designKeyLight = new DirectionalLight(0xffffff, 3.8);
    const designWarmLight = new DirectionalLight(0xff7a45, 0.7);
    designKeyLight.position.set(-2, 3, 5);
    designWarmLight.position.set(4, -1, 3);
      designScene.add(designAmbientLight, designKeyLight, designWarmLight);
    }

    developRenderer = new WebGLRenderer({
      alpha: true,
      antialias: true,
      canvas: developAssemblyDemo,
      powerPreference: "high-performance",
    });
    developRenderer.setClearColor(0x000000, 0);
    developRenderer.outputColorSpace = SRGBColorSpace;

    developScene = new Scene();
    developCamera = new OrthographicCamera(-2, 2, 1.3, -1.3, 0.1, 10);
    developCamera.position.set(3.2, 2.7, 5.4);
    developCamera.lookAt(0, 0, 0);

    developRig = new Group();
    developScene.add(developRig);

    const createCubeMaterial = (
      color,
      {
        emissive = 0x000000,
        emissiveIntensity = 0,
        metalness = 0.7,
        roughness = 0.42,
      } = {},
    ) => new MeshStandardMaterial({
      color,
      emissive,
      emissiveIntensity,
      metalness,
      roughness,
    });

    const cubeMaterials = {
      body: createCubeMaterial(0x3f4349, {
        metalness: 0.78,
        roughness: 0.46,
      }),
      right: createCubeMaterial(0xff5a24, {
        emissive: 0x3c1004,
        emissiveIntensity: 0.2,
        metalness: 0.38,
        roughness: 0.34,
      }),
      left: createCubeMaterial(0xc94332, {
        emissive: 0x270806,
        emissiveIntensity: 0.14,
        metalness: 0.4,
        roughness: 0.36,
      }),
      up: createCubeMaterial(0xe8e7e1, {
        metalness: 0.28,
        roughness: 0.32,
      }),
      down: createCubeMaterial(0xe6a847, {
        emissive: 0x2a1704,
        emissiveIntensity: 0.13,
        metalness: 0.42,
        roughness: 0.34,
      }),
      front: createCubeMaterial(0x5d61d8, {
        emissive: 0x10123b,
        emissiveIntensity: 0.18,
        metalness: 0.4,
        roughness: 0.34,
      }),
      back: createCubeMaterial(0x399a73, {
        emissive: 0x061f14,
        emissiveIntensity: 0.14,
        metalness: 0.42,
        roughness: 0.36,
      }),
    };
    const cubeGeometry = new RoundedBoxGeometry(0.63, 0.63, 0.63, 4, 0.055);
    const stickerGeometry = new RoundedBoxGeometry(0.49, 0.49, 0.025, 3, 0.028);
    const stickerOffset = 0.331;
    const stickerFaces = [
      {
        coordinate: "x",
        value: 1,
        material: cubeMaterials.right,
        position: [stickerOffset, 0, 0],
        rotation: [0, Math.PI / 2, 0],
      },
      {
        coordinate: "x",
        value: -1,
        material: cubeMaterials.left,
        position: [-stickerOffset, 0, 0],
        rotation: [0, -Math.PI / 2, 0],
      },
      {
        coordinate: "y",
        value: 1,
        material: cubeMaterials.up,
        position: [0, stickerOffset, 0],
        rotation: [-Math.PI / 2, 0, 0],
      },
      {
        coordinate: "y",
        value: -1,
        material: cubeMaterials.down,
        position: [0, -stickerOffset, 0],
        rotation: [Math.PI / 2, 0, 0],
      },
      {
        coordinate: "z",
        value: 1,
        material: cubeMaterials.front,
        position: [0, 0, stickerOffset],
        rotation: [0, 0, 0],
      },
      {
        coordinate: "z",
        value: -1,
        material: cubeMaterials.back,
        position: [0, 0, -stickerOffset],
        rotation: [0, Math.PI, 0],
      },
    ];

    developCubies = [];
    for (let x = -1; x <= 1; x += 1) {
      for (let y = -1; y <= 1; y += 1) {
        for (let z = -1; z <= 1; z += 1) {
          const group = new Group();
          const body = new Mesh(cubeGeometry, cubeMaterials.body);
          group.add(body);

          stickerFaces.forEach((face) => {
            if ({ x, y, z }[face.coordinate] !== face.value) return;
            const sticker = new Mesh(stickerGeometry, face.material);
            sticker.position.set(...face.position);
            sticker.rotation.set(...face.rotation);
            group.add(sticker);
          });

          group.position.set(
            x * developCubeStep,
            y * developCubeStep,
            z * developCubeStep,
          );
          developRig.add(group);
          developCubies.push({ group, solvedPosition: new Vector3(x, y, z) });
        }
      }
    }

    const faceMoves = {
      R: { axisName: "x", axisVector: new Vector3(1, 0, 0), layer: 1, direction: -1 },
      L: { axisName: "x", axisVector: new Vector3(1, 0, 0), layer: -1, direction: 1 },
      U: { axisName: "y", axisVector: new Vector3(0, 1, 0), layer: 1, direction: -1 },
      D: { axisName: "y", axisVector: new Vector3(0, 1, 0), layer: -1, direction: 1 },
      F: { axisName: "z", axisVector: new Vector3(0, 0, 1), layer: 1, direction: -1 },
      B: { axisName: "z", axisVector: new Vector3(0, 0, 1), layer: -1, direction: 1 },
    };
    const solutionTokens = [...developScrambleTokens]
      .reverse()
      .map(invertMoveToken);
    const parseMove = (token) => {
      const face = faceMoves[token[0]];
      const turnMultiplier = token.endsWith("2")
        ? 2
        : token.endsWith("'")
          ? -1
          : 1;
      return {
        ...face,
        token,
        angle: face.direction * turnMultiplier * Math.PI / 2,
      };
    };
    const cloneSnapshot = (snapshot) => snapshot.map((state) => ({
      position: state.position.clone(),
      quaternion: state.quaternion.clone(),
    }));
    const applyMoveToSnapshot = (snapshot, move) => {
      const nextSnapshot = cloneSnapshot(snapshot);
      const rotation = new Quaternion().setFromAxisAngle(move.axisVector, move.angle);
      nextSnapshot.forEach((state) => {
        if (Math.round(state.position[move.axisName]) !== move.layer) return;
        state.position.applyQuaternion(rotation);
        state.position.set(
          Math.round(state.position.x),
          Math.round(state.position.y),
          Math.round(state.position.z),
        );
        state.quaternion.premultiply(rotation).normalize();
      });
      return nextSnapshot;
    };

    developMovePlan = [...developScrambleTokens, ...solutionTokens].map(parseMove);
    developSnapshots = [
      developCubies.map(({ solvedPosition }) => ({
        position: solvedPosition.clone(),
        quaternion: new Quaternion(),
      })),
    ];
    developMovePlan.forEach((move) => {
      developSnapshots.push(
        applyMoveToSnapshot(developSnapshots[developSnapshots.length - 1], move),
      );
    });
    developScratchQuaternion = new Quaternion();

    const solvedSnapshot = developSnapshots[0];
    const scrambledSnapshot = developSnapshots[developScrambleTokens.length];
    const resolvedSnapshot = developSnapshots[developSnapshots.length - 1];
    const snapshotsKeepUniquePositions = developSnapshots.every((snapshot) => (
      new Set(snapshot.map(({ position }) => (
        `${Math.round(position.x)},${Math.round(position.y)},${Math.round(position.z)}`
      ))).size === developCubies.length
    ));
    const everyMoveTurnsOneLayer = developMovePlan.every((move, index) => (
      developSnapshots[index].filter((state) => (
        Math.round(state.position[move.axisName]) === move.layer
      )).length === 9
    ));
    const scrambleIsMixed = scrambledSnapshot.some((state, index) => (
      state.position.distanceToSquared(solvedSnapshot[index].position) > 1e-8
      || 1 - Math.abs(state.quaternion.dot(solvedSnapshot[index].quaternion)) > 1e-8
    ));
    const loopReturnsToSolved = resolvedSnapshot.every((state, index) => (
      state.position.distanceToSquared(solvedSnapshot[index].position) < 1e-8
      && 1 - Math.abs(state.quaternion.dot(solvedSnapshot[index].quaternion)) < 1e-8
    ));
    if (
      !snapshotsKeepUniquePositions
      || !everyMoveTurnsOneLayer
      || !scrambleIsMixed
      || !loopReturnsToSolved
    ) {
      throw new Error("Develop cube move plan failed its state validation.");
    }

    const developAmbientLight = new AmbientLight(0xe8e7e1, 1.65);
    const developKeyLight = new DirectionalLight(0xffffff, 4.6);
    const developFillLight = new DirectionalLight(0x8791d8, 1.1);
    const developWarmLight = new DirectionalLight(0xff5a24, 0.75);
    developTurnLight = new PointLight(0xff8a54, 0, 3.4);
    developKeyLight.position.set(-2.4, 3.6, 5);
    developFillLight.position.set(4, -1, 3);
    developWarmLight.position.set(3, 2, 2);
    developScene.add(
      developAmbientLight,
      developKeyLight,
      developFillLight,
      developWarmLight,
    );
    developRig.add(developTurnLight);

    laptopThreeRenderer = new WebGLRenderer({
      alpha: true,
      antialias: true,
      canvas: laptopThreeDemo,
      powerPreference: "high-performance",
    });
    laptopThreeRenderer.setClearColor(0x000000, 0);
    laptopThreeRenderer.outputColorSpace = SRGBColorSpace;

    laptopThreeScene = new Scene();
    laptopThreeCamera = new OrthographicCamera(-2, 2, 1.3, -1.3, 0.1, 10);
    laptopThreeCamera.position.z = 5;
    const laptopCurvePoints = curvePoints.map((point, index) => {
      const angle = (index / curvePoints.length) * Math.PI * 2;
      return new Vector3(point.x, point.y, Math.cos(angle) * 0.28);
    });
    laptopThreeCurve = new CatmullRomCurve3(laptopCurvePoints, true, "centripetal");
    laptopBallMotion.minY = Infinity;
    laptopBallMotion.maxY = -Infinity;
    for (let index = 0; index < 512; index += 1) {
      const point = laptopThreeCurve.getPointAt(index / 512);
      laptopBallMotion.minY = Math.min(laptopBallMotion.minY, point.y);
      laptopBallMotion.maxY = Math.max(laptopBallMotion.maxY, point.y);
    }

    const laptopGlassOuter = new Mesh(
      new TubeGeometry(laptopThreeCurve, 320, 0.255, 32, true),
      new MeshPhysicalMaterial({
        color: 0xaab3bd,
        metalness: 0,
        roughness: 0.08,
        transmission: 0.72,
        thickness: 0.18,
        ior: 1.42,
        clearcoat: 1,
        clearcoatRoughness: 0.06,
        transparent: true,
        opacity: 0.38,
        depthWrite: false,
      }),
    );
    laptopGlassOuter.renderOrder = 3;

    const laptopGlassInner = new Mesh(
      new TubeGeometry(laptopThreeCurve, 320, 0.198, 32, true),
      new MeshPhysicalMaterial({
        color: 0x69737f,
        metalness: 0,
        roughness: 0.13,
        transmission: 0.8,
        thickness: 0.06,
        ior: 1.36,
        clearcoat: 0.85,
        clearcoatRoughness: 0.09,
        transparent: true,
        opacity: 0.16,
        side: BackSide,
        depthWrite: false,
      }),
    );
    laptopGlassInner.renderOrder = 4;
    laptopThreeScene.add(laptopGlassOuter, laptopGlassInner);

    const laptopAmbientLight = new AmbientLight(0xe8e7e1, 1.8);
    const laptopKeyLight = new DirectionalLight(0xffffff, 4.6);
    const laptopWarmRimLight = new DirectionalLight(0xff5a24, 0.72);
    const laptopFillLight = new DirectionalLight(0x8791d8, 0.8);
    laptopKeyLight.position.set(-2.5, 3.5, 5);
    laptopWarmRimLight.position.set(4, 1, 3);
    laptopFillLight.position.set(-4, -1, 3);
    laptopThreeScene.add(
      laptopAmbientLight,
      laptopKeyLight,
      laptopWarmRimLight,
      laptopFillLight,
    );

    laptopThreeBall = new Mesh(
      new SphereGeometry(0.145, 36, 24),
      new MeshStandardMaterial({
        color: 0xfff3d2,
        emissive: 0x2a1705,
        emissiveIntensity: 0.14,
        metalness: 0.08,
        roughness: 0.3,
      }),
    );
    laptopThreeBall.renderOrder = 2;
    laptopThreeBallLight = new PointLight(0xffcc85, 6.2, 1.35);
    laptopThreeScene.add(laptopThreeBall, laptopThreeBallLight);

  return {
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
  };
});
