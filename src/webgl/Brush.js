import ToolWebGL from "./ToolWebGL";
const DEBUG = process.env.NODE_ENV !== 'production';


export default class Brush extends ToolWebGL {
    constructor() {
        super();
        this.points = [];
        this.buffers = {
            vertices: { attrib: "coordinates", size: 2, type: this.gl.FLOAT },            
            indexes:  { attrib: "index",  size: 1, type: this.gl.FLOAT },
            pressures: { attrib: "pressure", size: 1, type: this.gl.FLOAT },
        };

        this.PRIMITIVE_TYPE = this.gl.POINTS;
        this.pointStep = 1;
        this.index = 0;

        // since step between points depends on diameter,
        // diameter dynamics must be applied on js part 
        // pressureFunc gets pressures at point1 and point2 and position between them        
        this.getPressureFunc = {
            [this.DYNTYPE.DISABLED]:() => 1,
            [this.DYNTYPE.FADE]: () => 
                Math.max(
                    1 - this.index * this.params.spacing / 
                             this.dynamics.diameter.length, 
                    0),
            [this.DYNTYPE.PERIOD_MAX]: () => 
                1 - this.dynamics.diameter.range * 
                    Math.sin(
                        Math.PI * 
                        ((this.index * this.params.spacing / 
                               this.dynamics.diameter.length) % 1)
                    ),
            [this.DYNTYPE.PRESSURE]: (p0, p, d) => p0 + (p - p0) * d,
            [this.DYNTYPE.RANDOM]: 
                () => (1.00001 - Math.random() * this.dynamics.diameter.range) 
        };

        this.PROGRAM_NAME = "brush";

        this._init();
       
    }
    setProgram(programType) {
        this._createMainProgram(programType);

        this.programParams = {
            diameter: "1f",
            resolution: "2fv",
            opacity: "1f",
            flow: "1f",
            stretch: "1f",
            angle: "1f",
            spacing: "1f",
            hardness: "1f"
        };

        if(this.programProps.smooth) {
            this.programParams.hardness = "1f";
        }

        if(this.programProps.gradient) {
            if(this.programProps.by_len) 
                this.programParams.linearGradientLength = "1f";
        } else {
            this.programParams.color = "3fv";
        }

    }
    _addPoint({coords, pressure}) {
        
        if(this.vertices.length === 0) {
            this.vertices.push(coords[0]);
            this.vertices.push(coords[1]);
            this.pressures.push(this.pressureFunc(pressure, pressure, 0));
            this.indexes.push(++this.index);
        } else  {
            let coords0 = this.vertices.slice(-2);
            let pressure0 = this.pressures[this.pressures.length-1];
            let lx = coords[0] - coords0[0];
            let ly = coords[1] - coords0[1];
            
            let length = Math.sqrt(
                Math.pow(lx, 2) + Math.pow(ly, 2)
            );            
            let dlx = lx / length;
            let dly = ly / length;
            
            let press_prev = pressure0;
            let press_next = this.pressureFunc(pressure0, pressure, 0);

            for(let i = this.pointStep * (press_prev + press_next) / 2; i <= length;) {
                let delta = i / length;
               
                if(this.scatterLength) {
                    let rand = (Math.random() - 0.5) * this.scatterLength;
                    this.vertices.push(delta * lx + coords0[0] + dly * rand);
                    this.vertices.push(delta * ly + coords0[1] + dlx * rand);
                } else {
                    this.vertices.push(delta * lx + coords0[0]);
                    this.vertices.push(delta * ly + coords0[1]);
                }               
                
                this.pressures.push(press_next);
                this.indexes.push(++this.index);
                press_prev = press_next; 
                press_next = this.pressureFunc(pressure0, pressure, delta);    
                i += this.pointStep * ((press_prev + press_next) / 2 || 1);                           
            }               
                    
        }
    }
    _getProgramType() {
        return [ 
            this.texture ? "texture" : this.params.shape,
            this.params.pixel ? "pixel" : "smooth",
            this.gradient && this.gradient.enabled ? "gradient-" + this.gradient.type : "color",
            ...Object.entries(this.dynamics).map(d => `${d[0]}dynamics:${d[1] ? d[1].type : 0}`)
        ].join("-")
    }
    setParams(params) {
        super.setParams(params);        
        this.pointStep = this.params.diameter * this.params.spacing;
        this.scatterLength = this.params.scatter * this.params.diameter * 2;
        this.pressureFunc = this.getPressureFunc[this.dynamics.diameter.type];
        
        // clear the index, if dynamics type = fade
        if(this.dynamics.diameter.type == 1) this.index = 0;
    }
}