varying vec2 vUv;
    uniform float time;

    void main() {
    vUv = uv;

    vec3 pos = position;

    // лёгкая волна
    pos.x += sin(uv.y * 12.0 - time * 8.0) * 0.03;

    gl_Position =
        projectionMatrix *
        modelViewMatrix *
        vec4(pos, 1.0);
    }