import PagingBuffer from ".";
import vertShaderSource from "./vert.glsl";
import fragShaderSource from "./frag.glsl";
import Color from "parsegraph-color";

const interval = 10000;
const intervalMargin = 1000;
const minTrailers = 250;

document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("demo");
  root.style.position = "relative";
  root.style.overflow = "hidden";
  const trailerCanvas = document.createElement("canvas");
  trailerCanvas.style.position = "absolute";
  trailerCanvas.style.left = "0px";
  trailerCanvas.style.right = "0px";
  trailerCanvas.style.top = "0px";
  trailerCanvas.style.bottom = "0px";
  trailerCanvas.style.zIndex = "0";
  root.appendChild(trailerCanvas);
  const gl = trailerCanvas.getContext("webgl");

  const prog = gl.createProgram();
  const vShader = gl.createShader(gl.VERTEX_SHADER);
  const fShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(vShader, vertShaderSource);
  gl.compileShader(vShader);
  gl.attachShader(prog, vShader);
  gl.shaderSource(fShader, fragShaderSource);
  gl.compileShader(fShader);
  gl.attachShader(prog, fShader);
  gl.linkProgram(prog);

  const pg = new PagingBuffer(gl, prog);
  pg.defineAttrib("a_texCoord", 2);
  pg.defineAttrib("a_color", 3);
  pg.defineAttrib("start", 2);
  pg.defineAttrib("end", 2);
  pg.defineAttrib("duration", 1);
  pg.defineAttrib("size", 1);
  pg.defineAttrib("startTime", 1);

  const refresh = () => {
    pg.clear();
    pg.addPage();
    const playing = new Date();
    if (trailerCanvas.width !== root.clientWidth) {
      trailerCanvas.width = root.clientWidth;
    }
    if (trailerCanvas.height !== root.clientHeight) {
      trailerCanvas.height = root.clientHeight;
    }
    const sw = trailerCanvas.width;
    const sh = trailerCanvas.height;
    gl.viewport(0, 0, sw, sh);

    const curInterval = Math.random() * interval;

    const addTrailer = (startX: number, startY: number, color: Color) => {
      const size = Math.floor(2 + 100 * Math.random());
      const sw = root.clientWidth;
      const sh = root.clientHeight;
      const end = [Math.random() * sw, Math.random() * sh];
      const startTime = Date.now() - playing.getTime();
      const duration = Math.random() * curInterval;
      [
        [
          [1, 1],
          [-1, 1],
          [-1, -1],
        ],
        [
          [1, 1],
          [-1, -1],
          [1, -1],
        ],
      ].forEach((texCoords) => {
        texCoords.forEach((texCoord) => {
          pg.append2D("start", startX / sw, (sh - startY) / sh);
          pg.append2D("end", end[0] / sw, (sh - end[1]) / sh);
          pg.append2D("a_texCoord", texCoord[0], texCoord[1]);
          pg.append3D("a_color", color.r(), color.g(), color.b());
          pg.append1D("startTime", startTime);
          pg.append1D("duration", duration);
          pg.append1D("size", size / Math.min(sw, sh));
        });
      });
    };

    const paintTrailers = (() => {
      const numTrailers = Math.floor(minTrailers * Math.random());
      let i = 0;
      return () => {
        if (i < minTrailers + numTrailers) {
          const x = Math.random() * root.clientWidth;
          const y = Math.random() * root.clientHeight;
          addTrailer(x, y, Color.random());
          ++i;
        }
        return i < minTrailers + numTrailers;
      };
    })();

    const animate = () => {
      const now = Date.now();
      while (paintTrailers() && Date.now() - now < 5);

      const pct =
        Math.min(curInterval + intervalMargin, Date.now() - playing.getTime()) /
        (curInterval + intervalMargin);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(prog);
      gl.uniform1f(
        gl.getUniformLocation(prog, "time"),
        Date.now() - playing.getTime()
      );
      gl.uniform1f(gl.getUniformLocation(prog, "aspectRatio"), sw / sh);
      pg.renderPages();
      gl.useProgram(null);
      if (pct < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
    setTimeout(refresh, curInterval + intervalMargin);
  };
  refresh();
});
