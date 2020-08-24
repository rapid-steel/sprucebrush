import {Brush, Marker} from "../webgl";
import {fill} from "../functions/pixel-functions";
import {getRgba} from "../functions/color-functions";
import Ctx from "../functions/ctx";
import { resolve } from "core-js/fn/promise";
import { of } from "core-js/fn/array";

// someday i'll isolate the all canvas (including selection) functionality from vue app
// but this day is not today


export default {
    created() {
        this.canvasPattern = null;
        this.update = false;
        this.updateFunc =  () => {
            this.render();
        };
    },
    mounted() {

        this.brush = new Brush();
        this.marker = new Marker();
        this.mainCtx = this.$refs.mainCanvas.getContext("2d");
        this.selCtx = this.$refs.selection.getContext("2d");  
        this.contextsOnscreen = [ this.mainCtx, this.selCtx ];

        this.tempCtx =  Ctx.create(this.sizes.width, this.sizes.height, "2d");
        this.tempCtx2 = Ctx.create(this.sizes.width, this.sizes.height,"2d");
        this.contextsOffscreen = [ this.tempCtx, this.tempCtx2 ];          
        
    },
    methods: {
        animate() {
            if(this.update) {
                requestAnimationFrame(this.updateFunc.bind(this));
            }
        },
        draw(point, tool) {
            this._addPoint(point, tool);  
            this.updateFunc = () => {
                this._draw(point, tool, this.currentLayer.compositeMode);       
                this.render(true);    
                this.animate();
            };
            if(!this.update) {
                this.update = true; 
                this.animate();
            }   
        },
        erase(point) {
            this._addPoint(point, this.brush);  
            this.updateFunc = () => {
                this._draw(point, this.brush, "destination-out");       
                this.render(true);    
                this.animate();
            };
            if(!this.update) {
                this.update = true; 
                this.animate();
            }   
        },
        endDraw(point, tool) {
            if(tool.notEmpty()) {
               // this._addPoint(point, tool);  
                this.writeHistory();
                this.updateFunc = () => {
                    this._draw(point, tool, this.currentLayer.compositeMode);  
                    if(!this.selection) {
                        this.currentLayer.ctx.globalCompositeOperation = "copy";         
                        this.currentLayer.ctx.drawImage(this.tempCtx.canvas, 0, 0);
                    } else {
                        //this.selection.imgCtx.globalCompositeOperation = "copy";         
                        //this.selection.imgCtx.drawImage(this.tempCtx.canvas, 0, 0);
                        this.selection.setSource(this.tempCtx);
                        this.selection.drawImage();
                        this.selection.imgCtx.globalCompositeOperation = "source-over";
                    }
                    
                    tool.dropLine();       
                    this.render();  
                };
                this.animate();  
            }    
            this.update = false; 
           
        },
        endErase(point) {
            if(this.brush.notEmpty()) {
                this._addPoint(point, this.brush);
                this.writeHistory();
                 this.updateFunc = () => {
                    this._draw(point, this.brush, "destination-out");      

                    if(!this.selection) {
                        this.currentLayer.ctx.globalCompositeOperation = "copy";         
                        this.currentLayer.ctx.drawImage(this.tempCtx.canvas, 0, 0);
                    } else {
                        //this.selection.imgCtx.globalCompositeOperation = "copy";         
                        //this.selection.imgCtx.drawImage(this.tempCtx.canvas, 0, 0);
                        this.selection.setSource(this.tempCtx);
                        this.selection.drawImage();
                        this.selection.imgCtx.globalCompositeOperation = "source-over";
                    }
                    this.brush.dropLine();   
                    this.render();    
                };
                this.animate();
               
            }
            this.update = false; 
        },
        _addPoint(point, tool) {
            if(this.restrictedToStraight) {
                let p0 = this.lastTouchedPoint;
                tool.dropLine();
                tool.clearIndex();
                tool.addPoint(p0);
                if(this.restrictedToAxis) {
                    let [dx, dy] = point.coords.map(
                        (c,i) => Math.abs(c - p0.coords[i])
                    );
                    tool.addPoint({
                        pressure: point.pressure,
                        coords: dx > dy ? 
                        [point.coords[0], p0.coords[1]]
                        :  [p0.coords[0], point.coords[1]]
                    });
                }
                else {
                    tool.addPoint(point);
                }
            } else {
                tool.addPoint(point);
            }
        },
        _draw(point, tool, compositeOperation = "source-over") {        
            this.tempCtx.globalCompositeOperation = "copy";           
            
            if(this.selection) {             
                this.selection.drawImage();   
                this.tempCtx.drawImage(this.selection.imgCtx.canvas, 0, 0);
                
                this.selection.clip(this.tempCtx);
                
            }  else {
                this.tempCtx.drawImage(this.currentLayer.ctx.canvas, 0, 0);
            }
            // leave blur settings here now
            // it'd be nice to move it to webgl in the end

            if(!this.currentSettings.values.pixel)           
                this.tempCtx.filter = `blur(${(1-this.currentSettings.values.hardness)*(this.currentSettings.values.radius||this.currentSettings.values.lineWidth)}px)`;
            this.tempCtx.globalCompositeOperation = compositeOperation;
            tool.drawToCtx(this.tempCtx);            
            this.tempCtx.filter = "none";
            if(this.selection) 
                this.tempCtx.restore();
        },    
        render(temp) {
            const {width, height} = this.mainCtx.canvas;
            this.mainCtx.clearRect(0,0, width, height);
            
            this.layers.forEach(l => {
                if(l.visible) {
                    this.mainCtx.globalCompositeOperation = l.blend;
                    this.mainCtx.globalAlpha = l.opacity / 100;
                    if(l == this.currentLayer) {
                        if(temp)
                            this.mainCtx.drawImage(this.tempCtx.canvas, 0, 0);
                        if(!temp || this.selection) 
                            this.mainCtx.drawImage(l.ctx.canvas, 0, 0);
    
                        if(this.selection && !temp) 
                            this.mainCtx.drawImage(this.selection.imgCtx.canvas, 0, 0);
                    } else this.mainCtx.drawImage(l.ctx.canvas, 0, 0);     
                }            
            });    
        },
        setToolParams() {
            if(this.currentSettings.webglTool) {
                const {values, smoothing, dynamics, gradient, texture, webglTool} = this.currentSettings;
                const settings = {
                    values: Object.assign({}, values),
                    dynamics,
                    color: this.currentColor,
                    gradient, texture, smoothing
                };
                if(values.radius) settings.values.radius *= this.sizes.px_ratio;
                if(values.lineWidth) settings.values.lineWidth *= this.sizes.px_ratio;                
    
                this[webglTool].setParams(settings);
            }

            if(this.currentSettings.pattern) {
                if(!this.canvasPattern || 
                    this.currentSettings.pattern.src !== this.canvasPattern.src ||
                    this.currentSettings.pattern.scale !== this.canvasPattern.scale) {
                    this.canvasPattern = {
                        scale: this.currentSettings.pattern.scale,
                        src: this.currentSettings.pattern.src
                    };
                    Ctx.loadImg(
                        this.canvasPattern.src, 
                        (width, height) => ({
                            width:  this.canvasPattern.scale * width,
                            height: this.canvasPattern.scale * height
                        })
                    ).then(ctx => {
                        this.canvasPattern.pattern = this.tempCtx.createPattern(ctx.canvas, "repeat");
                    });                    
                }
            } else 
            this.canvasPattern = null;
        },
        rotateDrawing(angle) {
            let sin = Math.sin(angle);
            let cos = Math.cos(angle);
            let width = Math.abs(sin * this.sizes.height + cos * this.sizes.width);
            let height = Math.abs(cos * this.sizes.height + sin * this.sizes.width);
            let old = Object.assign({}, this.sizes_hr);
            this._setSize(width, height);
            let origin = [
                (this.sizes_hr.width - old.width) / 2,
                (this.sizes_hr.height - old.height) / 2,
            ];

            this.contextsOffscreen.forEach(ctx => {
                Ctx.resize(ctx,  this.sizes_hr.width, this.sizes_hr.height);
            });
            this.tempCtx.save();
            this.tempCtx.translate(this.sizes_hr.width / 2, this.sizes_hr.height / 2);
            this.tempCtx.rotate(angle);
            this.tempCtx.translate(- this.sizes_hr.width / 2, - this.sizes_hr.height / 2);

            this.layers.forEach(layer => {
                this.tempCtx.clearRect(...origin, this.tempCtx.canvas.width, this.tempCtx.canvas.height);
                this.tempCtx.drawImage(layer.ctx.canvas, ...origin);
                layer.ctx.globalCompositeOperation = "copy";
                Ctx.resize(layer.ctx, this.sizes_hr.width, this.sizes_hr.height);    
                layer.ctx.drawImage(this.tempCtx.canvas, 0, 0);    
            });
            this.tempCtx.translate(this.sizes_hr.width / 2, this.sizes_hr.height / 2);
            this.tempCtx.rotate(-angle);
            this.tempCtx.translate(- this.sizes_hr.width / 2, - this.sizes_hr.height / 2);
            this.tempCtx.restore();
            this.tempCtx.clearRect(0, 0, this.tempCtx.canvas.width, this.tempCtx.canvas.height);
        },
        flipDrawing(axis) {
            this.tempCtx.save();
            let origin = [0, 0];
            let scale = [1, 1];
            if(axis == "x") {
                origin[0] = -this.sizes_hr.width;
                scale[0] = -1;
            }
            if(axis == "y") {
                origin[1] = -this.sizes_hr.height;
                scale[1] = -1;
            }
            this.tempCtx.save();
            this.tempCtx.scale(...scale);
            this.layers.forEach(layer => {
                this.tempCtx.clearRect(...origin, this.tempCtx.canvas.width, this.tempCtx.canvas.height);
                this.tempCtx.drawImage(layer.ctx.canvas, ...origin);
                layer.ctx.globalCompositeOperation = "copy";      
                layer.ctx.drawImage(this.tempCtx.canvas, 0, 0);    
            });
            this.tempCtx.restore();
            this.tempCtx.clearRect(0, 0, this.tempCtx.canvas.width, this.tempCtx.canvas.height);
        },
        fill(coords, colorStr) {
            let rect = [0, 0, this.sizes_hr.width, this.sizes_hr.height];
            let data;
            if(this.selection) {
                data = this.selection.imgCtx.getImageData(...rect);
            } else {
                data = this.currentLayer.ctx.getImageData(...rect);
            }
            let color = getRgba(colorStr);         
            let data1 = fill(coords, data, color, this.currentSettings.values.tolerance);

            this.tempCtx.clearRect(...rect);
            this.tempCtx2.clearRect(...rect);
            this.tempCtx2.putImageData(data1, 0, 0); 
            
    
            if(this.selection) {                  
                this._fillIfPattern(this.tempCtx2);
                this.tempCtx.clearRect(...rect);
                
                this.selection.clip(this.tempCtx);
                this.tempCtx.drawImage(this.tempCtx2.canvas, 0, 0);
                this.tempCtx.restore();
            } else {
                this.tempCtx.drawImage(this.tempCtx2.canvas, 0, 0);
            }
    
            this._fillIfPattern(this.tempCtx);       
    
            this.writeHistory();
            if(this.selection) {
                
                this.selection.drawImage();
                this.tempCtx.globalCompositeOperation = "destination-over";
                this.tempCtx.drawImage(this.selection.imgCtx.canvas, 0, 0);
                this.tempCtx.globalCompositeOperation = "source-over";
                this.selection.setSource(this.tempCtx);
                this.selection.drawImage();
                this.selection.imgCtx.globalCompositeOperation = "source-over";
            } else {
                this.currentLayer.ctx.globalCompositeOperation = this.currentLayer.compositeMode;
                this.currentLayer.ctx.drawImage(this.tempCtx.canvas, 0, 0);
            }
            
            this.tempCtx.clearRect(...rect);
            this.render();    
        },
        _createLayerCtx(paste, params = {}) {
            const ctx = Ctx.create(this.sizes_hr.width, this.sizes_hr.height, "2d");      
            if(params.background) {
                ctx.fillStyle = this.colorBG;
                ctx.fillRect(0, 0, this.sizes_hr.width, this.sizes_hr.height);
            }  
            if(paste) {
                ctx.drawImage(paste.img, 
                ...[paste.x, paste.y, paste.width, paste.height].map(v => v * this.sizes.px_ratio));
            }        
            return ctx;
        },
        _mergeLayerImages(under, upper) {
            under.ctx.drawImage(upper.ctx.canvas, 0, 0, this.sizes_hr.width, this.sizes_hr.height);
        },
        _pickColorAtCoord(coord) {
            const data = Array.from(this.mainCtx.getImageData(...coord, 1, 1).data);
            if(data.find(n => !!n))
                return `rgb(${data.slice(0,3).join(",")})`;
            return 0;
        },
        _fillIfPattern(ctx) {
            if(this.currentSettings.pattern.enabled && this.canvasPattern) {    
                ctx.globalCompositeOperation = "source-in";
                ctx.fillStyle = this.canvasPattern.pattern;
                ctx.fillRect( 0, 0,this.sizes_hr.width, this.sizes_hr.height);
                ctx.globalCompositeOperation = "source-over"; 
            } 
        },
        _setSize(width, height, px_ratio = this.sizes.px_ratio) {
            Object.assign(this.sizes, {width, height, px_ratio});   
   
           this.canvasSizes.width = width * this.zoom;
           this.canvasSizes.height = height * this.zoom;       
           this.sizes_hr = {
               width: Math.round(width * px_ratio),
               height: Math.round(height * px_ratio)
           };     
   
           this.contextsOnscreen.forEach(ctx => {
               ctx.canvas.width = this.sizes_hr.width;
               ctx.canvas.height = this.sizes_hr.height; 
               ctx.canvas.style.width = this.canvasSizes.width + "px";
               ctx.canvas.style.height = this.canvasSizes.height + "px";              
           });     
           this.$refs.canvas.style.width = this.canvasSizes.width + "px";
           this.$refs.canvas.style.height = this.canvasSizes.height + "px";
   
   
           this.brush.setSizes(this.sizes_hr);
           this.marker.setSizes(this.sizes_hr);
          
           this._setContainerSize();   
       },
        _updateCanvasesSize(newImageRect) {
            let oldImageRect = [0, 0, this.tempCtx.canvas.width, this.tempCtx.canvas.height];

            this.contextsOffscreen.forEach(s => {
                Ctx.resize(s, this.sizes_hr.width, this.sizes_hr.height);
            });
        
            this.layers.forEach(layer => {
                this.tempCtx.clearRect(0, 0, this.tempCtx.canvas.width, this.tempCtx.canvas.height);
                this.tempCtx.drawImage(layer.ctx.canvas, ...oldImageRect, ...newImageRect);
                layer.ctx.globalCompositeOperation = "copy";      
                Ctx.resize(layer.ctx, this.sizes_hr.width, this.sizes_hr.height);           
                layer.ctx.drawImage(this.tempCtx.canvas, 0, 0);    
            }); 
        },
        _getCurrentLayerBbox() {
            const {width, height} = this.currentLayer.ctx.canvas;
            const data = this.currentLayer.ctx.getImageData(0, 0, width, height).data;
            const amount = width * height;
            let bbox = [
                [Infinity, Infinity], [-Infinity, -Infinity]
            ];

            for(let i = 0; i < amount; i++) {
                if(data[i*4+3] != 0) {
                    let y = Math.floor(i / width);
                    let x = i % width;
                    if(x < bbox[0][0]) bbox[0][0] = x;
                    if(y < bbox[0][1]) bbox[0][1] = y;
                    if(x > bbox[1][0]) bbox[1][0] = x;
                    if(y > bbox[1][1]) bbox[1][1] = y;
                }
            }
            return bbox;
        },
        _getCurrentLayerImage() {
            return this.currentLayer.ctx.canvas;
        },
        _canvasToBlob() {
            let ctx = Ctx.create(this.sizes.width, this.sizes.height, "2d");
            ctx.drawImage(this.mainCtx.canvas,
                0, 0, this.sizes_hr.width, this.sizes_hr.height, 
                0, 0, this.sizes.width, this.sizes.height, );
            return new Promise(resolve => {
                ctx.canvas.toBlob(blob => {
                    resolve(blob);
                });
            });
        }
    }
}