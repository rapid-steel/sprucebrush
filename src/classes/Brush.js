


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
            if(type.round) {
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
        mainFunc += `gl_FragColor = vec4(color, 0.0) + texture2D(texture, gl_PointCoord );`
    }
    
    



    code += `void main(void) {
        ${mainFunc}
    }`;   

    if(DEBUG) console.log(code);
    return code;
}



const DEBUG = process.env.NODE_ENV !== 'production';

export default class Brush {
    constructor(canvas) {
        this.points = [];
        this.vertices = [];
        this.indexes = [];
        this.pressures = [];

        this.canvas = canvas;
        this.gl = canvas.getContext("webgl", {
           // preserveDrawingBuffer: true, 
            depth: false
        });

        this.gl.getExtension("OES_standard_derivatives");
        this.gl.clearColor(0, 0, 0, 0);
        this.gl.enable(this.gl.SAMPLE_ALPHA_TO_COVERAGE);
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFuncSeparate(
            this.gl.SRC_ALPHA, 
            this.gl.ONE_MINUS_SRC_ALPHA, 
            this.gl.ONE, 
            this.gl.ONE_MINUS_SRC_ALPHA
        );
        this.gl.depthMask(false);        

        this.gl.clear(this.gl.COLOR_BUFFER_BIT  | this.gl.DEPTH_BUFFER_BIT);

    
        this.vertex_buffer = this.gl.createBuffer();
        this.index_buffer = this.gl.createBuffer();
        this.pressure_buffer = this.gl.createBuffer();
        

        this.programsLoaded = {};

        this.params = {
            spacing: .05,
            radius: 1
        };
        this.paramCache = {};
        this.update = false;
       
    }
    setProgram(programType) {
        this.programType = programType;

        if(!this.programsLoaded[programType]) {
            if(this.program) {
                const coord = this.gl.getAttribLocation(this.program, "coordinates");
                this.gl.disableVertexAttribArray(coord); 
                const press = this.gl.getAttribLocation(this.program, "pressure");
                this.gl.disableVertexAttribArray(press);
    
                const ind = this.gl.getAttribLocation(this.program, "index");
                this.gl.disableVertexAttribArray(ind);              
            }

            const fragCode = createFragShader(programType);

            const vertShader = this.gl.createShader(this.gl.VERTEX_SHADER);
            this.gl.shaderSource(vertShader, vertexShader);
            this.gl.compileShader(vertShader);
            if(DEBUG) 
                console.log(this.gl.getShaderInfoLog(vertShader));
    
            const fragShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
    
            this.gl.shaderSource(fragShader, fragCode);
            this.gl.compileShader(fragShader);
            if(DEBUG) 
                console.log(this.gl.getShaderInfoLog(fragShader));
    
            const program = this.gl.createProgram();
            this.gl.attachShader(program, vertShader); 
            this.gl.attachShader(program, fragShader);
            this.gl.linkProgram(program);

            this.programsLoaded[programType] = program;

        }
        this.program = this.programsLoaded[programType];      
        this.gl.useProgram(this.program);   
            
        
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertex_buffer);
        const coord = this.gl.getAttribLocation(this.program, "coordinates");
        this.gl.vertexAttribPointer(coord, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(coord);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.pressure_buffer);
        const press = this.gl.getAttribLocation(this.program, "pressure");
        this.gl.vertexAttribPointer(press, 1, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(press);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.index_buffer);
        const ind = this.gl.getAttribLocation(this.program, "index");
        this.gl.vertexAttribPointer(ind, 1, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(ind);

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


        //this.setAttributes();

    }
    addPoint(coords, pressure) {
        
        if(this.points.length === 0) {
            this.points.push({coords, pressure});
            this.vertices.push(coords[0]);
            this.vertices.push(coords[1]);
            this.pressures.push(pressure);
            this.indexes.push(this.indexes.length);
        } else  {
            let p = {coords, pressure};
            let p0 = this.points[this.points.length-1];
            let lx = p.coords[0] - p0.coords[0];
            let ly = p.coords[1] - p0.coords[1];
            let lp = p.pressure - p0.pressure;
            let length = Math.sqrt(
                Math.pow(lx, 2) + Math.pow(ly, 2)
            );            
            let step = this.params.radius / 2 * this.params.spacing;
            if(length >= step) {
                this.points.push({coords, pressure});
                for(let i = 0; i < length; i += step) {
                    let delta = i / length;
                    this.vertices.push(delta * lx + p0.coords[0]);
                    this.vertices.push(delta * ly + p0.coords[1]);
                    this.pressures.push(delta * lp + p0.pressure);
                    this.indexes.push(this.indexes.length);
                }                
           }
           
        }
       

        if(!this.update) {
            this.update = true;
            this.animate();
        }

    }
    dropLine() {
        this.update = false;
        this.points = [];
        this.vertices = [];
        this.indexes = [];
        this.pressures = [];
        requestAnimationFrame(() => {
            this.gl.clear(this.gl.COLOR_BUFFER_BIT  | this.gl.DEPTH_BUFFER_BIT);
        });
    }
    loadTexture(texture) {
        const img = new Image();
        img.crossOrigin = "anonymous";

        img.onload = () => {
            const glTexture = this.gl.createTexture();
            this.gl.activeTexture(this.gl.TEXTURE0);  // this is the 0th texture
            this.gl.bindTexture(this.gl.TEXTURE_2D, glTexture);

            this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, img);
            this.gl.generateMipmap(this.gl.TEXTURE_2D);

        }
        img.src = texture.src;
    }
    setParams(params) {
        let cacheTexture = this.paramCache.texture;
        for(let param in params) {
            this.paramCache[param] = params[param];
            if(this.params[param] !== undefined) {
                this.params[param] = params[param];
            }         
        }
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
                this.loadTexture(params.texture);
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
    setSizes({width, height}) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.canvas.style.width = width + "px";
        this.canvas.style.height = height + "px";
        this.gl.viewport(0, 0, width, height);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT  | this.gl.DEPTH_BUFFER_BIT);

        this.setParams({
            width2: this.canvas.width / 2,
            height2: this.canvas.height / 2
        });
    }
    animate() {
        if(this.update) {
            this.render();
            if(this.onNextRedraw) {
                this.onNextRedraw();
                this.onNextRedraw = null;
            }
            requestAnimationFrame(() => this.animate());
        }
        
    }
    render() {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT  | this.gl.DEPTH_BUFFER_BIT);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertex_buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.vertices), this.gl.DYNAMIC_DRAW);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.pressure_buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.pressures), this.gl.DYNAMIC_DRAW);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.index_buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.indexes), this.gl.DYNAMIC_DRAW);
        this.gl.drawArrays(this.gl.POINTS, 0, this.indexes.length);
     }
}