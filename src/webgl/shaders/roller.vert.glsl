#version 100

//#include <definitions>

precision mediump float;

uniform vec2 resolution;

uniform float lineWidth;
uniform float opacity;
uniform float textureRatio;
uniform float gradientRatio;

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

attribute vec2 coordinates;
attribute vec2 miter;
attribute float lineStart;
attribute float lineLength;
attribute float index;
attribute float pressure;

varying vec2 texPos;
varying vec2 gradTexPos;
varying float vOpacity;
varying vec3 hsldelta;

//#include <dynamics>


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

    vec2 pos;
    #ifdef LINEWIDTHDYNAMICS
    #   if LINEWIDTHDYNAMICS == 1
            float lineDynamics = dynamics_down(1.0, linePos, lineWidth_dynlen); 
            pos = coordinates + vec2(miter * lineWidth * lineDynamics * 0.5);

    #   elif LINEWIDTHDYNAMICS == 2
            float lineDynamics = dynamics_periodic(1.0, lineWidth_dynr, linePos, lineWidth_dynlen); 
            pos = coordinates + vec2(miter * lineWidth * lineDynamics * 0.5);

    #   elif LINEWIDTHDYNAMICS == 3
            float lineDynamics = dynamics_pressure(1.0, lineWidth_dynr, pressure); 
            pos = coordinates + vec2(miter * lineWidth * lineDynamics * 0.5);
            
    #   else
            pos = coordinates + vec2(miter * lineWidth * 0.5);
    #   endif    
    #else
        pos = coordinates + vec2(miter * lineWidth * 0.5);
    #endif


    #ifdef OPACITYDYNAMICS
    #   if OPACITYDYNAMICS == 1
            vOpacity = dynamics_down(opacity, linePos, opacity_dynlen); 
    #   elif OPACITYDYNAMICS == 2
            vOpacity = dynamics_periodic(opacity, opacity_dynr, linePos, opacity_dynlen); 
    #   elif OPACITYDYNAMICS == 3
            vOpacity = dynamics_pressure(opacity, opacity_dynr, pressure); 
    #   else
            vOpacity = opacity; 
    #   endif
    #else
        vOpacity = opacity; 
    #endif

    

    #ifdef COLORDYNAMICS            

    #   if HUEDYNAMICS == 2
            hsldelta.x = dynamics_periodic(1.0, hue_dynr, linePos, hue_dynlen); 
    #   elif HUEDYNAMICS == 3
            hsldelta.x = dynamics_pressure(1.0, hue_dynr, pressure); 
    #   elif HUEDYNAMICS == 6
            hsldelta.x = dynamics_random(1.0, hue_dynr, gl_Position.xy, index, 3.5);
    #   endif

    #   if SATURATIONDYNAMICS == 2
            hsldelta.y = dynamics_periodic(saturation_dynr, 1.0, linePos, saturation_dynlen); 
    #   elif SATURATIONDYNAMICS == 3
            hsldelta.y = dynamics_pressure(saturation_dynr, 1.0, pressure); 
    #   elif SATURATIONDYNAMICS == 6
            hsldelta.y = dynamics_random(saturation_dynr, 1.0, gl_Position.xy, index, 4.0);
    #   endif

    #   if LIGHTNESSDYNAMICS == 2
            hsldelta.z = dynamics_periodic(lightness_dynr, 1.0, linePos, lightness_dynlen); 
    #   elif LIGHTNESSDYNAMICS == 3
            hsldelta.z = dynamics_pressure(lightness_dynr, 1.0, pressure); 
    #   elif LIGHTNESSDYNAMICS == 6
            hsldelta.z = dynamics_random(lightness_dynr, 1.0, gl_Position.xy, index, 4.0);
    #   endif
    
    #endif

    
    gl_Position = vec4(
        pos.xy * resolution.xy - vec2(1.0, -1.0), 
        0.0, 1.0);
    
}