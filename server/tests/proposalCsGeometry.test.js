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
