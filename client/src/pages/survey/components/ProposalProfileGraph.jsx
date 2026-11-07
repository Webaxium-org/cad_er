import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Box, Button, Dialog, IconButton, Stack, Typography, useMediaQuery } from "@mui/material";
import { FiMaximize, FiMinus, FiPlus, FiRefreshCw, FiX, FiRotateCw, FiTrendingUp } from "react-icons/fi";
import { graphTicks } from "../../../utils/proposalWorkspace";
import QuantityDeltaBadge from "./QuantityDeltaBadge";

function GraphViewport({ series, height, ssd, quantities, totals, totalsStale, previewMessage, fullScreen, onToggleFullScreen, plotSx }) {
  const scroller = useRef(null);
  const [size, setSize] = useState({ width: 640, height: 260 });
  const [scroll, setScroll] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const drag = useRef(null);
  const hasPoints = series.some(entry => entry.points.some(Boolean));
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
  const axisWidth = Math.max(44, ...[bounds.y0, bounds.y1].map((value) => value.toFixed(3).length * 6 + 8));
  const changeZoom = (value) => setZoom(Math.min(8, Math.max(1, value)));
  return <>
    <Box sx={{ position: "relative", display: "grid", gridTemplateColumns: `${axisWidth}px minmax(0,1fr)`, gridTemplateRows: "30px minmax(0,1fr)", height, bgcolor: "white", border: "1px solid #e2e8f0", borderRadius: "16px 16px 0 0", overflow: "hidden", ...plotSx }}>
      <Box sx={{ fontSize: 10, color: "#667795", display: "grid", placeItems: "center", bgcolor: "#f8f9fd" }}>RL (m)</Box>
      <svg width="100%" height="30" style={{ background: "#f8f9fd" }} aria-label="Horizontal scale in metres">
        {xticks.map((tick) => <g key={tick}><text x={Math.max(18, Math.min(size.width - 18, x(tick) - scroll.x))} y={17} fontSize="10" fill="#52617f" textAnchor="middle">{Number(tick.toFixed(3))}</text><line x1={x(tick) - scroll.x} x2={x(tick) - scroll.x} y1="23" y2="30" stroke="#c7d2e5" /></g>)}
      </svg>
      <svg width={axisWidth} height="100%" style={{ background: "white" }} aria-label="Vertical scale in metres">
        {yticks.map((tick) => <g key={tick}><text x={axisWidth - 7} y={Math.max(12, Math.min(size.height - 4, y(tick) - scroll.y + 3))} fontSize="10" fill="#52617f" textAnchor="end">{tick.toFixed(3)}</text><line x1={axisWidth - 4} x2={axisWidth} y1={y(tick) - scroll.y} y2={y(tick) - scroll.y} stroke="#c7d2e5" /></g>)}
      </svg>
      <Box ref={scroller} tabIndex={0} aria-label="Scrollable profile graph" sx={{ overflow: "auto", minHeight: 0, cursor: zoom > 1 ? "grab" : "default", touchAction: "pan-x pan-y" }}
        onScroll={(event) => setScroll({ x: event.currentTarget.scrollLeft, y: event.currentTarget.scrollTop })}
        onPointerDown={(event) => { if (event.pointerType !== "mouse") return; drag.current = { x: event.clientX, y: event.clientY, left: event.currentTarget.scrollLeft, top: event.currentTarget.scrollTop }; event.currentTarget.setPointerCapture(event.pointerId); }}
        onPointerMove={(event) => { if (drag.current) { event.currentTarget.scrollLeft = drag.current.left - event.clientX + drag.current.x; event.currentTarget.scrollTop = drag.current.top - event.clientY + drag.current.y; } }}
        onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}>
        <svg width={width} height={contentHeight} style={{ display: "block" }} role="img" aria-label="Live survey profile">
          <g aria-hidden="true" stroke="#eef2f7" strokeDasharray="3 5">
            {xticks.map(tick => <line key={`x-${tick}`} x1={x(tick)} x2={x(tick)} y1="0" y2={contentHeight} />)}
            {yticks.map(tick => <line key={`y-${tick}`} x1="0" x2={width} y1={y(tick)} y2={y(tick)} />)}
          </g>
          {series.map((entry) => {
            let pen = false;
            const path = entry.points.map((point) => { if (!point) { pen = false; return ""; } const command = pen ? "L" : "M"; pen = true; return `${command}${x(point.x)},${y(point.y)}`; }).join(" ");
            return <path key={entry.name} d={path} fill="none" stroke={entry.color} strokeWidth="2" strokeOpacity="0.85" />;
          })}
          {ssd > 0 && <g><path d={`M8 20 H${Math.min(width - 8, x(bounds.x0 + ssd))}`} stroke="#d18b1b" strokeWidth="2" strokeDasharray="5 4" /><text x="10" y="14" fill="#966010" fontSize="11">SSD {ssd.toFixed(2)} m</text></g>}
        </svg>
      </Box>
      {!hasPoints && <Stack role="status" alignItems="center" justifyContent="center" spacing={0.75} sx={{ position: "absolute", top: 30, bottom: 0, left: axisWidth, right: 0, pointerEvents: "none", textAlign: "center", px: 2 }}>
        <Box sx={{ display: "grid", placeItems: "center", width: 36, height: 36, borderRadius: "12px", bgcolor: "#eef2ff", color: "#6366f1", mb: 0.5 }}><FiTrendingUp size={20} /></Box>
        <Typography sx={{ fontSize: "0.875rem", fontWeight: 600, color: "#334155" }}>Your profile preview appears here</Typography>
        <Typography sx={{ fontSize: "0.75rem", color: "#64748b" }}>Select a design layer below to view survey levels.</Typography>
      </Stack>}
      {totals && <Stack direction="column" alignItems="flex-end" aria-label="Earthwork quantities" aria-live="polite" spacing={0.5} sx={{ position: "absolute", right: 8, top: 38, pointerEvents: "none" }}>
        {totalsStale && <Typography variant="caption" sx={{ px: 1, bgcolor: "white", color: "#64748b" }}>Previous calculation</Typography>}
        {[["Cutting", "totalCuttingVolume", "#b45309"], ["Filling", "totalFillingVolume", "#2878c7"]].map(([label, key, color]) => <Box key={key} sx={{ px: 1, py: 0.5, borderRadius: 1, border: "1px solid", borderColor: color, bgcolor: "rgba(255,255,255,0.95)", color, fontSize: 12, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{label} {Number(totals[key]).toFixed(3)} m&sup3;</Box>)}
      </Stack>}
      {previewMessage && <Alert severity="warning" sx={{ position: "absolute", bottom: 8, left: axisWidth + 8, right: 8, maxHeight: "45%", overflow: "auto", py: 0.25, bgcolor: "#fff4e5", fontSize: "0.8rem" }}>{previewMessage}</Alert>}
      {quantities && <QuantityDeltaBadge saved={quantities.saved} live={quantities.live} invalid={quantities.invalid} />}
    </Box>
    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: { xs: 1.25, sm: 2 }, py: 1.25, gap: 1.25, flexWrap: "wrap", bgcolor: "#fcfcff", mb: 2, border: "1px solid #e2e8f0", borderTop: 0, borderRadius: "0 0 16px 16px" }}>
      <Stack direction="row" alignItems="center" gap={1.5} flexWrap="wrap">
        {series.map(entry => <Typography key={entry.name} variant="caption" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, color: entry.color, fontWeight: 600 }}><Box component="span" aria-hidden="true" sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: entry.color }} />{entry.name}</Typography>)}
        <Typography variant="caption" color="text.secondary">Drag to pan / Ctrl + wheel to zoom</Typography>
      </Stack>
      <Stack direction="row" alignItems="center" spacing={0.5} sx={{ ml: "auto", p: 0.5, border: "1px solid #e2e8f0", borderRadius: "10px", bgcolor: "white", "& .MuiIconButton-root": { width: 30, height: 30, borderRadius: "7px", color: "#52617f", "&:hover": { bgcolor: "#eef2ff", color: "#4f46e5" }, "&.Mui-disabled": { color: "#cbd5e1" } } }}>
        <IconButton size="small" aria-label="Zoom out" onClick={() => changeZoom(zoom / 1.3)} disabled={zoom <= 1}><FiMinus /></IconButton>
        <Typography variant="caption" sx={{ minWidth: 40, textAlign: "center" }}>{Math.round(zoom * 100)}%</Typography>
        <IconButton size="small" aria-label="Zoom in" onClick={() => changeZoom(zoom * 1.3)} disabled={zoom >= 8}><FiPlus /></IconButton>
        <IconButton size="small" aria-label="Reset graph view" onClick={() => { changeZoom(1); scroller.current?.scrollTo(0, 0); }}><FiRefreshCw /></IconButton>
        <IconButton size="small" aria-label={fullScreen ? "Close full screen" : "Open full-screen graph"} onClick={onToggleFullScreen}>{fullScreen ? <FiX /> : <FiMaximize />}</IconButton>
      </Stack>
    </Stack>
  </>;
}

