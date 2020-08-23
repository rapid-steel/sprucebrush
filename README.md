# SpruceBrush

This is a web application for drawing. It is developing in two main directions:
- wide range of instrument settings, so you can use experiment with them and use 
imagination.
- the most common and useful functions of advanced graphic editors, like filters, 
layers and so, but all this is available in the browser.

## Launching

The simpliest way is to refer the link:
Beware the load speed is not well. So if you'd like to give it a chance, you can 
download dist folder and open index page on localhost.


## Features

### Tools
Currently there are available the following tools:
- Brush - draws points
- Eraser - acts equal to brush and the options are same, except for color settings.
- Roller - draws lines
- Filling tool, with the option to use a pattern.
- Selection tool
- Helpers tools: color picker, tool to drag and rotate the canvas.
This is not the most impressive list yet, but be sure there are a few more 
interesting things to be added ahead.

#### Tools options

Some options has a parameter "length": it is set in units equal to diameter or
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


## Known issues

 - If the app crashes constantly after a centain amount of time, this is most 
 likely a problem related to GPU acceleration support.
 In a Chromium browser, check the status of graphic features:
 chrome://gpu/
 
 If GPU acceleration isn't available, maybe your videocard is the browser blacklist
 You can work around this problem by enabling flag ignore-gpu-blacklist
 chrome://flags/

 Caution! Use this at your own risk!

 - An image looks blurry on zoom in. This is a drawback of HTML Canvas. A possible 
 trick to make canvas bigger, but performance will suffer. You can try to set 
 resolution to x2 in settings, but see if this wouldn't significantly slow down
 the app for you.

 - So ... I've heard rumors that modern browsers support graphic tablet pressure. 
 Having suffered multiple setbacks in trying to get them to do this, I decided 
 that other tasks were of higher priority in the development of this application. 
 However, I promise that I will be back to this problem.

 