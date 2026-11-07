const uncertainSubmission = error => !error.response
  || [408, 502, 504].includes(error.response.status)
  || (error.response.status === 503 && !error.response.data?.message);

// A gateway can lose the acknowledgement even after the job was committed.
// Look up the original key instead of creating another export.
export async function queuePdfExport(api, payload, { onRecovery = () => {}, pause = ms => new Promise(resolve => setTimeout(resolve, ms)) } = {}) {
  try {
    return (await api.post("pdf-exports", payload, { timeout: 45000 })).data.job;
  } catch (error) {
    if (!uncertainSubmission(error) || error.code === "ERR_CANCELED") throw error;
    onRecovery();
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt) await pause(1000 * attempt);
      try {
        const { data } = await api.get("pdf-exports", { params: { requestKey: payload.requestKey }, timeout: 10000 });
        const job = data.jobs?.find(item => item.requestKey === payload.requestKey);
        if (job) return job;
      } catch (lookupError) {
        if (lookupError.response && [401, 402, 403].includes(lookupError.response.status)) throw lookupError;
      }
    }
    throw new Error("The server timed out while accepting the PDF export. We could not confirm that it was queued. Check the PDF progress card before trying again.");
  }
}
