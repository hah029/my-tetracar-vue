varying vec3 vLocalPosition;
uniform float uTime;
uniform float uLife;
uniform vec3 uColor;
uniform vec3 uBounds;
uniform vec3 uCameraLocalPosition;

vec2 intersectBox(vec3 rayOrigin, vec3 rayDirection, vec3 bounds) {
    vec3 invDirection = 1.0 / rayDirection;
    vec3 t0 = (-bounds - rayOrigin) * invDirection;
    vec3 t1 = ( bounds - rayOrigin) * invDirection;
    vec3 tMin = min(t0, t1);
    vec3 tMax = max(t0, t1);

    return vec2(
        max(max(tMin.x, tMin.y), tMin.z),
        min(min(tMax.x, tMax.y), tMax.z)
    );
}

void main() {
    vec3 rayOrigin = uCameraLocalPosition;
    vec3 rayDirection = normalize(vLocalPosition - rayOrigin);
    vec2 intersection = intersectBox(rayOrigin, rayDirection, uBounds);

    float entry = max(intersection.x, 0.0);
    float exit = intersection.y;
    if (exit <= entry) discard;

    float appear = smoothstep(0.0, 0.08, uLife);
    float fade = 1.0 - smoothstep(0.45, 1.0, uLife);
    float life = appear * fade;

    const int STEPS = 14;
    float stepLength = (exit - entry) / float(STEPS);
    vec3 plasma = vec3(0.0);
    float opacity = 0.0;
    float headProgress = smoothstep(0.01, 0.38, uLife);

    for (int i = 0; i < STEPS; i++) {
        float distanceAlongRay = entry + (float(i) + 0.5) * stepLength;
        vec3 point = rayOrigin + rayDirection * distanceAlongRay;
        float horizontal = abs(point.x / uBounds.x);
        float envelope = 1.0 - smoothstep(0.28, 1.0, horizontal);
        float core = exp(-horizontal * horizontal * 19.0);

        // The beam is a trail of one fast projectile: it begins at the
        // muzzle and fades continuously behind a single travelling head.
        float forward = (uBounds.z - point.z) / (uBounds.z * 2.0);
        float reached = 1.0 - smoothstep(
            headProgress,
            headProgress + 0.012,
            forward
        );
        float distanceBehindHead = max(headProgress - forward, 0.0);
        float trail = reached * exp(-distanceBehindHead * 2.35);
        float head = exp(-pow((forward - headProgress) / 0.018, 2.0));
        float shimmer = 0.88 + 0.12 * sin(
            point.x / uBounds.x * 18.0 + point.y / uBounds.y * 7.0 - uTime * 11.0
        );
        float tailAura = exp(-horizontal * horizontal * 3.6) * trail;
        float density =
            core * (trail * shimmer * 1.65 + head * 3.5) +
            tailAura * 0.5;
        float sampleWeight = stepLength / (uBounds.z * 2.0);

        plasma += uColor * density * sampleWeight * 19.0;
        plasma += vec3(1.0, 0.46, 0.22) * core * head * sampleWeight * 32.0;
        opacity += density * sampleWeight * 3.4;
    }

    // Keep the head and its fading trail sharp on the visible surface.
    vec3 entryPoint = rayOrigin + rayDirection * entry;
    float entryHorizontal = abs(entryPoint.x / uBounds.x);
    float entryCore = exp(-entryHorizontal * entryHorizontal * 24.0);
    float entryForward = (uBounds.z - entryPoint.z) / (uBounds.z * 2.0);
    float entryReached = 1.0 - smoothstep(
        headProgress,
        headProgress + 0.012,
        entryForward
    );
    float entryTrail = entryReached * exp(
        -max(headProgress - entryForward, 0.0) * 2.35
    );
    float entryHead = exp(-pow((entryForward - headProgress) / 0.018, 2.0));
    float entryTailAura = exp(-entryHorizontal * entryHorizontal * 3.6) * entryTrail;
    float streak = entryCore * (entryTrail * 4.1 + entryHead * 5.4) +
        entryTailAura * 0.9;

    plasma += uColor * streak * 4.4;
    plasma += vec3(1.0, 0.72, 0.48) * entryCore * entryHead * 7.0;
    opacity += streak * 0.82;

    gl_FragColor = vec4(plasma * life, opacity * life);
}
