# Water way: confirmed client requirements

Confirmed by the client on 15 September 2026:

- Bottom Width Fixed and With Respect to Berm were accepted.
- Slope End-to-End is exactly With Respect to Berm with total berm width 0, using the same quantity and side slope. It requires no entered RLs or separate bank limits.
- Proposed bed RL uses 0.005 m increments. Small quantity differences are acceptable. Nearest rounding is the implementation interpretation; the client did not explicitly specify a rounding direction.
- The client reported an area error at zero berm width and missing initial levels in the quantity table.

## Implemented correction

End-to-End and Berm now share the quantity solver. It finds a common bed RL, rounds to the nearest feasible 0.005 m increment, and rebuilds the bed edges from that level. Surveyed bank tie levels remain ground levels. If no 0.005 m bed fits, generation reports an error.

Area and combined plotting/quantity reports now compare ground and proposal at common physical offsets for these methods, including interpolated ground levels and cut/fill crossings. The final triangle where cutting returns to zero is included. The existing Volume report already uses this calculation. Bottom Width Fixed calculation is preserved.

Both proposal forms show quantity and side slope for End-to-End, without fixed/start/end RL or bank-limit inputs.

## Existing saved proposals

New Berm and End-to-End proposals use geometry version 4. Reports flag older proposals. Preserve any manual edits before recreating a proposal through the existing workflow. Viewing a report does not regenerate stored designs. No live project data was modified during this correction.

## Verification

From the repository root:

```
node --test server/test/waterWayController.test.js server/test/waterWayGeometry.test.js client/src/utils/surveyGeometry.test.js
```

Tests cover zero-berm equivalence, nearest 0.005 rounding, resulting quantity tolerance, side triangles, ground interpolation, nonzero berm limits, invalid quantities, transaction rollback, preserved fixed-width output, and PDF geometry. Controller tests mock database persistence.

The earlier investigation describes superseded buffer and longitudinal-grade assumptions; it is historical context, not the current design contract.
