import ToolWebGL from "./ToolWebGL";
const DEBUG = process.env.NODE_ENV !== 'production';


const vertexShader =   `
uniform float radius;
uniform float width2;
uniform float height2;

attribute vec2 coordinates;
attribute float pressure;
attribute float index;
varying float vPressure;
varying float vIndex;
varying float vRadius;

void main(void) { 
    gl_Position = vec4(
        (coordinates.x - width2) / width2, 
        (height2 - coordinates.y) / height2, 
        0.0, 1.0);
    gl_PointSize = radius * pressure;
    vPressure = pressure;      
    vIndex = index;    
    vRadius = radius;
}`;


function createFragShader(programType) {
    let type = {
        smooth: programType.indexOf("smooth") !== -1,
        texture: programType.indexOf("texture") !== -1,
        round: programType.indexOf("round") !== -1,
        gradient: programType.indexOf("grad") !== -1
    };
    if(type.gradient) {
        type.linearGradient = programType.indexOf("lingrad") !== -1;
        type.radialGradient = programType.indexOf("radgrad") !== -1;
        type.colors =  parseInt(programType.slice(programType.indexOf("grad")+ 4));
    }    
    let code = `
    #ifdef GL_OES_standard_derivatives
    #extension GL_OES_standard_derivatives : enable
    #endif

    precision mediump float;
    uniform float opacity;  
    varying float vPressure;
    varying float vIndex;
    varying float vRadius;     
    `;
    if(type.smooth ) {
        code += `
        uniform float hardness;  
        `;
    }
    if(type.gradient) {
        if(type.linearGradient) {
            code += `
            uniform float linearGradientLength;
            `
        }
        for(let i = 1; i <= type.colors; i++)
            code += `
            uniform vec3 color${i};
            `;
    } else {
        code += `
        uniform vec3 color;
        `;
    }
    if(type.texture) {
        code += `
        uniform sampler2D texture;   
        `;
    }


    let mainFunc = `
        float alpha = opacity * vPressure;
        vec2 cxy = 2.0 * gl_PointCoord - 1.0;
    `; 
    
    if(!type.texture) {
        if(type.round) {
            mainFunc += `
            float r = 0.0;            
            r = dot(cxy, cxy);
            `;
            if(type.smooth) {
                mainFunc += `
            #ifdef GL_OES_standard_derivatives
                float delta = fwidth(r);
                alpha = alpha - smoothstep(hardness - delta, 1.0 + delta, r);
            #endif
                `;
            } else {
                mainFunc += `
                    if(r > 1.0) discard;
                `;
            }
        }
    }


    if(type.gradient) {
        mainFunc += `
        float colorN = ${type.colors}.0;
        `
        if(type.linearGradient) {
            mainFunc += `
            float offset = mod(vIndex, linearGradientLength);
            float part = linearGradientLength / colorN;
            float div = floor(offset / part);
            float md = mod(offset, part) / part;
            vec3 color = vec3(color1);
            `;       
            
            for(let i = 1; i <= type.colors; i++) {
                let i2 = i == type.colors ? 1 : i+1;
                mainFunc += `
                    if(div == ${i-1}.0) {
                        color = mix(color${i}, color${i2}, md);
                    }
                `;
            }
        } else if(type.radialGradient) {
            if(type.round || type.texture) {
                mainFunc += `
                float offset = length(cxy);
                `;
            } else {
                mainFunc += `
                float offset = max(abs(cxy.x), abs(cxy.y));
                `;
            }
            mainFunc += `
                float part = 1.0 / (colorN - 1.0);
                float div = floor(offset / part);
                float md = mod(offset, part) / part;
                vec3 color = vec3(color${type.colors});
            `;        

            for(let i = 1; i < type.colors; i++) {
                mainFunc += `
                    if(div == ${i-1}.0) {
                        color = mix(color${i}, color${i+1}, md);
                    }
                `;
            }
        }



        
    }

    if(!type.texture) {
        mainFunc += `gl_FragColor = vec4(color, alpha);`;
    } else {
        mainFunc += `
        gl_FragColor = (texture2D(texture, gl_PointCoord ));
        gl_FragColor.a *= alpha;
        gl_FragColor.rgb = color;
        `
    }
    
    



    code += `void main(void) {
        ${mainFunc}
    }`;   

    if(DEBUG) console.log(code);
    return code;
}






