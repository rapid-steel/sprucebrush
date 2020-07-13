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
    gl_Position = vec4((coordinates.x - width2) / width2, (height2 - coordinates.y) / height2, 0.0, 1.0);
    gl_PointSize = radius * pressure;
    vPressure = pressure;      
    vIndex = index;    
    vRadius = radius;
}`;

const fragmentShader = `
#ifdef GL_OES_standard_derivatives
#extension GL_OES_standard_derivatives : enable
#endif

precision mediump float;
uniform vec3 color;
uniform float opacity;
varying float vPressure;   
uniform float hardness;        

void main(void) {
    float r = 0.0, delta = 0.0, alpha = opacity * vPressure;
    vec2 cxy = 2.0 * gl_PointCoord - 1.0;
    r = dot(cxy, cxy);
#ifdef GL_OES_standard_derivatives
    delta = fwidth(r);
    alpha = alpha - smoothstep(hardness - delta, 1.0 + delta, r);
#endif
    gl_FragColor = vec4(color, alpha);
}`;

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
        this.gl.blendFuncSeparate(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA, this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA);
        this.gl.depthMask(false);        

        this.gl.clear(this.gl.COLOR_BUFFER_BIT  | this.gl.DEPTH_BUFFER_BIT);

        const vertShader = this.gl.createShader(this.gl.VERTEX_SHADER);
        this.gl.shaderSource(vertShader, vertexShader);
        this.gl.compileShader(vertShader);
        if(DEBUG) 
            console.log(this.gl.getShaderInfoLog(vertShader));

        const fragShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);

        this.gl.shaderSource(fragShader, fragmentShader);
        this.gl.compileShader(fragShader);
        if(DEBUG) 
            console.log(this.gl.getShaderInfoLog(fragShader));

        this.program = this.gl.createProgram();
        this.gl.attachShader(this.program, vertShader); 
        this.gl.attachShader(this.program, fragShader);
        this.gl.linkProgram(this.program);
        this.gl.useProgram(this.program);

        this.vertex_buffer = this.gl.createBuffer();
        this.index_buffer = this.gl.createBuffer();
        this.pressure_buffer = this.gl.createBuffer();        
        
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertex_buffer);
        const coord = this.gl.getAttribLocation(this.program, "coordinates");
        this.gl.vertexAttribPointer(coord, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(coord);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.pressure_buffer);
        var press = this.gl.getAttribLocation(this.program, "pressure");
        this.gl.vertexAttribPointer(press, 1, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(press);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.index_buffer);
        let ind = this.gl.getAttribLocation(this.program, "index");
        this.gl.vertexAttribPointer(ind, 1, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(ind);

        this.programParams = {
            radius: "1f",
            width2: "1f",
            height2: "1f",
            opacity: "1f",
            hardness: "1f",
            color: "3fv"
        };
        this.params = {
            spacing: .05,
            radius: 1
        };
        this.update = false;
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
      //      if(length >= step) {
                this.points.push({coords, pressure});
                for(let i = 0; i < length; i += step) {
                    let delta = i / length;
                    this.vertices.push(delta * lx + p0.coords[0]);
                    this.vertices.push(delta * ly + p0.coords[1]);
                    this.pressures.push(delta * lp + p0.pressure);
                    this.indexes.push(this.indexes.length);
                }                
       //     }
           
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
    setParams(params) {
        for(let param in params) {
            if(this.programParams[param]) {
                let loc = this.gl.getUniformLocation(this.program, param);
                this.gl[`uniform${this.programParams[param]}`](loc, params[param]);
                console.log(param, params[param])
            }   
            if(this.params[param] !== undefined) {
                this.params[param] = params[param];
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