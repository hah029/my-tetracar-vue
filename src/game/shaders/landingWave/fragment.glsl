// shaders/landingWave/fragment.glsl

uniform float uTime;
uniform vec3 uColor;
uniform float uIntensity;
uniform float uThickness;
uniform float uTrailLength;
uniform float uArcAngle;

varying vec2 vUv;

void main() {

    vec2 uv = vUv - 0.5;

    float dist = length(uv);

    // радиус волны
    float radius = uTime * 0.5;

    // A narrow, bright shock front, followed by a dim and fading trail.
    // Keeping the trail behind the crest makes the sector read as a moving
    // wave instead of a uniformly lit plane.
    float crest = 1.0 - smoothstep(0.0, uThickness, abs(dist - radius));
    float behindCrest = max(radius - dist, 0.0);
    float trail = step(dist, radius) *
        (1.0 - smoothstep(uThickness, uTrailLength, behindCrest));

    // Local +Y maps to world -Z after the ground plane is rotated, which is
    // the forward direction of the road. A full angle keeps landing waves
    // circular; the shield uses a 90-degree forward sector.
    float arc = 1.0;
    if (uArcAngle < 6.28) {
        float angle = atan(uv.x, uv.y);
        float halfArc = uArcAngle * 0.5;
        arc = 1.0 - smoothstep(halfArc * 0.82, halfArc, abs(angle));
    }

    float lifeFade = 1.0 - smoothstep(0.55, 1.0, uTime);
    float wave = crest + trail * 0.14;
    float alpha = wave * arc * lifeFade;

    gl_FragColor = vec4(uColor * uIntensity * wave, alpha);
}
