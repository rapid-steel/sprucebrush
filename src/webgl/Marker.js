import ToolWebGL from "./ToolWebGL";
import {vec, normal, length, invert, equal, angle, rotateY, average} from "../functions/vector-functions";


const DEBUG = process.env.NODE_ENV !== 'production';
export default class Marker extends ToolWebGL {
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

        this._init();    
    }
    createVertShader(props) {
        return  Object.entries(props)
        .map(p => `#define ${p[0].toUpperCase()} ${p[1]}`)
        .join("\n") +   `
    uniform float lineWidth;
    uniform float width2;
    uniform float height2;
    uniform float textureRatio;
    uniform float gradientRatio;
    
    attribute vec2 coordinates;
    attribute vec2 miter;
    attribute float lineStart;
    attribute float lineLength;
    attribute float index;
    attribute float pressure;

    uniform float opacity;
    uniform float opacity_dynr;
    uniform float opacity_dynlen;
    uniform float lineWidth_dynr;
    uniform float lineWidth_dynlen;
    
    
    varying vec2 texPos;
    varying vec2 gradTexPos;
    varying float vOpacity;

    ${this.commonCodeBlocks.dynamics}
    
    void main(void) { 
        float linePos = lineStart; 
    
        if(index == 0.0) {
            texPos = vec2(1.0, 0.0);
        } else if(index == 5.0) {
            texPos = vec2(0.0, 1.0); 
            linePos += lineLength;
        } else if(index == 1.0 || index == 4.0) {
            texPos = vec2(0.0, 0.0);
        } else {        
            texPos = vec2(1.0, 1.0); 
            linePos += lineLength;
        }    
        gradTexPos = vec2(texPos);
    
        texPos.y *= lineLength * textureRatio;
        texPos.y += mod(lineStart, 1.0 / textureRatio) * textureRatio;
    
        gradTexPos.y *= lineLength * gradientRatio;
        gradTexPos.y += mod(lineStart, 1.0 / gradientRatio) * gradientRatio;


        #if LINEWIDTHDYNAMICS == 1
            float lineDynamics = dynamics_down(1.0, linePos, lineWidth_dynlen); 
            vec2 pos = coordinates + vec2(miter * lineWidth * lineDynamics / 2.0);
        #elif LINEWIDTHDYNAMICS == 2
            float lineDynamics = dynamics_periodic(1.0, lineWidth_dynr, linePos, lineWidth_dynlen); 
            vec2 pos = coordinates + vec2(miter * lineWidth * lineDynamics / 2.0);
        #elif LINEWIDTHDYNAMICS == 3
            float lineDynamics = dynamics_pressure(1.0, lineWidth_dynr, pressure); 
            vec2 pos = coordinates + vec2(miter * lineWidth * lineDynamics / 2.0);
        #else
            vec2 pos = coordinates + vec2(miter * lineWidth / 2.0);
        #endif


        
        #if OPACITYDYNAMICS == 1
            vOpacity = dynamics_down(opacity, linePos, opacity_dynlen); 
        #elif OPACITYDYNAMICS == 2
            vOpacity = dynamics_periodic(opacity, opacity_dynr, linePos, opacity_dynlen); 
        #elif OPACITYDYNAMICS == 3
            vOpacity = dynamics_pressure(opacity, opacity_dynr, pressure); 
        #else
            vOpacity = opacity; 
        #endif

        
    
        
        gl_Position = vec4(
            (pos.x - width2) / width2, 
            (height2 - pos.y) / height2, 
            0.0, 1.0);   
        
    }`;
    }
    createFragShader(props) {    

        return  Object.entries(props)
        .map(p => `#define ${p[0].toUpperCase()} ${p[1]}`)
        .join("\n") + `
        #if (defined GRADIENT || defined TEXTURE)
        # define COLORFUNC
        #endif
    
        precision highp float;
        uniform vec3 color;        
        uniform float lineWidth;
        uniform sampler2D texture;
        uniform sampler2D gradientTexture;
                
    
        uniform float width2;
        uniform float height2;
    
        varying vec2 texPos;
        varying vec2 gradTexPos;
        varying float vOpacity;
    
        void main(void) {
            gl_FragColor = vec4(color, 1.0);
    
            #ifdef TEXTURE
            gl_FragColor.a = texture2D(texture, texPos).a;
            #endif           
    
            #ifdef GRADIENT
            gl_FragColor.rgb = texture2D(gradientTexture, gradTexPos).rgb;                         
            #endif      

            gl_FragColor.a *= vOpacity;
        }
        ` 
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
        let line_vec = vec(line.p1, line.p2);
        let len = length(line_vec);
        let norm = normal(line_vec);

        line = Object.assign(line, {
            miter1: norm,
            miter2: norm,
            length: len,
            line_vec,
            start: 0          
        });


        if(this.lines[index-1]) {
            let line0 = this.lines[index-1];
            let line_vec0 = line0.line_vec
            let line_vec0_inv = invert(line_vec0);
            let norm0 = normal(line_vec0);
            for(let i = 0; i < index; i++) line.start += this.lines[i].length

            if(!equal(norm, norm0)) {
                let norm1 = normal( vec(norm0, norm) );
                let sign = rotateY(norm0, norm) < 0 ? -1 : 1;
                let a = angle( line_vec0_inv , line_vec) / 2;
                let miter = Math.min(1 / Math.sin(a), 3);
               
                norm1 = norm1.map(n => n * sign * miter);
                line.miter1 = norm1;
            }
            line0.miter2 = line.miter1;
           
        }

        return line;

    }
    _addPoint(point) {
        let avgLines = Math.min(this.params.angleSmoothing, this.lines.length);
        let p2 = point.coords;
        let p1 = this.points[this.points.length-1];


        let avgPoints = Math.min(this.lines.length, this.params.curveSmoothing+1);

        let delLines = Math.max(avgLines+1, avgPoints+2)

        if(p1) {

            for(let i = avgPoints; i > 0; --i) {
                let l = this.lines[this.lines.length-i];
                let l1 = this.lines[this.lines.length-i+1];
                
                if(l1) {
                    l1.p1 = (l.p2 = l.p1.map((c,j) => (c + l1.p2[j]) / 2));

                } else {
                    l.p2 = l.p1.map((c,j) => (c + p2[j]) / 2);    
                }
                    
                this.lines[this.lines.length-i] = this.calcLine(l, this.lines.length-i);            
            }


            p1 = p1.coords;   
            let line = { p1, p2 }; 
            line = this.calcLine(line, this.lines.length); 
            
            
            
            for(let j = 0; j < avgLines-1; j++) {
                let l = this.lines[this.lines.length-1-j];
                let l0 =  this.lines[this.lines.length-2-j];
                let v = average(l0.miter1, l.miter2);
                if(length(v))
                    l0.miter2 = (l.miter1 = v) 
            }   
            this.lines.push(line);


        }
        this.points.push(point);

       
        let dv = delLines * 6;

        
        this.vertices.splice(-dv*2, dv*2);
        this.miters.splice(-dv*2, dv*2);
        this.lineStart.splice(-dv, dv);
        this.lineLength.splice(-dv, dv);
        this.indexes.splice(-dv, dv);
        this.pressures.splice(-dv,dv);

        this.lines.slice(this.lines.length-(delLines+1)).forEach(l => {
            let ps = [
                {p: l.p1, n: invert(l.miter1), pressure: p1.pressure},
                {p: l.p1, n: l.miter1, pressure: p1.pressure},
                {p: l.p2, n: invert(l.miter2), pressure: p2.pressure},
                {p: l.p2, n: l.miter2, pressure: p2.pressure}
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

        });       

        if(!this.update) {
            this.update = true;
            this.animate();
        }
    }   
    dropLine() {
        this.lines = [];        
        super.dropLine();
    }
    _getProgramType() {
        return [ 
            this.params.texture ? "texture" : "notexture",
            this.params.gradient.enabled ? "gradient" : "color",
            ...Object.entries(this.dynamics).map(d => `${d[0]}dynamics:${d[1] ? d[1].type : 0}`)
        ].join("-");
    }
    setAttributes() {
        if(this.program) {
            for(let param in this.params) {
                if(param == "color") {
                    this.gl.uniform3fv(
                        this.gl.getUniformLocation(this.program, "color"), 
                        this._getGlColor(this.params.color));
                } else if(this.programParams[param]) {
                    let loc = this.gl.getUniformLocation(this.program, param);                
                    this.gl[`uniform${this.programParams[param]}`](loc, this.params[param]);                            
                }   
            }
            if(this.params.gradient.enabled) {
                this.gl.uniform1f(this.gl.getUniformLocation(this.program, "gradientRatio"), this.params.gradientRatio);
            }
            this.gl.uniform1i(
                this.gl.getUniformLocation(this.program, "texture"), 
                this.textures.BASE);

            this.gl.uniform1i(
                this.gl.getUniformLocation(this.program, "gradientTexture"), 
                this.textures.GRADIENT);

            this.gl.uniform1f(
                this.gl.getUniformLocation(this.program, "textureRatio"), 
                this.params.texture ? this.params.texture.ratio || 1 : 1);

            this._setDynamics();
        }
    }
}