precision mediump float;

uniform float lineWidth;
uniform float width2;
uniform float height2;
uniform float textureRatio;
uniform float gradientRatio;

attribute vec2 coordinates;
attribute vec2 miter;
attribute float lineStart;
attribute float lineLength;
attribute float index;
attribute float pressure;

uniform float opacity;
uniform float opacity_dynr;
uniform float opacity_dynlen;
uniform float lineWidth_dynr;
uniform float lineWidth_dynlen;
uniform float hue_dynr;
uniform float saturation_dynr;
uniform float lightness_dynr;
uniform float hue_dynlen;
uniform float saturation_dynlen;
uniform float lightness_dynlen;


varying vec2 texPos;
varying vec2 gradTexPos;
varying float vOpacity;
varying vec3 hsldelta;

//${common_dynamics}

void main(void) { 
    float linePos = lineStart; 

    if(index == 0.0) {
        texPos = vec2(1.0, 0.0);
    } else if(index == 5.0) {
        texPos = vec2(0.0, 1.0); 
        linePos += lineLength;
    } else if(index == 1.0 || index == 4.0) {
        texPos = vec2(0.0, 0.0);
    } else {        
        texPos = vec2(1.0, 1.0); 
        linePos += lineLength;
    }    
    gradTexPos = vec2(texPos);

    texPos.y *= lineLength * textureRatio;
    texPos.y += mod(lineStart, 1.0 / textureRatio) * textureRatio;

    gradTexPos.y *= lineLength * gradientRatio;
    gradTexPos.y += mod(lineStart, 1.0 / gradientRatio) * gradientRatio;


    #if LINEWIDTHDYNAMICS == 1
        float lineDynamics = dynamics_down(1.0, linePos, lineWidth_dynlen); 
        vec2 pos = coordinates + vec2(miter * lineWidth * lineDynamics / 2.0);
    #elif LINEWIDTHDYNAMICS == 2
        float lineDynamics = dynamics_periodic(1.0, lineWidth_dynr, linePos, lineWidth_dynlen); 
        vec2 pos = coordinates + vec2(miter * lineWidth * lineDynamics / 2.0);
    #elif LINEWIDTHDYNAMICS == 3
        float lineDynamics = dynamics_pressure(1.0, lineWidth_dynr, pressure); 
        vec2 pos = coordinates + vec2(miter * lineWidth * lineDynamics / 2.0);
    #else
        vec2 pos = coordinates + vec2(miter * lineWidth / 2.0);
    #endif


    
    #if OPACITYDYNAMICS == 1
        vOpacity = dynamics_down(opacity, linePos, opacity_dynlen); 
    #elif OPACITYDYNAMICS == 2
        vOpacity = dynamics_periodic(opacity, opacity_dynr, linePos, opacity_dynlen); 
    #elif OPACITYDYNAMICS == 3
        vOpacity = dynamics_pressure(opacity, opacity_dynr, pressure); 
    #else
        vOpacity = opacity; 
    #endif

    

    #ifdef COLORDYNAMICS            

    #if HUEDYNAMICS == 2
        hsldelta.x = dynamics_periodic(1.0, hue_dynr, linePos, hue_dynlen); 
    #elif HUEDYNAMICS == 3
        hsldelta.x = dynamics_pressure(1.0, hue_dynr, pressure); 
    #elif HUEDYNAMICS == 6
        hsldelta.x = dynamics_random(1.0, hue_dynr, gl_Position.xy, index, 3.5);
    #endif

    #if SATURATIONDYNAMICS == 2
        hsldelta.y = dynamics_periodic(saturation_dynr, 1.0, linePos, saturation_dynlen); 
    #elif SATURATIONDYNAMICS == 3
        hsldelta.y = dynamics_pressure(saturation_dynr, 1.0, pressure); 
    #elif SATURATIONDYNAMICS == 6
        hsldelta.y = dynamics_random(saturation_dynr, 1.0, gl_Position.xy, index, 4.0);
    #endif

    #if LIGHTNESSDYNAMICS == 2
        hsldelta.z = dynamics_periodic(lightness_dynr, 1.0, linePos, lightness_dynlen); 
    #elif LIGHTNESSDYNAMICS == 3
        hsldelta.z = dynamics_pressure(lightness_dynr, 1.0, pressure); 
    #elif LIGHTNESSDYNAMICS == 6
        hsldelta.z = dynamics_random(lightness_dynr, 1.0, gl_Position.xy, index, 4.0);
    #endif
    
    #endif

    
    gl_Position = vec4(
        (pos.x - width2) / width2, 
        (height2 - pos.y) / height2, 
        0.0, 1.0);   
    
}