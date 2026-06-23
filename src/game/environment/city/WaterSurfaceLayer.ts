import * as THREE from "three";
import type { CityLayerConfig } from "./types";

export class WaterSurfaceLayer {
  private mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  private elapsed = 0;

  constructor(
    private scene: THREE.Scene,
    private config: CityLayerConfig,
  ) {
    const width = Math.max(1, config.xMax - config.xMin);
    const depth = Math.max(1, config.zEnd - config.zStart);
    const geometry = new THREE.PlaneGeometry(width, depth, 96, 96);
    const material = this.createMaterial(config);

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.position.set(
      (config.xMin + config.xMax) / 2,
      config.y,
      (config.zStart + config.zEnd) / 2,
    );
    this.mesh.frustumCulled = false;
    this.mesh.receiveShadow = false;
    this.mesh.castShadow = false;

    this.scene.add(this.mesh);
  }

  public update(deltaTime: number, baseSpeed: number): void {
    const dtSeconds = deltaTime / 1000;
    this.elapsed += dtSeconds;
    this.mesh.material.uniforms.uTime.value = this.elapsed;

    const move = deltaTime * baseSpeed * this.config.speedFactor;
    const cycleLength = this.config.zEnd - this.config.zStart;
    this.mesh.position.z += move;

    if (this.mesh.position.z > 0) {
      this.mesh.position.z -= cycleLength;
    }
  }

  public dispose(): void {
    this.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }

  private createMaterial(config: CityLayerConfig): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      transparent: (config.opacity ?? 1) < 1,
      opacity: config.opacity ?? 1,
      depthWrite: (config.opacity ?? 1) >= 1,
      side: THREE.DoubleSide,
      uniforms: {
        uTime: { value: 0 },
        uColorA: { value: new THREE.Color(config.color) },
        uColorB: { value: new THREE.Color(config.secondaryColor ?? config.color) },
        uEmissive: { value: new THREE.Color(config.emissive ?? 0x000000) },
        uEmissiveIntensity: { value: config.emissiveIntensity ?? 0 },
        uOpacity: { value: config.opacity ?? 1 },
        uWaveAmplitude: { value: config.waveAmplitude ?? 1.2 },
        uWaveFrequency: { value: config.waveFrequency ?? 0.08 },
        uWaveSpeed: { value: config.waveSpeed ?? 1.6 },
      },
      vertexShader: `
        uniform float uTime;
        uniform float uWaveAmplitude;
        uniform float uWaveFrequency;
        uniform float uWaveSpeed;
        varying vec2 vUv;
        varying float vWave;

        void main() {
          vUv = uv;
          vec3 pos = position;
          float t = uTime * uWaveSpeed;
          float waveA = sin((pos.x * uWaveFrequency) + t);
          float waveB = sin((pos.y * uWaveFrequency * 1.7) - t * 1.35);
          float waveC = sin(((pos.x + pos.y) * uWaveFrequency * 0.65) + t * 0.7);
          vWave = (waveA + waveB + waveC) / 3.0;
          pos.z += vWave * uWaveAmplitude;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColorA;
        uniform vec3 uColorB;
        uniform vec3 uEmissive;
        uniform float uEmissiveIntensity;
        uniform float uOpacity;
        varying vec2 vUv;
        varying float vWave;

        void main() {
          float foam = smoothstep(0.42, 0.92, vWave);
          float band = sin((vUv.y * 44.0) + (vWave * 2.5)) * 0.5 + 0.5;
          float mixFactor = clamp(foam * 0.55 + band * 0.12, 0.0, 1.0);
          vec3 color = mix(uColorA, uColorB, mixFactor);
          color += uEmissive * uEmissiveIntensity * (0.35 + foam * 0.65);
          gl_FragColor = vec4(color, uOpacity);
        }
      `,
    });
  }
}
