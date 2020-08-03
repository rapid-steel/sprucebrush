const DEBUG = process.env.NODE_ENV !== 'production';

export default class ToolWebGL {
    _init() {        
        this.gl.getExtension("OES_standard_derivatives");
        this.gl.clearColor(0, 0, 0, 0);
        this.gl.enable(this.gl.SAMPLE_ALPHA_TO_COVERAGE);
       // this.gl.enable(this.gl.SAMPLE_COVERAGE);
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
        this.paramCache = {};
        this.textures = {
            BASE: 0
        };
        this.update = false;
    }
    _createProgram(programType) {
        this.programType = programType;

        if(!this.programsLoaded[programType]) {
            if(this.program) {
                for(let k in this.buffers) {
                    this.gl.disableVertexAttribArray(
                        this.gl.getAttribLocation(this.program, this.buffers[k].attrib)
                    ); 
                }           
            }

            const fragCode = this.createFragShader(programType);

            const vertShader = this.gl.createShader(this.gl.VERTEX_SHADER);
            this.gl.shaderSource(vertShader, this.vertexShader);
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


        for(let k in this.buffers) {
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers[k].buf);
            let ptr = this.gl.getAttribLocation(this.program, this.buffers[k].attrib);
            this.gl.vertexAttribPointer(ptr, this.buffers[k].size, this.buffers[k].type, false, 0, 0);
            this.gl.enableVertexAttribArray(ptr);
        }
    }
    _createTexture(img, index) {
        const glTexture = this.gl.createTexture();
        this.gl.activeTexture(this.gl.TEXTURE0 + index); 
        this.gl.bindTexture(this.gl.TEXTURE_2D, glTexture);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, img);
        this.gl.generateMipmap(this.gl.TEXTURE_2D);
    }

    _loadTexture(src, index) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => 
            this._createTexture(img, index);        
        img.src = src;

    }
    createTexture(texture) {
        this._loadTexture(texture.src, this.textures.BASE);
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
    
    dropLine() {
        this.update = false;
        this.points = [];

        for(let k in this.buffers) {
            this[k] = [];
        }
        requestAnimationFrame(() => {
            this.gl.clear(this.gl.COLOR_BUFFER_BIT  | this.gl.DEPTH_BUFFER_BIT);
        });
    }
    render() {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT  | this.gl.DEPTH_BUFFER_BIT);

        for(let k in this.buffers) {
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers[k].buf);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this[k]), this.gl.DYNAMIC_DRAW);
        }
        this.gl.drawArrays(this.PRIMITIVE_TYPE, 0, this.indexes.length);
     }
    setSizes({width, height}) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.gl.viewport(0, 0, width, height);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT  | this.gl.DEPTH_BUFFER_BIT);

        this.setParams({
            width2: this.canvas.width / 2,
            height2: this.canvas.height / 2
        });
    }
}