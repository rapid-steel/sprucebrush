
precision mediump float;
uniform sampler2D img;
varying vec2 vPos;


void main(void) {
    gl_FragColor = texture2D(img, vPos); 
}