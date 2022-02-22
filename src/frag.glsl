#ifdef GL_ES
precision mediump float;
#endif

// Derived from https://thebookofshaders.com/07/
varying highp vec2 texCoord;
varying highp vec3 color;

void main() {
    highp vec2 st = texCoord;
    // Calculate the distance function.
    highp float d = length(st);
    if (d > 1.0) {
        discard;
    }
    // Map the two calculated indicators to their colors.
    highp float a = 1.0 - smoothstep(0.95, 1.0, d);
    gl_FragColor = vec4(color.rgb, a);
}
