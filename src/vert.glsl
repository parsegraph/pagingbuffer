uniform highp float time;
uniform highp float aspectRatio;

attribute vec2 a_texCoord;
attribute vec3 a_color;
attribute vec2 start;
attribute vec2 end;
attribute highp float duration;
attribute highp float size;
attribute highp float startTime;

// Derived from https://thebookofshaders.com/07/
varying highp vec2 texCoord;
varying highp vec3 color;

void main() {
    highp float pct = min(1.0, (time - startTime) / duration);
    highp float curSize = mix(mix(0.0, size, min(1.0, pct * 5.0)), 0.0, pct);
    gl_Position = vec4(mix(start, end, pct) + mix(
        vec2(0.0, 0.0),
        vec2(curSize * a_texCoord.x / min(1.0, aspectRatio), curSize * a_texCoord.y * aspectRatio),
        pct
    ), 0.0, 1.0);
    gl_Position.x = 2.0 * gl_Position.x - 1.0;
    gl_Position.y = 2.0 * gl_Position.y - 1.0;
    color = a_color;
    texCoord = a_texCoord;
}
