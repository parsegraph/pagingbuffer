import Attribute from "./Attribute";
import PageGroup from "./PageGroup";
import BufferPage from "./BufferPage";
import PagingBuffer from "./PagingBuffer";

export function createPagingBuffer(
  gl: WebGLRenderingContext,
  program: WebGLProgram
) {
  return new PagingBuffer(gl, program);
}

export default PagingBuffer;

export { BufferPage, PageGroup, Attribute };
