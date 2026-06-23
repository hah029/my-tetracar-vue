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
    const widthSegments = Math.max(96, Math.min(220, Math.round(width / 3.5)));
    const depthSegments = Math.max(96, Math.min(180, Math.round(depth / 3.5)));
    const geometry = new THREE.PlaneGeometry(
      width,
      depth,
      widthSegments,
      depthSegments,
    );
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
        varying float vFoam;

        vec2 hash(vec2 p) {
          p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
          return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);

          return mix(
            mix(dot(hash(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
                dot(hash(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
            mix(dot(hash(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
                dot(hash(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x),
            u.y
          );
        }

        float fbm(vec2 p) {
          float value = 0.0;
          float amplitude = 0.5;
          mat2 rotate = mat2(0.8, -0.6, 0.6, 0.8);

          for (int i = 0; i < 5; i++) {
            value += amplitude * noise(p);
            p = rotate * p * 2.05 + 17.0;
            amplitude *= 0.5;
          }

          return value;
        }

        void main() {
          vUv = uv;
          vec3 pos = position;
          float t = uTime * uWaveSpeed;
          vec2 flow = vec2(t * 0.18, -t * 0.11);
          vec2 gust = vec2(-t * 0.055, t * 0.075);
          float swell = fbm(pos.xy * uWaveFrequency + flow);
          float chop = fbm(pos.xy * uWaveFrequency * 2.85 + gust);
          float ridges = 1.0 - abs(fbm(pos.xy * uWaveFrequency * 5.2 - flow * 1.6));

          vWave = swell * 0.72 + chop * 0.34 + ridges * 0.2;
          vFoam = smoothstep(0.58, 0.9, vWave + ridges * 0.25);
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
        varying float vFoam;

        void main() {
          float longCurrent = smoothstep(0.22, 0.88, sin(vUv.y * 18.0 + vWave * 3.0) * 0.5 + 0.5);
          float mixFactor = clamp(vFoam * 0.62 + longCurrent * 0.08 + vWave * 0.18, 0.0, 1.0);
          vec3 color = mix(uColorA, uColorB, mixFactor);
          color += uEmissive * uEmissiveIntensity * (0.28 + vFoam * 0.95);
          gl_FragColor = vec4(color, uOpacity);
        }
      `,
    });
  }
}
