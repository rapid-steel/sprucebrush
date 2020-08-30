
attribute vec2 pos;
varying vec2 vPos;

void main(void) {
    gl_Position = vec4(pos, 0.0, 1.0);
    vPos = (pos + 1.0) / 2.0;
}