uniform float uTime;
uniform vec3 uColor;
uniform vec3 uFogColor;
uniform float uFogNear;
uniform float uFogFar;
varying vec2 vUv;
varying float vFogDepth;

void main() {
    float center = 1.0 - abs(vUv.x - 0.5) * 2.0;
    center = pow(center, 2.0);
    float flow = sin(vUv.y * 40.0 - uTime * 8.0);
    flow = flow * 0.5 + 0.5;
    float flow2 = sin(vUv.y * 18.0 - uTime * 4.0);
    flow2 = flow2 * 0.5 + 0.5;
    float alpha = center * 0.10 + center * flow * 0.08 + center * flow2 * 0.05;
    vec3 color = uColor * alpha * 2.0;
    float fogFactor = smoothstep(uFogNear, uFogFar, vFogDepth);
    color = mix(color, uFogColor, fogFactor);
    alpha *= (1.0 - fogFactor);
    gl_FragColor = vec4(color, alpha);
}