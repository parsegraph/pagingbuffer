import PageGroup from "./PageGroup";
import Attribute from "./Attribute";

export default class BufferPage {
  _id: string | number;
  _buffers: number[][];
  _glBuffers: WebGLBuffer[];
  _needsUpdate: boolean;
  _renderFunc: (gl: WebGLRenderingContext, numIndices: number) => void;
  _renderFuncThisArg: object;
  _pg: PageGroup;

  constructor(
    pagingBuffer: PageGroup,
    renderFunc?: (gl: WebGLRenderingContext, numIndices: number) => void,
    renderFuncThisArg?: object
  ) {
    if (!renderFuncThisArg) {
      renderFuncThisArg = this;
    }
    if (!renderFunc) {
      renderFunc = function (gl: WebGLRenderingContext, numIndices: number) {
        // console.log("Drawing " + numIndices + " indices");
        gl.drawArrays(gl.TRIANGLES, 0, numIndices);
      };
    }

    this._buffers = [];
    this._glBuffers = [];
    this._needsUpdate = true;
    this._renderFunc = renderFunc;
    this._renderFuncThisArg = renderFuncThisArg;

    this._pg = pagingBuffer;

    // Add a buffer entry for each vertex attribute.
    pagingBuffer.eachAttrib(() => this.addAttrib());
  }

  clear() {
    this.pg().eachAttrib((attrib) => {
      this.clearAttrib(attrib.index());
    });
    this._needsUpdate = true;
  }

  id() {
    return this._id;
  }

  setId(id: string | number) {
    this._id = id;
  }

  gl() {
    return this.pg().gl();
  }

  clearAttrib(attribIndex: number) {
    /* if(this.glBuffers[attribIndex] != null) {
      this.gl().deleteBuffer(this.glBuffers[attribIndex]);
      this.glBuffers[attribIndex] = null;
    }*/
    this._buffers[attribIndex] = [];
  }

  addAttrib() {
    this._buffers.push([]);
    this._glBuffers.push(null);
  }

  isEmpty() {
    if (this._buffers.length === 0) {
      return true;
    }
    for (let j = 0; j < this._buffers.length; ++j) {
      const buffer = this._buffers[j];
      if (buffer.length === 0) {
        return true;
      }
    }
    return false;
  }

  pg() {
    return this._pg;
  }

  private parseIndex(attribIndexOrStr: number | string):number {
    let attribIndex: number;
    if (typeof attribIndexOrStr === "string") {
      if (!isNaN(parseInt(attribIndexOrStr, 10))) {
        attribIndex = parseInt(attribIndexOrStr, 10);
      } else {
        attribIndex = this.pg().getIndex(attribIndexOrStr);
      }
    } else {
      attribIndex = attribIndexOrStr as number;
    }
    // Ensure attribIndex points to a valid attribute.
    if (attribIndex < 0 || attribIndex > this._buffers.length - 1) {
      throw new Error("attribIndex is out of range. Given: " + attribIndex);
    }
    if (typeof attribIndex !== "number") {
      throw new Error("attribIndex must be a number.");
    }
    return attribIndex;
  }

  appendValue(attribIndexOrStr: number | string, value: number) {
    const attribIndex = this.parseIndex(attribIndexOrStr);
      if (Number.isNaN(value) || typeof value != "number") {
        throw new Error("Value is not a number: " + value);
      }
      this._buffers[attribIndex].push(value);
      this._needsUpdate = true;
  }

  /*
   * appendData(attribIndex, value1, value2, ...);
   * appendData(attribIndex, valueArray);
   *
   * Adds each of the specified values to the working buffer. If the value is an
   * array, each of its internal values are added.
   */
  appendData(attribIndexOrStr: number | string, ...args: any[]) {
    const appendValue = (value: any) => {
      let numAdded = 0;
      if (typeof value !== "number") {
        if (typeof value.forEach == "function") {
          value.forEach(function (x: number | number[]) {
            numAdded += appendValue(x);
          }, this);
          return numAdded;
        }
        if (typeof value.length == "number") {
          for (let i = 0; i < value.length; ++i) {
            numAdded += appendValue(value[i]);
          }
          return numAdded;
        }
        throw new Error("Value must be reduced to a number, got " + typeof value);
      }
      this.appendValue(attribIndexOrStr, value as number);
      return 1;
    };

    // Add each argument individually.
    let cumulativeAdded = 0;
    for (let i = 0; i < args.length; ++i) {
      cumulativeAdded += appendValue(args[i]);
    }
    return cumulativeAdded;
  }

  render() {
    let count = 0;
    let numIndices: number;
    const gl = this.gl();

    // Prepare each vertex attribute.
    this.pg().eachAttrib((attrib: Attribute) => {
      const attribIndex = attrib.index();

      // Bind the buffer, creating it if necessary.
      if (this._glBuffers[attribIndex] == null) {
        this._glBuffers[attribIndex] = gl.createBuffer();
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, this._glBuffers[attribIndex]);

      // Load buffer data if the page needs an update.
      const bufferData = this._buffers[attribIndex];
      if (this._needsUpdate && bufferData.length > 0) {
        // console.log("Pushing bytes to GL");
        gl.bufferData(
          gl.ARRAY_BUFFER,
          new Float32Array(bufferData),
          attrib.drawMode()
        );
      }

      // Set up the vertex attribute pointer.
      gl.vertexAttribPointer(
        attrib.location(),
        attrib.numComponents(),
        gl.FLOAT,
        false,
        0,
        0
      );

      const thisNumIndices = bufferData.length / attrib.numComponents();
      if (Math.round(thisNumIndices) != thisNumIndices) {
        throw new Error(
          "Odd number of indices for attrib " +
            attrib.name +
            ". Wanted " +
            Math.round(thisNumIndices) +
            ", but got " +
            thisNumIndices
        );
      }
      if (numIndices == undefined) {
        numIndices = thisNumIndices;
      } else {
        numIndices = Math.min(numIndices, thisNumIndices);
      }
    });

    // Draw the page's triangles.
    if (numIndices > 0) {
      // console.log("Drawing " + numIndices);
      this._renderFunc.call(this._renderFuncThisArg, gl, numIndices);
      count += numIndices / 3;
    }

    this._needsUpdate = false;

    return count;
  }
}