export default function ProposalProfileGraph({ series = [], type = "ls", title, ssd, quantities, totals, totalsStale, previewMessage, sx, stickyTop }) {
  const [fullScreen, setFullScreen] = useState(false);
  const mobile = useMediaQuery("(max-width:900px)");
  const landscape = useMediaQuery("(orientation: landscape)");
  return <>
    <Box role="region" aria-label={title || (type === "cs" ? "Live CS preview" : "Live LS preview")} sx={{ bgcolor: "white", border: "1px solid #e2e8f5", borderRadius: "20px", p: { xs: 1.5, sm: 2 }, mb: 2, ...(stickyTop != null ? { display: "contents" } : {}), ...sx }}>
    <GraphViewport plotSx={stickyTop != null ? { position: "sticky", top: stickyTop, zIndex: 1001, borderRadius: "16px 16px 0 0", boxShadow: "0 8px 24px rgba(20,32,72,0.08)" } : undefined} series={series} height={{ xs: "clamp(150px, 28dvh, 220px)", sm: 240 }} ssd={ssd} quantities={quantities} totals={totals} totalsStale={totalsStale} previewMessage={previewMessage} fullScreen={fullScreen} onToggleFullScreen={() => setFullScreen(previous => !previous)} />
    </Box>
    <Dialog fullScreen open={fullScreen} onClose={() => setFullScreen(false)}>
      <Box sx={{ p: 1.5, height: "100dvh", boxSizing: "border-box" }}>
        {mobile && !landscape ? <Stack sx={{ height: "75vh" }} justifyContent="center" alignItems="center" spacing={2}>
          <FiRotateCw size={40} color="#595cf2" /><Typography>Rotate your phone to landscape to view the full-screen graph.</Typography><Button onClick={() => setFullScreen(false)}>Close graph</Button>
        </Stack> : <GraphViewport series={series} height="calc(100dvh - 110px)" ssd={ssd} quantities={quantities} totals={totals} totalsStale={totalsStale} previewMessage={previewMessage} fullScreen={fullScreen} onToggleFullScreen={() => setFullScreen(previous => !previous)} />}
      </Box>
    </Dialog>
  </>;
}
