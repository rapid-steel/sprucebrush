import ToolWebGL from "./ToolWebGL";

import {sub, add, equals, scale, angle, length, negate, clone, scaleAndAdd} from "gl-matrix/vec2";
import {normal, rotateY, mean, vec_angle} from "../functions/vector-functions";

const DEBUG = process.env.NODE_ENV !== 'production';
export default class Roller extends ToolWebGL {
    constructor() {
        super();
        this.points = [];
        this.lines = [];      

        this.buffers = {
            vertices: { attrib: "coordinates", size: 2, type: this.gl.FLOAT },        
            pressures: {attrib: "pressure", size: 1, type: this.gl.FLOAT},    
            miters: { attrib: "miter", size: 2, type: this.gl.FLOAT },
            lineStart: { attrib: "lineStart", size: 1, type: this.gl.FLOAT },
            lineLength: { attrib: "lineLength", size: 1, type: this.gl.FLOAT },
            indexes:  { attrib: "index",  size: 1, type: this.gl.FLOAT }
        };
        this.PRIMITIVE_TYPE = this.gl.TRIANGLES;
        this.PROGRAM_NAME = "roller";

        this.headAngle = 0;        
        this.lStart = 0;

        this._init();    
    }
    setProgram(programType) {
        this._createProgram(programType);          
        this.programParams = {
            lineWidth: "1f",
            textureRatio: "1f",
            width2: "1f",
            height2: "1f",
            opacity: "1f",
            color: "3fv"
        };

    }
    calcLine(line, index) {
        let vec = sub([0, 0], line.p2, line.p1);
        let norm = normal([0, 0], vec);
        let start = 0;
        if(this.lines.length)
            for(let i = 0; i < index; i++) start += this.lines[i].length;

        line = Object.assign(line, {
            vec,
            norm,
            miter1: clone(norm),
            miter2: clone(norm),
            start: start,     
            length: length(vec)           
        });


        if(this.lines[index-1]) {
            let line0 = this.lines[index-1];
            let vec0n = negate([0, 0], line0.vec);
            let norm0 = line0.norm;

            if(!equals(norm, norm0)) {
                let norm1 = normal([0, 0], sub([0, 0], norm, norm0));

                let sign = rotateY(norm0, norm) < 0 ? -1 : 1;
                let a = angle(vec0n , vec) / 2;
                let miter = Math.min(
                    1 / Math.sin(a), 
                    2                 // no sharp corners, please
                );              
                line.miter1 = scale(line.miter1, norm1, sign * miter);
                line.miter2 - line.miter1;
            }
            line0.miter2 = line.miter1;    
            if(index == 1) line0.miter1 = line0.miter2       
            line.p1press = line0.p2press;
        } 
        return line;

    }
    _addPoint(point) {

        
        let avgLines = Math.min(this.smoothing.angle, this.lines.length);
        let p2 = point;
        let p1 = this.points[this.points.length-1];


        let avgPoints = Math.min(this.lines.length, this.smoothing.curve+this.newLines);
        let delLines = Math.min(this.lines.length, Math.max(avgLines+1, avgPoints+2));
        

        this.newLines = 0;

        if(p1) {
            // average points

            for(let i = avgPoints; i > 0; --i) {
                let l = this.lines[this.lines.length-i];
                let l1 = this.lines[this.lines.length-i+1];
                if(l1) {
                    let v = mean([0, 0], l.vec, l1.vec);
                    let d = add([0.0], l.p1, v);
                    l.p2 = (l1.p1 = d);
                }                     
                this.lines[this.lines.length-i] = this.calcLine(l, this.lines.length-i);            
            }
               
            let line = { p1: p1.coords, p2: p2.coords, p1press: p1.pressure, p2press: p2.pressure  }; 
            line = this.calcLine(line, this.lines.length); 

            
            if(line.length > this.maxLength) {
                let p11 = line.p1;
                let p21;
                let scale = this.maxLength / line.length;
                for(let l = this.maxLength; l < line.length; l += this.maxLength) {
                    p21 = [
                        p11[0] + line.vec[0] * scale,
                        p11[1] + line.vec[1] * scale
                    ];
                
                    let line1 = this.calcLine({
                        p1: p11, p2: p21,
                        p2press: (line.p2press - line.p1press) * l / line.length + line.p1press
                    }, this.lines.length);

                    this.lines.push(line1);
                    p11 = line1.p2.slice();
                    this.newLines++;
                    avgLines++;
                }
                line.p1 = p11;
                line = this.calcLine(line, this.lines.length); 
            }
            
           
    
            //average mitters
            
            for(let j = 0; j < avgLines-1; j++) {
                let l = this.lines[this.lines.length-1-j];
                let l0 =  this.lines[this.lines.length-2-j];
                let v = mean([0, 0], l0.miter1, l.miter2);
                if(length(v))
                    l0.miter2 = (l.miter1 = v); 
            } 

            this.lines.push( line); 

            this.newLines++;

            this.headAngle = (this.headAngle * avgLines + vec_angle(sub([0, 0],line.p1, line.p2))) / (avgLines + 1);

        }
        this.points.push(point);
        let dv = delLines * 6;

        
        this.vertices.splice(-dv*2, dv*2);
        this.miters.splice(-dv*2, dv*2);
        this.lineStart.splice(-dv, dv);
        this.lineLength.splice(-dv, dv);
        this.indexes.splice(-dv, dv);
        this.pressures.splice(-dv,dv);

        for(let i = this.lines.length-(delLines+this.newLines); 
            i < this.lines.length; 
            i++
        ) {
            let l = this.lines[i];
            let ps = [
                {p: l.p1, n: negate([0, 0], l.miter1), pressure: l.p1press},
                {p: l.p1, n: l.miter1, pressure: l.p1press},
                {p: l.p2, n: negate([0,0], l.miter2), pressure: l.p2press},
                {p: l.p2, n: l.miter2, pressure: l.p2press}
            ];


            this.vertices.push(
                ...ps[0].p,
                ...ps[1].p,
                ...ps[2].p,
                ...ps[2].p,
                ...ps[1].p,
                ...ps[3].p,
            );

            this.miters.push(
                ...ps[0].n,
                ...ps[1].n,
                ...ps[2].n,
                ...ps[2].n,
                ...ps[1].n,
                ...ps[3].n,
            );
            let lineStart = l.start / this.params.lineWidth;
            let lineLength = l.length / this.params.lineWidth;

            this.lineStart.push(
                lineStart, lineStart, lineStart,
                lineStart, lineStart, lineStart
            );

            this.lineLength.push(
                lineLength, lineLength, lineLength,
                lineLength, lineLength, lineLength
            );

            this.pressures.push(
                p1.pressure,
                p1.pressure,
                p2.pressure,
                p2.pressure,
                p1.pressure,
                p2.pressure
            );

            this.indexes.push(0, 1, 2, 3, 4, 5);  

        }  
    }   
    cursorAngle() {        
        return this.headAngle;
    }
    dropLine() {
        if(this.lines.length)
            this.lStart = this.lines[this.lines.length-1].start + this.lines[this.lines.length-1].length;
        this.lines = [];      
        this.hAngle = 0;  
        this.newLines = 0;
        super.dropLine();
    }
    _getProgramType() {
        return [ 
            this.texture ? "texture" : "notexture",
            this.gradient && this.gradient.enabled ? "gradient" : "color",
            ...Object.entries(this.dynamics).map(d => `${d[0]}dynamics:${d[1] ? d[1].type : 0}`)
        ].join("-");
    }
    setParams(params) {
        super.setParams(params);   
        this.maxLength = Infinity;
        for(let prop in this.dynamics) {
            if(this.dynamics[prop].type != this.DYNTYPE.DISABLED) {
                this.maxLength = Math.min(this.maxLength, this.dynamics[prop].length * this.params.lineWidth / 4);
            }
        }
    }
}