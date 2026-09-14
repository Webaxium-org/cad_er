# Please confirm with the surveyor

The software now builds a flat bed with sloping sides joining the selected banks. Please ask the client to answer the following for one actual section, preferably chainage 300.

1. **Buffer reference:** When entering a buffer of, for example, 0.185 m, is it subtracted from the ground level at the centreline/PLS, the lowest ground level within the banks, a water-level reading, or another specified RL?
2. **Bank limits:** Which offsets are the left and right ends of the proposed channel? In the CH300 image they are -3.000 and +3.000, although measurements extend to -4.000 and +4.000. Are the limits fixed throughout the survey, or do they change by chainage? Does the recorded section width represent these limits?
3. **Side slope:** What is the specified horizontal:vertical ratio for each method? CH300 indicates 1:1. Should both sides use the same ratio? Please do not infer the project specification from the appearance of a drawing.
4. **Longitudinal grade:** Confirm the first/last chainages and their proposed bed RLs. If the grade changes partway through the survey, supply the intermediate grade-change chainages and RLs.
5. **Above-level proposals:** If the proposed bed is higher than a bank, is filling/embankment intended? Its limits and side geometry need to be specified separately from this bank-to-bank channel template.

A useful worked example consists of: measured offset/RL pairs, chosen left/right bank offsets, side slope H:V, selected method and inputs, and expected proposed offset/RL pairs. If possible, obtain a second section with a different width. An Excel table or the original drawing is preferable to reading rounded values from a screenshot.

## Available inputs in the corrected app

- **Slope End-to-End Type:** start/end bed RLs, side slope, and bank limits. The grade follows actual chainage distance.
- **With Respect to Buffer:** buffer amount, above/below direction, explicit reference choice, side slope, and bank limits. Lowest ground means within the selected banks. A specified reference RL is constant across the selected survey.
- **Bank limits:** either explicit left/right offsets applied to all sections, or the recorded width at each chainage centred on PLS. The latter supports varying symmetric widths; varying asymmetric bank limits or independent left/right side slopes still need client details before adding an input workflow.
- Bank-to-bank templates require the bed to lie below both bank RLs, have positive width, and include PLS. The app gives a chainage-specific error if those conditions fail.
- PDF horizontal/vertical scales are selectable. Print at actual size (100%). Long sections paginate horizontally at the selected scale.

## Checking the CH300 example

Use centreline reference RL 7.340, buffer 0.185 below, side slope 1:1, and bank offsets -3 and +3. The expected proposed points are:

| Offset | Proposed RL |
| ---: | ---: |
| -3.000 | 7.865 |
| -2.290 | 7.155 |
| 0.000 | 7.155 |
| 2.240 | 7.155 |
| 3.000 | 7.915 |

This is a numerical reproduction using a reference choice that yields the illustrated bed, not evidence that centreline reference was the original designer's chosen buffer method. See `water-way-ch300-verification.pdf` for the generated drawing.

## Existing proposals

The correction affects newly generated proposals. It does not overwrite saved project data. Preserve/export any manually adjusted proposal before removing and recreating it through the existing proposal workflow with confirmed inputs. The authenticated live survey has not been used for the automated checks.

## Technical verification

Regression command, from the repository root:

```
node --test server/test/waterWayController.test.js server/test/waterWayGeometry.test.js client/src/utils/surveyGeometry.test.js
```

Coverage includes the CH300 geometry, irregular chainage distances across kilometre boundaries, missing centreline interpolation, explicit buffer references, varying recorded widths, invalid geometry transaction rollback, matching-offset cut/fill integration, scaled PDF pagination, and unchanged fixed-width output. Controller tests mock persistence; they do not modify the database.

The separation of invert elevation, channel dimensions, and side slopes agrees with the [USACE HEC-RAS channel modification documentation](https://www.hec.usace.army.mil/confluence/rasdocs/rasum/6.0/performing-channel-design-modifications). That reference supports the geometric model; project bank limits, grading and side-slope specifications must come from the client.
