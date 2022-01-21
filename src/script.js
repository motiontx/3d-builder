import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import jsonFont from "../static/fonts/font.json";
import * as dat from "dat.gui";

// ------------------------------------------------------------
// GUI
// ------------------------------------------------------------
const gui = new dat.GUI();

// ------------------------------------------------------------
// Canvas
// ------------------------------------------------------------
const canvas = document.querySelector("canvas.webgl");

// ------------------------------------------------------------
// Scene
// ------------------------------------------------------------
const scene = new THREE.Scene();

// ------------------------------------------------------------
// Sizes
// ------------------------------------------------------------
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// ------------------------------------------------------------
// Fonts
// ------------------------------------------------------------
const loader = new THREE.FontLoader();
const font = loader.parse(jsonFont);

// ------------------------------------------------------------
// Grid Helper
// ------------------------------------------------------------
const gridHelper = new THREE.GridHelper(1001, 1001, 0xcccccc);
gridHelper.position.y = 0.01;
scene.add(gridHelper);

// ------------------------------------------------------------
// Orthographic camera
// ------------------------------------------------------------
const aspect = sizes.width / sizes.height;
const d = 12;
const camera = new THREE.OrthographicCamera(
  -d * aspect,
  d * aspect,
  d,
  -d,
  1,
  10000
);
camera.position.set(50, 50, 50);
camera.lookAt(0, 0, 0);
scene.add(camera);

// ------------------------------------------------------------
// Ambient light
// ------------------------------------------------------------
const ambientLight = new THREE.AmbientLight(0xfffae5, 0.1);
scene.add(ambientLight);

// ------------------------------------------------------------
// Point light
// ------------------------------------------------------------
const shadowLight = new THREE.DirectionalLight(0xffffff, 1);
shadowLight.position.set(25, 100, -50);
shadowLight.castShadow = true;
shadowLight.shadow.camera.left = -100;
shadowLight.shadow.camera.right = 100;
shadowLight.shadow.camera.top = 100;
shadowLight.shadow.camera.bottom = -100;
shadowLight.shadow.mapSize.width = 2048;
shadowLight.shadow.mapSize.height = 2048;
scene.add(shadowLight);

// ------------------------------------------------------------
// Mouse
// ------------------------------------------------------------
const mouse = new THREE.Vector2();
document.addEventListener(
  "mousemove",
  (event) => {
    mouse.x = (event.clientX / sizes.width) * 2 - 1;
    mouse.y = -(event.clientY / sizes.height) * 2 + 1;
  },
  false
);

// ------------------------------------------------------------
// Raycaster
// ------------------------------------------------------------
const raycaster = new THREE.Raycaster();

// ------------------------------------------------------------
// Floor
// ------------------------------------------------------------
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(249, 249, 249, 249),
  new THREE.MeshStandardMaterial({
    color: 0xfafdf6,
  })
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// ------------------------------------------------------------
// Arrow
// ------------------------------------------------------------

// arrow
const arrowMaterial = new THREE.MeshStandardMaterial({
  color: 0xa4161a,
});

const arrowCone = new THREE.Mesh(
  new THREE.ConeGeometry(0.5, 1, 50),
  arrowMaterial
);
arrowCone.position.set(0, 1, 0);
arrowCone.rotation.x = -Math.PI;

const arrowCylinder = new THREE.Mesh(
  new THREE.CylinderGeometry(0.2, 0.2, 3, 50),
  arrowMaterial
);
arrowCylinder.position.set(0, 3, 0);

const arrow = new THREE.Group();
arrow.add(arrowCone);
arrow.add(arrowCylinder);
scene.add(arrow);

// Arrow Base
const arrowBase = new THREE.Mesh(
  new THREE.PlaneGeometry(1, 1, 1, 1),
  arrowMaterial
);
arrowBase.rotation.x = -Math.PI / 2;
arrowBase.position.set(0, 0.01, 0);
scene.add(arrowBase);

// SetArrowPosition
function setArrowPosition(x, z) {
  arrow.position.y = 2;
  arrow.position.x = x;
  arrow.position.z = z;
  arrowBase.position.x = x;
  arrowBase.position.z = z;
}

// HideArrow
const hideArrow = () => (arrow.visible = false);

