varying vec2 vUv;
uniform float time;
uniform vec3 color;

void main() {
    vec2 uv = vUv;

    float lines = step(0.8, fract(uv.x * 15.0 - time * 8.0));

    float fadeX = smoothstep(0.0, 0.3, uv.y) * smoothstep(1.0, 0.7, uv.y);

    float alpha = lines * fadeX * 0.6;

    gl_FragColor = vec4(color, alpha);
}