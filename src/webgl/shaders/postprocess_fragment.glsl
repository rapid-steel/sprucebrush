precision mediump float;

varying vec2 vTexcoord;
uniform sampler2D rendered_img;

void main() {
   gl_FragColor = texture2D(rendered_img, vTexcoord);
}