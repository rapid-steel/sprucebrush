const DEBUG = process.env.NODE_ENV !== 'production';

function n2(n) {
    let k = 2; // eslint-disable-next-line
    while(n >>>= 1) k <<= 1;
    return k >>>= 1;
}


export default class ToolWebGL {
    constructor() { 
        this.canvas = new OffscreenCanvas(100, 100);
        this.gl = this.canvas.getContext("webgl", {
            premultipliedAlpha: true,
            depth: false
        });

        this.commonCodeBlocks = {
            dynamics: `
            #define PI2 6.283185
            float dynamics_down(float base, float index, float length) {
                if(index > length) return 0.0;
                return base * (length - index) / length;
            }

            float dynamics_periodic(float base, float dynr, float index, float length) {
                float l2 = length / 2.0;
                float f = mod(index, length) / l2;
                if(f > 1.0) f = 2.0 - f;
                return base * (1.0 - f * dynr);
            }

            float dynamics_amplitude(float dynr, float index, float length) {
                float l4 = length / 4.0;
                float f = mod(index, length) / l4;
                if(f > 2.0) {
                    if(f > 3.0) f = 4.0 - f;
                    else f = f - 2.0;
                    if(f == 0.0 || dynr == 0.0) return 0.0;
                    return 1.0 / (1.0 - dynr * f); 
                }
                if(f > 1.0) 
                    f = 2.0 - f;
                return 1.0 * (1.0 - dynr * f); 
            }

            float dynamics_angle_periodic(float base, float dynr, float index, float length) {
                float l2 = length / 2.0;
                float f = mod(index, length) / l2;
                if(f > 1.0) f = 2.0 - f;
                return base + PI2 * (1.0 - f * dynr);
            }

            float dynamics_angle_circular(float index, float length) {
                float f = mod(index, length) / length;
                return f * PI2;
            }

            float dynamics_pressure(float base, float dynr, float pressure) {
                return base * (1.0 - (1.0 - pressure) * dynr);
            }`
        };

    }
    _init() {      
        this.gl.getExtension("OES_standard_derivatives");
        this.gl.clearColor(0, 0, 0, 0);
        this.gl.enable(this.gl.SAMPLE_ALPHA_TO_COVERAGE);
        this.gl.enable(this.gl.SAMPLE_COVERAGE);
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFuncSeparate(
            this.gl.SRC_ALPHA, 
            this.gl.ONE_MINUS_SRC_ALPHA, 
            this.gl.ONE, 
            this.gl.ONE_MINUS_SRC_ALPHA
        );
        this.gl.depthMask(false);        

        this.gl.clear(this.gl.COLOR_BUFFER_BIT  | this.gl.DEPTH_BUFFER_BIT);

        for(let k in this.buffers) {
            this.buffers[k].buf = this.gl.createBuffer();
            this[k] = [];
        }   
        this.programsLoaded = {};
        this.params = {};
        this.dynamics = {};
        this.programParams = {};
        this.programType = "";
        this.programProps = {};
        this.textures = {
            BASE: 0,
            GRADIENT: 1
        };
        this.autoUpdate = false;
        this.update = false;
    }
    _getGlColor(color) {
        if(color.indexOf("rgb") == 0) {
            return color.replace(")", "")
            .split("(")[1]
            .split(",").map(s => (+s) / 255).slice(0, 3);
        } 
        if(color.indexOf("#") == 0) {
            color = color.slice(1);
            let vals = [];
            for(let i = 0; i < 6; i += 2) {
                vals.push(parseInt(color.slice(i,i + 2), 16) / 255);
            }
            return vals;
        }
    }
    _createProgram(programType) {
        this.programType = programType;
        this.programProps = Object.fromEntries(
            programType.split("-")
            .map(p => p.split(":"))
            .map(e => [e[0], +(e[1]||1)]));


        if(!this.programsLoaded[programType]) {
            if(this.program) {
                for(let k in this.buffers) {
                    if(this.buffers[k].enabled)
                        this.gl.disableVertexAttribArray(
                            this.gl.getAttribLocation(this.program, this.buffers[k].attrib)
                        ); 
                }           
            }
            const vertShader = this.gl.createShader(this.gl.VERTEX_SHADER);
            this.gl.shaderSource(vertShader, this.createVertShader(this.programProps));
            this.gl.compileShader(vertShader);
            if(DEBUG) 
                console.log(this.gl.getShaderInfoLog(vertShader));
    
            const fragShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
    
            this.gl.shaderSource(fragShader, this.createFragShader(this.programProps));
            this.gl.compileShader(fragShader);
            if(DEBUG) 
                console.log(this.gl.getShaderInfoLog(fragShader));
    
            const program = this.gl.createProgram();
            this.gl.attachShader(program, vertShader); 
            this.gl.attachShader(program, fragShader);
            this.gl.linkProgram(program);

            if(DEBUG) 
                console.log(this.gl.getProgramInfoLog(program));

            this.programsLoaded[programType] = program;

        }
        this.program = this.programsLoaded[programType];      
        this.gl.useProgram(this.program);   


        for(let k in this.buffers) {
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers[k].buf);
            let ptr = this.gl.getAttribLocation(this.program, this.buffers[k].attrib); //eslint-disable-next-line
            if(this.buffers[k].enabled = ptr !== -1) {
                this.gl.vertexAttribPointer(ptr, this.buffers[k].size, this.buffers[k].type, false, 0, 0);
                this.gl.enableVertexAttribArray(ptr);
            }
        }
    }
    _createTexture(img, index) {
        const glTexture = this.gl.createTexture();
        this.gl.activeTexture(this.gl.TEXTURE0 + index); 
        this.gl.bindTexture(this.gl.TEXTURE_2D, glTexture);
        let format = [
            this.gl.LUMINANCE_ALPHA,
            this.gl.RGBA
        ][index]
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, format, format, this.gl.UNSIGNED_BYTE, img);
        this.gl.generateMipmap(this.gl.TEXTURE_2D);
    }
    createGradientTexture({colors, type}, [w, h] = [1, 1]) {
        const k = 1024;
        const ctx = new OffscreenCanvas(k*w, k*h).getContext("2d");
        const position = {
            radial: [0, 0, 0, k*h],
            by_wid: [0, 0, k*w, 0],
            by_len: [0, 0, 0, k*h]
        }[type];

        const canvasGradient = ctx.createLinearGradient(...position);
        colors.forEach((c, i) => {
            canvasGradient.addColorStop(i / (colors.length - 1), c);
        })

        ctx.fillStyle = canvasGradient;
        ctx.fillRect(0, 0, k*w, k*h);


        ctx.canvas.convertToBlob({type: "image/png"})
        .then(blob => 
            this.loadTexture(
                URL.createObjectURL(blob), 
                "gradientTexture",
                this.textures.GRADIENT
            ));  
    }
    loadTexture(src, attrib, index = this.textures.BASE) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => 
            this._createTexture(img, index);  
            if(this.program) {
                this.gl.uniform1i(
                    this.gl.getUniformLocation(this.program, attrib),  
                    index);  
            }    
        img.src = src;
    }
    _updateParams(params){
        for(let param in params.values) {
            this.params[param] = params.values[param];
        }
        this.params.color = params.color;
        this.dynamics = params.dynamics;
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
    notEmpty() {
        return !!this.vertices.length;
    }    
    clearIndex() {
        this.index = 0;
    }
    dropLine() {
        this.update = false;
        this.points = [];

        for(let k in this.buffers) {
            this[k] = [];
        }
        requestAnimationFrame(() => {
            this.gl.clear(this.gl.COLOR_BUFFER_BIT  | this.gl.DEPTH_BUFFER_BIT);
        });
        if(Object.values(this.dynamics).find(d => d.type === 1)) {
            this.clearIndex();
        }
    }
    addPoint(p) {
        this._addPoint(p);
        if(this.autoUpdate && !this.update) {
            this.update = true;
            this.animate();
        }
    }
    drawToCtx(ctx2d) {
        this.render();
        ctx2d.drawImage(this.canvas, 0, 0);
    }
    render() {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT  | this.gl.DEPTH_BUFFER_BIT);

        for(let k in this.buffers) {
            if(this.buffers[k].enabled) {
                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers[k].buf);
                this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this[k]), this.gl.DYNAMIC_DRAW);
            }
        }
        this.gl.drawArrays(this.PRIMITIVE_TYPE, 0, this.indexes.length);
     }
     setParams(params) {
        let old = Object.assign({}, this.params);
        this._updateParams(params);

        const programType = this._getProgramType();
        if(this.programType !== programType) {
            this.setProgram(programType);
        }

        if(this.params.texture) {            
            if(old.texture !== this.params.texture) 
                this.loadTexture(this.params.texture.src, "texture", this.textures.BASE);
        } 
        
        if(old.gradient !== this.params.gradient && this.params.gradient.enabled) {      
            let size_ratio = [1, 1];
            let h_ratio = 1;
            let loop = false;
            if(this.params.gradient.type == "by_len") {
                let h = n2(this.params.gradient.colors.length - 1);
                size_ratio = [1, h];
                h_ratio = h / this.params.gradient.length;
                loop = true;
            }      
            this.createGradientTexture(
               this.params.gradient, size_ratio, loop);      
            this.params.gradientRatio =  h_ratio;
            this.gl.uniform1f(this.gl.getUniformLocation(this.program, "gradientRatio"), this.params.gradientRatio);
        }     

        this.setAttributes();

    }
    setSizes({width, height}) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT  | this.gl.DEPTH_BUFFER_BIT);

        Object.assign(this.params, {
            width2: width / 2,
            height2: height / 2
        });
        this.setAttributes();
    }
    _setDynamics() {
        for(let d in this.dynamics) {
            let range = this.dynamics[d] ? this.dynamics[d].range : 0;
            let length = this.dynamics[d] ? this.dynamics[d].length : 1;
            this.gl.uniform1f(
                this.gl.getUniformLocation(this.program, d + "_dynr"), range);  
            this.gl.uniform1f(
                this.gl.getUniformLocation(this.program, d + "_dynlen"), length);   
        }
    }
}
