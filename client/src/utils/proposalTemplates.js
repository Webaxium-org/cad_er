// Editable illustrative profiles, not statutory design specifications.
export const proposalTemplates = [
  { id: "national-highway", system: "road", name: "National Highway", width: 7, lhs: "2:1", rhs: "2:1" },
  { id: "state-highway", system: "road", name: "State Highway", width: 5.5, lhs: "2:1", rhs: "2:1" },
  { id: "local-road", system: "road", name: "Local Road", width: 3.5, lhs: "1.5:1", rhs: "1.5:1" },
  { id: "national-waterway", system: "water", name: "National Waterway", width: 12, lhs: "3:1", rhs: "3:1" },
  { id: "state-waterway", system: "water", name: "State Water Way", width: 8, lhs: "2:1", rhs: "2:1" },
  { id: "canal", system: "water", name: "Canal", width: 4, lhs: "1.5:1", rhs: "1.5:1" },
  { id: "single-rail", system: "rail", name: "Single-track Railway", width: 6, lhs: "2:1", rhs: "2:1" },
  { id: "double-rail", system: "rail", name: "Double-track Railway", width: 11, lhs: "2:1", rhs: "2:1" },
];
export const applyExampleTemplate = (design, preset) => ({ ...design, template: preset.system, templateId: preset.id, templateName: preset.name,
  cs: { ...design.cs, fixedBottomEnabled: true, slopeEnabled: false, bottomWidth: String(preset.width), fixedLhs: preset.lhs, fixedRhs: preset.rhs, superelevationEnabled: false, berm: "0" } });
export const exampleTemplateSeries = design => {
  if (!design.templateId) return [];
  const width = Number(design.cs.bottomWidth);
  const ratio = value => { const [h,v] = String(value).split(":").map(Number); return h > 0 && v > 0 ? h/v : null; };
  const lhs = ratio(design.cs.fixedLhs), rhs = ratio(design.cs.fixedRhs);
  if (!(width > 0) || !lhs || !rhs) return [];
  const edge = design.template === "water" ? 101 : 99;
  return [{ name: design.templateName + " ? example", color: "#595cf2", points: [{x:-width/2-lhs,y:edge},{x:-width/2,y:100},{x:0,y:100},{x:width/2,y:100},{x:width/2+rhs,y:edge}] }];
};
