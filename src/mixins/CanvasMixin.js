import {Brush, Marker} from "../webgl";
import {fill} from "../functions/pixel-functions";
import {getRgba} from "../functions/color-functions";

export default {
    created() {
        this.canvasPattern = null;
        this.update = false;
        this.updateFunc =  () => {
            this.render();
        };
    },
    mounted() {
        this.tempCtx =  document.createElement("canvas").getContext("2d");
        this.tempCtx2 = (new OffscreenCanvas(800, 600)).getContext("2d");
    
        this.mainCtx = this.$refs.mainCanvas.getContext("bitmaprenderer");
        this.selCtx = this.$refs.selection.getContext("2d");  
        
        
        this.blender = (new OffscreenCanvas(800, 600)).getContext("2d"); 

        this.blender.imageSmoothingEnabled = false;
        this.blender.save();
        this.blender.translate(0.5, 0.5);
        this.offscreenContexts = [
            this.tempCtx, this.tempCtx2, this.blender
        ];


        this.brush = new Brush();
        this.marker = new Marker();
        
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
                this._addPoint(point, tool);  
                this.writeHistory();
                this.updateFunc = () => {
                    this._draw(point, tool, this.currentLayer.compositeMode);  
                    this.currentLayer.ctx.globalCompositeOperation = this.currentLayer.compositeMode;            
                    if(this.selection) {
                        this.selection.clip(this.currentLayer.ctx);
                    } 
                    tool.drawToCtx(this.currentLayer.ctx);
                    if(this.selection) 
                        this.currentLayer.ctx.restore();
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
                    this.currentLayer.ctx.globalCompositeOperation = "copy";
                    this.currentLayer.ctx.drawImage(this.tempCtx.canvas, 0, 0);
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
            this.tempCtx.drawImage(this.currentLayer.ctx.canvas, 0, 0);
            if(this.selection) {
                this.selection.clip(this.tempCtx);
            }             
            this.tempCtx.globalCompositeOperation = compositeOperation;
            tool.drawToCtx(this.tempCtx);            
            if(this.selection) 
                this.tempCtx.restore();
        },    
        render(temp) {
            const {width, height} = this.blender.canvas;
            this.blender.clearRect(0,0, width, height);
            
            this.layers.forEach(l => {
                if(l.visible) {
                    this.blender.globalCompositeOperation = l.blend;
                    this.blender.globalAlpha = l.opacity / 100;
                    if(l == this.currentLayer) {
                        if(temp)
                            this.blender.drawImage(this.tempCtx.canvas, 0, 0);
                        else           
                            this.blender.drawImage(l.ctx.canvas, 0, 0);
    
                        if(this.selection) 
                            this.blender.drawImage(this.selection.imgCtx.canvas, 0, 0);
                    } else this.blender.drawImage(l.ctx.canvas, 0, 0);     
                }            
            });    
            this.mainCtx.transferFromImageBitmap(
                this.blender.canvas.transferToImageBitmap()
            );
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
                    this.currentSettings.pattern.src !== this.canvasPattern.img.src ||
                    this.currentSettings.pattern.scale !== this.canvasPattern.scale) {
                    this.canvasPattern = {
                        scale: this.currentSettings.pattern.scale,
                        img: new Image()
                    };
                    this.canvasPattern.img.onload = () => {
                        let c = document.createElement("canvas");
                        c.width = this.currentSettings.pattern.scale * this.canvasPattern.img.width;
                        c.height = this.currentSettings.pattern.scale * this.canvasPattern.img.height;
                        let ctx = c.getContext("2d");
                        ctx.drawImage(this.canvasPattern.img, 
                            0, 0, this.canvasPattern.img.width, this.canvasPattern.img.height, 
                            0, 0, c.width, c.height );

                        this.canvasPattern.pattern = 
                        this.tempCtx.createPattern(c, "repeat");
                    };
                    this.canvasPattern.img.src = this.currentSettings.pattern.src;
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

            this.offscreenContexts.forEach(s => {
                s.canvas.width = this.sizes_hr.width;
                s.canvas.height = this.sizes_hr.height;
            });
            this.tempCtx.save();
            this.tempCtx.translate(this.sizes_hr.width / 2, this.sizes_hr.height / 2);
            this.tempCtx.rotate(angle);
            this.tempCtx.translate(- this.sizes_hr.width / 2, - this.sizes_hr.height / 2);

            this.layers.forEach(layer => {
                this.tempCtx.clearRect(...origin, this.tempCtx.canvas.width, this.tempCtx.canvas.height);
                this.tempCtx.drawImage(layer.ctx.canvas, ...origin);
                layer.ctx.globalCompositeOperation = "copy";
                layer.ctx.canvas.width = this.sizes_hr.width;
                layer.ctx.canvas.height = this.sizes_hr.height;        
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
            this.tempCtx.scale(...scale);
            this.layers.forEach(layer => {
                this.tempCtx.clearRect(...origin, this.tempCtx.canvas.width, this.tempCtx.canvas.height);
                this.tempCtx.drawImage(layer.ctx.canvas, ...origin);
                layer.ctx.globalCompositeOperation = "copy";      
                layer.ctx.drawImage(this.tempCtx.canvas, 0, 0);    
            });
        },
        fill(coords) {
            let accuracy = this.sizes.px_ratio;
            let sizes = [this.sizes_hr.width, this.sizes_hr.height].map(c => Math.round(c / accuracy));
            this.tempCtx.drawImage(this.currentLayer.ctx.canvas, 0, 0, ...sizes);
    
            let data = this.tempCtx.getImageData(0, 0, ...sizes).data;
            let positions = new Int8Array(sizes[0] * sizes[1] );
            let color = getRgba(this.currentColor);
            let color0 = Array.from(this.currentLayer.ctx.getImageData(...coords, 1, 1).data);         
    
    
            let data1 = fill([coords.map(c => Math.round(c / accuracy))], positions, data, color, color0, ...sizes, this.currentSettings.values.tolerance);
            let imgData = new ImageData(data1, sizes[0]);
            this.tempCtx.clearRect(0,0, ...sizes);
            this.tempCtx2.clearRect(0, 0,  this.sizes_hr.width, this.sizes_hr.height);
            this.tempCtx2.putImageData(imgData, 0, 0); 
            
    
            if(this.selection) {                  
                this._fillIfPattern(this.tempCtx2);
                this.tempCtx.clearRect(0,0, this.sizes_hr.width, this.sizes_hr.height);
                this.selection.clip(this.tempCtx);
                this.tempCtx.drawImage(this.tempCtx2.canvas, 0, 0, ...sizes, 0, 0, this.sizes_hr.width, this.sizes_hr.height);
                this.tempCtx.restore();
            } else {
                this.tempCtx.drawImage(this.tempCtx2.canvas, 0, 0, ...sizes, 0, 0, this.sizes_hr.width, this.sizes_hr.height);
            }
    
            this._fillIfPattern(this.tempCtx);       
    
            this.writeHistory();
            this.currentLayer.ctx.globalCompositeOperation = this.currentLayer.compositeMode;
            this.currentLayer.ctx.drawImage(this.tempCtx.canvas, 0, 0);
            this.tempCtx.clearRect(0,0, this.sizes_hr.width, this.sizes_hr.height);
            this.render();    
        },
        _createLayerCtx(paste, params = {}) {
            const ctx = (new OffscreenCanvas(this.sizes_hr.width, this.sizes_hr.height)).getContext("2d");      
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
            const data = Array.from(this.blender.getImageData(...coord, 1, 1).data);
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
   
           ['canvas', "mainCanvas", "selection"].forEach(s => {
               this.$refs[s].width = this.sizes_hr.width;
               this.$refs[s].height = this.sizes_hr.height;
               this.$refs[s].style.width = this.canvasSizes.width + "px";
               this.$refs[s].style.height = this.canvasSizes.height + "px";
           });     
   
   
           this.brush.setSizes(this.sizes_hr);
           this.marker.setSizes(this.sizes_hr);
          
           this._setContainerSize();       
           this._setSizeFactor();
       },
        _updateCanvasesSize(newImageRect) {
            let oldImageRect = [0, 0, this.tempCtx.canvas.width, this.tempCtx.canvas.height];

            this.offscreenContexts.forEach(s => {
                s.canvas.width = this.sizes_hr.width;
                s.canvas.height = this.sizes_hr.height;
            });
        
            this.layers.forEach(layer => {
                this.tempCtx.clearRect(0, 0, this.tempCtx.canvas.width, this.tempCtx.canvas.height);
                this.tempCtx.drawImage(layer.ctx.canvas, ...oldImageRect, ...newImageRect);
                layer.ctx.globalCompositeOperation = "copy";      
                layer.ctx.canvas.width = this.sizes_hr.width;
                layer.ctx.canvas.height = this.sizes_hr.height;            
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
        }
    }
}