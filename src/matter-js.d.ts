// src/matter-js.d.ts
declare module 'matter-js' {
  // This creates a namespace for types, so you can use Matter.Composite, etc.
  export namespace Matter {
    type Composite = any;
    type Engine = any;
    type World = any;
    type Body = any;
    type Bodies = any;
    type Render = any;
    type Runner = any;
    type Mouse = any;
    type MouseConstraint = any;
    type Events = any;
    type Vector = any;
    // Add more as needed
  }
  // This is for the default import
  const Matter: any;
  export default Matter;
}
