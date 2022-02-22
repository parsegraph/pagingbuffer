import Attribute from "./Attribute";

export default interface PageGroup {
  eachAttrib(cb: (attrib: Attribute) => void): void;
  gl(): WebGLRenderingContext;
  getIndex(name: string): number;
}
