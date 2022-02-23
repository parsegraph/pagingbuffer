import PagingBuffer from ".";

import vertShaderSource from "./vert.glsl";
import fragShaderSource from "./frag.glsl";
import Color from "parsegraph-color";

const minTrailers = 100;
const TRAILER_SIZE = 100;
const interval = 6000;
const intervalMargin = 1000;
const trailerDecay = 1.0;

document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("demo");
  root.style.position = "relative";
  root.style.overflow = "hidden";

  const container = document.createElement("div");
  container.innerHTML = "Click to animate";
  container.style.position = "absolute";
  container.style.left = "0px";
  container.style.top = "0px";
  container.style.pointerEvents = "none";
  root.appendChild(container);
  container.style.fontSize = "18px";
  container.style.fontFamily = "sans";

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
  // gl.enable(gl.BLEND);
  // gl.blendFunc(gl.ONE, gl.SRC_ALPHA);
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

  let playing: Date = null;
  let lastPos: [number, number, Color] = [0, 0, new Color(1, 1, 1, 1)];

  const fullStart = Date.now();

  const moveContainer = () => {
    pg.clear();
    pg.addPage();

    const addTrailer = (startX: number, startY: number, color: Color) => {
      const size = Math.floor(2 + TRAILER_SIZE * Math.random());
      const sw = root.clientWidth;
      const sh = root.clientHeight;
      const end = [Math.random() * sw, Math.random() * sh];
      const startTime = Date.now() - fullStart;
      const duration = trailerDecay * Math.random() * (interval - intervalMargin);
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
    playing = new Date();
    if (trailerCanvas.width !== root.clientWidth) {
      trailerCanvas.width = root.clientWidth;
    }
    if (trailerCanvas.height !== root.clientHeight) {
      trailerCanvas.height = root.clientHeight;
    }
    const newBG = Color.random();
    document.body.style.backgroundColor = newBG.asRGBA();
    container.style.color = Color.random().asRGB();

    const x = Math.random() * root.clientWidth;
    const y = Math.random() * root.clientHeight;
    container.style.transform = `translate(${x}px, ${y}px)`;
    container.style.zIndex = "2";

    const makeTrailerPainter = (lastPos:[number, number, Color])=>{
      const numTrailers = Math.floor(minTrailers * Math.random());
      if (!lastPos) {
        return ()=>{
          return false;
        }
      }
      let i = 0;
      container.innerHTML = "" + (numTrailers + minTrailers);
      return ()=>{
        if (i < minTrailers + numTrailers) {
          addTrailer(...lastPos);
          ++i;
        }
        return i < minTrailers + numTrailers;
      };
    };

    const paintTrailers = makeTrailerPainter(lastPos);
    lastPos = [x, y, newBG];
    const sw = trailerCanvas.width;
    const sh = trailerCanvas.height;
    gl.viewport(0, 0, sw, sh);
    const animate = () => {
      if (!playing) {
        return;
      }
      const now = Date.now();
      while(paintTrailers() && Date.now() - now < 5);

      const pct = Math.min(interval, Date.now() - playing.getTime()) / interval;
      gl.useProgram(prog);
      gl.uniform1f(gl.getUniformLocation(prog, "time"), Date.now() - fullStart);
      gl.uniform1f(gl.getUniformLocation(prog, "aspectRatio"), sw / sh);
      pg.renderPages();
      gl.useProgram(null);
      if (timer && pct < 1) {
        animation = requestAnimationFrame(animate);
      }
    };
    let animation = requestAnimationFrame(animate);

    return ()=>{
      cancelAnimationFrame(animation);
      playing = null;
    };
  };

  const dot = document.createElement("div");
  dot.style.position = "absolute";
  dot.style.right = "8px";
  dot.style.top = "8px";
  dot.style.width = "16px";
  dot.style.height = "16px";
  dot.style.borderRadius = "8px";
  dot.style.transition = "background-color 400ms";
  dot.style.backgroundColor = "#222";
  root.appendChild(dot);

  container.style.transition = `color ${interval - intervalMargin}ms, transform ${
    interval - intervalMargin
  }ms, top ${interval - intervalMargin}ms`;
  document.body.style.transition = `background-color ${interval - intervalMargin}ms`;
  let timer: any = null;
  let dotTimer: any = null;
  let dotIndex = 0;
  const dotState = ["#f00", "#c00"];
  const refreshDot = () => {
    dotIndex = (dotIndex + 1) % dotState.length;
    dot.style.backgroundColor = dotState[dotIndex];
  };
  const dotInterval = 500;

  let animationCleaner:()=>void;
  root.addEventListener("click", () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
      clearInterval(dotTimer);
      if (animationCleaner) {
        animationCleaner();
      }
      dotTimer = null;
      dot.style.transition = "background-color 3s";
      dot.style.backgroundColor = "#222";
    } else {
      playing = new Date();
      trailerCanvas.width = root.clientWidth;
      trailerCanvas.height = root.clientHeight;
      animationCleaner = moveContainer();
      dot.style.transition = "background-color 400ms";
      refreshDot();
      timer = setInterval(()=>{
        if (animationCleaner) {
          animationCleaner();
        }
        animationCleaner = moveContainer();
      }, interval);
      dotTimer = setInterval(refreshDot, dotInterval);
    }
  });
});
