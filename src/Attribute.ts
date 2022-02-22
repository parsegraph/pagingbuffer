export default class Attribute {
  _name: string;
  _numComponents: number;
  _drawMode: number;
  _location: number;
  _index: number;

  constructor(
    name: string,
    index: number,
    numComponents: number,
    drawMode: number,
    location: number
  ) {
    this._name = name;
    this._index = index;
    this._numComponents = numComponents;
    this._drawMode = drawMode;
    this._location = location;
  }

  enable(gl: WebGLRenderingContext) {
    if (!this.hasLocation()) {
      return;
    }
    gl.enableVertexAttribArray(this.location());
  }

  disable(gl: WebGLRenderingContext) {
    if (!this.hasLocation()) {
      return;
    }
    gl.disableVertexAttribArray(this.location());
  }

  name() {
    return this._name;
  }

  index() {
    return this._index;
  }

  numComponents() {
    return this._numComponents;
  }

  drawMode() {
    return this._drawMode;
  }

  location() {
    return this._location;
  }

  hasLocation() {
    return this.location() !== -1;
  }
}
