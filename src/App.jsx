import { useEffect, useRef } from "react";
import * as THREE from "three";
import gsap from "gsap";
import "./App.css";

export default function App() {
  const mountRef = useRef(null);
  const particlesRef = useRef([]);
  const techSymbolsRef = useRef([]);

  useEffect(() => {
    const container = mountRef.current;

    // =========================================================
    // SCENE / CAMERA / RENDERER
    // =========================================================

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      42,
      window.innerWidth / window.innerHeight,
      0.1,
      200
    );

    camera.position.set(0, 2.4, 7.5);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    if ("outputColorSpace" in renderer) {
      renderer.outputColorSpace = THREE.SRGBColorSpace;
    } else {
      renderer.outputEncoding = THREE.sRGBEncoding;
    }

    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;

    container.appendChild(renderer.domElement);

    // =========================================================
    // TEXTURES
    // =========================================================

    function makeFaceTexture(w, h, variant) {
      const cv = document.createElement("canvas");
      cv.width = w;
      cv.height = h;

      const ctx = cv.getContext("2d");

      const gold = "#e8c877";
      const goldDim = "#8c6a2b";
      const goldBright = "#f4e3ab";

      // Wood
      const bg = ctx.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, "#3b2b1b");
      bg.addColorStop(0.5, "#241a10");
      bg.addColorStop(1, "#120d08");

      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Grain
      const imgData = ctx.getImageData(0, 0, w, h);

      for (let i = 0; i < imgData.data.length; i += 4) {
        const n = (Math.random() - 0.5) * 14;

        imgData.data[i] += n;
        imgData.data[i + 1] += n;
        imgData.data[i + 2] += n;
      }

      ctx.putImageData(imgData, 0, 0);

      const pad = w * 0.045;

      // Outer frame
      ctx.strokeStyle = goldDim;
      ctx.lineWidth = w * 0.018;
      ctx.strokeRect(
        pad,
        pad,
        w - pad * 2,
        h - pad * 2
      );

      ctx.strokeStyle = gold;
      ctx.lineWidth = w * 0.005;

      ctx.strokeRect(
        pad + w * 0.015,
        pad + w * 0.015,
        w - pad * 2 - w * 0.03,
        h - pad * 2 - w * 0.03
      );

      // Corner medallions
      [
        [pad, pad],
        [w - pad, pad],
        [pad, h - pad],
        [w - pad, h - pad],
      ].forEach(([cx, cy]) => {
        ctx.beginPath();
        ctx.arc(cx, cy, w * 0.03, 0, Math.PI * 2);
        ctx.strokeStyle = gold;
        ctx.lineWidth = w * 0.006;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, cy, w * 0.011, 0, Math.PI * 2);
        ctx.fillStyle = goldBright;
        ctx.fill();

        for (let k = 0; k < 3; k++) {
          const a0 = (Math.PI / 2) * k + Math.PI / 8;

          ctx.strokeStyle = gold;
          ctx.lineWidth = w * 0.0035;
          ctx.globalAlpha = 0.55;

          ctx.beginPath();

          ctx.moveTo(cx, cy);

          ctx.quadraticCurveTo(
            cx + Math.cos(a0) * w * 0.05,
            cy + Math.sin(a0) * w * 0.02,
            cx + Math.cos(a0) * w * 0.08,
            cy + Math.sin(a0) * w * 0.06
          );

          ctx.stroke();

          ctx.globalAlpha = 1;
        }
      });

      // Glyph rows
      function glyphRow(y) {
        const n = Math.max(6, Math.round(w / 48));
        const usable = w - pad * 2 - w * 0.06;
        const step = usable / n;

        for (let i = 0; i < n; i++) {
          const x =
            pad +
            w * 0.03 +
            step * i +
            step / 2;

          const kind = i % 6;

          ctx.strokeStyle = gold;
          ctx.fillStyle = gold;
          ctx.lineWidth = w * 0.0035;

          ctx.beginPath();

          if (kind === 0) {
            ctx.arc(
              x,
              y,
              w * 0.007,
              0,
              Math.PI * 2
            );
            ctx.fill();
          } else if (kind === 1) {
            ctx.moveTo(x - w * 0.01, y);
            ctx.lineTo(x, y - w * 0.014);
            ctx.lineTo(x + w * 0.01, y);
            ctx.lineTo(x, y + w * 0.014);
            ctx.closePath();

            ctx.globalAlpha = 0.8;
            ctx.fill();
            ctx.globalAlpha = 1;
          } else if (kind === 2) {
            ctx.moveTo(
              x - w * 0.01,
              y - w * 0.01
            );

            ctx.lineTo(
              x + w * 0.01,
              y + w * 0.01
            );

            ctx.moveTo(
              x - w * 0.01,
              y + w * 0.01
            );

            ctx.lineTo(
              x + w * 0.01,
              y - w * 0.01
            );

            ctx.stroke();
          } else if (kind === 3) {
            ctx.rect(
              x - w * 0.008,
              y - w * 0.008,
              w * 0.016,
              w * 0.016
            );

            ctx.stroke();
          } else if (kind === 4) {
            ctx.arc(
              x,
              y,
              w * 0.009,
              0,
              Math.PI
            );

            ctx.stroke();
          } else {
            ctx.moveTo(x, y - w * 0.011);

            ctx.lineTo(
              x + w * 0.009,
              y + w * 0.007
            );

            ctx.lineTo(
              x - w * 0.009,
              y + w * 0.007
            );

            ctx.closePath();

            ctx.globalAlpha = 0.7;
            ctx.fill();
            ctx.globalAlpha = 1;
          }
        }
      }

      glyphRow(pad + w * 0.026);
      glyphRow(h / 2);
      glyphRow(h - pad - w * 0.026);

      // Side lattice
      [pad + w * 0.05, w - pad - w * 0.05].forEach(
        (x) => {
          const n = Math.round(h / (w * 0.09));

          for (let j = 0; j < n; j++) {
            const y =
              pad +
              w * 0.06 +
              j *
                ((h -
                  pad * 2 -
                  w * 0.12) /
                  Math.max(1, n - 1));

            ctx.strokeStyle = goldDim;
            ctx.lineWidth = w * 0.003;
            ctx.globalAlpha = 0.6;

            ctx.beginPath();

            ctx.moveTo(x, y - w * 0.018);
            ctx.lineTo(x + w * 0.012, y);
            ctx.lineTo(x, y + w * 0.018);
            ctx.lineTo(x - w * 0.012, y);
            ctx.closePath();

            ctx.stroke();

            ctx.globalAlpha = 1;
          }
        }
      );

      const cx = w / 2;
      const cy = h / 2;

      // Lid medallion
      if (variant === "medallion-lid") {
        const R = Math.min(w, h) * 0.26;

        ctx.strokeStyle = gold;
        ctx.lineWidth = w * 0.006;

        ctx.beginPath();
        ctx.arc(cx, cy, R, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = goldDim;
        ctx.lineWidth = w * 0.003;

        ctx.beginPath();
        ctx.arc(cx, cy, R * 0.8, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, cy, R * 0.56, 0, Math.PI * 2);
        ctx.stroke();

        for (let i = 0; i < 12; i++) {
          const a = (Math.PI * 2 / 12) * i;

          ctx.strokeStyle = gold;
          ctx.lineWidth = w * 0.003;
          ctx.globalAlpha = 0.7;

          ctx.beginPath();

          ctx.moveTo(
            cx + Math.cos(a) * R * 0.8,
            cy + Math.sin(a) * R * 0.8
          );

          ctx.lineTo(
            cx + Math.cos(a) * R * 1.05,
            cy + Math.sin(a) * R * 1.05
          );

          ctx.stroke();

          ctx.globalAlpha = 1;
        }

        ctx.save();
        ctx.translate(cx, cy);

        for (let i = 0; i < 6; i++) {
          ctx.rotate(Math.PI / 3);

          ctx.beginPath();

          ctx.moveTo(0, -R * 0.5);

          ctx.bezierCurveTo(
            R * 0.22,
            -R * 0.3,
            R * 0.16,
            R * 0.05,
            0,
            R * 0.1
          );

          ctx.bezierCurveTo(
            -R * 0.16,
            R * 0.05,
            -R * 0.22,
            -R * 0.3,
            0,
            -R * 0.5
          );

          ctx.fillStyle =
            "rgba(200,160,80,0.15)";

          ctx.fill();

          ctx.strokeStyle = goldBright;
          ctx.lineWidth = w * 0.0035;

          ctx.stroke();
        }

        ctx.restore();

        ctx.beginPath();
        ctx.arc(
          cx,
          cy,
          w * 0.01,
          0,
          Math.PI * 2
        );

        ctx.fillStyle = goldBright;
        ctx.fill();
      }

      // Figures
      else if (variant === "figures") {
        ctx.strokeStyle = gold;
        ctx.lineWidth = w * 0.005;
        ctx.globalAlpha = 0.85;

        ctx.beginPath();

        ctx.moveTo(
          cx - w * 0.12,
          cy + h * 0.16
        );

        ctx.quadraticCurveTo(
          cx - w * 0.09,
          cy - h * 0.1,
          cx - w * 0.02,
          cy - h * 0.13
        );

        ctx.quadraticCurveTo(
          cx,
          cy - h * 0.18,
          cx + w * 0.04,
          cy - h * 0.13
        );

        ctx.quadraticCurveTo(
          cx + w * 0.1,
          cy - h * 0.08,
          cx + w * 0.09,
          cy + h * 0.16
        );

        ctx.stroke();

        ctx.beginPath();

        ctx.moveTo(
          cx - w * 0.07,
          cy + h * 0.16
        );

        ctx.quadraticCurveTo(
          cx - w * 0.04,
          cy,
          cx,
          cy - h * 0.02
        );

        ctx.quadraticCurveTo(
          cx + w * 0.04,
          cy,
          cx + w * 0.05,
          cy + h * 0.16
        );

        ctx.stroke();

        ctx.globalAlpha = 1;

        ctx.beginPath();
        ctx.arc(
          cx - w * 0.02,
          cy - h * 0.13,
          w * 0.016,
          0,
          Math.PI * 2
        );

        ctx.fillStyle = gold;
        ctx.globalAlpha = 0.5;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(
          cx + w * 0.04,
          cy - h * 0.13,
          w * 0.013,
          0,
          Math.PI * 2
        );

        ctx.fill();

        ctx.globalAlpha = 1;

        [-1, 1].forEach((s) => {
          ctx.strokeStyle = goldDim;
          ctx.lineWidth = w * 0.003;
          ctx.globalAlpha = 0.6;

          ctx.beginPath();

          let x0 = cx + s * w * 0.17;
          let y0 = cy + h * 0.15;

          ctx.moveTo(x0, y0);

          for (let k = 0; k < 5; k++) {
            x0 +=
              s *
              w *
              0.006 *
              (k % 2 ? 1 : -1);

            y0 -= h * 0.055;

            ctx.lineTo(x0, y0);

            ctx.moveTo(x0, y0);

            ctx.arc(
              x0,
              y0,
              w * 0.006,
              0,
              Math.PI * 2
            );
          }

          ctx.stroke();

          ctx.globalAlpha = 1;
        });
      }

      // Plain
      else {
        ctx.save();
        ctx.translate(cx, cy);

        for (let i = 0; i < 16; i++) {
          ctx.rotate(Math.PI / 8);

          ctx.strokeStyle = gold;
          ctx.lineWidth = w * 0.003;
          ctx.globalAlpha =
            i % 2 ? 0.3 : 0.55;

          ctx.beginPath();

          ctx.moveTo(0, -h * 0.06);
          ctx.lineTo(0, -h * 0.24);

          ctx.stroke();
        }

        ctx.restore();

        ctx.globalAlpha = 1;

        ctx.beginPath();

        ctx.arc(
          cx,
          cy,
          w * 0.05,
          0,
          Math.PI * 2
        );

        ctx.strokeStyle = gold;
        ctx.lineWidth = w * 0.005;

        ctx.stroke();
      }

      const tex = new THREE.CanvasTexture(cv);

      tex.anisotropy = 4;

      if ("colorSpace" in tex) {
        tex.colorSpace = THREE.SRGBColorSpace;
      } else {
        tex.encoding = THREE.sRGBEncoding;
      }

      return tex;
    }

    // =========================================================
    // MATERIALS
    // =========================================================

    function faceMat(texture, emissive = 0.9) {
      return new THREE.MeshStandardMaterial({
        map: texture,
        emissiveMap: texture,
        emissive: new THREE.Color(0x6b461b),
        emissiveIntensity: emissive,
        roughness: 0.35,
        metalness: 0.3,
      });
    }

    const metalMat =
      new THREE.MeshStandardMaterial({
        color: 0x4b4034,
        roughness: 0.3,
        metalness: 0.85,
      });

    const goldMat =
      new THREE.MeshStandardMaterial({
        color: 0xe8c66c,
        roughness: 0.25,
        metalness: 0.9,
        emissive: 0x6a450b,
        emissiveIntensity: 0.65,
      });

    // =========================================================
    // BOX
    // =========================================================

    const BW = 3.2;
    const BD = 2.6;
    const BH = 2.0;

    const baseH = BH * 0.62;
    const lidH = BH * 0.38;

    const baseCenterY =
      -BH / 2 + baseH / 2;

    const baseTopY =
      -BH / 2 + baseH;

    const boxGroup = new THREE.Group();

    // Lift the relic slightly so the lock is visible
    boxGroup.position.y = 0.18;

    scene.add(boxGroup);

    // =========================================================
    // BASE
    // =========================================================

    const baseGeo =
      new THREE.BoxGeometry(
        BW,
        baseH,
        BD
      );

    const texBaseFront =
      makeFaceTexture(
        512,
        300,
        "figures"
      );

    const texBaseSide =
      makeFaceTexture(
        420,
        300,
        "medallion-lid"
      );

    const texBaseBack =
      makeFaceTexture(
        512,
        300,
        "plain"
      );

    const baseMaterials = [
      faceMat(texBaseSide),
      faceMat(texBaseSide),
      faceMat(texBaseBack, 0.3),
      faceMat(texBaseBack, 0.3),
      faceMat(texBaseFront),
      faceMat(texBaseBack),
    ];

    const baseMesh =
      new THREE.Mesh(
        baseGeo,
        baseMaterials
      );

    baseMesh.position.y =
      baseCenterY;

    boxGroup.add(baseMesh);

    // =========================================================
    // INNER CAVITY
    // =========================================================

    const innerGeo =
      new THREE.BoxGeometry(
        BW * 0.92,
        baseH * 0.86,
        BD * 0.92
      );

    const innerMat =
      new THREE.MeshStandardMaterial({
        color: 0x120c08,
        roughness: 0.9,
        metalness: 0.05,
        side: THREE.BackSide,
        emissive: 0x1a3a35,
        emissiveIntensity: 0.7,
      });

    const innerMesh =
      new THREE.Mesh(
        innerGeo,
        innerMat
      );

    innerMesh.position.y =
      baseCenterY +
      baseH * 0.05;

    boxGroup.add(innerMesh);

    // Magical interior light
    const innerLight =
      new THREE.PointLight(
        0xbfead0,
        2.5,
        5,
        2
      );

    innerLight.position.set(
      0,
      baseCenterY,
      0
    );

    boxGroup.add(innerLight);

    // =========================================================
    // LID
    // =========================================================

    const lidPivot =
      new THREE.Group();

    lidPivot.position.set(
      0,
      baseTopY,
      -BD / 2
    );

    boxGroup.add(lidPivot);

    const lidGeo =
      new THREE.BoxGeometry(
        BW,
        lidH,
        BD
      );

    const texLidTop =
      makeFaceTexture(
        512,
        420,
        "medallion-lid"
      );

    const texLidSide =
      makeFaceTexture(
        420,
        260,
        "plain"
      );

    const lidMaterials = [
      faceMat(texLidSide),
      faceMat(texLidSide),
      faceMat(texLidTop),
      faceMat(texLidSide, 0.25),
      faceMat(texLidSide),
      faceMat(texLidSide),
    ];

    const lidMesh =
      new THREE.Mesh(
        lidGeo,
        lidMaterials
      );

    lidMesh.position.set(
      0,
      lidH / 2,
      BD / 2
    );

    lidPivot.add(lidMesh);

    // =========================================================
    // EDGE ACCENTS
    // =========================================================

    function addEdges(mesh, opacity = 0.45) {
      const geometry =
        new THREE.EdgesGeometry(
          mesh.geometry
        );

      const material =
        new THREE.LineBasicMaterial({
          color: 0xf4dfa0,
          transparent: true,
          opacity,
        });

      const lines =
        new THREE.LineSegments(
          geometry,
          material
        );

      mesh.add(lines);
    }

    addEdges(baseMesh, 0.5);
    addEdges(lidMesh, 0.55);

    // =========================================================
    // HINGES
    // =========================================================

    [-1, 1].forEach((s) => {
      const hinge =
        new THREE.Mesh(
          new THREE.CylinderGeometry(
            0.09,
            0.09,
            0.5,
            12
          ),
          metalMat
        );

      hinge.rotation.z =
        Math.PI / 2;

      hinge.position.set(
        s * BW * 0.28,
        baseTopY,
        -BD / 2
      );

      boxGroup.add(hinge);

      [-0.16, 0.16].forEach(
        (offset) => {
          const rivet =
            new THREE.Mesh(
              new THREE.SphereGeometry(
                0.045,
                8,
                8
              ),
              goldMat
            );

          rivet.position.set(
            s * BW * 0.28 +
              offset,
            baseTopY,
            -BD / 2 + 0.005
          );

          boxGroup.add(rivet);
        }
      );
    });

    // =========================================================
    // LOCK
    // =========================================================

    const lockGroup =
      new THREE.Group();

    lockGroup.position.set(
      0,
      baseTopY,
      BD / 2 + 0.02
    );

    boxGroup.add(lockGroup);

    const plateGeo =
      new THREE.BoxGeometry(
        0.55,
        0.4,
        0.07
      );

    const plate =
      new THREE.Mesh(
        plateGeo,
        goldMat
      );

    lockGroup.add(plate);

    const keyholeCircle =
      new THREE.Mesh(
        new THREE.CylinderGeometry(
          0.045,
          0.045,
          0.08,
          16
        ),
        new THREE.MeshStandardMaterial({
          color: 0x080604,
          roughness: 0.9,
        })
      );

    keyholeCircle.rotation.x =
      Math.PI / 2;

    keyholeCircle.position.set(
      0,
      0.02,
      0.02
    );

    lockGroup.add(keyholeCircle);

    const keyholeWedge =
      new THREE.Mesh(
        new THREE.ConeGeometry(
          0.045,
          0.12,
          12
        ),
        new THREE.MeshStandardMaterial({
          color: 0x080604,
          roughness: 0.9,
        })
      );

    keyholeWedge.rotation.x =
      Math.PI;

    keyholeWedge.position.set(
      0,
      -0.06,
      0.02
    );

    lockGroup.add(keyholeWedge);

    const plateEdges =
      new THREE.LineSegments(
        new THREE.EdgesGeometry(
          plateGeo
        ),
        new THREE.LineBasicMaterial({
          color: 0xf4e3ab,
        })
      );

    plate.add(plateEdges);

    // Shackle
    const shacklePivot =
      new THREE.Group();

    shacklePivot.position.set(
      -0.2,
      0.22,
      0
    );

    lockGroup.add(shacklePivot);

    const shackle =
      new THREE.Mesh(
        new THREE.TorusGeometry(
          0.2,
          0.035,
          8,
          20,
          Math.PI * 1.15
        ),
        metalMat
      );

    shackle.rotation.z =
      Math.PI * 0.5 +
      Math.PI * 0.07;

    shackle.position.set(
      0.2,
      -0.02,
      0
    );

    shacklePivot.add(shackle);

    // =========================================================
    // LIGHTING — BRIGHT VERSION
    // =========================================================

    scene.add(
      new THREE.AmbientLight(
        0x30384a,
        1.15
      )
    );

    const teal =
      new THREE.PointLight(
        0x7fe8e0,
        6.5,
        14,
        2
      );

    teal.position.set(
      0,
      3,
      1
    );

    scene.add(teal);

    // Main warm light
    const warm =
      new THREE.PointLight(
        0xffc875,
        4.5,
        14,
        2
      );

    warm.position.set(
      3,
      2.5,
      4
    );

    scene.add(warm);

    // Front fill — this is what makes the relic readable
    const relicFill =
      new THREE.PointLight(
        0xffe0a3,
        4,
        10,
        2
      );

    relicFill.position.set(
      -2,
      2.5,
      5
    );

    scene.add(relicFill);

    const rim =
      new THREE.PointLight(
        0x6677ff,
        1.2,
        14,
        2
      );

    rim.position.set(
      -4,
      2,
      -3
    );

    scene.add(rim);

    // =========================================================
    // MAGICAL GLOW
    // =========================================================

    function makeGlowSprite() {
      const cv =
        document.createElement(
          "canvas"
        );

      cv.width = 256;
      cv.height = 256;

      const ctx =
        cv.getContext("2d");

      const gradient =
        ctx.createRadialGradient(
          128,
          128,
          0,
          128,
          128,
          128
        );

      gradient.addColorStop(
        0,
        "rgba(180,255,245,0.7)"
      );

      gradient.addColorStop(
        0.45,
        "rgba(120,220,210,0.25)"
      );

      gradient.addColorStop(
        1,
        "rgba(120,220,210,0)"
      );

      ctx.fillStyle = gradient;

      ctx.fillRect(
        0,
        0,
        256,
        256
      );

      const texture =
        new THREE.CanvasTexture(cv);

      const material =
        new THREE.SpriteMaterial({
          map: texture,
          transparent: true,
          depthWrite: false,
          blending:
            THREE.AdditiveBlending,
        });

      const sprite =
        new THREE.Sprite(material);

      sprite.scale.set(4, 4, 1);

      sprite.position.set(
        0,
        1,
        0
      );

      return sprite;
    }

    const glowSprite =
      makeGlowSprite();

    scene.add(glowSprite);

    // =========================================================
    // BACKGROUND STARS
    // =========================================================

    function makeStarTexture() {
      const cv = document.createElement("canvas");
      cv.width = 64;
      cv.height = 64;

      const ctx = cv.getContext("2d");

      // Soft outer glow
      const glow = ctx.createRadialGradient(
        32, 32, 0,
        32, 32, 32
      );

      glow.addColorStop(
        0,
        "rgba(255,255,255,1)"
      );

      glow.addColorStop(
        0.18,
        "rgba(255,255,255,0.95)"
      );

      glow.addColorStop(
        0.45,
        "rgba(180,245,240,0.45)"
      );

      glow.addColorStop(
        1,
        "rgba(180,245,240,0)"
      );

      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, 64, 64);

      // ✦ Four-point magical star
      ctx.save();
      ctx.translate(32, 32);

      ctx.beginPath();

      ctx.moveTo(0, -30);
      ctx.lineTo(4, -6);
      ctx.lineTo(30, 0);
      ctx.lineTo(4, 4);
      ctx.lineTo(0, 30);
      ctx.lineTo(-4, 4);
      ctx.lineTo(-30, 0);
      ctx.lineTo(-4, -6);

      ctx.closePath();

      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.shadowColor = "rgba(180,255,245,0.9)";
      ctx.shadowBlur = 8;
      ctx.fill();

      ctx.restore();

      return new THREE.CanvasTexture(cv);
    }

    const starTexture =
      makeStarTexture();

    const STAR_COUNT = 2200;

    const starGeo =
      new THREE.BufferGeometry();

    const starPositions =
      new Float32Array(
        STAR_COUNT * 3
      );

    const starColors =
      new Float32Array(
        STAR_COUNT * 3
      );

    for (
      let i = 0;
      i < STAR_COUNT;
      i++
    ) {
      const r =
        30 +
        Math.random() * 60;

      const theta =
        Math.random() *
        Math.PI *
        2;

      const phi =
        Math.acos(
          Math.random() * 2 - 1
        );

      starPositions[i * 3] =
        r *
        Math.sin(phi) *
        Math.cos(theta);

      starPositions[
        i * 3 + 1
      ] =
        r *
          Math.cos(phi) *
          0.6 +
        5;

      starPositions[
        i * 3 + 2
      ] =
        r *
        Math.sin(phi) *
        Math.sin(theta);

      const random =
        Math.random();

      let color;

      if (random < 0.12) {
        color =
          new THREE.Color(
            0x9fe8e0
          );
      } else if (
        random < 0.2
      ) {
        color =
          new THREE.Color(
            0xe0a888
          );
      } else {
        color =
          new THREE.Color(
            0xffffff
          );
      }

      starColors[i * 3] =
        color.r;

      starColors[
        i * 3 + 1
      ] = color.g;

      starColors[
        i * 3 + 2
      ] = color.b;
    }

    starGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(
        starPositions,
        3
      )
    );

    starGeo.setAttribute(
      "color",
      new THREE.BufferAttribute(
        starColors,
        3
      )
    );

    const starMaterial =
      new THREE.PointsMaterial({
        size: 0.35,
        map: starTexture,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
        vertexColors: true,
        blending:
          THREE.AdditiveBlending,
        sizeAttenuation: true,
      });

    const starPoints =
      new THREE.Points(
        starGeo,
        starMaterial
      );

    scene.add(starPoints);

    // =========================================================
    // MAGICAL BURST PARTICLES
    // =========================================================

    const BURST_COUNT = 420;

    const burstGeo =
      new THREE.BufferGeometry();

    const burstPositions =
      new Float32Array(
        BURST_COUNT * 3
      );

    const burstColors =
      new Float32Array(
        BURST_COUNT * 3
      );

    const burstVelocities = [];

    for (
      let i = 0;
      i < BURST_COUNT;
      i++
    ) {
      // Start inside the box
      burstPositions[i * 3] =
        (Math.random() - 0.5) *
        1.0;

      burstPositions[
        i * 3 + 1
      ] =
        -0.2 +
        Math.random() * 0.6;

      burstPositions[
        i * 3 + 2
      ] =
        (Math.random() - 0.5) *
        0.8;

      // 3D scatter velocity
      burstVelocities.push({
        x:
          (Math.random() - 0.5) *
          0.055,

        y:
          0.025 +
          Math.random() *
            0.085,

        z:
          (Math.random() - 0.5) *
          0.055,
      });

      const color =
        Math.random() < 0.35
          ? new THREE.Color(
              0xbfffee
            )
          : new THREE.Color(
              0xffffff
            );

      burstColors[i * 3] =
        color.r;

      burstColors[
        i * 3 + 1
      ] = color.g;

      burstColors[
        i * 3 + 2
      ] = color.b;
    }

    burstGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(
        burstPositions,
        3
      )
    );

    burstGeo.setAttribute(
      "color",
      new THREE.BufferAttribute(
        burstColors,
        3
      )
    );

    const burstMaterial =
      new THREE.PointsMaterial({
        size: 0.28,
        map: starTexture,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        vertexColors: true,
        blending:
          THREE.AdditiveBlending,
        sizeAttenuation: true,
      });

    const burstParticles =
      new THREE.Points(
        burstGeo,
        burstMaterial
      );

    // IMPORTANT:
    // Burst particles belong to the scene,
    // not the box, so they stay after box disappears.
    scene.add(burstParticles);

    // =========================================================
    // CAMERA
    // =========================================================

    let azimuth = -0.6;
    let polar = 1.15;
    let radius = 7.5;

    let targetAzimuth =
      azimuth;

    let targetPolar =
      polar;

    let targetRadius =
      radius;

    let autoRotate = true;

    function updateCamera() {
      azimuth +=
        (targetAzimuth -
          azimuth) *
        0.08;

      polar +=
        (targetPolar -
          polar) *
        0.08;

      radius +=
        (targetRadius -
          radius) *
        0.08;

      const p =
        Math.max(
          0.5,
          Math.min(
            2.6,
            polar
          )
        );

      camera.position.x =
        radius *
        Math.sin(p) *
        Math.sin(
          azimuth
        );

      camera.position.y =
        radius *
          Math.cos(p) +
        0.4;

      camera.position.z =
        radius *
        Math.sin(p) *
        Math.cos(
          azimuth
        );

      camera.lookAt(
        0,
        0.1,
        0
      );
    }

    // =========================================================
    // OPEN ANIMATION
    // =========================================================

    let hasOpened = false;
    let burstActive = false;

    function openRelic() {
      if (hasOpened) return;

      hasOpened = true;
      autoRotate = false;

      // Make prompt disappear
      gsap.to(
        ".interaction",
        {
          opacity: 0,
          duration: 0.35,
        }
      );

      const timeline =
        gsap.timeline();

      // Slight lift
      timeline.to(
        boxGroup.position,
        {
          y: 0.38,
          duration: 0.5,
          ease: "power2.out",
        }
      );

      // Unlock
      timeline.to(
        shacklePivot.rotation,
        {
          z: -1.8,
          duration: 0.6,
          ease: "back.out(1.4)",
        }
      );

      // Magical glow starts
      timeline.to(
        innerLight,
        {
          intensity: 8,
          distance: 7,
          duration: 0.7,
          ease: "power2.out",
        },
        "<"
      );

      timeline.to(
        glowSprite.scale,
        {
          x: 7,
          y: 7,
          duration: 0.8,
          ease: "power2.out",
        },
        "<"
      );

      timeline.to(
        glowSprite.material,
        {
          opacity: 1,
          duration: 0.5,
        },
        "<"
      );

      // Lid opens
      timeline.to(
        lidPivot.rotation,
        {
          x: -2.15,
          duration: 1.3,
          ease: "power3.inOut",
        }
      );

      // BURST
      timeline.add(() => {
        burstActive = true;

        burstMaterial.opacity = 1;

        // Make background stars brighter too
        gsap.to(
          starMaterial,
          {
            size: 0.5,
            opacity: 1,
            duration: 0.7,
          }
        );
      });

      // DOM POP STARS
      particlesRef.current.forEach((particle) => {
        gsap.set(particle, {
          x: 0,
          y: 0,
          opacity: 0,
          scale: 0.2,
        });
      });

      timeline.to(
        particlesRef.current,
        {
          opacity: 1,
          x: () => (Math.random() - 0.5) * 500,
          y: () => -100 - Math.random() * 350,
          rotation: () =>
            Math.random() * 720 - 360,
          scale: () =>
            0.5 + Math.random() * 1.5,
          duration: 1.8,
          stagger: {
            each: 0.025,
            from: "random",
          },
          ease: "power3.out",
        },
        "-=0.5"
      );

      // =========================================================
      // FLOATING TECH SYMBOLS
      // =========================================================

      techSymbolsRef.current.forEach((symbol) => {
        gsap.set(symbol, {
          x: 0,
          y: 0,
          rotation: 0,
        });

        gsap.to(symbol, {
          x: () =>
            (Math.random() - 0.5) *
            120,

          y: () =>
            (Math.random() - 0.5) *
            100,

          rotation: () =>
            (Math.random() - 0.5) *
            30,

          duration:
            5 + Math.random() * 6,

          delay:
            Math.random() * 3,

          repeat: -1,

          yoyo: true,

          ease: "sine.inOut",
        });
      });

      // Camera moves closer
      timeline.to(
        { value: radius },
        {
          value: 6.3,
          duration: 1.5,
          ease: "power2.out",
          onUpdate() {
            targetRadius =
              this.targets()[0].value;
          },
        },
        "<"
      );

      // Let particles travel
      timeline.to(
        {},
        {
          duration: 1.6,
        }
      );

      // Fade relic
      const relicMaterials = [];

      boxGroup.traverse(
        (child) => {
          if (
            child.isMesh &&
            child.material
          ) {
            if (
              Array.isArray(
                child.material
              )
            ) {
              child.material.forEach(
                (material) => {
                  relicMaterials.push(
                    material
                  );
                }
              );
            } else {
              relicMaterials.push(
                child.material
              );
            }
          }
        }
      );

      const uniqueMaterials =
        [
          ...new Set(
            relicMaterials
          ),
        ];

      timeline.to(
        uniqueMaterials,
        {
          opacity: 0,
          duration: 0.8,
          ease: "power2.in",
        }
      );

      timeline.to(
        boxGroup.scale,
        {
          x: 0.2,
          y: 0.2,
          z: 0.2,
          duration: 0.9,
          ease: "power3.in",
        },
        "<"
      );

      timeline.to(
        boxGroup.position,
        {
          y: -1,
          duration: 0.9,
          ease: "power3.in",
          onComplete() {
            boxGroup.visible =
              false;
          },
        },
        "<"
      );

      // Box gone — reveal title
      timeline.to(
        glowSprite.material,
        {
          opacity: 0,
          duration: 0.8,
        }
      );

      timeline.to(
        ".msa-title",
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: "power3.out",
        }
      );

      timeline.to(
        ".pandora-title",
        {
          opacity: 1,
          y: 0,
          duration: 1.1,
          ease: "power3.out",
        },
        "-=0.55"
      );

      timeline.to(
        ".subtitle",
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
        },
        "-=0.5"
      );
    }

    // =========================================================
    // CLICK / TOUCH
    // =========================================================

    const raycaster =
      new THREE.Raycaster();

    const mouse =
      new THREE.Vector2();

    let pointerDownX = 0;
    let pointerDownY = 0;

    renderer.domElement.addEventListener(
      "pointerdown",
      (event) => {
        pointerDownX =
          event.clientX;

        pointerDownY =
          event.clientY;

        autoRotate = false;
      }
    );

    renderer.domElement.addEventListener(
      "pointerup",
      (event) => {
        const moved =
          Math.hypot(
            event.clientX -
              pointerDownX,
            event.clientY -
              pointerDownY
          );

        if (moved > 8) return;

        mouse.x =
          (event.clientX /
            window.innerWidth) *
            2 -
          1;

        mouse.y =
          -(event.clientY /
            window.innerHeight) *
            2 +
          1;

        raycaster.setFromCamera(
          mouse,
          camera
        );

        const hits =
          raycaster.intersectObjects(
            boxGroup.children,
            true
          );

        if (
          hits.length &&
          !hasOpened
        ) {
          openRelic();
        }
      }
    );

    // =========================================================
    // DRAG ORBIT
    // =========================================================

    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    renderer.domElement.addEventListener(
      "pointerdown",
      (event) => {
        dragging = true;

        lastX =
          event.clientX;

        lastY =
          event.clientY;
      }
    );

    window.addEventListener(
      "pointerup",
      () => {
        dragging = false;
      }
    );

    window.addEventListener(
      "pointermove",
      (event) => {
        if (!dragging) return;

        const dx =
          event.clientX - lastX;

        const dy =
          event.clientY - lastY;

        targetAzimuth -=
          dx * 0.006;

        targetPolar -=
          dy * 0.006;

        lastX =
          event.clientX;

        lastY =
          event.clientY;
      }
    );

    renderer.domElement.addEventListener(
      "wheel",
      (event) => {
        targetRadius =
          Math.max(
            4,
            Math.min(
              14,
              targetRadius +
                event.deltaY *
                  0.003
            )
          );

        event.preventDefault();
      },
      { passive: false }
    );

    // =========================================================
    // RESIZE
    // =========================================================

    function handleResize() {
      camera.aspect =
        window.innerWidth /
        window.innerHeight;

      camera.updateProjectionMatrix();

      renderer.setSize(
        window.innerWidth,
        window.innerHeight
      );
    }

    window.addEventListener(
      "resize",
      handleResize
    );

    // =========================================================
    // ANIMATION LOOP
    // =========================================================

    const clock =
      new THREE.Clock();

    function animate() {
      requestAnimationFrame(
        animate
      );

      const dt =
        clock.getDelta();

      const t =
        clock.elapsedTime;

      // Camera
      if (
        autoRotate &&
        !hasOpened
      ) {
        targetAzimuth +=
          dt * 0.08;
      }

      updateCamera();

      // Lights
      teal.intensity =
        6 +
        Math.sin(t * 1.6) *
          1.2;

      rim.intensity =
        1.0 +
        Math.sin(
          t * 0.9 + 1
        ) *
          0.25;

      warm.intensity =
        4.3 +
        Math.sin(t * 1.2) *
          0.35;

      relicFill.intensity =
        3.8 +
        Math.sin(t * 1.4) *
          0.25;

      glowSprite.material.opacity =
        0.7 +
        Math.sin(t * 1.6) *
          0.15;

      // Background stars
      starPoints.rotation.y +=
        dt * 0.004;

      // Magical burst
      if (burstActive) {
        const positions =
          burstGeo.attributes
            .position.array;

        for (
          let i = 0;
          i < BURST_COUNT;
          i++
        ) {
          const velocity =
            burstVelocities[i];

          positions[
            i * 3
          ] +=
            velocity.x;

          positions[
            i * 3 + 1
          ] +=
            velocity.y;

          positions[
            i * 3 + 2
          ] +=
            velocity.z;

          // Gravity
          velocity.y -=
            0.0009;
        }

        burstGeo.attributes.position.needsUpdate =
          true;
      }

      renderer.render(
        scene,
        camera
      );
    }

    animate();

    // =========================================================
    // CLEANUP
    // =========================================================

    return () => {
      window.removeEventListener(
        "resize",
        handleResize
      );

      renderer.dispose();

      if (
        renderer.domElement &&
        container.contains(
          renderer.domElement
        )
      ) {
        container.removeChild(
          renderer.domElement
        );
      }
    };
  }, []);

  return (
    <div className="app">
      <div
        ref={mountRef}
        className="three-container"
      />

      <div className="particle-field">
        {Array.from({ length: 55 }).map((_, i) => (
          <span
            key={i}
            ref={(el) => {
              if (
                el &&
                !particlesRef.current.includes(el)
              ) {
                particlesRef.current.push(el);
              }
            }}
            className="particle"
            style={{
              left: `${10 + Math.random() * 80}%`,
              top: `${20 + Math.random() * 55}%`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          >
            {i % 4 === 0 ? "✦" : "·"}
          </span>
        ))}
      </div>

      {/* FLOATING TECH SYMBOLS */}
      <div className="tech-symbol-field">
        {[
          "{ }",
          "</>",
          "01",
          "AI",
          "λ",
          "⚡",
          "⌘",
          "<>",
          "#",
          "∞",
          "01",
          "{ }",
          "AI",
          "</>",
        ].map((symbol, i) => (
          <span
            key={i}
            ref={(el) => {
              if (
                el &&
                !techSymbolsRef.current.includes(el)
              ) {
                techSymbolsRef.current.push(el);
              }
            }}
            className="tech-symbol"
            style={{
              left: `${8 + Math.random() * 84}%`,
              top: `${12 + Math.random() * 72}%`,
              opacity:
                0.08 +
                Math.random() * 0.14,
              fontSize:
                `${0.65 + Math.random() * 0.75}rem`,
            }}
          >
            {symbol}
          </span>
        ))}
      </div>

      <div className="title-layer">
        <div className="msa-title">
          MSA
        </div>

        <div className="pandora-title">
          PANDORA
        </div>

        <div className="subtitle">
          every mystery begins with a key
        </div>
      </div>

      <div className="interaction">
        <span>✦</span>
        <p>click the relic to unlock</p>
      </div>
    </div>
  );
}