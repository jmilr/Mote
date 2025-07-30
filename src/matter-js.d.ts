// src/matter-js.d.ts
declare module 'matter-js' {
  // This creates a global namespace for types only
  export namespace Matter {
    type Composite = any;
    type Engine = any;
    type World = any;
    type Body = any;
    type Bodies = any;
    type Composites = any;
    // Add more as needed
  }
  // This is for the default import
  const Matter: any;
  export default Matter;
}
