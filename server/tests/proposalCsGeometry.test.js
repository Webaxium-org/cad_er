import test from "node:test";
import assert from "node:assert/strict";
import { applyProposalWorkspace, proposalDesignQuantity } from "../helper/proposalWorkspace.js";
import { calculateVolumeReport } from "../../client/src/utils/volumeReport.js";
import { reverseSlopeRatio, slopeRatioToGrade } from "../../client/src/utils/slopeRatio.js";
const fixture = level => ({ pls: 0, rows: ["0/000","0/010"].map(chainage => ({ type:"Chainage", chainage, roadWidth:10, reducedLevels:[level,level,level], intermediateOffsets:[-5,0,5].map(offset=>({offset})) })) });
const normalized = p => ({...p, rows:p.rows.map(r=>({...r, offsets:r.intermediateOffsets.map(p=>Number(p.offset))}))});
const survey={type:"Water Way",separator:"/"};
test("V:H inputs preserve the stored CS geometry and signed LS gradient", () => {
 const base = fixture(12), seed = fixture(10);
 const oldCs = { fixedBottomEnabled:true, bottomWidth:4, fixedLhs:"2:1", fixedRhs:"1:1" };
 const displayed = reverseSlopeRatio(oldCs.fixedLhs);
 assert.equal(displayed, "1:2");
 const editedCs = { ...oldCs, fixedLhs:reverseSlopeRatio(displayed) };
 assert.deepEqual(applyProposalWorkspace(survey,base,seed,{cs:editedCs}), applyProposalWorkspace(survey,base,seed,{cs:oldCs}));
 const falling = applyProposalWorkspace(survey,base,seed,{cs:editedCs,ls:{enabled:true,strategy:"anchor",anchorRl:10,grade:slopeRatioToGrade("-1:2000")}});
 const centerRl = row => Number(row.reducedLevels[row.intermediateOffsets.findIndex(p => Number(p.offset) === 0)]);
 assert.equal(centerRl(falling.rows[0]), 10);
 assert.equal(centerRl(falling.rows[1]), 9.995);
});
test("fixed width preserves flat bed and independently applies both side ratios",()=>{
 const base=fixture(12), seed=fixture(10);
 const result=applyProposalWorkspace(survey,base,seed,{cs:{fixedBottomEnabled:true,bottomWidth:4,fixedLhs:"2:1",fixedRhs:"1:1"}});
 assert.deepEqual(result.rows[0].intermediateOffsets.map(p=>Number(p.offset)),[-5,-2,0,2,5]);
 assert.deepEqual(result.rows[0].reducedLevels,["11.500","10.000","10.000","10.000","13.000"]);
 const expected=proposalDesignQuantity(survey,base,result), actual=calculateVolumeReport(survey,normalized(base),normalized(result));
 assert.ok(Math.abs(expected.cutting-actual.totalCuttingVolume)<0.02);
 assert.ok(Math.abs(expected.filling-actual.totalFillingVolume)<0.02);
 assert.equal(seed.rows[0].reducedLevels.length,3);
});
test("berm is an inset at each edge, with separate side ratios",()=>{
 for(const berm of [0,1]) {
 const result=applyProposalWorkspace(survey,fixture(12),fixture(10),{cs:{slopeEnabled:true,lhs:"1:1",rhs:"1.5:1",berm}});
 const xs=result.rows[0].intermediateOffsets.map(p=>Number(p.offset));
 assert.equal(xs[0],-5+berm);assert.equal(xs.at(-1),5-berm);
 assert.ok(xs.includes(-3+berm));assert.ok(xs.includes(2-berm));
 assert.equal(result.rows[0].reducedLevels[0],"12.000");assert.equal(result.rows[0].reducedLevels.at(-1),"12.000");
 }
});
test("invalid geometry and simultaneous modes are rejected",()=>{
 for(const cs of [{fixedBottomEnabled:true,slopeEnabled:true},{fixedBottomEnabled:true,bottomWidth:20,fixedLhs:"1:1",fixedRhs:"1:1"},{slopeEnabled:true,lhs:"0:1",rhs:"1:1",berm:0},{slopeEnabled:true,lhs:"1:1",rhs:"1:1",berm:5}]) assert.throws(()=>applyProposalWorkspace(survey,fixture(12),fixture(10),{cs}));
});

test("camber falls away from the centre", () => {
 const result = applyProposalWorkspace({type:"Road Survey",separator:"/"},fixture(10),fixture(10),{cs:{camberEnabled:true,camber:"2"}});
 assert.deepEqual(result.rows[0].reducedLevels,["9.900","10.000","9.900"]);
});
test("custom slope ranges apply the entered H:V and reject reversed chainages", () => {
 const cs={slopeEnabled:true,lhs:"1:1",rhs:"1:1",berm:0,slopeMode:"custom",slopeRanges:[{from:"0/000",to:"0/010",side:"all",horizontal:2,vertical:1,berm:0}]};
 const result=applyProposalWorkspace(survey,fixture(12),fixture(10),{cs});
 assert.ok(result.rows[0].intermediateOffsets.some(p=>Number(p.offset)===-1));
 assert.throws(()=>applyProposalWorkspace(survey,fixture(12),fixture(10),{cs:{...cs,slopeRanges:[{...cs.slopeRanges[0],from:"0/010",to:"0/000"}]}}));
});

