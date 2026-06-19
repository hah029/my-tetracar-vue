import * as THREE from "three";
import type { RoadLaneConfig } from "./types";

// import vertexShader from "@/game/shaders/roadLane/vertex.glsl";
// import fragmentShader from "@/game/shaders/roadLane/fragment.glsl";
// import { useEnvironmentStore } from "@/store/environmentStore";

export class RoadLane extends THREE.Mesh {
  public material: THREE.MeshBasicMaterial | THREE.ShaderMaterial;

  constructor(config: RoadLaneConfig) {
    const { x, z, color = "#66ccff", length = 800, width = 1 } = config;

    const geometry = new THREE.PlaneGeometry(width * 0.9, length);

    // const material = new THREE.ShaderMaterial({
    //   transparent: true,
    //   depthWrite: false,
    //   depthTest: true,
    //   // fog: true,

    //   blending: THREE.AdditiveBlending,

    //   // defines: {
    //   //   USE_FOG: true,
    //   // },

    //   uniforms: {
    //     uTime: { value: 0 },
    //     uColor: { value: new THREE.Color(color) },

    //     // fog uniforms вручную
    //     uFogColor: { value: new THREE.Color() },
    //     uFogNear: { value: useEnvironmentStore().FOG_NEAR },
    //     uFogFar: { value: useEnvironmentStore().FOG_FAR },
    //   },

    //   vertexShader,
    //   fragmentShader,

    //   toneMapped: false,
    // });
    const material = new THREE.MeshBasicMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: true,
      color: new THREE.Color(color),
      opacity: 0.03,
      // fog: true,

      blending: THREE.AdditiveBlending,

      toneMapped: false,
    });

    super(geometry, material);

    this.material = material;

    this.rotation.x = -Math.PI / 2;

    // чуть выше дороги чтобы избежать z-fighting
    this.position.set(x, 0.03, z + 30);

    this.castShadow = false;
    this.receiveShadow = true;

    this.renderOrder = 10;
  }

  update(deltaTime: number) {
    this.material.uniforms.uTime.value += deltaTime;
  }
}
