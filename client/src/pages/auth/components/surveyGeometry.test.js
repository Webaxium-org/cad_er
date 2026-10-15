import test from 'node:test';
import assert from 'node:assert/strict';
import { createContours } from './surveyGeometry.js';
import { createMountainMesh, terrainHeight } from './mountainGeometry.js';

test('mountains have stable local topology, unique edges and both diagonals', () => {
  for (const [columns, rows] of [[100,36],[44,20]]) {
    const mesh=createMountainMesh(columns,rows);
    assert.deepEqual(mesh,createMountainMesh(columns,rows));
    assert.ok(mesh.vertices.every(p=>p.every(Number.isFinite)));
    assert.equal(mesh.triangles.length,columns*rows*6);
    const seen=new Set(), diagonals=new Set();
    for(let i=0;i<mesh.edges.length;i+=2) {
      const a=mesh.edges[i],b=mesh.edges[i+1];
      const dr=Math.floor(b/(columns+1))-Math.floor(a/(columns+1));
      const dc=b%(columns+1)-a%(columns+1);
      assert.ok(dr<=1 && Math.abs(dc)<=1);
      const key=`${a}:${b}`; assert.ok(!seen.has(key)); seen.add(key);
      if(dr===1 && dc!==0) diagonals.add(dc);
    }
    assert.equal(diagonals.size,2);
    // Jitter must not invert triangles in the horizontal ground plane.
    for(let i=0;i<mesh.triangles.length;i+=3) {
      const [a,b,c]=mesh.triangles.slice(i,i+3).map(j=>mesh.vertices[j]);
      assert.ok((b[0]-a[0])*(c[2]-a[2])-(b[2]-a[2])*(c[0]-a[0])<0);
    }
  }
});
test('elevation varies independently in horizontal position and depth',()=>{
  const difference=x=>terrainHeight(x,.5)-terrainHeight(x,2.3);
  assert.ok(Math.abs(difference(-3)-difference(.5))>.5);
  assert.ok(terrainHeight(-3,2.2)>terrainHeight(0,2.2)+.8);
  assert.ok(terrainHeight(2.7,1.9)>terrainHeight(0,1.9)+1);
});
test('upper contours remain stable and closed', () => {
  const contours=createContours(31);
  assert.equal(contours.length,16);
  assert.deepEqual(contours,createContours(31));
  assert.ok(contours.every(({d})=>d.endsWith(' Z')&&!/NaN|Infinity/.test(d)));
});
