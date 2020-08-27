import Ctx from "../functions/ctx"
const DEBUG = process.env.NODE_ENV !== 'production';


function n2(n) {
    let k = 2; // eslint-disable-next-line
    while(n >>>= 1) k <<= 1;
    return k >>>= 1;
}

// all the shaders are .glsl files, so i needn't search them somewhere in this  
// class and can look at the code without squinting.
// placeholders for common chunks are commented line in format: //${chunk_key}
// so they should be added via js


const commonChunks = {
    common_colors: require("./shaders/common_colors.glsl").default,
    common_dynamics: require("./shaders/common_dynamics.glsl").default
};

export default class ToolWebGL {
    constructor() { 
        this.gl =  Ctx.create(100, 100, "webgl", {
           premultipliedAlpha: true,
           depth: false,
        });
        this.canvas = this.gl.canvas;

        this.DYNTYPE = {
            DISABLED:    0,
            FADE:        1,
            PERIOD_MAX:  2,
            PRESSURE:    3,
            PERIOD_AMPL: 4,
            CIRCULAR:    5,
            RANDOM:      6  
        };

        // let's see if it could be useful in future, for blur or other effects
        // but so far, i have to solve problems with blending
        this.useFrameBuffer = false;
    }
    _init() {      
        this.gl.getExtension("OES_standard_derivatives");
        
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFuncSeparate(
            this.gl.SRC_ALPHA, 
            this.gl.ONE_MINUS_SRC_ALPHA, 
            this.gl.ONE, 
            this.gl.ONE_MINUS_SRC_ALPHA
        );
        this.gl.enable(this.gl.SAMPLE_COVERAGE);
        this.gl.depthMask(false);        
        this.gl.clearColor(0, 0, 0, 0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT  | this.gl.DEPTH_BUFFER_BIT);
        

        if(this.useFrameBuffer)
            this._initFramebuffer();
        

        for(let k in this.buffers) {
            this.buffers[k].buf = this.gl.createBuffer();
            this[k] = [];
        }   
        this.programsLoaded = {};
        this.params = {};
        this.texture = false;
        this.gradient = {enabled: false};
        this.dynamics = {};
        this.smoothing = {};
        this.programParams = {};
        this.programType = "";
        this.programProps = {};
        this.textures = {
            BASE: 0,
            GRADIENT: 1
        };
        this.autoUpdate = false;
        this.update = false;
        this.commonChunks = commonChunks;

        this.mainProgShaders = this._loadShadersCode(this.PROGRAM_NAME);
       if(this.useFrameBuffer) {
            this.postProgShaders = this._loadShadersCode("postprocess"); 
            this.postProgram = this._createProgram(this.postProgShaders, {});
       }
    }
    _initFramebuffer() {
        this.gl.getExtension("OES_texture_float");
        this.gl.getExtension("OES_texture_float_linear");
        this.frameBuffer = this.gl.createFramebuffer();
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.frameBuffer);
        this.framebufferTexture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D,  this.framebufferTexture); 
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.canvas.width, this.canvas.height, 0, this.gl.RGBA, this.gl.FLOAT,
                      null);
      
        this.gl.framebufferTexture2D(
            this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D,  this.framebufferTexture, 0);

        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        this.gl.bindTexture(this.gl.TEXTURE_2D,  null); 

        this.postProgBuffer = this.gl.createBuffer();
        this.postProgBufferData = new Float32Array([
            1.0, -1.0, 
            1.0,  1.0, 
           -1.0, -1.0, 
           -1.0,  1.0, 
           -1.0, -1.0, 
            1.0,  1.0,           
        ]);
    }
    _createShader(props, shaderCode) {
        return [
            ...Object.entries(props)
                .map(p => `#define ${p[0].toUpperCase()} ${p[1]}`),
            ...shaderCode
                .map(c => c.ref ? this.commonChunks[c.ref] : c)
        ].join("\n");
    }
    _loadShadersCode(program) {
        const shaders = { 
            vertex: [], 
            fragment: [] 
        };
        for(let shader in shaders) {
            const chunks = shaders[shader];
            const code = require(`./shaders/${program}_${shader}.glsl`).default;
            code.split("//${")
            .forEach((chunk, i) => {
                if(i) {
                    let delim = chunk.indexOf("}");
                    chunks.push({
                        ref: chunk.slice(0, delim)
                    });
                    chunk = chunk.slice(delim+1);
                }   
                chunks.push(chunk);  
            }, []);
        }
        return shaders;
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
    _createProgram(shaders, props) {
        let errorInfo;

        const vertShader = this.gl.createShader(this.gl.VERTEX_SHADER);
        this.gl.shaderSource(vertShader, this._createShader(props, shaders.vertex));
        this.gl.compileShader(vertShader); // eslint-disable-next-line
        if(DEBUG && (errorInfo = this.gl.getShaderInfoLog(vertShader))) 
            console.log(errorInfo);

        const fragShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);

        this.gl.shaderSource(fragShader, this._createShader(props, shaders.fragment));
        this.gl.compileShader(fragShader); // eslint-disable-next-line
        if(DEBUG && (errorInfo = this.gl.getShaderInfoLog(fragShader))) 
            console.log(errorInfo);

        const program = this.gl.createProgram();
        this.gl.attachShader(program, vertShader); 
        this.gl.attachShader(program, fragShader);
        this.gl.linkProgram(program); 
        this.gl.validateProgram(program); // eslint-disable-next-line
        if(DEBUG && (errorInfo = this.gl.getProgramInfoLog(program)))
            console.log(errorInfo);

        return program;
    }
    _createMainProgram(programType) {
        this.programType = programType;
        this.programProps = Object.fromEntries(
            programType.split("-")
            .map(p => p.split(":"))
            .map(e => [e[0], +(e[1]||1)])
        );
        
        if(this.programProps.huedynamics || 
           this.programProps.saturationdynamics || 
           this.programProps.lightnessdynamics
        ) 
            this.programProps.colordynamics = 1.0;


        if(!this.programsLoaded[programType]) {
            if(this.mainProgram) {
                for(let k in this.buffers) {
                    if(this.buffers[k].enabled)
                        this.gl.disableVertexAttribArray(
                            this.gl.getAttribLocation(this.mainProgram, this.buffers[k].attrib)
                        ); 
                }           
            }
            this.programsLoaded[programType] = this._createProgram(this.mainProgShaders, this.programProps);
        }
        this.gl.clear(this.gl.COLOR_BUFFER_BIT  | this.gl.DEPTH_BUFFER_BIT);
        this.mainProgram = this.programsLoaded[programType];    
        this.gl.useProgram(this.mainProgram);

        this.setAttributes();
    }
    setAttributes() {
        for(let k in this.buffers) {
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers[k].buf);
            let ptr = this.gl.getAttribLocation(this.mainProgram, this.buffers[k].attrib); //eslint-disable-next-line
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
        const ctx = Ctx.create(k*w, k*h, "2d");
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

        ctx.canvas.toBlob(blob => 
            this.loadTexture(
                URL.createObjectURL(blob), 
                "gradientTexture",
                this.textures.GRADIENT
        ));  
    }
    loadTexture(src, attrib, index = this.textures.BASE) {
        this.gl.useProgram(this.mainProgram);   
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            this._createTexture(img, index);  
            if(index == this.textures.BASE) {
                this.textureRatio = img.width / img.height;
                this.gl.uniform1f(
                    this.gl.getUniformLocation(this.mainProgram, "textureRatio"),  
                    this.textureRatio);
            }
            if(this.mainProgram) {
                this.gl.uniform1i(
                    this.gl.getUniformLocation(this.mainProgram, attrib),  
                    index);
            }    
        };
        img.src = src;
    }
    _updateParams(params){
        for(let param in params.values) {
            this.params[param] = params.values[param];
        }
        this.params.color = params.color;
        this.texture = params.texture;
        this.gradient = params.gradient;
        this.dynamics = params.dynamics;
        this.smoothing = params.smoothing;
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
    _enableFb() {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.frameBuffer);
        this.gl.clearColor(0, 0, 0, 0);    this.gl.useProgram(this.mainProgram);
        this.setUniforms();
        this.setAttributes();  
    }
    _disableFb() {
        for(let k in this.buffers) {
            if(this.buffers[k].enabled)
                this.gl.disableVertexAttribArray(
                    this.gl.getAttribLocation(this.mainProgram, this.buffers[k].attrib)
                ); 
        }           

        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    }
    _renderPostProcess() {
        this.gl.bindTexture(this.gl.TEXTURE_2D,  this.framebufferTexture); 
        this.gl.clearColor(1, 1, 1, 0);

        this.gl.clear(this.gl.COLOR_BUFFER_BIT  | this.gl.DEPTH_BUFFER_BIT);
        this.gl.useProgram(this.postProgram);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.postProgBuffer);
        let ptr = this.gl.getAttribLocation(this.postProgram, "pos"); 
        this.gl.vertexAttribPointer(ptr, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(ptr);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.postProgBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.postProgBufferData, this.gl.DYNAMIC_DRAW);
        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);

        this.gl.bindTexture(this.gl.TEXTURE_2D,  null); 
        this.gl.useProgram(this.mainProgram); 
    }
    render() {        
        if(this.useFrameBuffer) this._enableFb();

        this.gl.clear(this.gl.COLOR_BUFFER_BIT  | this.gl.DEPTH_BUFFER_BIT);
      
        for(let k in this.buffers) {
            if(this.buffers[k].enabled) {
                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers[k].buf);
                this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this[k]), this.gl.DYNAMIC_DRAW);
            }
        }
        
        this.gl.drawArrays(this.PRIMITIVE_TYPE, 0, this.indexes.length);
        
        if(this.useFrameBuffer) {
            this._disableFb();
            this._renderPostProcess;
        }


     }
     setParams(params) {
        let old = {
            texture: this.texture,
            gradient: this.gradient
        };
        this._updateParams(params);

        const programType = this._getProgramType();
        if(this.programType !== programType) {
            this.setProgram(programType);
        }

        if(this.texture) {            
            if(old.texture !== this.texture) 
                this.loadTexture(this.texture.src, "texture", this.textures.BASE);
        } 
        if(this.gradient && old.gradient !== this.gradient && this.gradient.enabled) {      
            let size_ratio = [1, 1];
            let h_ratio = 1;
            let loop = false;
            if(this.gradient.type == "by_len") {
                let h = n2(this.gradient.colors.length - 1);
                size_ratio = [1, h];
                h_ratio = h / this.gradient.length;
                loop = true;
            }      
            this.createGradientTexture(
               this.gradient, size_ratio, loop);      
            this.gradientRatio =  h_ratio;
            this.gl.uniform1f(this.gl.getUniformLocation(this.mainProgram, "gradientRatio"), this.gradientRatio);
        }     
        this.gl.sampleCoverage(this.params.opacity, false);
  //      this.gl.enable(this.gl.SAMPLE_ALPHA_TO_COVERAGE)
       this.setUniforms();

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
        
        if(this.useFrameBuffer) this._resizeFramebufferTexture();
        
        this.setUniforms();
    }
    _resizeFramebufferTexture() {
        this.gl.bindTexture(this.gl.TEXTURE_2D,  this.framebufferTexture); 
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.canvas.width, this.canvas.height, 0, this.gl.RGBA, this.gl.FLOAT,
                      null);
        this.gl.bindTexture(this.gl.TEXTURE_2D,  null); 
    }
    _setDynamics() {
        for(let d in this.dynamics) {
            let range = this.dynamics[d] ? this.dynamics[d].range : 0;
            let length = this.dynamics[d] ? this.dynamics[d].length : 1;
            this.gl.uniform1f(
                this.gl.getUniformLocation(this.mainProgram, d + "_dynr"), range);  
            this.gl.uniform1f(
                this.gl.getUniformLocation(this.mainProgram, d + "_dynlen"), length);   
        }
    }
    setUniforms() {
        if(this.mainProgram) {
            for(let param in this.params) {
                if(param == "color") {
                    this.gl.uniform3fv(
                        this.gl.getUniformLocation(this.mainProgram, "color"), 
                        this._getGlColor(this.params.color));
                }
                else if(param == "angle") {
                    let angle = this.params.angle / 180 * Math.PI;
                    this.gl.uniform1f(
                        this.gl.getUniformLocation(this.mainProgram, "angle"), angle);
                }
    
                else if(this.programParams[param]) {
                    this.gl.uniform1f(
                        this.gl.getUniformLocation(this.mainProgram, param), 
                        this.params[param]);                         
                }

            }
            if(this.gradient && this.gradient.enabled) {
                this.gl.uniform1f(this.gl.getUniformLocation(this.mainProgram, "gradientRatio"), this.gradientRatio);
                if(this.programProps.by_len) {
                    this.gl.uniform1f(
                        this.gl.getUniformLocation(this.mainProgram, "gradientLength"), 
                        this.gradient.length);
                }            
                this.gl.uniform1i(
                    this.gl.getUniformLocation(this.mainProgram, "gradientTexture"), 
                    this.textures.GRADIENT);        
            }
            if(this.texture) {
                this.gl.uniform1i(
                    this.gl.getUniformLocation(this.mainProgram, "texture"), 
                    this.textures.BASE); 
                this.gl.uniform1f(
                    this.gl.getUniformLocation(this.mainProgram, "textureRatio"), 
                    this.textureRatio
                );
            }

            this._setDynamics();
        }
    }   
}
