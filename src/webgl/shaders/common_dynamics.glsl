#define PI2 6.2832

float rand(vec2 co){
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}
float rand(vec2 co, float index) {
    return rand(vec2(rand(co), index));
}
float rand(vec2 co, float index, float s) {
    return rand(vec2(rand(co), index), s);
}

float dynamics_random(float base, float dynr, vec2 coords, float index, float s) {
    return (1.0 - dynr * rand(coords, index, s)) * base;
}

float dynamics_down(float base, float index, float length) {
    if(index > length) return 0.0;
    return base * (length - index) / length;
}

float dynamics_periodic(float base, float dynr, float index, float length) {
    float l2 = length / 2.0;
    float f = mod(index, length) / l2;
    if(f > 1.0) f = 2.0 - f;
    return base * (1.0 - f * dynr);
}

float dynamics_amplitude(float dynr, float index, float length) {
    float l4 = length / 4.0;
    float f = mod(index, length) / l4;
    if(f > 2.0) {
        if(f > 3.0) f = 4.0 - f;
        else f = f - 2.0;
        if(f == 0.0 || dynr == 0.0) return 0.0;
        return 1.0 / (1.0 - dynr * f); 
    }
    if(f > 1.0) 
        f = 2.0 - f;
    return 1.0 * (1.0 - dynr * f); 
}

float dynamics_angle_periodic(float base, float dynr, float index, float length) {
    float l2 = length / 2.0;
    float f = mod(index, length) / l2;
    if(f > 1.0) f = 2.0 - f;
    return base + PI2 * (1.0 - f * dynr);
}

float dynamics_angle_circular(float index, float length) {
    float f = mod(index, length) / length;
    return f * PI2;
}

float dynamics_pressure(float base, float dynr, float pressure) {
    return base * (1.0 - (1.0 - pressure) * dynr);
}  