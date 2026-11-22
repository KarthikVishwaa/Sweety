// GLSL injected into three's physical material, so the glass and liquid get its image-based lighting,
// reflections, tone mapping and colour management for free.

export const vertexDeclarations = /* glsl */ `
#include <common>
varying vec3 vGlucoseWorld;
`;

export const vertexWorldPosition = /* glsl */ `
#include <begin_vertex>
vGlucoseWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;
`;

export const fragmentDeclarations = /* glsl */ `
#include <common>
uniform float uLevelY;
uniform vec3 uColor;
uniform float uTime;
uniform float uReduceMotion;
uniform float uOpacity;
uniform float uRingLow;
uniform float uRingHigh;
uniform float uBackFace;
varying vec3 vGlucoseWorld;

float glucoseRing(float y, float at) {
  return 1.0 - smoothstep(0.0, 0.003, abs(y - at));
}
`;

// Below the surface: the band colour, deeper towards the feet and lighter near the surface. Above it:
// a faint, cool, almost clear glass. The edge is antialiased by the screen-space height derivative, so
// it stays one clean line at any distance.
export const fragmentColour = /* glsl */ `
#include <color_fragment>
float glucoseWave = (sin(vGlucoseWorld.x * 24.0 + uTime * 1.6) + sin(vGlucoseWorld.z * 19.0 - uTime * 1.2))
  * 0.0018 * (1.0 - uReduceMotion);
float glucoseSurface = uLevelY + glucoseWave;
float glucoseEdge = fwidth(vGlucoseWorld.y) + 0.0006;
float glucoseBelow = 1.0 - smoothstep(glucoseSurface - glucoseEdge, glucoseSurface + glucoseEdge, vGlucoseWorld.y);
float glucoseDepth = clamp((glucoseSurface - vGlucoseWorld.y) / 0.9, 0.0, 1.0);
vec3 glucoseLiquid = mix(uColor * 1.08, uColor * 0.55, glucoseDepth);
diffuseColor.rgb = mix(vec3(0.93, 0.96, 1.0), glucoseLiquid, glucoseBelow);
diffuseColor.a = mix(mix(0.07, 0.04, uBackFace), mix(0.9, 0.82, uBackFace), glucoseBelow) * uOpacity;
`;

// A soft inner glow in the liquid, a fresnel rim on the glass, a thin bright meniscus at the surface and
// two faint rings at the edges of the target range.
export const fragmentGlow = /* glsl */ `
#include <emissivemap_fragment>
float glucoseFront = 1.0 - uBackFace;
float glucoseGlass = 1.0 - glucoseBelow;
float glucoseFresnel = pow(1.0 - clamp(abs(dot(normal, normalize(vViewPosition))), 0.0, 1.0), 2.5);
float glucoseMeniscus = (1.0 - smoothstep(0.0, glucoseEdge * 2.0 + 0.0025, abs(vGlucoseWorld.y - glucoseSurface)))
  * step(0.0, uLevelY);
float glucoseRings = max(glucoseRing(vGlucoseWorld.y, uRingLow), glucoseRing(vGlucoseWorld.y, uRingHigh));
totalEmissiveRadiance += glucoseLiquid * glucoseBelow * (0.28 + 0.3 * glucoseFresnel) * (1.0 - 0.4 * uBackFace);
totalEmissiveRadiance += vec3(0.75, 0.85, 0.95) * glucoseFresnel * glucoseGlass * 0.35 * glucoseFront;
totalEmissiveRadiance += vec3(1.0) * (glucoseMeniscus * 0.55 + glucoseRings * 0.25) * glucoseFront;
diffuseColor.a = max(
  diffuseColor.a,
  (glucoseFresnel * 0.4 * glucoseGlass + glucoseMeniscus * 0.7 + glucoseRings * 0.3) * glucoseFront * uOpacity
);
`;
