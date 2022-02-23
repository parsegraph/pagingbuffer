import BufferPage from "./BufferPage";
import Attribute from "./Attribute";
import PageGroup from "./PageGroup";

/*
 * Manages the low-level paging of vertex attributes. For
 * demonstrations of use, see any painter class.
 */
export default class PagingBuffer implements PageGroup {
  _gl: WebGLRenderingContext;
  _pages: BufferPage[];
  _currentPage: number;
  _program: WebGLProgram;
  _attribs: Attribute[];

  constructor(gl: WebGLRenderingContext, program: WebGLProgram) {
    if (!gl) {
      throw new Error("gl must be provided");
    }
    if (!program) {
      throw new Error("program must be provided");
    }
    // Contains vertex attribute information used for drawing. Provide using
    // defineAttrib.
    this._attribs = [];

    // Contains buffer data for each page.
    this._pages = [];
    this._currentPage = -1;

    this._gl = gl;
    this._program = program;
  }

  eachAttrib(cb: (attrib: Attribute) => void) {
    this._attribs.forEach((attrib) => {
      if (!attrib.hasLocation()) {
        return;
      }
      cb(attrib);
    });
  }

  getIndex(attribName: string): number {
    for (let i = 0; i < this._attribs.length; ++i) {
      const attrib = this._attribs[i];
      if (attrib.name() === attribName) {
        return i;
      }
    }
    return -1;
  }

  isEmpty() {
    // Check each page's buffer, failing early if possible.
    if (this._pages.length === 0) {
      return true;
    }
    for (let i = 0; i < this._pages.length; ++i) {
      if (this._pages[i].isEmpty()) {
        return true;
      }
    }
    return false;
  }

  addPage(
    renderFunc?: (gl: WebGLRenderingContext, numIndices: number) => void,
    renderFuncThisArg?: object
  ) {
    ++this._currentPage;

    if (this._currentPage < this._pages.length) {
      // Reuse the page.
      return;
    }

    // Create a new page.
    const page = new BufferPage(this, renderFunc, renderFuncThisArg);

    // Add the page.
    this._pages.push(page);
    page.setId(this._pages.length - 1);

    // Return the working page.
    return page;
  }

  getWorkingPage() {
    if (this._pages.length === 0) {
      throw new Error("Refusing to create a new page; call addPage()");
    }
    return this._pages[this._currentPage];
  }

  /*
   * Defines an attribute for data entry.
   *
   * name - the attribute name in this paging buffer's GL program
   * numComponents - the number of components in the named attribute
   * type (1, 2, 3, or 4) drawMode - the WebGL draw mode.
   * Defaults to gl.STATIC_DRAW
   */
  defineAttrib(name: string, numComponents: number, drawMode?: number) {
    if (drawMode == undefined) {
      drawMode = this.gl().STATIC_DRAW;
    }
    // Add a new buffer entry for this new attribute.
    this._pages.forEach((page) => page.addAttrib());

    this._attribs.push(
      new Attribute(
        name,
        this._attribs.length,
        numComponents,
        drawMode,
        this.gl().getAttribLocation(this._program, name)
      )
    );

    return this._attribs.length - 1;
  }

  appendRGB(attribIndex: number | string, color: any) {
    const page = this.getWorkingPage();
    if (typeof color.r == "function") {
      return page.appendData(attribIndex, color.r(), color.g(), color.b());
    }
    return page.appendData(attribIndex, color.r, color.g, color.b);
  }

  appendRGBA(attribIndex: number | string, color: any) {
    const page = this.getWorkingPage();
    if (typeof color.r == "function") {
      return page.appendData(
        attribIndex,
        color.r(),
        color.g(),
        color.b(),
        color.a()
      );
    }
    return page.appendData(attribIndex, color.r, color.g, color.b, color.a);
  }

  appendData(attribIndex: number | string, ...args: any) {
    const page = this.getWorkingPage();
    return page.appendData(attribIndex, ...args);
  }

  append1D(attribIndex: number | string, val: number) {
    const page = this.getWorkingPage();
    page.appendValue(attribIndex, val);
    return 1;
  }

  appendValue(attribIndex: number | string, val: number) {
    return this.append1D(attribIndex, val);
  }

  append2D(attribIndex: number | string, x: number, y: number) {
    const page = this.getWorkingPage();
    return page.appendData(attribIndex, x, y);
  }

  append3D(attribIndex: number | string, x: number, y: number, z: number) {
    const page = this.getWorkingPage();
    return page.appendData(attribIndex, x, y, z);
  }

  eachPage(cb: (page: BufferPage) => void): void {
    this._pages.forEach((page, index) => {
      if (index > this._currentPage) {
        return;
      }
      cb(page);
    });
  }

  gl() {
    return this._gl;
  }

  /*
   * Deletes all buffers and empties values.
   */
  clear() {
    // Clear the buffers for all pages.
    this.eachPage((page) => {
      page.clear();
    });
    this._currentPage = -1;
  }

  /*
   * Render each page. This function sets up vertex attribute
   * buffers and calls drawArrays for each page.
   *
   * gl.drawArrays(gl.TRIANGLES, 0, numVertices)
   *
   * where numVertices is calculated from the appended data size / component
   * count. The least-filled buffer is used for the size, if the sizes differ.
   */
  renderPages() {
    let count = 0;

    const gl = this.gl();

    // Enable used vertex attributes.
    this.eachAttrib((attrib) => {
      attrib.enable(gl);
    });

    // Draw each page.
    this.eachPage((page) => {
      count += page.render();
    });

    // Disable used variables.
    this.eachAttrib((attrib) => attrib.disable(gl));

    return count;
  }
}
