import Plotly from "plotly.js/dist/plotly";

export const GRAPH_EXPORT_SCALE = 3;
export const GRAPH_EXPORT_JPEG_QUALITY = 0.98;

export const loadExportImage = src => new Promise((resolve, reject) => {
  const image = new Image();
  image.onload = () => resolve(image);
  image.onerror = () => reject(new Error("Could not render the graph for PDF export."));
  image.src = src;
});

export const canvasJpegBytes = async canvas => {
  const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", GRAPH_EXPORT_JPEG_QUALITY));
  if (!blob) throw new Error("Could not encode the graph for PDF export.");
  return new Uint8Array(await blob.arrayBuffer());
};

// Reuse the finished SVG layers instead of asking Plotly to redraw the graph.
export const capturePlotCanvas = async plot => {
  if (!plot) throw new Error("The graph is not ready yet.");
  const bounds = plot.getBoundingClientRect();
  if (!bounds.width || !bounds.height) throw new Error("The graph has no visible size.");
  const width = bounds.width;
  const height = bounds.height;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * GRAPH_EXPORT_SCALE);
  canvas.height = Math.round(height * GRAPH_EXPORT_SCALE);
  const context = canvas.getContext("2d");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  let url;
  try {
    const layers = [...plot.querySelectorAll(".svg-container > svg.main-svg")];
    const vectorOnly = plot._fullData?.every(trace => trace.type === "scatter" || trace.type === "bar");
    if (layers.length && vectorOnly) {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("width", width);
      svg.setAttribute("height", height);
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
      svg.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
      for (const layer of layers) {
        const copy = layer.cloneNode(true);
        const sourceTexts = layer.querySelectorAll("text");
        copy.querySelectorAll("text").forEach((node, index) => {
          const style = getComputedStyle(sourceTexts[index]);
          for (const key of ["font-family", "font-size", "font-weight", "font-style", "fill"]) node.style.setProperty(key, style.getPropertyValue(key));
        });
        copy.querySelectorAll(".draglayer, .hoverlayer, .zoomlayer").forEach(node => node.remove());
        for (const node of copy.querySelectorAll("*")) {
          for (const attribute of [...node.attributes]) {
            if (attribute.value.includes("url(")) node.setAttribute(attribute.name,
              attribute.value.replace(/url\(["']?[^)"']*#([^)'"\s]+)["']?\)/g, "url(#$1)"));
          }
        }
        svg.appendChild(copy);
      }
      url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)], { type: "image/svg+xml;charset=utf-8" }));
    } else {
      // Keep support for non-SVG traces without silently omitting their data.
      url = await Plotly.toImage(plot, { format: "png", width: Math.round(width), height: Math.round(height), scale: GRAPH_EXPORT_SCALE });
    }
    const image = await loadExportImage(url);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const size = plot._fullLayout?._size;
    if (size?.w > 0 && size?.h > 0) {
      // Draw only the left Y-axis and bottom X-axis in the exported image.
      context.save();
      context.scale(canvas.width / width, canvas.height / height);
      context.strokeStyle = "#9ca3af";
      context.lineWidth = 0.75;
      context.beginPath();
      context.moveTo(size.l, size.t);
      context.lineTo(size.l, size.t + size.h);
      context.lineTo(size.l + size.w, size.t + size.h);
      context.stroke();
      context.restore();
    }
    return { canvas, width, height, plotArea: size && { left: size.l / width, width: size.w / width,
      top: size.t / height, height: size.h / height,
      bottom: (size.t + size.h) / height, xRange: plot._fullLayout?.xaxis?.range,
      yRange: plot._fullLayout?.yaxis?.range, xType: plot._fullLayout?.xaxis?.type, yType: plot._fullLayout?.yaxis?.type,
      fontSizePx: Number(plot._fullLayout?.xaxis?.tickfont?.size || plot._fullLayout?.font?.size) || 12 } };
  } catch (error) {
    canvas.width = canvas.height = 0;
    throw error;
  } finally {
    if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
  }
};
