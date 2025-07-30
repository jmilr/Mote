// src/matter-js.d.ts
declare module 'matter-js' {
  // Core types
  export type Engine = any;
  export type World = any;
  export type Bodies = any;
  export type Body = any;
  export type Composite = any;
  export type Composites = any;
  export type Constraint = any;
  export type Mouse = any;
  export type MouseConstraint = any;
  export type Render = any;
  export type Runner = any;
  export type Events = any;
  export type Vector = any;

  // Main Matter namespace
  const Matter: {
    Engine: {
      create: (...args: any[]) => Engine;
      run: (engine: Engine) => void;
      update: (engine: Engine, delta?: number) => void;
    };
    World: {
      add: (world: World, body: any) => void;
      remove: (world: World, body: any) => void;
    };
    Bodies: {
      rectangle: (...args: any[]) => Body;
      circle: (...args: any[]) => Body;
      polygon: (...args: any[]) => Body;
      // Add more as needed
    };
    Body: {
      setPosition: (body: Body, position: Vector) => void;
      setVelocity: (body: Body, velocity: Vector) => void;
      // Add more as needed
    };
    Composite: Composite;
    Composites: Composites;
    Constraint: Constraint;
    Mouse: {
      create: (element: HTMLElement) => Mouse;
    };
    MouseConstraint: {
      create: (...args: any[]) => MouseConstraint;
    };
    Render: {
      create: (...args: any[]) => Render;
      run: (render: Render) => void;
      stop: (render: Render) => void;
    };
    Runner: {
      create: () => Runner;
      run: (runner: Runner, engine: Engine) => void;
    };
    Events: Events;
    Vector: Vector;
    // Add more as needed
  };

  export default Matter;
}
