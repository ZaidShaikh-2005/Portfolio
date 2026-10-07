# Byte — the 3D coding companion

Byte is an original cartoon robot made for this portfolio. Its rounded ivory
armour, navy joints, glowing face, antenna, and floating circuit blocks fit the
portfolio's gaming style. It is built from actual 3D geometry and rendered
locally with WebGL; it is not a Sketchfab embed or a character copied from a game.

## Placement

At desktop widths of 1280px and above, Byte occupies the right column next to the
main content. The existing profile stays on the left. Below that width, Byte
appears in a collapsed panel below the content; click its heading to expand it.

The character appears on World, About, Quest Log, Projects, and Comms.

## Controls

| Control | Action |
| --- | --- |
| Drag the character | Rotate the view |
| Arrow keys, with the character focused | Rotate left/right or tilt up/down |
| Home, with the character focused | Reset rotation |
| Wave | Play a short greeting animation |
| Pause / Play | Stop or start the idle animation |
| Reset view | Restore the default rotation and head position |
| Existing theme button | Change the character's accent colours with the site |

Idle animation starts paused for reduced-motion preferences. Explicit rotation
and the Wave control remain available. Rendering pauses when the character is
offscreen, its panel is collapsed, or the tab is hidden. A static illustration
of the same model appears when 3D rendering is unavailable.

## Files

- `assets/js/companion.js`: the original model, shading, animation, and controls.
- `assets/css/companion.css`: the responsive right-column layout and panel.
- `assets/images/byte-companion.png`: the fallback poster, rendered from the model.

All three files are local and included in this ZIP. You can use and redistribute
the model and its renderer with your portfolio. There are no extra libraries,
model-hosting accounts, subscriptions, or API keys to configure.

## Validation

The scene's actual shaders and mesh data were rendered in an OpenGL ES context
with no graphics errors. Script checks verified rotation, view reset, pause,
wave animation, theme changes, reduced-motion preferences, collapsed layouts,
and graphics-context loss/restoration. Full browser layout verification was
unavailable in this environment.
