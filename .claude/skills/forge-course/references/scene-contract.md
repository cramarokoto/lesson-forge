# Scene contract

What the stager writes in `step.scene` and what the engine must render.
**Status: draft.** The engine does not exist yet (HANDOVER §8 step 2). When it does, `engine/README.md` becomes the reference and this file points to it.

## Coordinates

- Isometric grid. `pos = [x, y, z]` in grid units: `x` and `y` on the floor, `z` up.
- Usable volume: `x, y ∈ [0, 10]`, `z ∈ [0, 6]`. The engine fits this box to the viewport.
- `size` is in grid units (sphere diameter, cube edge, ring radius, tile side).

## Objects

| `type` | Needs | Notes |
|---|---|---|
| `board` | `pos`, `size` | Floor plate under a group of objects |
| `cube`, `sphere`, `tile` | `pos` | |
| `ring` | `pos`, `size` | Flat circle, e.g. an electron shell |
| `arrow` | `pos`, `to` | |
| `label` | `pos`, `text` | Short tag attached to a point, ≤ 4 words |
| `text` | `pos`, `text` | Free text, e.g. a value |
| `group` | `key` | Other objects join it with `parent`; moving the group moves them |

- `role` picks a color from the course palette (e.g. `proton`, `neutron`, `electron`, `nucleus`). The same role always means the same thing, in every lesson of the course.
- `accent: true` marks **the** focus of the step: at most one per step.
- `opacity` 0–1; use it to fade context, not to hide (omit the object instead).

## Animation between steps

- Each step's `scene` is the **full** state, not a diff.
- Same `key` in consecutive steps = same object; the engine animates position, size, color, opacity.
- A new key fades in; a key that disappears fades out.
- At most 25 objects per step. Labels must not overlap.
- Diagrams are schematic: when real proportions cannot be shown (atom vs nucleus), the step text or a label must say so.

## When the primitives are not enough

Say so in the stager's reply. Never draw a misleading figure to fill the gap.