// hideArrowBase
const hideArrowBase = () => (arrowBase.visible = false);

// ShowArrow
const showArrow = () => (arrow.visible = true);

// ShowArrowBase
const showArrowBase = () => (arrowBase.visible = true);

// ------------------------------------------------------------
// Controls
// ------------------------------------------------------------
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.enableRotate = false;
controls.minPolarAngle = (Math.PI / 8) * 2;
controls.maxPolarAngle = (Math.PI / 8) * 3;
controls.minAzimuthAngle = 0;
controls.maxAzimuthAngle = Math.PI / 2;
controls.zoomSpeed = 0.25;
controls.rotateSpeed = 0.25;
controls.maxZoom = 2;
controls.minZoom = 0.5;

// ------------------------------------------------------------
// Renderer
// ------------------------------------------------------------
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// ------------------------------------------------------------
// Shaders
// ------------------------------------------------------------
const renderScene = new RenderPass(scene, camera);

// Bloom
const bloomParams = {
  strength: 0.7,
  radius: 0.6,
  threshold: 0,
};

let uniforms = {
  globalBloom: { value: 1 },
};

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(sizes.width, sizes.height),
  bloomParams.strength,
  bloomParams.radius,
  bloomParams.threshold
);

const bloomGui = gui.addFolder("Bloom");

bloomGui.add(bloomParams, "strength", 0, 1).onChange(() => {
  bloomPass.strength = bloomParams.strength;
});

bloomGui.add(bloomParams, "radius", 0, 1).onChange(() => {
  bloomPass.radius = bloomParams.radius;
});

bloomGui.add(bloomParams, "threshold", 0, 1).onChange(() => {
  bloomPass.threshold = bloomParams.threshold;
});

const composer = new EffectComposer(renderer);
composer.renderToScreen = false;
composer.addPass(renderScene);
composer.addPass(bloomPass);

const finalPass = new ShaderPass(
  new THREE.ShaderMaterial({
    uniforms: {
      baseTexture: { value: null },
      bloomTexture: { value: composer.renderTarget2.texture },
    },
    vertexShader: document.getElementById("vertexshader").textContent,
    fragmentShader: document.getElementById("fragmentshader").textContent,
    defines: {},
  }),
  "baseTexture"
);
finalPass.needsSwap = true;

const finalComposer = new EffectComposer(renderer);
finalComposer.addPass(renderScene);
finalComposer.addPass(finalPass);

// ------------------------------------------------------------
// State
// ------------------------------------------------------------
const state = {
  currentTool: "build",
  currentBuild: null,
  currentBuildPosition: {
    start: {
      x: 0,
      z: 0,
    },
    end: {
      x: 0,
      z: 0,
    },
  },
  buildingState: null, // start, moving, end
};

function newBuilding() {
  const {
    start: { x: sx, z: sz },
    end: { x: ex, z: ez },
  } = state.currentBuildPosition;

  state.currentBuild = new THREE.Group();

  const buildMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x172a3a,
    shading: THREE.FlatShading,
  });

  const dx = Math.abs(ex - sx);
  const dz = Math.abs(ez - sz);

  const t = new THREE.Mesh(new THREE.BoxGeometry(dx, 2, 0.3), buildMaterial);
  t.position.set(sx + (ex - sx) / 2, 1.01, sz);
  t.castShadow = true;
  t.name = "top";

  const b = new THREE.Mesh(new THREE.BoxGeometry(dx, 2, 0.3), buildMaterial);
  b.position.set(sx + (ex - sx) / 2, 1.01, ez);
  b.castShadow = true;
  b.name = "bottom";

  const l = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2, dz), buildMaterial);
  l.position.set(sx, 1.01, sz + (ez - sz) / 2);
  l.castShadow = true;
  l.name = "left";

  const r = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2, dz), buildMaterial);
  r.position.set(ex, 1.01, sz + (ez - sz) / 2);
  r.castShadow = true;
  r.name = "right";

  const f = new THREE.Mesh(
    new THREE.BoxGeometry(dx, 0.3, dz),
    new THREE.MeshPhysicalMaterial({
      color: 0x142533,
      shading: THREE.FlatShading,
    })
  );
  f.position.set(sx + (ex - sx) / 2, 0.16, sz + (ez - sz) / 2);
  f.castShadow = true;
  f.name = "floor";

  /*
  const size = new THREE.Mesh(
    new THREE.TextGeometry("Test", {
      font: font,
      size: 0.5,
      height: 0.1,
      curveSegments: 12,
      bevelEnabled: false,
    }),
    new THREE.MeshPhysicalMaterial({
      color: 0x142533,
      shading: THREE.FlatShading,
    })
  );
  size.position.set(sx + (ex - sx) / 2, 0.16, sz + (ez - sz) / 2);
  size.castShadow = true;
  size.name = "size";
  */

  state.currentBuild.add(t, b, l, r, f);

  state.currentBuild.visible = false;
  scene.add(state.currentBuild);
}

