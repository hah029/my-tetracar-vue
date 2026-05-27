// shaders/landingWave/fragment.glsl

uniform float uTime;
uniform vec3 uColor;

varying vec2 vUv;

void main() {

    vec2 uv = vUv - 0.5;

    float dist = length(uv);

    // радиус волны
    float radius = uTime * 0.5;

    // толщина кольца
    float thickness = 0.06;

    // кольцо
    float ring =
        smoothstep(radius, radius - thickness, dist)
        *
        smoothstep(radius - thickness * 2.0, radius - thickness, dist);

    // fade out
    float alpha = ring * (1.0 - uTime);

    gl_FragColor = vec4(uColor, alpha);
}