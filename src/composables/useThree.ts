// src/three/useThree.ts
import * as THREE from "three";
import { type Ref, onMounted, onUnmounted } from "vue";

// Типы
export type ThreeRefs = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
};

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;

export function useThree(container: Ref<HTMLElement | null>) {
  function init() {
    if (!container.value) return;

    // ---- Scene ----
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x000000, 10, 70);

    // ---- Camera ----
    const aspect = container.value.clientWidth / container.value.clientHeight;
    camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
    camera.position.set(0, 4, 5);
    camera.lookAt(0, 1, -10);

    // ---- Renderer ----
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      // powerPreference: "high-performance",
    });
    renderer.setSize(container.value.clientWidth, container.value.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1));
    // renderer.shadowMap.enabled = true;
    // renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.value.appendChild(renderer.domElement);

    // ---- Resize ----
    window.addEventListener("resize", onWindowResize);
  }

  function onWindowResize() {
    if (!container.value || !camera || !renderer) return;
    camera.aspect = container.value.clientWidth / container.value.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.value.clientWidth, container.value.clientHeight);
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

  return { getScene, getCamera, getRenderer };
}
