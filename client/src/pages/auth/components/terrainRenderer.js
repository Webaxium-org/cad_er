import { createMountainMesh } from './mountainGeometry';

const vertexShader = `
attribute vec3 aPosition;
attribute float aShade;
uniform float uDpr;
varying vec3 vPosition;
varying float vShade;
void main() {
  vec3 p = aPosition;
  float distance = 3.0 + .94*p.z - .34*p.y;
  gl_Position = vec4(p.x*1.3, (p.y*.94+p.z*.34-1.7)*3.0,
    1.285714*distance-2.285714, distance);
  gl_PointSize = uDpr*3.4;
  vPosition=p; vShade=aShade;
}`;
const fragmentShader = `
precision mediump float;
uniform float uMode;
uniform float uTime;
uniform float uAnimate;
varying vec3 vPosition;
varying float vShade;
void main() {
  vec3 ink=vec3(.3098,.2745,.898);
  float near=1.0-clamp(vPosition.z/3.2,0.0,1.0);
  if(uMode<.5) {
    gl_FragColor=vec4(mix(vec3(1.0),ink,vShade*(.45+.55*near)),1.0);
  } else {
    float scanX=-5.0+mod(uTime,22.0)*.5;
    float scan=exp(-pow((vPosition.x-scanX)/.22,2.0))*.13*uAnimate;
    float variation=.88+.12*sin(vPosition.x*17.0+vPosition.z*11.0);
    float alpha=(.075+.16*near)*variation+scan;
    if(uMode>1.5) {
      if(length(gl_PointCoord-vec2(.5))>.5) discard;
      alpha=.3+.1*near;
      if(vShade>.5) alpha+=.1*sin(uTime*(.9+vShade*.1)+vPosition.x*2.0)*uAnimate;
    }
    gl_FragColor=vec4(ink,alpha);
  }
}`;

export function createTerrainRenderer(canvas) {
  const gl = canvas.getContext('webgl', { alpha:true, antialias:true, depth:true, premultipliedAlpha:false });
  if (!gl) return null;
  const shaders = [];
  const compile = (type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader,source); gl.compileShader(shader);
    if (!gl.getShaderParameter(shader,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
    shaders.push(shader); return shader;
  };
  const program = gl.createProgram();
  gl.attachShader(program,compile(gl.VERTEX_SHADER,vertexShader));
  gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragmentShader));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  const position = gl.getAttribLocation(program,'aPosition'), shade = gl.getAttribLocation(program,'aShade');
  const mode = gl.getUniformLocation(program,'uMode'), time = gl.getUniformLocation(program,'uTime');
  const animate = gl.getUniformLocation(program,'uAnimate'), dpr = gl.getUniformLocation(program,'uDpr');
  let buffers = [], mesh, faceBuffer, vertexBuffer, edgeBuffer, pointBuffer, compact;
  const buffer = (data,target=gl.ARRAY_BUFFER) => {
    const item = gl.createBuffer(); buffers.push(item); gl.bindBuffer(target,item);
    gl.bufferData(target,data,gl.STATIC_DRAW); return item;
  };
  function resize() {
    const ratio = Math.min(window.devicePixelRatio || 1,1.5);
    const box = canvas.getBoundingClientRect();
    canvas.width = Math.round(box.width*ratio); canvas.height = Math.round(box.height*ratio);
    gl.viewport(0,0,canvas.width,canvas.height);
    gl.useProgram(program); gl.uniform1f(dpr,ratio);
    const nextCompact = box.width<760;
    if (!mesh || compact!==nextCompact) {
      compact=nextCompact;
      for(const item of buffers) gl.deleteBuffer(item);
      buffers=[];
      mesh=createMountainMesh(compact?44:100,compact?20:36);
      faceBuffer=buffer(new Float32Array(mesh.faces));
      vertexBuffer=buffer(new Float32Array(mesh.vertices.flatMap(p=>[...p,0])));
      edgeBuffer=buffer(new Uint16Array(mesh.edges),gl.ELEMENT_ARRAY_BUFFER);
      pointBuffer=buffer(new Float32Array(mesh.points.flatMap((i,index)=>[...mesh.vertices[i],index<4?1:0])));
    }
  }
  const bind = item => {
    gl.bindBuffer(gl.ARRAY_BUFFER,item);
    gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position,3,gl.FLOAT,false,16,0);
    gl.enableVertexAttribArray(shade); gl.vertexAttribPointer(shade,1,gl.FLOAT,false,16,12);
  };
  function draw(seconds, moving) {
    gl.useProgram(program);
    gl.clearColor(0,0,0,0); gl.clearDepth(1);
    gl.depthMask(true); gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL);
    gl.uniform1f(time,seconds); gl.uniform1f(animate,moving?1:0);
    // Opaque facets populate the depth buffer before any edge is drawn.
    gl.disable(gl.BLEND); gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(1,1);
    gl.uniform1f(mode,0); bind(faceBuffer); gl.drawArrays(gl.TRIANGLES,0,mesh.faces.length/4);
    gl.disable(gl.POLYGON_OFFSET_FILL);
    gl.depthMask(false); gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
    gl.uniform1f(mode,1); bind(vertexBuffer); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,edgeBuffer);
    gl.drawElements(gl.LINES,mesh.edges.length,gl.UNSIGNED_SHORT,0);
    gl.uniform1f(mode,2); bind(pointBuffer); gl.drawArrays(gl.POINTS,0,mesh.points.length);
  }
  return { resize, draw, destroy() {
    for(const item of buffers) gl.deleteBuffer(item);
    gl.deleteProgram(program); for(const shader of shaders) gl.deleteShader(shader);
  }};
}
