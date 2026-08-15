varying vec3 vWorldNormal;
varying vec3 vWorldPos;
varying vec3 vLocalPos;

uniform float time;
uniform vec3 color;
uniform float opacity;

void main() {
    // У машины направление движения — -Z, поэтому оставляем переднюю полусферу.
    if (vLocalPos.z > 0.12) discard;

    vec3 viewDirection = normalize(cameraPosition - vWorldPos);
    // Камера смотрит на внутреннюю сторону переднего купола. Для неё оставляем
    // яркое свечение, а на внешней стороне сохраняем контурный Fresnel-эффект.
    float viewFacing = dot(normalize(vWorldNormal), viewDirection);
    float fresnel = pow(1.0 - max(viewFacing, 0.0), 2.4);

    float waves = sin(vLocalPos.y * 9.0 - time * 5.0)
        + sin(atan(vLocalPos.x, vLocalPos.z) * 8.0 + time * 3.0);
    float energyBands = smoothstep(0.3, 1.25, waves);
    float pulse = 0.72 + 0.28 * sin(time * 3.0);
    float alpha = (fresnel * 0.82 + energyBands * 0.28) * pulse * opacity;

    gl_FragColor = vec4(color, alpha);
}