function moveAndResizeBuilding() {
  const {
    start: { x: sx, z: sz },
    end: { x: ex, z: ez },
  } = state.currentBuildPosition;

  const { top, bottom, right, left, floor, size } = Object.fromEntries(
    state.currentBuild.children.map((c) => [c.name, c])
  );

  const dx = Math.abs(ex - sx);
  const dz = Math.abs(ez - sz);

  top.geometry = new THREE.BoxGeometry(dx, 2, 0.3);
  top.position.set(sx + (ex - sx) / 2, 1.01, sz);

  bottom.geometry = new THREE.BoxGeometry(dx, 2, 0.3);
  bottom.position.set(sx + (ex - sx) / 2, 1.01, ez);

  left.geometry = new THREE.BoxGeometry(0.3, 2, dz);
  left.position.set(sx, 1.01, sz + (ez - sz) / 2);

  right.geometry = new THREE.BoxGeometry(0.3, 2, dz);
  right.position.set(ex, 1.01, sz + (ez - sz) / 2);

  floor.geometry = new THREE.BoxGeometry(dx, 0.3, dz);
  floor.position.set(sx + (ex - sx) / 2, 0.16, sz + (ez - sz) / 2);

  /*
  size.geometry = new THREE.TextGeometry("Test", {
    font: font,
    size: 0.5,
    height: 0.1,
    curveSegments: 12,
    bevelEnabled: false,
  });
  size.position.set(sx + (ex - sx) / 2, 4, sz + (ez - sz) / 2);
  */

  state.currentBuild.visible = true;
}

document.addEventListener(
  "mousedown",
  (e) => (state.buildingState = e.button === 0 ? "start" : "end")
);

document.addEventListener(
  "mousemove",
  () =>
    (state.buildingState =
      state.buildingState === "start" || state.buildingState === "moving"
        ? "moving"
        : null)
);

document.addEventListener(
  "mouseup",
  (e) => (state.buildingState = e.button === 0 ? "end" : null)
);

newBuilding();

// ------------------------------------------------------------
// Animation
// ------------------------------------------------------------
const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObject(floor);

  hideArrow();
  hideArrowBase();

  if (intersects[0]?.point) {
    const x = Math.round(intersects[0].point.x);
    const z = Math.round(intersects[0].point.z);
    setArrowPosition(x, z);
    showArrow();
    showArrowBase();
    if (state.buildingState) {
      if (state.buildingState === "start") {
        state.currentBuildPosition.start.x = x;
        state.currentBuildPosition.start.z = z;
      } else if (
        state.buildingState === "end" ||
        state.buildingState === "moving"
      ) {
        state.currentBuildPosition.end.x = x;
        state.currentBuildPosition.end.z = z;

        moveAndResizeBuilding();
      }
      if (state.buildingState === "end") {
        const width = Math.abs(
          state.currentBuildPosition.end.x - state.currentBuildPosition.start.x
        );
        const depth = Math.abs(
          state.currentBuildPosition.end.z - state.currentBuildPosition.start.z
        );

        if (width > 0 && depth > 0) {
          newBuilding();
        } else {
          state.currentBuild.visible = false;
        }
      }
    }
  }

  floor.visible = false;
  gridHelper.visible = false;
  renderer.setClearColor(0x000000);
  uniforms.globalBloom.value = 1;

  composer.render();

  floor.visible = true;
  gridHelper.visible = true;
  renderer.setClearColor(0xfafdf6);
  uniforms.globalBloom.value = 0;

  finalComposer.render();

  controls.update();

  window.requestAnimationFrame(tick);
};

tick();
