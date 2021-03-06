#version 100

//#include <definitions>

precision mediump float;
    
uniform vec2 resolution;    
uniform float diameter;
uniform float flow;
uniform float opacity;  
uniform float angle;
uniform float stretch;
uniform float spacing;

uniform float diameter_dynr;
uniform float opacity_dynr;
uniform float angle_dynr;
uniform float stretch_dynr;
uniform float hue_dynr;
uniform float saturation_dynr;
uniform float lightness_dynr;

uniform float diameter_dynlen;
uniform float opacity_dynlen;
uniform float angle_dynlen;
uniform float stretch_dynlen;
uniform float hue_dynlen;
uniform float saturation_dynlen;
uniform float lightness_dynlen;


attribute vec2 coordinates;
attribute float index;
attribute float pressure;


varying float vOpacity;
varying float vIndex;
varying float vDiameter;
varying float vStretch;
varying mat2 angleMat;

varying vec3 hsldelta;

//#include <dynamics>

#define DIAG 1.41421

void main(void) { 
    gl_Position = vec4(
        coordinates.xy * resolution.xy - vec2(1.0, -1.0), 
        0.0, 1.0);

    float linePos = index * spacing;
    
    // pressure already includes diameter dynamics
    gl_PointSize = diameter * pressure;
    vDiameter = gl_PointSize;

    
    #ifdef STRETCHDYNAMICS 
    #   if STRETCHDYNAMICS == 1
            float s = dynamics_down(stretch, linePos, stretch_dynlen);
            if(s <= 0.0)  vStretch = 0.0;
            else vStretch = 1.0 / s; 
    #   elif STRETCHDYNAMICS == 2
            float s = dynamics_periodic(stretch, stretch_dynr, linePos, stretch_dynlen); 
            if(s <= 0.0)  vStretch = 0.0;
            else vStretch = 1.0 / s; 
    #   elif STRETCHDYNAMICS == 3
            float s = dynamics_pressure(stretch, stretch_dynr, pressure); 
            if(s <= 0.0)  vStretch = 0.0;
            else vStretch = 1.0 / s; 
    #   elif STRETCHDYNAMICS == 4
            float center = stretch_dynlen * 0.5;
            float s = dynamics_amplitude(stretch_dynr, linePos, center); 
            if(s <= 0.0)  vStretch = 0.0;
            else vStretch = 1.0 / s; 
    #   elif STRETCHDYNAMICS == 6
            float s = dynamics_random(stretch_dynr * 100.0, 1.0, gl_Position.xy, index, 2.0) - stretch_dynr * 50.0; 
            vStretch = stretch;
            if(vStretch != 0.0) {
                float f = vStretch;
                if(f < 1.0) f = - 1.0 / f;
                f += s;
                if(f == 0.0) vStretch = 0.0;
                else if(f < 0.0) vStretch = - 1.0 / f;
                else vStretch = f;
            }        
    #   else
            vStretch = stretch;
    #   endif
    #else
        vStretch = stretch;
    #endif


    float angle1;
    #ifdef ANGLEDYNAMICS 
    #   if ANGLEDYNAMICS == 1
            angle1 = dynamics_down(angle, linePos, angle_dynlen);  
    #   elif ANGLEDYNAMICS == 2
            angle1 = dynamics_angle_periodic(angle, angle_dynr, linePos, angle_dynlen); 
    #   elif ANGLEDYNAMICS == 5
            angle1 = dynamics_angle_circular(index, angle_dynlen); 
    #   elif ANGLEDYNAMICS == 6
            angle1 = dynamics_random(360.0, angle_dynr, gl_Position.xy, index, 2.5) + angle; 
    #   else
            angle1 = angle;
    #   endif
    #else
        angle1 = angle;
    #endif

    angleMat = mat2(
        cos(angle1), -sin(angle1),
        sin(angle1), cos(angle1)
    );

    vOpacity = opacity * flow;


    #ifdef OPACITYDYNAMICS         
    #   if OPACITYDYNAMICS == 1
            vOpacity = dynamics_down(vOpacity, linePos, opacity_dynlen); 
    #   elif OPACITYDYNAMICS == 2
            vOpacity = dynamics_periodic(vOpacity, opacity_dynr, linePos, opacity_dynlen); 
    #   elif OPACITYDYNAMICS == 3
            vOpacity = dynamics_pressure(vOpacity, opacity_dynr, pressure); 
    #   elif OPACITYDYNAMICS == 6
            vOpacity = dynamics_random(vOpacity, opacity_dynr, gl_Position.xy, index, 3.0);
    #   endif
    #endif

    
    
    #if defined RECT || defined TEXTURE
        gl_PointSize = vDiameter * DIAG;
    #endif

    hsldelta = vec3(0.0, 0.0, 0.0);       


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

    
    vIndex = index;    
    
}