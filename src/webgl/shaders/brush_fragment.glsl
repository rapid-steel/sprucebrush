#ifdef GL_OES_standard_derivatives
# extension GL_OES_standard_derivatives : enable
#endif      
#define DIAG 1.41421    

precision mediump float;

uniform float spacing;
uniform vec3 color;

varying mat2 angleMat;
varying float vOpacity;
varying float vIndex;
varying float vDiameter;     
varying float vStretch;

varying vec3 hsldelta;

#ifdef SMOOTH
    uniform float hardness;  
#endif
#ifdef GRADIENT
    uniform sampler2D gradientTexture;
# ifdef BY_LEN
    uniform float gradientLength;
# endif
#endif

#ifdef TEXTURE
    uniform sampler2D texture;  
#endif

//${common_colors}

void main(void) {
    if(vDiameter == 0.0 || vStretch == 0.0 || vOpacity == 0.0) discard;

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
        float base = 1.0;
    # ifdef ROUND
        float r = 0.0;            
        r = dot(cxy, cxy);
    #  if defined SMOOTH && defined GL_OES_standard_derivatives
            float delta = fwidth(r);
            alpha = alpha - smoothstep(base - delta, base + delta, r);
    #  else
            if(r > 1.0) discard;                
    #  endif
    # else
        float r = max(abs(cxy.x), abs(cxy.y)); 
    #  if defined SMOOTH && defined GL_OES_standard_derivatives                
        float delta = fwidth(r);
        alpha = alpha - smoothstep(base - delta, base + delta, r);
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
        float div = gradientLength / spacing;
        float offset = mod(vIndex, div) / div;
    # else        
        float offset = length(cxy);
    #  ifdef RECT
        offset = max(abs(cxy.x), abs(cxy.y)); 
    #  endif
    # endif
        color1 = vec3(texture2D(gradientTexture, vec2(0.5, offset)).rgb);
    #endif
    
    
    #ifdef COLORDYNAMICS
        vec3 hsl = rgb2hsl(color1);        
        hsl.x = fract(hsl.x + hsldelta.x);
        hsl.y -= hsl.y * hsldelta.y;
        hsl.z -= hsl.z * hsldelta.z;
        color1 = hsl2rgb(hsl);

    #endif

    gl_FragColor.rgb = color1;
    gl_FragColor.a *= alpha;       
    

}