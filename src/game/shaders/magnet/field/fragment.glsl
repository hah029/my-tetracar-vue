varying vec3 vWorldPos;
varying vec3 vNormal;

uniform float time;
uniform float intensity;
uniform vec3 color;

void main() {

    vec3 viewDir = normalize(cameraPosition - vWorldPos);

    float fresnel = pow(1.0 - dot(viewDir, vNormal), 3.0);

    float bands =
        sin(vWorldPos.y * 8.0 - time * 4.0) * 0.5 + 0.5;

    float swirl =
        sin(vWorldPos.x * 10.0 + time * 3.0) *
        sin(vWorldPos.z * 10.0 - time * 2.0);

    float energy = bands * 0.5 + swirl * 0.5;

    float alpha =
        fresnel * 0.45 +
        energy * 0.18;

    alpha *= intensity;

    gl_FragColor = vec4(color, alpha);
}