import { BufferAttribute, BufferGeometry, Mesh, type Material, type Object3D } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

function findMesh(root: Object3D): Mesh {
  let found: Mesh | undefined;
  root.traverse((object) => {
    if (!found && object instanceof Mesh) found = object;
  });
  if (!found) throw new Error('The body model has no mesh.');
  return found;
}

// The file stores quantised integer attributes plus a node transform; the scene needs plain floats
// in metres-at-unit-height, so the transform is baked in.
function toFloatGeometry(source: BufferGeometry, mesh: Mesh): BufferGeometry {
  const read = (name: string) => {
    const attribute = source.getAttribute(name);
    const values = new Float32Array(attribute.count * 3);
    for (let index = 0; index < attribute.count; index++) {
      values[index * 3] = attribute.getX(index);
      values[index * 3 + 1] = attribute.getY(index);
      values[index * 3 + 2] = attribute.getZ(index);
    }
    return new BufferAttribute(values, 3);
  };
  const index = source.getIndex();
  if (!index) throw new Error('The body model has no index.');

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', read('position'));
  geometry.setAttribute('normal', read('normal'));
  geometry.setIndex(new BufferAttribute(Uint32Array.from(index.array), 1));
  mesh.updateWorldMatrix(true, false);
  geometry.applyMatrix4(mesh.matrixWorld);
  geometry.computeBoundingSphere();
  return geometry;
}

export async function parseBodyGlb(data: ArrayBuffer): Promise<BufferGeometry> {
  await MeshoptDecoder.ready;
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const gltf = await loader.parseAsync(data, '');
  const mesh = findMesh(gltf.scene);
  const geometry = toFloatGeometry(mesh.geometry, mesh);
  mesh.geometry.dispose();
  for (const material of ([] as Material[]).concat(mesh.material)) material.dispose();
  return geometry;
}