test("unified width All row preserves legacy centred and offset geometry for both design conditions", () => {
  for (const type of ["Road", "Water Way"]) for (const condition of ["cutting", "filling"]) {
    const context = { type, separator: "/" }, base = fixture(12), seed = fixture(10);
    const settings = { mode: "manual", manualLevels: { "0/000": 10, "0/010": 10 }, ls: { quantityType: condition } };
    const fixed = { fixedBottomEnabled: true, bottomWidth: 2, fixedLhs: "2:1", fixedRhs: "1:1" };
    const legacy = applyProposalWorkspace(context, base, seed, { ...settings, cs: { ...fixed, widthMode: "all", side: "all" } });
    const unified = applyProposalWorkspace(context, base, seed, { ...settings, cs: { ...fixed, widthMode: "custom", widthRanges: [{ from: "all", to: "", side: "all", widthOffset: "0", bottomWidth: 2 }] } });
    assert.deepEqual(unified.rows, legacy.rows);
    assert.deepEqual(proposalDesignQuantity(context, base, unified), proposalDesignQuantity(context, base, legacy));
    for (const side of ["all", "lhs", "rhs"]) for (const offset of [-2, 0, 2]) {
      const entry = { side, widthOffset: String(offset), bottomWidth: 2 };
      const previous = applyProposalWorkspace(context, base, seed, { ...settings, cs: { ...fixed, widthMode: "custom", widthRanges: [{ ...entry, from: "0/000", to: "0/010" }] } });
      const current = applyProposalWorkspace(context, base, seed, { ...settings, cs: { ...fixed, widthMode: "custom", widthRanges: [{ ...entry, from: "all", to: "" }] } });
      assert.deepEqual(current.rows, previous.rows, `${type}/${condition}/${side}/${offset}`);
      const report = calculateVolumeReport(context, normalized(base), normalized(current));
      const quantity = proposalDesignQuantity(context, base, current);
      assert.ok(Math.abs(quantity.cutting - report.totalCuttingVolume) < 0.02);
      assert.ok(Math.abs(quantity.filling - report.totalFillingVolume) < 0.02);
    }
  }
});

test("width rows combine All defaults and chainage overrides with last matching row winning", () => {
  const chainages = ["0/000", "0/010", "0/020", "0/030"];
  const base = fixture(12), seed = fixture(10);
  base.rows = chainages.map(chainage => ({ ...structuredClone(base.rows[0]), chainage }));
  seed.rows = chainages.map(chainage => ({ ...structuredClone(seed.rows[0]), chainage }));
  const result = applyProposalWorkspace(survey, base, seed, {
    mode: "manual", manualLevels: Object.fromEntries(chainages.map(chainage => [chainage, 10])),
    cs: { fixedBottomEnabled: true, fixedLhs: "1:1", fixedRhs: "1:1", widthMode: "custom", widthRanges: [
      { from: "all", to: "", widthOffset: "0", side: "all", bottomWidth: 4 },
      { from: "0/010", to: "0/020", widthOffset: "-2", side: "lhs", bottomWidth: 2 },
      { from: "0/020", to: "0/030", widthOffset: "2", side: "rhs", bottomWidth: 2 },
    ] },
  });
  const flatOffsets = result.rows.map(row => row.intermediateOffsets.filter((_, index) => Number(row.reducedLevels[index]) === 10).map(point => Number(point.offset)));
  assert.deepEqual(flatOffsets, [[-2, 0, 2], [-4, -2], [2, 4], [2, 4]]);
  assert.deepEqual(seed.rows[0].reducedLevels, [10, 10, 10]);
});

test("unified width offset remains relative to PLS and rejects invalid geometry", () => {
  const base = { ...fixture(12), pls: 1 }, seed = { ...fixture(10), pls: 1 };
  const cs = { fixedBottomEnabled: true, fixedLhs: "1:1", fixedRhs: "1:1", widthMode: "custom", widthRanges: [{ from: "all", to: "", widthOffset: "-2", side: "all", bottomWidth: 2 }] };
  const result = applyProposalWorkspace(survey, base, seed, { cs });
  const flat = result.rows[0].intermediateOffsets.filter((_, index) => Number(result.rows[0].reducedLevels[index]) === 10).map(point => Number(point.offset));
  assert.deepEqual(flat, [-2, 0]);
  for (const change of [{ widthOffset: "" }, { widthOffset: "NaN" }, { widthOffset: 10 }, { bottomWidth: 0 }, { side: "invalid" }, { from: "0/010", to: "0/000" }]) {
    assert.throws(() => applyProposalWorkspace(survey, base, seed, { cs: { ...cs, widthRanges: [{ ...cs.widthRanges[0], ...change }] } }));
  }
});
