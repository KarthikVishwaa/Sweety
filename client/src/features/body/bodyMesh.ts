import { BODY_PROPORTIONS, type BodyModel } from './bodyProportions';
import { createBodySdf } from './bodySdf';
import { extractSurface, type SurfaceMesh } from './surfaceNets';

const VOXEL = 0.006;
const HALF_WIDTH = 0.31;
const BOTTOM = -0.02;
const TOP = 1.02;
const BACK = -0.12;
const FRONT = 0.16;

function evenCellCount(span: number, voxel: number): number {
  return Math.ceil(span / voxel / 2) * 2;
}

// A seamless, symmetrical mesh of the whole body, with normals taken from the signed-distance field.
export function generateBodyMesh(model: BodyModel): SurfaceMesh {
  const { stature } = BODY_PROPORTIONS[model];
  const voxel = VOXEL * stature;
  const cellsX = evenCellCount(2 * HALF_WIDTH * stature, voxel);

  return extractSurface(createBodySdf(model), {
    min: [(-cellsX / 2) * voxel, BOTTOM * stature, BACK * stature],
    cells: [
      cellsX,
      Math.ceil(((TOP - BOTTOM) * stature) / voxel),
      Math.ceil(((FRONT - BACK) * stature) / voxel),
    ],
    voxel,
  });
}