export default class Brush extends ToolWebGL {
    constructor() {
        super();
        this.points = [];

        this.canvas = new OffscreenCanvas(100, 100);
        this.gl = this.canvas.getContext("webgl", {
           premultipliedAlpha: true,
            depth: false
        });
    
        this.buffers = {
            vertices: { attrib: "coordinates", size: 2, type: this.gl.FLOAT },
            pressures: { attrib: "pressure", size: 1, type: this.gl.FLOAT },
            indexes:  { attrib: "index",  size: 1, type: this.gl.FLOAT }
        };
        this.params = {
            spacing: .05,
            radius: 1,
            overlay: false
        };

        this.PRIMITIVE_TYPE = this.gl.POINTS;
        this.vertexShader = vertexShader;
        this.createFragShader = createFragShader;
        this.pointStep = this.params.radius * this.params.spacing;
        this.index = 0;

        this._init();
       
    }
    setProgram(programType) {
         this._createProgram(programType);

        this.programParams = {
            radius: "1f",
            width2: "1f",
            height2: "1f",
            opacity: "1f"
        };

        if(programType.indexOf("smooth") !== -1) {
            this.programParams.hardness = "1f";
        }

        if(programType.indexOf("texture") !== -1) {
            this.programParams.texture = "1i";
        }

        if(programType.indexOf("grad") !== -1) {
            if(programType.indexOf("lingrad") !== -1) 
                this.programParams.linearGradientLength = "1f";
            let colors = parseInt(programType.slice(programType.indexOf("grad")+4));
            for(let i = 1; i <= colors; i++) {
                this.programParams["color" + i] = "3fv";
            }
        } else {
            this.programParams.color = "3fv";
        }

    }
    addPoint({coords, pressure}) {
        
        if(this.vertices.length === 0) {
            this.vertices.push(coords[0]);
            this.vertices.push(coords[1]);
            this.pressures.push(pressure);
            this.indexes.push(++this.index);
        } else  {
            let coords0 = this.vertices.slice(-2);
            let pressure0 = this.pressures[this.pressures.length-1];
            let lx = coords[0] - coords0[0];
            let ly = coords[1] - coords0[1];
            
            let length = Math.sqrt(
                Math.pow(lx, 2) + Math.pow(ly, 2)
            );            
            let lp = pressure - pressure0;
            for(let i = this.pointStep; i < length; i += this.pointStep) {
                let delta = i / length;
                this.vertices.push(delta * lx + coords0[0]);
                this.vertices.push(delta * ly + coords0[1]);
                this.pressures.push(delta * lp + pressure0);
                this.indexes.push(++this.index);
            }                
           
           
        }
       

        if(!this.update) {
            this.update = true;
            this.animate();
        }

    }
   
    setParams(params) {
        let cacheTexture = this.paramCache.texture;
        for(let param in params) {
            this.paramCache[param] = params[param];
            if(this.params[param] !== undefined) {
                this.params[param] = params[param];
            }         
        }
        this.pointStep = this.params.radius * this.params.spacing;
        const programType = [ 
            params.texture ? "texture" : params.shape,
            params.pixel ? "pixel" : "smooth",
            params.linearGradient ? 
            "lingrad" + params.linearGradient.length 
            : params.radialGradient ? 
            "radgrad" + params.radialGradient.length 
            : "color"
        ].join("-");

        if(this.programType !== programType) {
            this.setProgram(programType);
        }

        if(params.texture) {            
            if(cacheTexture !== params.texture) {
                this.createTexture(params.texture);
                let loc = this.gl.getUniformLocation(this.program, "texture");
                this.gl[`uniform1i`](loc, 0);
            }
        } 
          
                    

        this.setAttributes();

    }
    setAttributes() {
        for(let param in this.paramCache) {
            if(param == "linearGradient" || param == "radialGradient") {
               if(this.paramCache[param]) {
                let colors = parseInt(this.programType.slice(this.programType.indexOf("grad")+4));
                for(let i = 0; i < colors; i++) {
                    let loc = this.gl.getUniformLocation(this.program, "color" + (1+i));
                    this.gl.uniform3fv(loc, this.paramCache[param][i]);
                }               
               } 

            }

            else if(this.programParams[param]) {
                let loc = this.gl.getUniformLocation(this.program, param);
                let val = param == "texture" ? 0 : this.paramCache[param];
                this.gl[`uniform${this.programParams[param]}`](loc, val);
                            
            }   
        }
    }   
}