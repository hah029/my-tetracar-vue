varying vec3 vWorldPos;
varying vec3 vNormal;

uniform float time;

void main() {
    vec3 pos = position;

    float wave =
        sin(position.y * 6.0 + time * 2.0) * 0.04 +
        sin(position.x * 8.0 - time * 3.0) * 0.03;

    pos += normal * wave;

    vec4 world = modelMatrix * vec4(pos, 1.0);

    vWorldPos = world.xyz;
    vNormal = normalize(normalMatrix * normal);

    gl_Position = projectionMatrix * viewMatrix * world;
}