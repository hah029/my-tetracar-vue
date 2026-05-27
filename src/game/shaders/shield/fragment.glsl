varying vec3 vNormal;
uniform float time;
uniform vec3 color;

void main() {
    float fresnel = pow(1.0 - dot(normalize(vNormal), vec3(0,0,1)), 3.0);

    float pulse = 0.5 + 0.5 * sin(time * 4.0);

    float alpha = fresnel * 0.8 + pulse * 0.2;

    gl_FragColor = vec4(color, alpha);
}