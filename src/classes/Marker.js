import ToolWebGL from "./ToolWebGL";
import {vec, normal, length, invert, equal, angle, rotateY} from "../functions/vector-functions";

const DEBUG = process.env.NODE_ENV !== 'production';


const vertexShader =   `
uniform float lineWidth;
uniform float width2;
uniform float height2;

attribute vec2 coordinates;
attribute vec2 miter;
attribute float line_start;
attribute float line_length;
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

    texPos.y *= line_length / lineWidth;
    texPos.y += mod(line_start, lineWidth) / lineWidth;

    
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

         #ifdef TEXCOLOR
         float maxc(vec3 color) {
            float m = color.r > color.g ? color.r : color.g;
            m = color.b > m ? color.b : m;
            return m;
         }

         float minc(vec3 color) {
            float m = color.r < color.g ? color.r : color.g;
            m = color.b < m ? color.b : m;
            return m;
         }
         #endif

            void main(void) {
                gl_FragColor = vec4(color, 1.0);

                #ifdef TEXTURE
                gl_FragColor = texture2D(texture, texPos);                
                #endif

                #ifdef TEXCOLOR
                gl_FragColor.a = (maxc(gl_FragColor.rgb) + minc(gl_FragColor.rgb)) * 0.5;
                gl_FragColor.rgb = color;
                #endif

                #ifdef WIDTHGRAD
                gl_FragColor.rgb = texture2D(gradient_texture, texPos);                
                #endif               
                
                gl_FragColor.a *= opacity;
                
            }
    `;
   
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
            line_start: { attrib: "line_start", size: 1, type: this.gl.FLOAT },
            line_length: { attrib: "line_length", size: 1, type: this.gl.FLOAT },
            indexes:  { attrib: "index",  size: 1, type: this.gl.FLOAT }
        };

        this.params = {
            lineWidth: 1
        };
        this.PRIMITIVE_TYPE = this.gl.TRIANGLES;
        this.vertexShader = vertexShader;
        this.createFragShader = createFragShader;

        this._init();
        this.gl.enable(this.gl.CULL_FACE);
        this.gl.cullFace(this.gl.FRONT);

       
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
            width2: "1f",
            height2: "1f",
            opacity: "1f",
            color: "3fv"
        };


        //this.setAttributes();

    }
    addPoint(point) {
        let p2 = point.coords;
        let p1 = this.points[this.points.length-1];
        
        if(p1) {
            p1 = p1.coords;            
            let line_vec = vec(p1, p2);
            let len = length(line_vec);
            let norm = normal(line_vec);

            if(this.points.length > 1) {
                let len2 = length(vec(this.points[this.points.length-2].coords, p2));
                let minlen = (this.paramCache.lineWidth * this.paramCache.lineWidth - 2 * len2 * len2) /
                    this.paramCache.lineWidth;
                if(len2 < minlen) return;
            }


            let line = {
                p1, p2,
                miter1: norm,
                miter2: norm,
                length: len,
                line_vec,
                start: 0          
            };
            if(this.lines.length > 0) {
                let line0 = this.lines[this.lines.length-1];
                let line_vec0 = line0.line_vec
                let line_vec0_inv = invert(line_vec0);
                let norm0 = normal(line_vec0);
                line.start += line0.start + line0.length;

                if(!equal(norm, norm0)) {
                    let norm1 = normal( vec(norm0, norm) );
                    let sign = rotateY(norm0, norm) < 0 ? -1 : 1;
                    let a = angle( line_vec0_inv , line_vec) / 2;
                    let mitter = 1 / Math.sin(a);
                   
                    norm1 = norm1.map(n => n * sign * mitter);
                    line.miter1 = norm1;
                    line0.miter2 = norm1;
                }           
               
            }
            
            this.lines.push(line);
        }
        this.points.push(point);

        this.vertices = [];
        this.miters = [];
        this.line_start = [];
        this.line_length = [];
        this.indexes = [];

        this.lines.forEach(l => {
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

            this.line_start.push(
                l.start, l.start, l.start, l.start, l.start, l.start
            );

            this.line_length.push(
                l.length, l.length, l.length, l.length, l.length, l.length
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