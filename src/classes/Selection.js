import Ctx from "../functions/ctx";

export default class Selection {
    constructor(p1, selCtx, ratio, zoom, state = false) {
        this.selCtx = selCtx;
        this.imgCtx = Ctx.create(selCtx.canvas.width, selCtx.canvas.height, "2d");
        this.sourceCopy = Ctx.create(selCtx.canvas.width, selCtx.canvas.height, "2d");
        this.contexts = [this.imgCtx, this.selCtx, this.sourceCopy];

        this.ready = false;
        this.started = false;

        this.path = [p1.slice(), p1.slice()];
        this.bbox = [p1.slice(), p1.slice()];

        this.origin = [0, 0];
        this.scale = [1, 1];
        this.angle = 0;
        this.movePoint = [0, 0];

        if(state) this.restoreState(state);

        this.zoom = zoom;
        this.ratio = ratio;
        this._zoomRatioChanged();

        this.calculateControls();
        this.drawSelection();
        this.type = "rect";
    }
    getState() {
        this.drawImage();
        return {
            type: this.type,
            bbox: this.bbox,
            path: this.path,
            origin: this.origin,
            angle: this.angle,
            scale: this.scale,
            data: this.sourceCopy.getImageData(0, 0, this.imgCtx.canvas.width, this.imgCtx.canvas.height)
        };
    }
    restoreState(state) {
        this.path = state.path;
        this.bbox = state.bbox;
        this.origin = state.origin;
        this.angle = state.angle;
        this.scale = state.scale;
        this.sourceCopy.putImageData(state.data, 0, 0);
        this.calculateControls();
        this.ready = true;
        this.started = true;
        
        this.drawImage();
        this.drawSelection();
    }
    _zoomRatioChanged() {
        this.imgCtx.lineWidth = this.ratio;
        this.selCtx.lineWidth = this.ratio / this.zoom;
        this.rectW = 10 / this.ratio * this.zoom;
    }
    setZoom(zoom) {        
        this.zoom = zoom;
        this._zoomRatioChanged();
        this.drawSelection();
    }
    setRatio(ratio) {
        this.ratio = ratio;
        this._zoomRatioChanged();
        this.drawSelection();
    }
    getBbox() {
        return this.bbox.map(b => b.map(c => c / this.ratio));
    }
    setSize({width, height}) {
        this.contexts.forEach(ctx => {
            Ctx.resize(ctx, width, height);
        });
    }
    setPoint(p2) {
        this.path[1] = p2.slice();
        this.bbox = [
            this.path[0].map((d,i) => Math.min(d, this.path[1][i])),
            this.path[0].map((d,i) => Math.max(d, this.path[1][i]))
        ];

        this.calculateControls();
        this.drawSelection();
    }

