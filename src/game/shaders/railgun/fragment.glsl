varying vec2 vUv;
uniform float uTime;
uniform float uLife;
uniform vec3 uColor;

void main() {
    float horizontal = abs(vUv.x - 0.5) * 2.0;
    float core = 1.0 - smoothstep(0.0, 0.16, horizontal);
    float glow = 1.0 - smoothstep(0.08, 1.0, horizontal);

    // Pulses travel from the muzzle along the beam and reveal a turbulent
    // plasma structure instead of a flat glowing rectangle.
    float flow = 0.5 + 0.5 * sin(vUv.y * 62.0 - uTime * 34.0);
    float filaments = pow(flow, 5.0) * glow;
    float edgeEnergy = pow(1.0 - horizontal, 3.0) *
        (0.55 + 0.45 * sin(vUv.y * 27.0 + uTime * 18.0));

    float appear = smoothstep(0.0, 0.08, uLife);
    float fade = 1.0 - smoothstep(0.45, 1.0, uLife);
    float life = appear * fade;
    float energy = core * 1.35 + glow * 0.22 + filaments * 0.7 + edgeEnergy * 0.3;
    float alpha = (core * 0.92 + glow * 0.22 + filaments * 0.42) * life;

    vec3 color = uColor * (energy * 1.85);
    color += vec3(1.0, 0.72, 0.62) * core * 0.9;

    gl_FragColor = vec4(color * life, alpha);
}
