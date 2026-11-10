import { readFile } from "node:fs/promises";

// Include Chromium and the API in the container total; Node RSS alone hides
// most of the memory used by an export. Support both cgroup versions.
export const pdfExportResources = async () => {
  const result = { nodeRssBytes: process.memoryUsage().rss };
  for (const [usage, limit] of [
    ["/sys/fs/cgroup/memory.current", "/sys/fs/cgroup/memory.max"],
    ["/sys/fs/cgroup/memory/memory.usage_in_bytes", "/sys/fs/cgroup/memory/memory.limit_in_bytes"],
  ]) {
    try {
      const values = await Promise.all([readFile(usage, "utf8"), readFile(limit, "utf8")]);
      result.containerBytes = Number(values[0].trim());
      result.containerLimitBytes = /^\d+$/.test(values[1].trim()) ? Number(values[1].trim()) : null;
      break;
    } catch { /* Local systems need not expose Linux cgroups. */ }
  }
  return result;
};
