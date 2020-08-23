// addons to glMatrix.vec2, for convenience

import {length} from "gl-matrix/vec2";


// get the component of rotating vec1 to angle between vec2 and X axis

export function rotateX(vec1, vec2) {
    return vec1[0] * vec2[0] + vec1[1] * vec2[1];
}
  
export function rotateY(vec1, vec2) {
    return -vec1[1] * vec2[0] + vec1[0] * vec2[1];
}

// get normal to the vector
export function normal(out, a) {
    let len = length(a);
    if(!len) return[0,1]
    out[1] = a[0] / len;
    out[0] = a[1] / len;
    return out;
}

// get angle of the given vector to X axis
export function vec_angle(vec) {
    return Math.atan(vec[1] / vec[0]) + (vec[0] < 0 ? Math.PI : 0);
}

// angle taking into account the direction
export function angle_signed(vec1, vec2) {
    return vec_angle(vec2) - vec_angle(vec1);
}



// lepr(out, a, b, .5)
export function mean(out, a, b) {
    out[0] = (b[0] + a[0]) / 2;
    out[1] = (b[1] + a[1]) / 2;
    return out;   
}