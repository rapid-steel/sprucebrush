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

        this._init();
       
    }
    createVertShader(props) {
        return  Object.entries(props)
        .map(p => `#define ${p[0].toUpperCase()} ${p[1]}`)
        .join("\n") +`
            precision highp float;
    
            uniform float radius;
            uniform float width2;
            uniform float height2;
            uniform float opacity;  
            uniform float angle;
            uniform float stretch;
            uniform float spacing;
    
            uniform float radius_dynr;
            uniform float opacity_dynr;
            uniform float angle_dynr;
            uniform float stretch_dynr;
            uniform float radius_dynlen;
            uniform float opacity_dynlen;
            uniform float angle_dynlen;
            uniform float stretch_dynlen;
            
            attribute vec2 coordinates;
            attribute float index;
            attribute float pressure;
            
    
            varying float vOpacity;
            varying float vIndex;
            varying float vRadius;
            varying float vStretch;
            varying mat2 angleMat;
    
            ${this.commonCodeBlocks.dynamics}
            #define DIAG 1.41421
    
            void main(void) { 
                gl_Position = vec4(
                    coordinates.x / width2 - 1.0, 
                    1.0 - coordinates.y / height2, 
                    0.0, 1.0);
    
                float linePos = index * spacing;
    
                
                #if RADIUSDYNAMICS == 1
                    gl_PointSize = dynamics_down(radius, linePos, radius_dynlen); 
                #elif RADIUSDYNAMICS == 2
                    gl_PointSize = dynamics_periodic(radius, radius_dynr, linePos, radius_dynlen); 
                #elif RADIUSDYNAMICS == 3
                    gl_PointSize = dynamics_pressure(radius, radius_dynr, pressure); 
                #else
                    gl_PointSize = radius;
                #endif
    
                #if STRETCHDYNAMICS == 1
                    float s = dynamics_down(stretch, linePos, stretch_dynlen);
                    if(s <= 0.0)  vStretch = 0.0;
                    else vStretch = 1.0 / s; 
                #elif STRETCHDYNAMICS == 2
                    float s = dynamics_periodic(stretch, stretch_dynr, linePos, stretch_dynlen); 
                    if(s <= 0.0)  vStretch = 0.0;
                    else vStretch = 1.0 / s; 
                #elif STRETCHDYNAMICS == 3
                    float s = dynamics_pressure(stretch, stretch_dynr, pressure); 
                    if(s <= 0.0)  vStretch = 0.0;
                    else vStretch = 1.0 / s; 
                #elif STRETCHDYNAMICS == 4
                    float center = stretch_dynlen / 2.0;
                    float s = dynamics_amplitude(stretch_dynr, linePos, center); 
                    if(s <= 0.0)  vStretch = 0.0;
                    else vStretch = 1.0 / s; 
                #else
                    vStretch = stretch;
                #endif
    
    
                float angle1;
                #if ANGLEDYNAMICS == 1
                    angle1 = dynamics_down(angle, linePos, angle_dynlen);  
                #elif ANGLEDYNAMICS == 2
                    angle1 = dynamics_angle_periodic(angle, angle_dynr, linePos, angle_dynlen); 
                #elif ANGLEDYNAMICS == 5
                    angle1 = dynamics_angle_circular(index, angle_dynlen); 
                #else
                    angle1 = angle;
                #endif
    
    
                //vOpacity = opacity * min(1.0, spacing * 4.0);
                vOpacity = opacity;
                    
                #if OPACITYDYNAMICS == 1
                    vOpacity = dynamics_down(vOpacity, linePos, opacity_dynlen); 
                #elif OPACITYDYNAMICS == 2
                    vOpacity = dynamics_periodic(vOpacity, opacity_dynr, linePos, opacity_dynlen); 
                #elif OPACITYDYNAMICS == 3
                    vOpacity = dynamics_pressure(vOpacity, opacity_dynr, pressure); 
                #endif
    
                vRadius = gl_PointSize;
                
                #if defined RECT || defined TEXTURE
                gl_PointSize = vRadius * DIAG;
                #endif
                
                vIndex = index;    
                angleMat = mat2(
                    cos(angle1), -sin(angle1),
                    sin(angle1), cos(angle1)
                );
            }`;
    }
    createFragShader(props) {
        let code = Object.entries(props)
        .map(p => `#define ${p[0].toUpperCase()} ${p[1] == 1 ? "" : p[1] + ".0"}`)
        .join("\n") + `
        #ifdef GL_OES_standard_derivatives
        #extension GL_OES_standard_derivatives : enable
        #endif
        #define DIAG 1.41421
    
        precision highp float;
        uniform float spacing;
    
        uniform vec3 color;
        varying mat2 angleMat;
        varying float vOpacity;
        varying float vIndex;
        varying float vRadius;     
        varying float vStretch;
    
        #ifdef SMOOTH
            uniform float hardness;  
        #endif
        #ifdef GRADIENT
            uniform sampler2D gradientTexture;
            uniform float gradientRatio;
        # ifdef BY_LEN
            uniform float gradientLength;
        # endif
        #endif
        
        #ifdef TEXTURE
            uniform sampler2D texture;  
        #endif
    
        void main(void) {
            if(vRadius == 0.0 || vStretch == 0.0 || vOpacity == 0.0) discard;
    
            vec3 color1 = vec3(color);
    
            float alpha = vOpacity;
            vec2 cxy = 2.0 * gl_PointCoord - 1.0;
            cxy = angleMat * cxy;
            if(vStretch > 1.0)
                cxy.y *= vStretch;
            else cxy.x /= vStretch;
            gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);   

            #ifndef ROUND
                cxy = cxy * DIAG;
            #endif
    
            #ifndef TEXTURE        
            # ifdef ROUND
                float r = 0.0;            
                r = dot(cxy, cxy);
            #  if defined SMOOTH && defined GL_OES_standard_derivatives
                    float delta = fwidth(r);
                    alpha = alpha - smoothstep(hardness - delta, 1.0 + delta, r);
            #  else
                    if(r > 1.0) discard;                
            #  endif
            # else
                float r = max(abs(cxy.x), abs(cxy.y)); 
            #  if defined SMOOTH && defined GL_OES_standard_derivatives                
                float delta = fwidth(r);
                alpha = alpha - smoothstep(hardness - delta, 1.0 + delta, r);
            #  else
                if(r > 1.0) discard;
            #  endif
            # endif
    
            #else
                vec2 texCoord = (cxy + 1.0) / 2.0;
                float r = max(abs(cxy.x), abs(cxy.y)); 
                if(r > 1.0) discard;
                gl_FragColor = texture2D(texture, texCoord);
            #endif     
    
    
            #ifdef GRADIENT
            # ifdef BY_LEN
                float div = gradientLength / spacing / 2.0;
                float offset = mod(vIndex, div) / div;
            # else        
                float offset = length(cxy);
            #  ifdef RECT
                offset = max(abs(cxy.x), abs(cxy.y)); 
            #  endif
            # endif
                color1 = vec3(texture2D(gradientTexture, vec2(0.5, offset)).rgb);
            #endif
    
            gl_FragColor.rgb = color1;
            gl_FragColor.a *= alpha;       
    
        }
        `;
        return code;
    }
    setProgram(programType) {
        this._createProgram(programType);

        this.programParams = {
            radius: "1f",
            width2: "1f",
            height2: "1f",
            opacity: "1f",
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
    }
    _getProgramType() {
        return [ 
            this.params.texture ? "texture" : this.params.shape,
            this.params.pixel ? "pixel" : "smooth",
            this.params.gradient.enabled ? "gradient-" + this.params.gradient.type : "color",
            ...Object.entries(this.dynamics).map(d => `${d[0]}dynamics:${d[1] ? d[1].type : 0}`)
        ].join("-")
    }
    setParams(params) {
        super.setParams(params);        
        this.pointStep = this.params.radius * this.params.spacing;
    }
    setAttributes() {

        if(this.program) {
            for(let param in this.params) {
                if(param == "gradient") {
                    if(this.programProps.gradient) {
                        if(this.programProps.by_len) {
                            this.gl.uniform1f(
                                this.gl.getUniformLocation(this.program, "gradientLength"), 
                                this.params.gradient.length);
                        }
                    }
                }
                else if(param == "color") {
                    this.gl.uniform3fv(
                        this.gl.getUniformLocation(this.program, "color"), 
                        this._getGlColor(this.params.color));
                }
                else if(param == "angle") {
                    let angle = this.params.angle / 180 * Math.PI;
                    this.gl.uniform1f(
                        this.gl.getUniformLocation(this.program, "angle"), angle);
                }
    
                else if(this.programParams[param]) {
                    this.gl.uniform1f(
                        this.gl.getUniformLocation(this.program, param), 
                        this.params[param]);                         
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

            this._setDynamics();
        }

    }   
}