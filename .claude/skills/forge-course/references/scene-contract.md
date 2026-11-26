# Scene contract

What the stager writes in `step.scene` and what the engine must render.
Implemented by `engine/app.js`; see `engine/README.md`. Allowed `role` values: the keys of `engine/palette.json`.

## Coordinates

- Isometric grid. `pos = [x, y, z]` in grid units: `x` and `y` on the floor, `z` up.
- Usable volume: `x, y ∈ [0, 10]`, `z ∈ [0, 6]`. The engine frames the objects of the whole lesson once (the camera does not move between steps).
- `size` is in grid units (sphere diameter, cube edge, ring radius, tile side).

## Objects

| `type` | Needs | Notes |
|---|---|---|
| `board` | `pos`, `size` or `dims: [length, depth]` | Rounded, thick plinth under a group of objects. Optional `height` (0.4), `radius` (0.3), `slots` (n inset cells along x, colored by `slotRole` or `role`), `sideLabels` (texts written on the front face, one per cell: indexes, values, names) |
| `cube`, `sphere`, `tile` | `pos` | `tile` accepts `dims`, `height`, `radius` like `board` |
| `ring` | `pos`, `size` | Flat circle, e.g. an electron shell |
| `arrow` | `pos`, `to` | |
| `label` | `pos`, `text` | Short tag attached to a point, ≤ 4 words |
| `text` | `pos`, `text` | Free text, e.g. a value |
| `group` | `key` | Other objects join it with `parent`; moving the group moves them |

- `role` picks a color from `engine/palette.json` (e.g. `proton`, `neutron`, `electron`, `nucleus`, `shell`, `measure`); an unknown role fails validation. The same role always means the same thing, in every lesson of the course.
- `accent: true` marks **the** focus of the step: at most one per step.
- `opacity` 0–1; use it to fade context, not to hide (omit the object instead).

## Visual grammar (mandatory)

First find the **verb** of the step's `takeaway`, then use the device it requires. A step may need several.

| Verb in the takeaway | Required device |
|---|---|
| operation or transformation: divide, multiply, convert, go from A to B | an `arrow` from the start object to the end object, labelled with the operation (e.g. « ÷ 10 » five times, or « ÷ 10⁵ »), accent on it |
| comparison: smaller, larger, as much as, same order | objects side by side on one common base (`board`), the gap itself drawn (bar, bracket, arrow between them) |
| sequence or steps | one reading direction (left→right or top→bottom), an arrow between consecutive stages |
| quantity or size | size or length of the object; if not proportional, a « Pas à l’échelle » text |
| definition or naming | the named object with its label, accent on it, everything else faded |

Every diagram must answer, without the text: **where do I start? which way do I go? where do I end? what changes? what do I conclude?** A label alone never gives a direction: use an arrow.

## Animation between steps

- Each step's `scene` is the **full** state, not a diff.
- Same `key` in consecutive steps = same object; the engine animates position, color and opacity. A change of `size`, `type` or `text` redraws the object without animation.
- A new key fades in; a key that disappears fades out.
- At most 25 objects per step. Labels must not overlap.
- Diagrams are schematic: when real proportions cannot be shown (atom vs nucleus), the step text or a label must say so.

## When the primitives are not enough

Say so in the stager's reply. Never draw a misleading figure to fill the gap.
