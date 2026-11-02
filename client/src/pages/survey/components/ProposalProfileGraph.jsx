import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Button, Dialog, IconButton, Stack, Typography, useMediaQuery } from "@mui/material";
import { FiMaximize, FiMinus, FiPlus, FiRefreshCw, FiX, FiRotateCw } from "react-icons/fi";
import { graphTicks } from "../../../utils/proposalWorkspace";
import QuantityDeltaBadge from "./QuantityDeltaBadge";

function GraphViewport({ series, height, ssd, quantities }) {
  const scroller = useRef(null);
  const [size, setSize] = useState({ width: 640, height: 260 });
  const [scroll, setScroll] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const drag = useRef(null);
  useEffect(() => {
    const node = scroller.current;
    const observer = new ResizeObserver(() => setSize({ width: node.clientWidth || 640, height: node.clientHeight || 260 }));
    observer.observe(node); return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const node = scroller.current;
    const onWheel = (event) => {
      if (!event.ctrlKey) return;
      event.preventDefault();
      setZoom((previous) => Math.min(8, Math.max(1, previous * (event.deltaY < 0 ? 1.1 : 1 / 1.1))));
    };
    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, []);
  const bounds = useMemo(() => {
    const points = series.flatMap((entry) => entry.points.filter(Boolean));
    if (!points.length) return { x0: 0, x1: 100, y0: 0, y1: 10 };
    const xs = points.map((point) => point.x), ys = points.map((point) => point.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const pad = Math.max((maxY - minY) * 0.12, 0.25);
    return { x0: minX, x1: maxX > minX ? maxX : minX + 1, y0: minY - pad, y1: maxY + pad };
  }, [series]);
  const width = Math.max(size.width, 1) * zoom, contentHeight = Math.max(size.height, 1) * zoom;
  const x = (value) => (value - bounds.x0) / (bounds.x1 - bounds.x0) * width;
  const y = (value) => (bounds.y1 - value) / (bounds.y1 - bounds.y0) * contentHeight;
  const xticks = graphTicks(bounds.x0 + scroll.x / width * (bounds.x1 - bounds.x0), bounds.x0 + (scroll.x + size.width) / width * (bounds.x1 - bounds.x0));
  const yticks = graphTicks(bounds.y1 - (scroll.y + size.height) / contentHeight * (bounds.y1 - bounds.y0), bounds.y1 - scroll.y / contentHeight * (bounds.y1 - bounds.y0), 5);
  const changeZoom = (value) => setZoom(Math.min(8, Math.max(1, value)));
  return <>
    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 1, pb: 1 }}>
      <Typography variant="caption" color="text.secondary">Drag or scroll to pan · Ctrl + wheel to zoom</Typography>
      <Stack direction="row" alignItems="center" spacing={0.5}>
        <IconButton size="small" aria-label="Zoom out" onClick={() => changeZoom(zoom / 1.3)} disabled={zoom <= 1}><FiMinus /></IconButton>
        <Typography variant="caption" sx={{ minWidth: 40, textAlign: "center" }}>{Math.round(zoom * 100)}%</Typography>
        <IconButton size="small" aria-label="Zoom in" onClick={() => changeZoom(zoom * 1.3)} disabled={zoom >= 8}><FiPlus /></IconButton>
        <IconButton size="small" aria-label="Reset graph view" onClick={() => { changeZoom(1); scroller.current?.scrollTo(0, 0); }}><FiRefreshCw /></IconButton>
      </Stack>
    </Stack>
    <Box sx={{ position: "relative", display: "grid", gridTemplateColumns: "64px minmax(0,1fr)", gridTemplateRows: "30px minmax(0,1fr)", height, bgcolor: "white", border: "1px solid #e2e8f5", borderRadius: "12px", overflow: "hidden" }}>
      <Box sx={{ fontSize: 10, color: "#667795", display: "grid", placeItems: "center", bgcolor: "#f8f9fd" }}>RL (m)</Box>
      <svg width="100%" height="30" style={{ background: "#f8f9fd" }} aria-label="Horizontal scale in metres">
        {xticks.map((tick) => <g key={tick}><text x={Math.max(18, Math.min(size.width - 18, x(tick) - scroll.x))} y={17} fontSize="10" fill="#52617f" textAnchor="middle">{Number(tick.toFixed(3))}</text><line x1={x(tick) - scroll.x} x2={x(tick) - scroll.x} y1="23" y2="30" stroke="#c7d2e5" /></g>)}
      </svg>
      <svg width="64" height="100%" style={{ background: "#f8f9fd" }} aria-label="Vertical scale in metres">
        {yticks.map((tick) => <g key={tick}><text x="52" y={Math.max(12, Math.min(size.height - 4, y(tick) - scroll.y + 3))} fontSize="10" fill="#52617f" textAnchor="end">{tick.toFixed(3)}</text><line x1="58" x2="64" y1={y(tick) - scroll.y} y2={y(tick) - scroll.y} stroke="#c7d2e5" /></g>)}
      </svg>
      <Box ref={scroller} tabIndex={0} aria-label="Scrollable profile graph" sx={{ overflow: "auto", minHeight: 0, cursor: zoom > 1 ? "grab" : "default", touchAction: "pan-x pan-y" }}
        onScroll={(event) => setScroll({ x: event.currentTarget.scrollLeft, y: event.currentTarget.scrollTop })}
        onPointerDown={(event) => { if (event.pointerType !== "mouse") return; drag.current = { x: event.clientX, y: event.clientY, left: event.currentTarget.scrollLeft, top: event.currentTarget.scrollTop }; event.currentTarget.setPointerCapture(event.pointerId); }}
        onPointerMove={(event) => { if (drag.current) { event.currentTarget.scrollLeft = drag.current.left - event.clientX + drag.current.x; event.currentTarget.scrollTop = drag.current.top - event.clientY + drag.current.y; } }}
        onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}>
        <svg width={width} height={contentHeight} style={{ display: "block" }} role="img" aria-label="Live survey profile">
          <g opacity="0" aria-hidden="true">{graphTicks(bounds.x0, bounds.x1).map((tick) => <line key={tick} x1={x(tick)} x2={x(tick)} y1="0" y2={contentHeight} stroke="#cbd5e1" />)}</g>
          {series.map((entry) => {
            let pen = false;
            const path = entry.points.map((point) => { if (!point) { pen = false; return ""; } const command = pen ? "L" : "M"; pen = true; return `${command}${x(point.x)},${y(point.y)}`; }).join(" ");
            return <path key={entry.name} d={path} fill="none" stroke={entry.color} strokeWidth="2" strokeOpacity="0.5" />;
          })}
          {ssd > 0 && <g><path d={`M8 20 H${Math.min(width - 8, x(bounds.x0 + ssd))}`} stroke="#d18b1b" strokeWidth="2" strokeDasharray="5 4" /><text x="10" y="14" fill="#966010" fontSize="11">SSD {ssd.toFixed(2)} m</text></g>}
        </svg>
      </Box>
      {quantities && <QuantityDeltaBadge saved={quantities.saved} live={quantities.live} invalid={quantities.invalid} />}
    </Box>
  </>;
}

