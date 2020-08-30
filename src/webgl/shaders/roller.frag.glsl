#version 100

//#include <definitions>

#if (defined GRADIENT || defined TEXTURE)
# define COLORFUNC
#endif

precision mediump float;
uniform vec3 color;      
uniform sampler2D texture;
uniform sampler2D gradientTexture;
        
varying vec2 texPos;
varying vec2 gradTexPos;
varying float vOpacity;
varying vec3 hsldelta;

//#include <colors>

void main(void) {
    gl_FragColor = vec4(color, 1.0);

    #ifdef TEXTURE
    gl_FragColor.a = texture2D(texture, texPos).a;
    #endif           

    #ifdef GRADIENT
    gl_FragColor.rgb = texture2D(gradientTexture, gradTexPos).rgb;                         
    #endif      

    #ifdef COLORDYNAMICS
        vec3 hsl = rgb2hsl(gl_FragColor.rgb);        
        hsl.x = fract(hsl.x + hsldelta.x);
        hsl.y -= hsl.y * hsldelta.y;
        hsl.z -= hsl.z * hsldelta.z;
        gl_FragColor.rgb = hsl2rgb(hsl);

    #endif

    gl_FragColor.a *= vOpacity;
}