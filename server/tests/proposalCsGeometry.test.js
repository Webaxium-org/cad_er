import test from "node:test";
import assert from "node:assert/strict";
import { applyProposalWorkspace, proposalDesignQuantity } from "../helper/proposalWorkspace.js";
import { calculateVolumeReport } from "../../client/src/utils/volumeReport.js";
const fixture = level => ({ pls: 0, rows: ["0/000","0/010"].map(chainage => ({ type:"Chainage", chainage, roadWidth:10, reducedLevels:[level,level,level], intermediateOffsets:[-5,0,5].map(offset=>({offset})) })) });
const normalized = p => ({...p, rows:p.rows.map(r=>({...r, offsets:r.intermediateOffsets.map(p=>Number(p.offset))}))});
const survey={type:"Water Way",separator:"/"};
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
