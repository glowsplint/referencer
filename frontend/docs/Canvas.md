# Canvas events

The default selection mode (state variable in React Context) is "none". There are other modes like "selecting" and "arrowing".

## Events that change the selection mode

### Ctrl key pressed

When the Ctrl key is being pressed, the canvas goes into "arrowing" mode.

## Mouse events

When a mouseDown event is detected, the canvas finds the target span with a SpanID at the current mouse location. If there is a span with a SpanID at the current location, the SpanID is passed to the selection or arrowing handlers depending on the current mode.

|           | Selecting                                      | Arrowing (ctrlKey down)                                        | None        |
| --------- | ---------------------------------------------- | -------------------------------------------------------------- | ----------- |
| MouseDown | Set the anchor of the selection.               | Set the anchor of the arrow.                                   | Do nothing. |
| MouseMove | If mouseDown, set the target of the selection. | If mouseDown, set the target of the arrow if target != anchor. | Do nothing. |
| MouseUp   | Do nothing.                                    | Move arrows.inCreation to arrows.finished                      | Do nothing. |

## Painter mode

When you are in painter mode, any text selection that you make will highlight the corresponding segment with your active highlight colour.
