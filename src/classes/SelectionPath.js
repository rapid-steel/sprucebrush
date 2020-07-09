import Selection from "./Selection";

export default class SelectionPath extends Selection {
    constructor(...args) {
        super(...args);
    }
    setPoint(p) {
        this.path[this.path.length-1] = p.slice();
        this.bbox = [this.path[0].slice(), p.slice()];
        this.path.forEach(p => {
            if(p[0] < this.bbox[0][0]) this.bbox[0][0] = p[0];
        if(p[1] < this.bbox[0][1]) this.bbox[0][1] = p[1];
        if(p[0] > this.bbox[1][0]) this.bbox[1][0] = p[0];
        if(p[1] > this.bbox[1][1]) this.bbox[1][1] = p[1];
        })
  
        this.calculateControls();
        this.drawSelection();
      }
      addPoint(p) {
          this.path.push(p);
          this.setPoint(p);
      }

      drawClipPath(ctx) {
        ctx.beginPath();
        ctx.moveTo(...this.path[0]);
        this.path.slice(1).forEach(p => {
            ctx.lineTo(...p);
        })
        ctx.closePath();
      }
}