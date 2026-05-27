uniform float uTime;
        uniform vec3 uColor;

        varying vec2 vUv;

        void main() {

          vec2 uv = vUv - 0.5;
          float dist = length(uv);

          float core = smoothstep(0.25, 0.0, dist);

          float ring = smoothstep(0.42,0.38,dist)
                     - smoothstep(0.52,0.48,dist);

          float pulse = sin(uTime * 12.0) * 0.15;

          float alpha =
              core
            + ring * (1.0 + pulse);

          alpha *= (1.0 - uTime);

          gl_FragColor = vec4(uColor, alpha);
        }