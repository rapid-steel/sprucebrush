vec3 rgb2hsl(vec3 rgb) {
    float minc = min(rgb.r, min(rgb.b, rgb.g));
    float maxc = max(rgb.r, max(rgb.b, rgb.g));
    float hue = 0.0;
    if(maxc != minc) {
        float angle = 0.0;
        float dc;
        if(rgb.r == maxc) {
            dc = rgb.g - rgb.b;
        } else if(rgb.g == maxc) {
            dc = rgb.b - rgb.r;
            angle = 2.0;
        } else {
            dc = rgb.r - rgb.g;
            angle = 4.0;
        }                    
        hue = fract((dc / (maxc - minc) + angle) / 6.0);
    } 
    float saturation = (maxc - minc) / (1.0 - abs(1.0 - (maxc + minc)));               
    float lightness = (minc + maxc) / 2.0;
    return vec3(hue, saturation, lightness);
}

vec3 hsl2rgb(vec3 hsl) {
    
    float h = hsl.x;
    float s = hsl.y;
    float l = hsl.z;
    float c = (1.0 - abs(2.0 * l - 1.0)) * s;
    float h1 = h * 6.0;
    float x = c * (1.0 - abs(mod(h1, 2.0) - 1.0));
    vec3 rgb1 = vec3(0.0, 0.0, 0.0);
    vec2 t = vec2(c, x);
    if(h1 < 1.0) {
        rgb1.rg = t;
    } else if(h1 < 2.0) {
        rgb1.gr = t;
    } else if(h1 < 3.0) {
        rgb1.gb = t;
    } else if(h1 < 4.0) {
        rgb1.bg = t;
    } else if(h1 < 5.0) {
        rgb1.br = t;
    } else {
        rgb1.rb = t;
    }

    float m = l - c / 2.0;

    return rgb1 + m;
}