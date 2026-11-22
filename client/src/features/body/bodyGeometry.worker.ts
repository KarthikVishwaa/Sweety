import type { BodyModel } from './bodyProportions';
import { generateBodyMesh } from './bodyMesh';

self.onmessage = (event: MessageEvent<BodyModel>) => {
  const mesh = generateBodyMesh(event.data);
  self.postMessage(mesh, [mesh.positions.buffer, mesh.normals.buffer, mesh.indices.buffer]);
};