    drawClipPath(ctx) {
        ctx.beginPath();
        ctx.rect(
            this.bbox[0][0], 
            this.bbox[0][1], 
            this.bbox[1][0] - this.bbox[0][0], 
            this.bbox[1][1] - this.bbox[0][1]
        );
        ctx.closePath();
    }
    clip(ctx) {
        ctx.save();
        this.rotate(ctx);
        this.drawClipPath(ctx);
        ctx.clip();
        this.rotate(ctx, -1);
    }
    fill(ctx, andStroke = false) {
        this.rotate(ctx, 1);
        this.drawClipPath(ctx);      
        if(andStroke) ctx.stroke();
        ctx.fill();
        this.rotate(ctx, -1);
    }
    clearSelectionArea(ctx) {
        ctx.save();  
        ctx.imageSmoothingEnabled = false;
        ctx.globalCompositeOperation = "destination-out";
        this.fill(ctx, true);
        ctx.globalCompositeOperation = "source-over";
        ctx.restore();
    }
    addSource(source) {
        this.sourceCopy.save();
        this.sourceCopy.clearRect(0,0, this.sourceCopy.canvas.width, this.sourceCopy.canvas.height)
        
        this.sourceCopy.translate(...this.origin.map(o => -o));     

        this.sourceCopy.translate(...this.bbox[0]);   
        this.sourceCopy.scale(...this.scale.map(s => 1 / s)); 
        this.sourceCopy.translate(...this.bbox[0].map(v => -v));
            
        this.rotate(this.sourceCopy, -1);
        this.sourceCopy.drawImage(source.canvas, 0, 0, source.canvas.width, source.canvas.height);    

        this.sourceCopy.restore();

    }
    setSource(source) {
        this.origin = [0, 0];
        this.scaleOrigin = this.bbox[0];
        this.imgCtx.save();
        this.imgCtx.clearRect(0, 0, this.imgCtx.canvas.width, this.imgCtx.canvas.height);
        this.fill(this.imgCtx);     
        this.imgCtx.globalCompositeOperation = "source-in";
        this.imgCtx.drawImage(source.canvas, 0, 0, source.canvas.width, source.canvas.height);   
        this.imgCtx.globalCompositeOperation = "source-over"; 
        this.imgCtx.restore();
        
        this.addSource(this.imgCtx);    

        if(source !== this.sourceCopy) {
            this.clearSelectionArea(source);            
        }        
        

    }
    startTransform(source) {
        this.setSource(source);  
        this.ready = true;    
        this.started = true;
        this.drawSelection();
    }
    detectAction(p) {
        this.action = this.getAction(p); 
    }
    getAction([x,y]) {
        let x1 = (x - this.center[0]);
        let y1 = (y - this.center[1]);
        let x0 = this.center[0] + x1 * Math.cos(-this.angle) - y1 * Math.sin(-this.angle);
        let y0 = this.center[1] + x1 * Math.sin(-this.angle) + y1 * Math.cos(-this.angle);
        let action = null;
        this.controls.forEach(([i, j, x, y]) => {
            if(Math.abs(x0 - x - i * this.rectW) <= this.rectW / 2 &&
            Math.abs(y0 - y - j * this.rectW) <= this.rectW / 2
            ) {
            action = {resize: 1, dir: [i, j]};     
            return;
            } 
        });
        if(!action) {
            action = this.bbox[0][0] < x0 && x0 < this.bbox[1][0] &&
                    this.bbox[0][1] < y0 && y0 < this.bbox[1][1] ?
            {move: 1}
            : {rotate: 1}
        }
        return action;
    }
    applyTransform(coords, recAction = false, restricted = false) {
        if(recAction) {
            this.movePoint = coords;
            this._prevOrigin = this.origin.slice();
            this._firstPoint = coords.slice();
            this.sideRatio = (this.bbox[1][0] - this.bbox[0][0]) / (this.bbox[1][1] - this.bbox[0][1]);
            this.detectAction(coords);
        }  
        
        let [dx, dy] = coords.map((c,i) => c - this.movePoint[i]);
        if(this.action.move) {
            if(restricted) {
            let [dx1, dy1] = coords.map((c,i) => c - this._firstPoint[i]);
            if(dx1 < dy1) dx1 = 0;
            else dy1 = 0;          
            dx = dx1 + this._prevOrigin[0] - this.origin[0];
            dy = dy1 + this._prevOrigin[1] - this.origin[1];
            } 
            this.origin[0] += dx;
            this.origin[1] += dy;
            this.bbox = this.bbox.map(([x, y]) => [x+dx, y+dy]);
            this.path = this.path.map(([x, y]) => [x+dx, y+dy]);
            
            
            
            this.scaleOrigin = this.bbox[0];
            this.calculateControls();      
        }

        if(this.action.resize) {
            if(restricted && this.action.dir[0] != 0 && this.action.dir[1] != 0) {
                let k = this.sideRatio;
                if(dx / dy > k) dx = dy * k;
                else dy = dx / k;        
            }

            let d = Math.sqrt(dx * dx + dy * dy);
            let a = Math.atan(dy / dx) + (dx < 0 ? Math.PI : 0);
            if(isNaN(a)) a = dy < 0 ? Math.PI / 2 : Math.PI * 1.5;
            a -= this.angle;  
            let bbox = this.bbox.map( b => b.slice());

            const sin = Math.sin(this.angle);
            const cos = Math.cos(this.angle);
            let dx1 = 0;
            let dy1 = 0;
            let d1 = this.action.dir[0] ? dx * cos + dy * sin : 0;
            let d2 = this.action.dir[1] ? dy * cos - dx * sin : 0;


            if(this.action.dir[0] == -1) {
                bbox[0][0] += d1;          
                dx1 +=  d1 * (cos - 1) / 2
                dy1 += d1 * sin / 2;     
                if(this.scale[0] > 0) this.origin[0] += d1;
            }
            else if(this.action.dir[0] == 1) {
                bbox[1][0] += d1;
                dx1 += d1 * (cos - 1) / 2
                dy1 += d1 * sin / 2;
                if(this.scale[0] < 0) this.origin[0] += d1;          
            }
            if(this.action.dir[1] == -1) {
                bbox[0][1] += d2;
                dy1 += d2 * (cos - 1 ) / 2
                dx1 += - d2 * sin / 2;
                if(this.scale[1] > 0) this.origin[1] += d2;
            }
            else if(this.action.dir[1] == 1) {
                bbox[1][1] += d2;
                dy1 += d2 * (cos - 1 ) / 2
                dx1 += - d2 * sin / 2;
                if(this.scale[1] < 0) this.origin[1] += d2;
            } 

            bbox = bbox.map(b => [
                b[0] + dx1,
                b[1] + dy1
            ]);

            
        

            if(bbox[1][0] == bbox[0][0]) bbox[1][0] += .001;
            if(bbox[1][1] == bbox[0][1]) bbox[1][1] += .001;
            let scale = [
                (bbox[1][0] - bbox[0][0]) / (this.bbox[1][0] - this.bbox[0][0]),
                (bbox[1][1] - bbox[0][1]) / (this.bbox[1][1] - this.bbox[0][1])  
            ];

            if(scale[0] < 0) {
                this.action.dir[0] = -this.action.dir[0];
                let t = bbox[1][0];
                bbox[1][0] = bbox[0][0];
                bbox[0][0] = t;
            }
            if(scale[1] < 0) {
                this.action.dir[1] = -this.action.dir[1];
                let t = bbox[1][1];
                bbox[1][1] = bbox[0][1];
                bbox[0][1] = t;
            }

            let origin = [
                this.action.dir[0] == -1 ? bbox[1][0] : bbox[0][0],
                this.action.dir[1] == -1 ? bbox[1][1] : bbox[0][1]
            ];


            this.path = this.path.map(b => [
                (b[0] + dx1 - origin[0]) * scale[0] + origin[0],
                (b[1] + dy1 - origin[1]) * scale[1] + origin[1],
            ]);

            this.origin = [
                this.origin[0] + dx1,
                this.origin[1] + dy1,
            ];
            
            
            this.bbox = bbox;
            this.scale = this.scale.map((s,i) => s * scale[i]);
            let dt = scale.map((s,i) => {
                return Math.abs(this.bbox[1][i] - this.bbox[0][i]) * (s - 1)
            });

            this.calculateControls();


        }    

        if(this.action.rotate) {        
            let c1;
            if(restricted) {
                c1 = this._firstPoint.map((c,i) => c - this.center[i]);
            } else {
                c1 = this.movePoint.map((c,i) => c - this.center[i]);
            }
            let c2 = coords.map((c,i) => c - this.center[i]);
            let a1 = Math.atan(c1[1] / c1[0]);
            if(c1[0] < 0) a1 += Math.PI;
            let a2 = Math.atan(c2[1] / c2[0]);
            if(c2[0] < 0) a2 += Math.PI;
            let da = (a2 - a1);
            
            if(restricted) {
                let angle = Math.round((this.angle + da) / Math.PI * 4) * Math.PI / 4;
                if(this.angle !== angle) {
                    this._firstPoint = this.movePoint.slice();
                    this.angle = angle;
                }
            } else {
                this.angle += da;
            }

            this.scaleOrigin = this.bbox[0];

            this.calculateControls(); 

        }    
        
        this.drawImage();
        this.drawSelection();

        this.movePoint = coords;
    }
    getCursor(point) {
        return this.cursor = this.getAction(point);
    }
    cursorAngle() {    
        if(this.cursor && this.cursor.resize) {
            let angle = this.angle;
            let [x, y] = this.cursor.dir;

            if(x && (y != -x)) angle += Math.PI / 2;
            if(x&&y) angle += Math.PI / 4;

            return angle;
        }
        return 0;
    }
    calculateControls() {

        this.center = this.bbox[0].map((c,i) => (this.bbox[1][i] + c) / 2 );

        let w = this.bbox[1][0] - this.bbox[0][0];
        let h = this.bbox[1][1] - this.bbox[0][1];
        let sin_abs = Math.abs(Math.sin(this.angle));
        let cos_abs = Math.abs(Math.cos(this.angle));
        let wd = w * cos_abs + sin_abs * h;
        let hd = h * cos_abs + sin_abs * w;

        this.rect = [this.center[0] - wd / 2, this.center[1] - hd / 2,  wd, hd];

        this.controls = [
            [-1, -1, ...this.bbox[0] ],
            [-1,  0, this.bbox[0][0], this.center[1] ],
            [-1,  1, this.bbox[0][0], this.bbox[1][1] ],
            [ 0,  1, this.center[0], this.bbox[1][1] ],
            [ 1,  1, ...this.bbox[1] ],
            [ 1,  0, this.bbox[1][0], this.center[1] ],
            [ 1, -1, this.bbox[1][0], this.bbox[0][1] ],
            [ 0, -1, this.center[0], this.bbox[0][1] ],     
        ];
    
    }    
    drawImage() {
        this.imgCtx.save();      
        this.imgCtx.clearRect(0, 0, this.imgCtx.canvas.width, this.imgCtx.canvas.height);

        
        this.rotate(this.imgCtx);

        let scaleOrigin = this.scale.map((s, i) => s > 0 ? this.bbox[0][i] : this.bbox[1][i])

        this.imgCtx.translate(...scaleOrigin);   
        this.imgCtx.scale(...this.scale); 
        this.imgCtx.translate(...scaleOrigin.map(v => -v));
        let origin = this.origin
        this.imgCtx.translate(...origin);     
        this.imgCtx.drawImage(this.sourceCopy.canvas, 0, 0, this.imgCtx.canvas.width, this.imgCtx.canvas.height);   
        this.imgCtx.restore();      
    }
    rotate(ctx, dir = 1) {
        ctx.translate(...this.center);
        ctx.rotate(this.angle * dir);
        ctx.translate(...this.center.map(c => -c));
    }
    drawSelection() {
        this.selCtx.save();
        this.selCtx.clearRect(0, 0, this.selCtx.canvas.width, this.selCtx.canvas.height);

        if(this.angle % Math.PI / 2 !== 0) {
            this.selCtx.setLineDash([2, 2]);
            this.selCtx.strokeStyle = "lightgrey";   
            this.selCtx.strokeRect(...this.rect);
        }

        this.rotate(this.selCtx);
        
        this.selCtx.setLineDash([3, 3]);
        this.selCtx.strokeStyle = "blue";    
        this.selCtx.strokeRect(
            this.bbox[0][0], 
            this.bbox[0][1], 
            this.bbox[1][0] - this.bbox[0][0], 
            this.bbox[1][1] - this.bbox[0][1]
        );

        this.drawClipPath(this.selCtx);
        this.selCtx.stroke();

        if(this.ready) {
            this.selCtx.setLineDash([]);
            this.selCtx.strokeStyle = "black";

            this.controls.forEach(([i,j,x,y]) => {
            this.selCtx.strokeRect( x + (i - .5) * this.rectW, y + (j - .5) * this.rectW, this.rectW, this.rectW );
            });

            this.selCtx.beginPath();
            this.selCtx.moveTo(this.center[0] - this.rectW / 2, this.center[1]);
            this.selCtx.lineTo(this.center[0] + this.rectW / 2, this.center[1]);
            this.selCtx.moveTo(this.center[0], this.center[1] - this.rectW / 2);
            this.selCtx.lineTo(this.center[0], this.center[1] + this.rectW / 2);
            this.selCtx.stroke();        
        }

        this.selCtx.restore();

    
    }
    clear() {
        this.origin = [0, 0];
        this.imgCtx.restore();
        this.imgCtx.clearRect(0, 0, this.imgCtx.canvas.width, this.imgCtx.canvas.height);      
    }
    drop() {
        this.selCtx.clearRect(0, 0, this.selCtx.canvas.width, this.selCtx.canvas.height);
        this.started = false;
        this.ready = false;
    
    }
}

