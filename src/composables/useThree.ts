// src/three/useThree.ts
import * as THREE from "three";
import { type Ref, onMounted, onUnmounted } from "vue";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { AfterimagePass } from "three/examples/jsm/postprocessing/AfterimagePass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";

// Типы
export type ThreeRefs = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
};

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let composer: EffectComposer;
let afterimagePass: AfterimagePass;
// let listener: THREE.AudioListener;

export function useThree(container: Ref<HTMLElement | null>) {
  function init() {
    if (!container.value) return;

    // ---- Scene ----
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x000000, 0, 100);

    // ---- Camera ----
    const aspect = container.value.clientWidth / container.value.clientHeight;
    camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
    camera.position.set(0, 4, 5);
    camera.lookAt(0, 1, -10);

    // // ---- Audio ----
    // listener = new THREE.AudioListener();
    // camera.add(listener);

    // ---- Renderer ----
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      // powerPreference: "high-performance",
    });
    renderer.setSize(container.value.clientWidth, container.value.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1));
    // renderer.shadowMap.enabled = false;
    // renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    afterimagePass = new AfterimagePass(0.96); // оригинальное значение damp
    composer.addPass(afterimagePass);

    container.value.appendChild(renderer.domElement);

    // ---- Resize ----
    window.addEventListener("resize", onWindowResize);
  }

  function onWindowResize() {
    if (!container.value || !camera || !renderer) return;
    camera.aspect = container.value.clientWidth / container.value.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.value.clientWidth, container.value.clientHeight);
    composer.setSize(container.value.clientWidth, container.value.clientHeight);
  }

  // ---- Cleanup ----
  function cleanup() {
    window.removeEventListener("resize", onWindowResize);
    renderer.dispose();
    scene.clear();
  }

  onMounted(init);
  onUnmounted(cleanup);

  // ---- Геттеры ----
  function getScene(): THREE.Scene {
    return scene;
  }

  function getCamera(): THREE.PerspectiveCamera {
    return camera;
  }

  function getRenderer(): THREE.WebGLRenderer {
    return renderer;
  }

  function getComposer() {
    return composer;
  }

  function getMotionBlurPass() {
    return afterimagePass;
  }

  return {
    getScene,
    getCamera,
    getRenderer,
    getComposer,
    getMotionBlurPass,
  };
}
