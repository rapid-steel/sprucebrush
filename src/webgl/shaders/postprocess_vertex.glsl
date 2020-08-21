attribute vec4 a_position;
attribute vec2 coord;

varying vec2 texcoord;

void main() {
  gl_Position = coord;
  vTexcoord = texcoord;
}