import ToolWebGL from "./ToolWebGL";
import {vec, normal, length, invert, equal, angle, rotateY, average} from "../functions/vector-functions";

const DEBUG = process.env.NODE_ENV !== 'production';


const vertexShader =   `
uniform float lineWidth;
uniform float width2;
uniform float height2;
uniform float textureRatio;

attribute vec2 coordinates;
attribute vec2 miter;
attribute float lineStart;
attribute float lineLength;
attribute float index;


varying vec2 texPos;

void main(void) { 
    vec2 pos = coordinates + vec2(miter * lineWidth / 2.0);

    if(index == 0.0) {
        texPos = vec2(1.0, 0.0);
    } else if(index == 5.0) {
        texPos = vec2(0.0, 1.0); 
    } else if(index == 1.0 || index == 4.0) {
        texPos = vec2(0.0, 0.0);
    } else {        
        texPos = vec2(1.0, 1.0); 
    }

    

    texPos.y *= lineLength * textureRatio;
    texPos.y += mod(lineStart, 1.0 / textureRatio) * textureRatio;

    
    gl_Position = vec4(
        (pos.x - width2) / width2, 
        (height2 - pos.y) / height2, 
        0.0, 1.0);

    

    
}`;


function createFragShader(programType) {
    
    let code = programType.split("-").map(param => `#define ${param.toUpperCase()} \n`).join("");
    code += `
         precision highp float;
         uniform vec3 color;
         uniform float opacity;
         uniform float lineWidth;
         uniform sampler2D texture;
         uniform sampler2D gradient_texture;

        uniform float width2;
        uniform float height2;

         varying vec2 texPos;

         float maxc(vec4 color) {
            float m = color.r > color.g ? color.r : color.g;
            m = color.b > m ? color.b : m;
            return m * color.a;
         }

         float minc(vec4 color) {
            float m = color.r < color.g ? color.r : color.g;
            m = color.b < m ? color.b : m;
            return m * color.a;
         }

            void main(void) {
                gl_FragColor = vec4(color, 1.0);

                #ifdef TEXTURE
                gl_FragColor = texture2D(texture, texPos);                
                #endif

                #ifndef WIDTHGRAD
                    #ifdef TEXCOLOR
                    gl_FragColor.a = gl_FragColor.a - (maxc(gl_FragColor) + minc(gl_FragColor)) * 0.5;
                    gl_FragColor.rgb = color;
                    #endif
                #endif

                #ifdef WIDTHGRAD
                gl_FragColor.a = gl_FragColor.a - (maxc(gl_FragColor) + minc(gl_FragColor)) * 0.5;
                gl_FragColor.rgb = texture2D(gradient_texture, texPos).rgb;                
                #endif               
                
                gl_FragColor.a *= opacity;
                
            }
    ` + programType.split("-").map(param => `#undef ${param.toUpperCase()} \n`).join("");
   
    if(DEBUG) console.log(code);
    return code;
}



export default class Marker extends ToolWebGL {
    constructor() {
        super();
        this.points = [];
        this.lines = [];      

        this.canvas = new OffscreenCanvas(100, 100);
        this.gl = this.canvas.getContext("webgl", {
           premultipliedAlpha: true,
            depth: false
        });        

        this.buffers = {
            vertices: { attrib: "coordinates", size: 2, type: this.gl.FLOAT },            
            miters: { attrib: "miter", size: 2, type: this.gl.FLOAT },
            lineStart: { attrib: "lineStart", size: 1, type: this.gl.FLOAT },
            lineLength: { attrib: "lineLength", size: 1, type: this.gl.FLOAT },
            indexes:  { attrib: "index",  size: 1, type: this.gl.FLOAT }
        };

        this.params = {
            lineWidth: 1,
            curveSmoothing: 10,
            angleSmoothing: 10
        };
        this.PRIMITIVE_TYPE = this.gl.TRIANGLES;
        this.vertexShader = vertexShader;
        this.createFragShader = createFragShader;

        this._init();
      //  this.gl.enable(this.gl.CULL_FACE);
      //  this.gl.cullFace(this.gl.FRONT);

       
    }
    createGradientTexture(gradient) {
        const size = 1024;
        const ctx = new OffscreenCanvas(size, size).getContext("2d");

        const canvasGradient = ctx.createLinearGradient(0, 0, size, 0);
        gradient.forEach((c, i) => {
            canvasGradient.addColorStop(i / (gradient.length - 1), c);
        })

        ctx.fillStyle = canvasGradient;
        ctx.fillRect(0, 0, size, size);

        const img = new Image();
        img.crossOrigin = "anonymous";

        img.onload = () => {
            const glTexture = this.gl.createTexture();
            this.gl.activeTexture(this.gl.TEXTURE1);  
            this.gl.bindTexture(this.gl.TEXTURE_2D, glTexture);

            this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, img);
            this.gl.generateMipmap(this.gl.TEXTURE_2D);            
        }
        ctx.canvas.convertToBlob({
            type: "image/png"
        })
        .then(blob => img.src = URL.createObjectURL(blob));  
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


        //this.setAttributes();

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
                let mitter = 1 / Math.sin(a);
               
                norm1 = norm1.map(n => n * sign * mitter);
                line.miter1 = norm1;
            }
            line0.miter2 = line.miter1;
           
        }

        return line;

    }
    addPoint(point) {
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

        this.lines.slice(this.lines.length-(delLines+1)).forEach(l => {
            let ps = [
                {p: l.p1, n: invert(l.miter1)},
                {p: l.p1, n: l.miter1},
                {p: l.p2, n: invert(l.miter2)},
                {p: l.p2, n: l.miter2}
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
            let lineStart = l.start / this.paramCache.lineWidth;
            let lineLength = l.length / this.paramCache.lineWidth;

            this.lineStart.push(
                lineStart, lineStart, lineStart,
                lineStart, lineStart, lineStart
            );

            this.lineLength.push(
                lineLength, lineLength, lineLength,
                lineLength, lineLength, lineLength
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
    setParams(params) {

        console.log(params)
        let cacheTexture = this.paramCache.texture;
        for(let param in params) {
            this.paramCache[param] = params[param];
            if(this.params[param] !== undefined) {
                this.params[param] = params[param];
            }         
        }
        this.pointStep = this.params.radius * this.params.spacing;
        const programType = [ 
            this.paramCache.texture ? "texture" + (this.paramCache.textureColor ? "-texcolor" : "") : "notexture",
            this.paramCache.radialGradient ? "widthgrad" : "nograd",
            this.paramCache.dashed ? "dashed" : "solid"
        ].join("-");

        if(this.programType !== programType) {
            this.setProgram(programType);
        }

        if(params.texture) {            
            if(cacheTexture !== params.texture) {
                this.loadTexture(params.texture);
                let loc = this.gl.getUniformLocation(this.program, "texture");
                this.gl[`uniform1i`](loc, 0);
            }
            let loc1 = this.gl.getUniformLocation(this.program, "textureRatio");
            this.gl[`uniform1f`](loc1, params.texture.ratio || 1);
        }   
        
        if(params.radialGradient) {            
            this.createGradientTexture(params.radialGradient);
            let loc = this.gl.getUniformLocation(this.program, "gradient_texture");
            this.gl[`uniform1i`](loc, 1);            
        }   

        this.setAttributes();

    }
    setAttributes() {
        for(let param in this.paramCache) {
             if(this.programParams[param]) {
                let loc = this.gl.getUniformLocation(this.program, param);
                let val = param == "texture" ? 0 : this.paramCache[param];
                this.gl[`uniform${this.programParams[param]}`](loc, val);
                            
            }   
        }
    }
}