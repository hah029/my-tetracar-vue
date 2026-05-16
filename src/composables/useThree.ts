// src/three/useThree.ts
import * as THREE from "three";
import { type Ref, onMounted, onUnmounted, watch } from "vue";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { AfterimagePass } from "three/examples/jsm/postprocessing/AfterimagePass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { useGameState } from "@/store/gameState";
import { useEnvironmentStore } from "@/store/environmentStore";
import { useGraphicsStore } from "@/store/graphicsStore";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader.js";
import { RGBShiftShader } from "three/examples/jsm/shaders/RGBShiftShader.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

export type ThreeRefs = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
};

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let composer: EffectComposer;
let resizeFrameId: number | null = null;
let afterimagePass!: AfterimagePass;
let bloomPass: UnrealBloomPass;
let fxaaPass: ShaderPass;
let rgbShiftPass: ShaderPass;

export function useThree(container: Ref<HTMLElement | null>) {
  // Принудительный рендер одного кадра
  function forceRender() {
    if (composer && scene && camera) composer.render();
  }

  // Применение всех графических настроек (эффекты, тени, освещение, пиксель-рейтинг)
  function applyGraphicsSettings() {
    if (!renderer || !container.value) return;

    const graphics = useGraphicsStore();

    // 1. Пиксельное соотношение
    renderer.setPixelRatio(graphics.getPixelRatio());

    // 2. Тени
    const shadowEnabled = graphics.shadowEnabled;
    renderer.shadowMap.enabled = shadowEnabled;

    if (shadowEnabled) {
      const quality = graphics.shadowQuality; // 'low' | 'medium' | 'high'
      if (quality === "high") {
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      } else if (quality === "medium") {
        renderer.shadowMap.type = THREE.PCFShadowMap;
      } else {
        renderer.shadowMap.type = THREE.BasicShadowMap;
      }
    }

    // 3. Синхронизация castShadow у источников света
    if (scene.userData.lights) {
      for (const key of Object.keys(scene.userData.lights)) {
        const light = scene.userData.lights[key];
        if (light && light.isLight && light.shadow !== undefined) {
          light.castShadow = shadowEnabled;
        }
      }
    }

    // 4. Постобработка (включение/выключение проходов)
    const vfxOn = graphics.vfxEnabled;
    bloomPass.enabled = vfxOn && graphics.bloomEnabled;
    fxaaPass.enabled = vfxOn && graphics.fxaaEnabled;
    rgbShiftPass.enabled = vfxOn && graphics.rgbShiftEnabled;

    // 5. Режим день/ночь (фон, туман, освещение)
    updateLightingMode();

    // 6. Принудительная перерисовка
    forceRender();
  }

  // Смена дня и ночи
  function updateLightingMode() {
    if (!scene) return;

    const graphics = useGraphicsStore();
    const isNight = graphics.nightMode;

    // Фон и туман
    if (isNight) {
      scene.background = new THREE.Color(0x000000);
      scene.fog = new THREE.Fog(0x000000, 0.01, 200);
    } else {
      scene.background = new THREE.Color(0xdddddd);
      scene.fog = new THREE.Fog(0xdddddd, 0.01, 200);
    }

    // Освещение (если сохранено в scene.userData.lights)
    const lights = scene.userData.lights;
    if (!lights) return;

    if (isNight) {
      lights.ambientLight.intensity = 0.3;
      lights.dirLight.intensity = 2.0;
      lights.dirLight.color.setHex("#aaccff");
      lights.fillLight.intensity = 2.0;
    } else {
      lights.ambientLight.intensity = 0.1;
      lights.dirLight.intensity = 2.0;
      lights.dirLight.color.setHex("#ffeedd");
      lights.fillLight.intensity = 2.5;
    }
  }

  function setRGBShiftAmount(amount: number) {
    if (rgbShiftPass) {
      rgbShiftPass.uniforms.amount.value = amount;
    }
  }

  function init() {
    if (!container.value) return;

    // ---- Scene ----
    scene = new THREE.Scene();

    // ---- Camera ----
    const aspect = container.value.clientWidth / container.value.clientHeight;
    camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 10000000);

    // Отладочные оси
    if (useGameState().isDebug) {
      const axesHelper = new THREE.AxesHelper(useEnvironmentStore().AXES_SIZE);
      scene.add(axesHelper);
    }

    // ---- Renderer ----
    renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: false,
      powerPreference: "high-performance",
    });
    renderer.setSize(container.value.clientWidth, container.value.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.9;
    // Начальные значения (перезапишутся в applyGraphicsSettings)
    renderer.shadowMap.enabled = false;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // ---- Постобработка ----
    bloomPass = new UnrealBloomPass(
      new THREE.Vector2(
        container.value.clientWidth,
        container.value.clientHeight,
      ),
      1.0,
      0,
      1.2,
    );

    afterimagePass = new AfterimagePass(0.1);

    fxaaPass = new ShaderPass(FXAAShader);
    fxaaPass.material.uniforms.resolution!.value.set(
      1 / container.value.clientWidth,
      1 / container.value.clientHeight,
    );

    // ---- RGBShiftPass ----
    rgbShiftPass = new ShaderPass(RGBShiftShader);
    // rgbShiftPass.uniforms.amount.value = 0.003; // начальная сила сдвига (маленькая)

    const outputPass = new OutputPass();

    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(bloomPass);
    composer.addPass(afterimagePass);
    composer.addPass(fxaaPass);
    composer.addPass(rgbShiftPass);
    composer.addPass(outputPass);

    // Применить начальные настройки из стора
    applyGraphicsSettings();

    container.value.appendChild(renderer.domElement);
    window.addEventListener("resize", onWindowResize);

    // Наблюдаем за группой настроек
    watch(
      () => [
        useGraphicsStore().vfxEnabled,
        useGraphicsStore().bloomEnabled,
        useGraphicsStore().fxaaEnabled,
        useGraphicsStore().nightMode,
        useGraphicsStore().shadowEnabled,
        useGraphicsStore().shadowQuality,
        useGraphicsStore().rgbShiftEnabled,
      ],
      () => {
        applyGraphicsSettings();
      },
    );
  }

  function onWindowResize() {
    if (!container.value || !camera || !renderer) return;

    const width = container.value.clientWidth;
    const height = container.value.clientHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    composer.setSize(width, height);

    // Обновляем разрешение для FXAA
    if (fxaaPass) {
      fxaaPass.material.uniforms.resolution!.value.set(1 / width, 1 / height);
    }
    // Для Bloom тоже нужно обновить размер
    if (bloomPass) {
      bloomPass.resolution.set(width, height);
    }

    if (resizeFrameId) cancelAnimationFrame(resizeFrameId);
    resizeFrameId = requestAnimationFrame(() => {
      forceRender();
      resizeFrameId = null;
    });
  }

  // ---- Cleanup ----
  function cleanup() {
    if (resizeFrameId) cancelAnimationFrame(resizeFrameId);
    window.removeEventListener("resize", onWindowResize);
    renderer?.dispose();
    scene?.clear();
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
    setRGBShiftAmount,
  };
}
