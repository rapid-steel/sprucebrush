# SpruceBrush

This is a web application for drawing. Still not GIMP or Photoshop, but already 
not MSPaint.

## Launching

The simpliest way is to refer the link:
Beware the load speed is not well. So if you'd like to give it a chance, you can 
download dist folder and open index page on localhost.


## Features

### Tools
Currently there are available the following tools:
- Brush - draws points. 
- Roller - draws lines.
- Eraser
- Filling tool.
- Selection tool
- Helpers tools: color picker, tool to drag and rotate the canvas.
This is not the most impressive list yet, but be sure there are a few more 
interesting things to be added ahead.

#### Tools settings
Basic settings for brush and roller: diameter or line width, opacity, blur. 
There are also the shape settings available for the brush: angle and stretch of 
a point, distance between points, point spread (perpendicular to the direction 
of the brush stroke).
For some settings, you can set the dynamics so that the parameter will change, 
for example, periodically or randomly. There is also support for tablet pressing
(if you choose "Pressure" dynamics).
You can choose a texture or even upload your own. The texture is used for alpha 
mapping, so it should be transparent.
It is also possible to draw with a gradient rather than a solid color.

Note: some settings has a parameter "length": it is set in units equal to diameter or
line width.

### Other
- Layers
- Blending modes
- Transformations of canvas (rotating, flipping);
- Import of images via menu or drag-n-drop to canvas;
- Image filters

## Useful shortcuts

### Common:
- Ctrl + N - new drawing
- Ctrl + S - save to file
- Ctrl + A - select a whole layer
- Ctrl + V - paste from clipboard
- Ctrl + Z - undo last action
- Ctrl + Y - redo last action
- Add - zoom in
- Minus - zoom out

### Selection:
- Ctrl + C - copy selection to clipboard
- Ctrl + X - cut selection to clipboard
- Ctrl + T - crop image to selected area
- Delete - clear selection

### Keys to select a centain tool:
-  B - Brush
-  E - Eraser
-  F - Fill
-  C - Color picker
-  S - rectangular Selection

### Keys to switch to a centain tool while pressing:
- Alt - color picker
- mouse middle button - hand

### Other keys on key press:
- Shift - restrict the moving to one axis
- Ctrl  - draw straight lines

### Other:
- Ctrl + W - fullview mode (hide side panels)
- Ctrl + E - merge a current layer with underlying one
- D - reset the main color to black and the background color to white


## Dependencies

This is a Vue.js project.
Vue components used:

**[vue-select](https://github.com/sagalbot/vue-select)**

**[vue-color-picker-wheel](https://github.com/stijlbreuk/vue-color-picker-wheel)**

**[Vue.Draggable](https://github.com/SortableJS/Vue.Draggable)**

## Credits

**[Color palette](http://www.colourlovers.com/web/blog/2008/04/22/all-120-crayon-names-color-codes-and-fun-facts)**


## Known issues

 - An image looks blurry on zoom in. You can try to set resolution to x2 in settings, 
 but see if this wouldn't significantly slow down the app for you.

 