export default class Selection {
    constructor(p1, imgCtx, selCtx) {
      this.imgCtx = imgCtx;
      this.selCtx = selCtx;
      let sCopy = document.createElement("canvas");
      sCopy.width = this.imgCtx.canvas.width;
      sCopy.height = this.imgCtx.canvas.height;
      sCopy.style.width = this.imgCtx.canvas.width + "px";
      sCopy.style.height = this.imgCtx.canvas.height + "px";
      this.sourceCopy = sCopy.getContext("2d");

      this.ready = false;
      this.started = false;

      this.path = [p1.slice(), p1.slice()];
      this.bbox = [p1.slice(), p1.slice()];

      this.rectW = 10;
      this.origin = [0, 0];
      this.scale = [1, 1];
      this.angle = 0;

      this.movePoint = [0, 0];

      this.clipPath = document.getElementById("sClip");
      this.calculateControls();
      this.drawSelection();
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
    setClipPath() {
      this.clipPath.setAttribute(
        "d", `
        M ${this.bbox[0].join(",")}
        L ${this.bbox[1][0]},${this.bbox[0][1]}
        L ${this.bbox[1].join(",")}
        L ${this.bbox[0][0]},${this.bbox[1][1]}
        Z
      `);
      console.log(this.clipPath)
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
    addSource(source) {
      this.sourceCopy.save();
      
      this.sourceCopy.translate(...this.origin.map(o => -o));     

      this.sourceCopy.translate(...this.bbox[0]);   
      this.sourceCopy.scale(...this.scale.map(s => 1 / s)); 
      this.sourceCopy.translate(...this.bbox[0].map(v => -v));
      
    
      this.rotate(this.sourceCopy, -1);
      this.sourceCopy.drawImage(source.canvas, 0, 0, source.canvas.width, source.canvas.height);    

      this.sourceCopy.restore();

      this.drawImage();

    }
    startTransform(source) {
      this.ready = true;
      this.origin = [0, 0];
      this.scaleOrigin = this.bbox[0];
      this.imgCtx.save();
      this.imgCtx.clearRect(0, 0, this.imgCtx.canvas.width, this.imgCtx.canvas.height);
      this.rotate(this.sourceCopy, -1);
      this.drawClipPath(this.imgCtx);
      this.imgCtx.clip();
      this.imgCtx.drawImage(source.canvas, 0, 0, source.canvas.width, source.canvas.height);    
      this.sourceCopy.clearRect(0, 0, this.sourceCopy.canvas.width, this.sourceCopy.canvas.height);
      this.sourceCopy.drawImage(this.imgCtx.canvas, 0, 0, source.canvas.width, source.canvas.height);
      this.imgCtx.restore();
  
      source.globalCompositeOperation = "destination-out";
      this.drawClipPath(source);
      source.stroke();
      source.fill();
      source.globalCompositeOperation = "source-over";
      this.started = true;

      this.drawSelection();
    }
    detectAction(p) {
      this.action = this.getAction(p); 
    }
    getAction(p) {
      let x1 = (p.x - this.center[0]);
      let y1 = (p.y - this.center[1]);
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
    applyTransform(p, recAction = false) {
      if(recAction) {
        this.movePoint = [p.x, p.y];
        this.detectAction(p);
      }
  

      
      let [dx, dy] = [p.x, p.y].map((c,i) => c - this.movePoint[i]);
      if(this.action.move) {
        this.origin[0] += dx;
        this.origin[1] += dy;
        this.bbox = this.bbox.map(([x, y]) => [x+dx, y+dy]);
        this.path = this.path.map(([x, y]) => [x+dx, y+dy]);
        this.scaleOrigin = this.bbox[0];
        this.calculateControls();      
      }
  
      if(this.action.resize) {
        let d = Math.sqrt(dx * dx + dy * dy);
        let a = Math.atan(dy / dx) + (dx < 0 ? Math.PI : 0);
        if(isNaN(a)) a = dy < 0 ? Math.PI / 2 : Math.PI * 1.5;
        a -= this.angle;  
        let bbox = this.bbox.map( b => b.slice());

        const sin = Math.sin(this.angle);
        const cos = Math.cos(this.angle);
        let dx1 = 0;
        let dy1 = 0;

  
        if(this.action.dir[0] == -1) {
          let d1 = dx * cos + dy * sin;
          bbox[0][0] += d1;
          this.origin[0] += d1;
          dx1 +=  d1 * (cos - 1) / 2
          dy1 += d1 * sin / 2;          
        }
        else if(this.action.dir[0] == 1) {
          let d1 = dx * cos + dy * sin;
          bbox[1][0] += d1;
          dx1 += d1 * (cos - 1) / 2
          dy1 += d1 * sin / 2;
        }
        if(this.action.dir[1] == -1) {
          let d1 = dy * cos - dx * sin;
          bbox[0][1] += d1;
          this.origin[1] += d1;
          dy1 += d1 * (cos - 1 ) / 2
          dx1 += - d1 * sin / 2;
        }
        else if(this.action.dir[1] == 1) {
          let d1 = dy * cos - dx * sin;
          bbox[1][1] += d1;
          dy1 += d1 * (cos - 1 ) / 2
          dx1 += - d1 * sin / 2;
          
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
        if(scale[0] < 0) this.action.dir[0] = -this.action.dir[0]
        if(scale[1] < 0) this.action.dir[1] = -this.action.dir[1]

        let origin = [
          this.action.dir[0] == -1 ? bbox[1][0] : bbox[0][0],
          this.action.dir[1] == -1 ? bbox[1][1] : bbox[0][1]
        ]



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
        
        let c1 = this.movePoint.map((c,i) => c - this.center[i]);
        let c2 = [p.x, p.y].map((c,i) => c - this.center[i]);
        let a1 = Math.atan(c1[1] / c1[0]);
        if(c1[0] < 0) a1 += Math.PI
        let a2 = Math.atan(c2[1] / c2[0]);
        if(c2[0] < 0) a2 += Math.PI
        this.angle += (a2 - a1);

        this.scaleOrigin = this.bbox[0];

        this.calculateControls(); 
  
      }
  
      
        
      this.drawImage();
      this.drawSelection();
  
      this.movePoint = [p.x, p.y];
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
    getCursor(point) {
      return this.getAction(point);
    }
    
  
  
    drawImage() {
      this.imgCtx.save();      
      this.imgCtx.clearRect(0, 0, this.imgCtx.canvas.width, this.imgCtx.canvas.height);
      
      this.rotate(this.imgCtx);

      this.imgCtx.translate(...this.bbox[0]);   
      this.imgCtx.scale(...this.scale); 
      this.imgCtx.translate(...this.bbox[0].map(v => -v));
      
      this.imgCtx.translate(...this.origin);      
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

      this.setClipPath();
      
    }
    clear() {
      this.origin = [0, 0];
      this.imgCtx.clearRect(0, 0, this.imgCtx.canvas.width, this.imgCtx.canvas.height);
      this.imgCtx.restore();
    }
    drop() {
      this.clear();
      this.selCtx.clearRect(0, 0, this.selCtx.canvas.width, this.selCtx.canvas.height);
      this.started = false;
      this.ready = false;
      
    }
  }
  
  