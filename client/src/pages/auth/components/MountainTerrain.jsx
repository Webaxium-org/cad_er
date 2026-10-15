import { useEffect, useRef } from 'react';
import { createTerrainRenderer } from './terrainRenderer';

export default function MountainTerrain() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas=ref.current;
    let renderer, frame=0, elapsed=0, last=0;
    const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
    const tick=now=>{
      if(document.hidden || motion.matches || !renderer) return;
      if(last) elapsed+=(now-last)/1000;
      last=now; renderer.draw(elapsed,true);
      frame=requestAnimationFrame(tick);
    };
    const sync=()=>{
      cancelAnimationFrame(frame); last=0;
      if(!renderer || document.hidden) return;
      renderer.draw(elapsed,false);
      if(!motion.matches) frame=requestAnimationFrame(tick);
    };
    const resize=()=>{ if(renderer) { renderer.resize(); sync(); } };
    const restore=()=>{ renderer=createTerrainRenderer(canvas); resize(); };
    const lost=event=>{ event.preventDefault(); cancelAnimationFrame(frame); renderer=null; };
    restore();
    const observer=new ResizeObserver(resize); observer.observe(canvas);
    motion.addEventListener('change',sync);
    document.addEventListener('visibilitychange',sync);
    canvas.addEventListener('webglcontextlost',lost);
    canvas.addEventListener('webglcontextrestored',restore);
    return ()=>{
      cancelAnimationFrame(frame); observer.disconnect();
      motion.removeEventListener('change',sync);
      document.removeEventListener('visibilitychange',sync);
      canvas.removeEventListener('webglcontextlost',lost);
      canvas.removeEventListener('webglcontextrestored',restore);
      renderer?.destroy();
    };
  },[]);
  return <canvas ref={ref} className="survey-terrain" aria-hidden="true" />;
}
