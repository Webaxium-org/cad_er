// Stable two-dimensional value noise and terrain topology, independent of time.
function randomGenerator(seed) {
  return () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
}
function noise(x, z, seed) {
  const hash = (a, b) => {
    let n = Math.imul(a, 374761393) ^ Math.imul(b, 668265263) ^ seed;
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  };
  const ix = Math.floor(x), iz = Math.floor(z);
  const smooth = t => t * t * (3 - 2 * t);
  const u = smooth(x - ix), v = smooth(z - iz);
  const mix = (a, b, t) => a + (b - a) * t;
  return mix(mix(hash(ix, iz), hash(ix + 1, iz), u), mix(hash(ix, iz + 1), hash(ix + 1, iz + 1), u), v);
}
export function terrainHeight(x, z, seed = 428) {
  const peak = (cx, cz, wx, wz, h) => h * Math.exp(-(((x - cx) / wx) ** 2) - ((z - cz) / wz) ** 2);
  const ridge = 1.8 * Math.exp(-(((x - (2.6 + .28 * (z - 1.5))) / .53) ** 2) - ((z - 1.85) / 1.1) ** 2);
  const hills = peak(-3.15, 2.2, .8, .65, 1.65) + peak(-2.35, 1.3, .55, .6, .85)
    + ridge + peak(3.4, 2.65, .65, .55, .8)
    + peak(-.75, .5, .48, .44, .95) + peak(.55, .82, .6, .52, .85)
    + peak(1.6, .25, .4, .4, .65) + peak(-.45, 2.7, .5, .5, .25) + peak(.9, 2.5, .4, .55, .2) - peak(-1.5, 1.55, .45, .8, .18);
  const detail = (noise(x * 1.8, z * 1.8, seed) - .5) * .35
    + (noise(x * 4.5, z * 4.5, seed + 1) - .5) * .16
    + (noise(x * 10, z * 10, seed + 2) - .5) * .06;
  return Math.max(.025, .07 + hills + detail);
}
export function createMountainMesh(columns = 100, rows = 36, seed = 428) {
  const random = randomGenerator(seed);
  const vertices = [];
  for (let row = 0; row <= rows; row++) {
    for (let col = 0; col <= columns; col++) {
      const x = -3.9 + (col + (col > 0 && col < columns ? (random() - .5) * .48 : 0)) / columns * 7.8;
      const z = (row + (row > 0 && row < rows ? (random() - .5) * .48 : 0)) / rows * 3.2;
      vertices.push([x, terrainHeight(x, z, seed), z]);
    }
  }
  const triangles = [], edgeSet = new Set(), edges = [];
  const add = (a, b, c) => {
    triangles.push(a, b, c);
    for (const [u, v] of [[a,b], [b,c], [c,a]]) {
      const lo = Math.min(u,v), hi = Math.max(u,v), key = `${lo}:${hi}`;
      if (!edgeSet.has(key)) { edgeSet.add(key); edges.push(lo, hi); }
    }
  };
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const a = row * (columns + 1) + col, b = a + 1, c = a + columns + 1, d = c + 1;
      if (random() > .5) { add(a,c,b); add(b,c,d); }
      else { add(a,c,d); add(a,d,b); }
    }
  }
  // Separate face vertices allow restrained, flat facet shading without derivatives.
  const faces = [];
  for (let i = 0; i < triangles.length; i += 3) {
    const [a,b,c] = triangles.slice(i,i+3).map(index => vertices[index]);
    const ux=b[0]-a[0], uy=b[1]-a[1], uz=b[2]-a[2];
    const vx=c[0]-a[0], vy=c[1]-a[1], vz=c[2]-a[2];
    const nx=uy*vz-uz*vy, ny=uz*vx-ux*vz, nz=ux*vy-uy*vx;
    const shade = .012 + .024 * (1 - Math.abs((nx * .4 + ny * .8 + nz * .2) / Math.hypot(nx,ny,nz)));
    for (const vertex of [a,b,c]) faces.push(...vertex, shade);
  }
  return { vertices, triangles, edges, faces, points: vertices.map((_,i)=>i).filter(i=>i%137===43) };
}
