# Water way proposal investigation

Reviewed 14 September 2026 against commit `14db9c9`, both supplied cross-section images, and all five raster pages of `LS CHECK ONLY.pdf`. The findings below describe the original implementation. A subsequent correction now implements explicit bank limits and buffer references, bank-to-bank geometry, matching-offset quantities, PLS interpolation, and shared vector PDF/preview drawings. Saved survey data has not been changed. See [client confirmation and verification](water-way-client-confirmation.md) for the remaining project-specific questions and test instructions.

## Confirmed findings

1. **The two disputed methods do not generate a channel cross section.** In `server/controllers/surveyController.js`, `generateWaterWayProposalPurpose` calculates a bed RL and copies it to every original offset for both methods. There are no bank tie-ins, side slopes, or new bed-edge offsets. Both images require those features. The accepted fixed-width branch has a separate geometry builder which these methods never call.
2. **The recent longitudinal correction is useful but incomplete.** Commit `14db9c9` replaced the old transverse edge-slope calculation with interpolation between start and end RL over chainage. It also removed the side-slope input for that method. Longitudinal grade and transverse side slope are separate inputs: correcting one cannot construct the other.
3. **Buffer centre RL can be wrong.** `getCenterLevel` uses an exact offset match, otherwise the middle array element. It must interpolate at the configured reference offset if centreline ground is the intended reference. An execution of the actual helper with offsets `[-4,-1,2,4]`, RLs `[8,7,6,8]`, and centre `0` returned `6`; interpolation gives `6.666667`. Filtering RLs before matching indices can also break alignment when a level is invalid.
4. **The buffer reference is not established by these attachments.** The current branch uses centreline ground plus/minus buffer. The previous version shifted every ground point, preserving the irregular ground shape. Neither version creates the illustrated flat bed and bank connections. The drawings do not specify whether the intended reference is centreline ground, lowest section RL, a water-level reading, or a separately specified datum. A clarification was requested.
5. **Export labels are not positioned by offset.** Both `CrossSectionChart.jsx` (hidden PDF layout) and `CrossSectionChartV2.jsx` distribute each series independently using `justifyContent: space-between`. Uneven offsets and unequal point counts therefore misalign the level rows, offset row, and graph. The single-chart hidden PDF layout also omits the offset row. This is separate from the wrong generated geometry.
6. **Printed scales are not enforced.** Export components print `1:100` while graph width, height, axis ranges, and PDF resizing are dynamic. The references specify CS scales of 1:150 and 1:200, and LS horizontal 1:2400 / vertical 1:300. Changing the printed text alone will not give a drawing at those scales.
7. **LS has a similar reference-offset fallback.** `LongitudinalSectionReport.jsx` selects a middle array element when the PLS offset is missing. Once proposal offsets change, the report should interpolate at PLS, or use an explicitly stored bed RL when that is what the report represents.
8. **Quantity reporting must be included in any geometry correction.** The general path in `VolumeReport.jsx` pairs initial and proposal RLs by array index and even takes the previous offset from the initial row. New proposal bed-edge offsets invalidate those pairings. Compare profiles on common physical offsets, interpolating both and including cut/fill crossings before integration. Preserve the client's accepted fixed-width quantity convention separately.

## Calculation contract supported by the references

### Longitudinal bed level

For start/end chainages `c0`, `c1` and entered bed RLs `z0`, `z1`:

```
zBed(c) = z0 + (z1 - z0) * (c - c0) / (c1 - c0)
```

Use numeric chainage distance, including the kilometre component, rather than row number. Require distinct endpoint chainages and finite RLs. Do not force the sign: the PDF's proposed level rises with increasing chainage.

The PDF shows 5.455 at chainage 0, 5.855 at 120, 7.255 at 540, and 9.055 at 1080. These points fit `5.455 + c/300`. This validates the general grade calculation; it does not certify every printed intermediate label. The separate CH300 image uses 7.155, so the attachments must not be treated as one identical numerical dataset.

