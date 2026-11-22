export const vertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vWorld;

  void main() {
    vNormal = normalize(mat3(modelMatrix) * normal);
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

export const fragmentShader = /* glsl */ `
  uniform float uLevelY;
  uniform vec3 uColor;
  uniform float uTime;
  uniform float uReduceMotion;
  uniform float uOpacity;
  uniform float uRingLow;
  uniform float uRingHigh;
  uniform float uBackFace;

  varying vec3 vNormal;
  varying vec3 vWorld;

  const vec3 LIGHT = normalize(vec3(0.35, 0.75, 0.55));

  float ring(float y, float at) {
    return 1.0 - smoothstep(0.0, 0.0032, abs(y - at));
  }

  void main() {
    float ripple = (sin(vWorld.x * 22.0 + uTime * 1.7) + sin(vWorld.z * 17.0 - uTime * 1.2)) * 0.0022;
    float level = uLevelY + ripple * (1.0 - uReduceMotion);
    float liquid = 1.0 - smoothstep(level - 0.003, level + 0.003, vWorld.y);

    vec3 normal = normalize(uBackFace > 0.5 ? -vNormal : vNormal);
    vec3 view = normalize(cameraPosition - vWorld);
    float fresnel = pow(1.0 - clamp(abs(dot(normal, view)), 0.0, 1.0), 2.4);
    float diffuse = 0.62 + 0.38 * max(dot(normal, LIGHT), 0.0);

    vec3 liquidColor = uColor * diffuse + uColor * 0.45 * fresnel + vec3(0.12) * fresnel;
    liquidColor *= mix(1.0, 0.72, uBackFace);
    float surfaceGlow = exp(-abs(vWorld.y - level) * 230.0) * 0.35;
    liquidColor += vec3(surfaceGlow);

    vec3 glassColor = mix(vec3(0.86, 0.9, 0.96), uColor, 0.18) * (0.9 + 0.1 * diffuse);
    float glassAlpha = (0.07 + 0.42 * fresnel) * mix(1.0, 0.7, uBackFace);

    vec3 color = mix(glassColor, liquidColor, liquid);
    float alpha = mix(glassAlpha, mix(0.94, 0.86, uBackFace), liquid);

    float rings = max(ring(vWorld.y, uRingLow), ring(vWorld.y, uRingHigh)) * (1.0 - uBackFace);
    color = mix(color, vec3(1.0), rings * 0.5);
    alpha = max(alpha, rings * 0.32);

    gl_FragColor = vec4(color, alpha * uOpacity);
  }
`;
