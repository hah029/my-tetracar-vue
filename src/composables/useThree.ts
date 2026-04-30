// src/three/useThree.ts
import * as THREE from "three";
import { type Ref, onMounted, onUnmounted, watch } from "vue";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
// import { AfterimagePass } from "three/examples/jsm/postprocessing/AfterimagePass.js";
// import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { useGameState } from "@/store/gameState";
import { useEnvironmentStore } from "@/store/environmentStore";
import { useGraphicsStore } from "@/store/graphicsStore";
// import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
// import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader.js";

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
let resizeFrameId: number | null = null;
// let afterimagePass: AfterimagePass;

export function useThree(container: Ref<HTMLElement | null>) {
    // принудительный рендер одного кадра
    function forceRender() {
        if (composer && scene && camera) composer.render();
    };

    function applyGraphicsSettings() {
        if (!renderer || !container.value) return;

        const graphicsStore = useGraphicsStore();
        const pixelRatio = graphicsStore.getPixelRatio();
        // const bloomStrengthValue = graphicsStore.getBloomStrength();
        // const shadowMapStatus = graphicsStore.getShadowQuality();

        renderer.setPixelRatio(pixelRatio);
        forceRender();  // принудительно перерисовываем

        console.log(`🎮 Pixel ratio: ${pixelRatio} (эффекты: ${graphicsStore.vfxEnabled ? 'вкл' : 'выкл'})`);
    };

    function init() {
        if (!container.value) return;

        // ---- Scene ----
        scene = new THREE.Scene();
        // scene.fog = new THREE.Fog(0x000000, 0, 100);

        // ---- Camera ----
        const aspect = container.value.clientWidth / container.value.clientHeight;
        camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);

        // Axis
        if (useGameState().isDebug) {
            const axesHelper = new THREE.AxesHelper(useEnvironmentStore().AXES_SIZE);
            scene.add(axesHelper);
        };

        // ---- Renderer ----
        const graphicsStore = useGraphicsStore();
        renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: false,
            // powerPreference: "high-performance",
        });
        renderer.setSize(container.value.clientWidth, container.value.clientHeight);
        renderer.toneMappingExposure = 1.5;
        renderer.shadowMap.enabled = false;

        // renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // const bloomPass = new UnrealBloomPass(
        //   new THREE.Vector2(
        //     container.value.clientWidth,
        //     container.value.clientHeight,
        //   ),
        //   0.3, // strength
        //   0.8, // radius
        //   0.85, // threshold
        // );

        // const fxaaPass = new ShaderPass(FXAAShader);
        // fxaaPass.material.uniforms.resolution!.value.set(1 / container.value.clientWidth, 1 / container.value.clientHeight);

        composer = new EffectComposer(renderer);
        composer.addPass(new RenderPass(scene, camera));

        container.value.appendChild(renderer.domElement);
        window.addEventListener("resize", onWindowResize);
        
        // следим за изменением настроек
        let timeoutId: ReturnType<typeof setTimeout> | null = null;
        watch(
            () => useGraphicsStore().vfxEnabled,
            () => {
                if (timeoutId) clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    // применяем pixel ratio и пересоздаём рендерер для antialias
                    applyGraphicsSettings();
                    timeoutId = null;
                }, 50);
            },
        );
    };

    function onWindowResize() {
        if (!container.value || !camera || !renderer) return;
        
        const width = container.value.clientWidth;
        const height = container.value.clientHeight;
        
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
        composer?.setSize(width, height);
        
        if (resizeFrameId) cancelAnimationFrame(resizeFrameId);
        resizeFrameId = requestAnimationFrame(() => {
            forceRender();
            resizeFrameId = null;
        });
    };

    // ---- Cleanup ----
    function cleanup() {
        if (resizeFrameId) cancelAnimationFrame(resizeFrameId);
        window.removeEventListener("resize", onWindowResize);
        renderer?.dispose();
        scene?.clear();
    };

    onMounted(init);
    onUnmounted(cleanup);

    // ---- Геттеры ----
    function getScene(): THREE.Scene {
        return scene;
    };

    function getCamera(): THREE.PerspectiveCamera {
        return camera;
    };

    function getRenderer(): THREE.WebGLRenderer {
        return renderer;
    };

    function getComposer() {
        return composer;
    };

    // function getMotionBlurPass() {
    //   return afterimagePass;
    // }

    return {
        getScene,
        getCamera,
        getRenderer,
        getComposer,
        // getMotionBlurPass,
    };
}