### Buffer bed level (conditional on the reference choice)

If the intended reference is centreline ground:

```
zReference(c) = interpolated ground RL at PLS in section c
zBed(c) = zReference(c) - buffer     // below
zBed(c) = zReference(c) + buffer     // above
```

Use one bed RL for the section, then build its sides. A constant buffer from varying centreline ground produces a varying longitudinal profile; it does not generally produce a straight longitudinal grade. Require a finite, nonnegative buffer and an explicit valid direction.

### Cross-section sides and bed edges

For a cut section with selected bank tie points `(xL,zL)` and `(xR,zR)`, a bed level `zBed`, and side slope `m = H/V`:

```
xLeftBed  = xL + m * (zL - zBed)
xRightBed = xR - m * (zR - zBed)
```

The proposal is the polyline through the left bank, left bed edge, right bed edge, and right bank. Include the PLS point on the bed where applicable. Leave initial terrain extending beyond the proposal limits. Interpolate existing ground at generated offsets for comparisons, without presenting those values as measured observations.

The CH300 image checks this exactly:

| Point | Offset | Proposed RL |
| --- | ---: | ---: |
| Left tie | -3.000 | 7.865 |
| Left bed edge | -2.290 | 7.155 |
| Centre | 0.000 | 7.155 |
| Right bed edge | 2.240 | 7.155 |
| Right tie | 3.000 | 7.915 |

Both runs equal their respective vertical drops, establishing 1H:1V for this example. The initial survey extends to -4 and +4, so selecting the outermost survey points as bank ties would not reproduce this example. The second image has a different section width and different apparent side proportions; do not hardcode the first image's ratio globally.

The two disputed forms currently lack the side-slope and bank-limit inputs needed to uniquely determine this geometry. Those may come from explicit inputs or established survey metadata, but their source must be defined. Do not reinterpret the accepted fixed-width method merely because of its name: its current implementation treats the entered width as the distance between outer tie points.

The formulas above assume both bank RLs are at or above the bed and that the side runs fit inside the selected limits. Reject or explicitly handle overlapping bed edges, missing reference coverage, and fill sections; silently clipping side runs changes the specified geometry. An above-ground buffer requires a defined fill/embankment rule if it lies above the selected bank levels.

## Report correction

Use numeric x coordinates for the graph and a shared coordinate transform for every table row:

```
fraction = (offset - minOffset) / (maxOffset - minOffset)
```

Map that fraction into the graph's actual plotting rectangle, accounting for margins. Use the union of measured and proposed offsets for table columns, preserving blanks where a profile has no reported point. Keep points sorted numerically while preserving intentional vertical segments at duplicate offsets. Separate collision handling for nearby labels from the physical x position.

For a physically scaled export, allocate drawing dimensions from the horizontal/vertical denominators and retain those dimensions in the PDF; paginate instead of resizing the finished image arbitrarily. Use the same renderer for individual and all-chainage exports.

## Verification and limits

- Read the relevant controller, both proposal forms, CS/LS report paths, export components, quantity report, models, and the latest correction diff.
- Rendered and visually inspected all five PDF pages and inspected both attached images.
- Executed the current centre-level helper in isolation and reproduced the interpolation error above.
- Verified the CH300 bed-edge arithmetic and representative PDF grade values numerically.
- The supplied frontend URL returned HTTP 200. No authenticated browser tool was available; a probe of the server's default localhost port 5000 was refused. The actual survey's stored inputs/output were not inspected, and no end-to-end result is claimed.
- Generation inserts stored proposal rows. Changing formulas later will not update old proposals automatically; a correction must include explicit regeneration/versioning of affected proposals.

The correction requires explicit design inputs instead of assuming the unresolved buffer reference or bank limits. Automated checks cover the exact CH300 geometry, irregular chainage intervals, absent centre offsets, asymmetric banks, invalid/overlapping geometry, aligned PDF labels, and quantities where proposed offsets differ from measured offsets. Confirm the actual project's inputs with the client before recreating its proposals.
