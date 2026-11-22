import { BufferAttribute, BufferGeometry } from 'three';
import type { BodyModel } from './bodyProportions';
import { generateBodyMesh } from './bodyMesh';
import type { SurfaceMesh } from './surfaceNets';

const geometries = new Map<BodyModel, Promise<BufferGeometry>>();

function toGeometry(mesh: SurfaceMesh): BufferGeometry {
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(mesh.positions, 3));
  geometry.setAttribute('normal', new BufferAttribute(mesh.normals, 3));
  geometry.setIndex(new BufferAttribute(mesh.indices, 1));
  geometry.computeBoundingSphere();
  return geometry;
}

// Marching the field takes a few hundred milliseconds, so it runs off the main thread where possible.
function generateInWorker(model: BodyModel): Promise<SurfaceMesh> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./bodyGeometry.worker.ts', import.meta.url), {
      type: 'module',
    });
    worker.onmessage = (event: MessageEvent<SurfaceMesh>) => {
      worker.terminate();
      resolve(event.data);
    };
    worker.onerror = (event) => {
      worker.terminate();
      reject(new Error(event.message));
    };
    worker.postMessage(model);
  });
}

function generate(model: BodyModel): Promise<SurfaceMesh> {
  return typeof Worker === 'undefined'
    ? Promise.resolve(generateBodyMesh(model))
    : generateInWorker(model);
}

// The only entry point to the body shape, so a modelled GLB loader can replace it later.
export function getBodyGeometry(model: BodyModel): Promise<BufferGeometry> {
  let geometry = geometries.get(model);
  if (!geometry) {
    geometry = generate(model).then(toGeometry);
    geometry.catch(() => geometries.delete(model));
    geometries.set(model, geometry);
  }
  return geometry;
}
