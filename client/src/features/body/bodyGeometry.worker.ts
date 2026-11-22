import { generateBodyMesh } from './bodyMesh';
import type { BodyModel } from './bodyProportions';
import type { SurfaceMesh } from './surfaceNets';

// The DOM library types `self` as a window, so the few members used here are declared directly.
interface WorkerScope {
  onmessage: ((event: MessageEvent<BodyModel>) => void) | null;
  postMessage(message: SurfaceMesh, transfer: Transferable[]): void;
}

const scope = self as unknown as WorkerScope;

scope.onmessage = (event) => {
  const mesh = generateBodyMesh(event.data);
  scope.postMessage(mesh, [mesh.positions.buffer, mesh.normals.buffer, mesh.indices.buffer]);
};
