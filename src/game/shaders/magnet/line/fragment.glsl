
varying vec2 vUv;
uniform float time;
uniform vec3 color;

void main() {

// центр луча
float center = abs(vUv.x - 0.5);

// мягкие края
float beam = smoothstep(0.48, 0.08, center);

// поток энергии
float flow =
sin(vUv.y * 18.0 - time * 12.0) * 0.5 + 0.5;

// яркость
float alpha = beam * (0.45 + flow * 0.7);

gl_FragColor = vec4(color, alpha);
}
    