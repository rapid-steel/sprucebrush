# magicpen

This is a web application for drawing. It is developing in two main directions:
- wide range of instrument settings, so you can use experiment with them and use imagination.
- the most common and useful functions of advanced graphic editors, like filters, layers and so, but all this is available in the browser.

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

### Keys to select a centain tool:
-  B - Brush
-  E - Eraser
-  F - Fill
-  C - Color picker
-  S - rectangular Selection

### Other:
- Ctrl + E - merge a current layer with underlying one
-  D - reset the main color to black and the background color to white


## Dependencies

This is a Vue.js project.
Vue components used:

**[vue-select](https://github.com/sagalbot/vue-select)**

**[vue-color-picker-wheel](https://github.com/stijlbreuk/vue-color-picker-wheel)**

**[Vue.Draggable](https://github.com/SortableJS/Vue.Draggable)**


## Known issues

 - An image looks blurry on zoom in. This is a drawback of HTML Canvas. A possible 
 trick to make canvas bigger, but performance will suffer. You can try to set 
 resolution to x2 in settings, but see if this wouldn't significantly slow down
 the app for you.

 - So ... I've heard rumors that modern browsers support graphic tablet pressure. 
 Having suffered multiple setbacks in trying to get them to do this, I decided 
 that other tasks were of higher priority in the development of this application. 
 However, I promise that I will be back to this problem.