export default function ProposalProfileGraph({ series = [], type = "ls", ssd, quantities }) {
  const [fullScreen, setFullScreen] = useState(false);
  const mobile = useMediaQuery("(max-width:900px)");
  const landscape = useMediaQuery("(orientation: landscape)");
  const header = <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1} sx={{ mb: 1 }}>
    <Box><Typography fontWeight={800} color="#142048">{type === "cs" ? "Live CS preview" : "Live LS preview"}</Typography>
      <Stack direction="row" gap={1.5} flexWrap="wrap">{series.map((entry) => <Typography key={entry.name} variant="caption" color={entry.color}>● {entry.name}</Typography>)}</Stack></Box>
    <IconButton aria-label={fullScreen ? "Close full screen" : "Open full-screen graph"} onClick={() => setFullScreen(!fullScreen)}>{fullScreen ? <FiX /> : <FiMaximize />}</IconButton>
  </Stack>;
  return <Box sx={{ bgcolor: "white", border: "1px solid #e2e8f5", borderRadius: "20px", p: { xs: 1.5, sm: 2 }, mb: 2 }}>
    {header}<GraphViewport series={series} height={310} ssd={ssd} quantities={quantities} />
    <Dialog fullScreen open={fullScreen} onClose={() => setFullScreen(false)}>
      <Box sx={{ p: 1.5, height: "100dvh", boxSizing: "border-box" }}>{header}
        {mobile && !landscape ? <Stack sx={{ height: "75vh" }} justifyContent="center" alignItems="center" spacing={2}>
          <FiRotateCw size={40} color="#595cf2" /><Typography>Rotate your phone to landscape to view the full-screen graph.</Typography><Button onClick={() => setFullScreen(false)}>Close graph</Button>
        </Stack> : <GraphViewport series={series} height="calc(100dvh - 110px)" ssd={ssd} quantities={quantities} />}
      </Box>
    </Dialog>
  </Box>;
}
