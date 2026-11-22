// Bakes the three body figures into compact GLB files that the client loads at runtime.
// The generator is plain TypeScript shared with the client tests; Node runs it directly (type stripping),
// so it never ends up in the client bundle. Usage: npm run models:generate
import { mkdir, writeFile } from 'node:fs/promises';
import { Document, Logger, NodeIO } from '@gltf-transform/core';
import { meshopt, weld } from '@gltf-transform/functions';
import { MeshoptEncoder } from 'meshoptimizer';
import { BODY_PROPORTIONS, GENDERS } from '../../client/src/features/body/bodyProportions.ts';
import { generateBodyMesh } from '../../client/src/features/body/generator/generateBody.ts';
import {
  bodyMeshProblems,
  measureBodyMesh,
} from '../../client/src/features/body/generator/meshValidation.ts';

const OUTPUT = new URL('../../client/src/assets/models/', import.meta.url);
// 14-bit positions are about 0.1 mm on a 1.78 m figure; 10-bit normals keep the shading smooth.
const COMPRESSION = { level: 'medium', quantizePosition: 14, quantizeNormal: 10 };

function toDocument(gender, mesh) {
  const document = new Document().setLogger(new Logger(Logger.Verbosity.WARN));
  const buffer = document.createBuffer();
  const accessor = (type, array) =>
    document.createAccessor().setType(type).setArray(array).setBuffer(buffer);
  const primitive = document
    .createPrimitive()
    .setAttribute('POSITION', accessor('VEC3', mesh.positions))
    .setAttribute('NORMAL', accessor('VEC3', mesh.normals))
    .setIndices(accessor('SCALAR', mesh.indices));
  const node = document
    .createNode(gender)
    .setMesh(document.createMesh(gender).addPrimitive(primitive));
  document.createScene(gender).addChild(node);
  return document;
}

const round = (value, digits = 3) => Number(value.toFixed(digits));

async function bake(gender, io) {
  const started = performance.now();
  const mesh = generateBodyMesh(gender);
  const proportions = BODY_PROPORTIONS[gender];
  const report = measureBodyMesh(mesh.positions, mesh.indices, proportions);
  const problems = bodyMeshProblems(report, proportions);
  if (problems.length > 0) {
    throw new Error(`The ${gender} figure failed validation:\n  - ${problems.join('\n  - ')}`);
  }

  const document = toDocument(gender, mesh);
  await document.transform(weld(), meshopt({ encoder: MeshoptEncoder, ...COMPRESSION }));
  const file = new URL(`${gender}.glb`, OUTPUT);
  // The compression step adds the EXT_meshopt_compression and KHR_mesh_quantization extensions; the
  // writer needs their classes registered, which are taken from the document itself.
  const extensions = document
    .getRoot()
    .listExtensionsUsed()
    .map((extension) => extension.constructor);
  const bytes = await io.registerExtensions(extensions).writeBinary(document);
  await writeFile(file, bytes);

  return {
    figure: gender,
    triangles: report.triangles,
    height: round(report.height),
    components: report.components,
    'boundary edges': report.boundaryEdges,
    'non-manifold edges': report.nonManifoldEdges,
    degenerate: report.degenerateTriangles,
    'volume > 0': report.signedVolume > 0,
    asymmetry: round(report.asymmetry, 5),
    'foot / S': round(report.footLength),
    'shoulder / S': round(report.shoulderWidth),
    'waist / S': round(report.waistWidth),
    'hip / S': round(report.hipWidth),
    'GLB KB': Math.round(bytes.byteLength / 1024),
    seconds: round((performance.now() - started) / 1000, 1),
  };
}

await MeshoptEncoder.ready;
await mkdir(OUTPUT, { recursive: true });
const io = new NodeIO().registerDependencies({ 'meshopt.encoder': MeshoptEncoder });
const rows = [];
for (const gender of GENDERS) rows.push(await bake(gender, io));
console.table(rows);
