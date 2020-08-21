import Selection from "./Selection";

export default class SelectionPath extends Selection {
    constructor(...args) {
        super(...args);
        this.type = "polygon";
    }
    _updateBbox() {
        this.bbox = [this.path[0].slice(), this.path[this.path.length-1].slice()];
        this.path.forEach(p => {
            if(p[0] < this.bbox[0][0]) this.bbox[0][0] = p[0];
            if(p[1] < this.bbox[0][1]) this.bbox[0][1] = p[1];
            if(p[0] > this.bbox[1][0]) this.bbox[1][0] = p[0];
            if(p[1] > this.bbox[1][1]) this.bbox[1][1] = p[1];
        });  
        this.calculateControls();
        this.drawSelection();
    }
    setPoint(p) {
        this.path[this.path.length-1] = p.slice();
        this._updateBbox();
      }
      addPoint(p) {
          this.path.push(p);
          this._updateBbox();
      }
      removePoint() {
          let point = this.path.pop();
          this._updateBbox();
      }

      drawClipPath(ctx) {
        ctx.beginPath();
        ctx.moveTo(...this.path[0]);
        this.path.slice(1).forEach(p => {
            ctx.lineTo(...p);
        });
        ctx.closePath();
      }
}