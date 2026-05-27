uniform float uTime;
uniform vec3 uColor;

varying vec2 vUv;

float noise(vec2 p) {
    return sin(p.x * 10.0) * sin(p.y * 10.0);
}

void main() {
    vec2 uv = vUv - 0.5;

    float dist = length(uv);

    float angle = atan(uv.y, uv.x);

    float swirl =
        sin(angle * 8.0 + uTime * 12.0) * 0.04;

    dist += swirl;

    float plasma =
        smoothstep(0.45, 0.0, dist);

    plasma += noise(uv * 8.0 + uTime * 5.0) * 0.15;

    float alpha = plasma * (1.0 - uTime);

    vec3 color = uColor * alpha * 3.0;

    gl_FragColor = vec4(color, alpha);
}