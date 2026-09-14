varying vec2 vUv;
uniform float uTime;

void main() {
    vUv = uv;

    vec3 pos = position;
    float center = 1.0 - abs(uv.x - 0.5) * 2.0;
    float ripple = sin(uv.y * 34.0 - uTime * 26.0);
    pos.x += ripple * 0.055 * center;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
