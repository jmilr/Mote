// AmoebaGame.tsx

import React, { useEffect, useRef, useState } from "react";
import Matter, { Composite, Body, Engine } from "matter-js";

type FoodType = "red" | "blue" | "yellow" | "green";

interface FoodCell {
  id: string;
  composite: Composite;
  type: FoodType;
  color: string;
  size: number;
  age: number;
  energy: number;
  intelligence: number;
  evolutionLevel: number;
  canEat: boolean;
  aggressiveness: number;
  reproductionCooldown: number;
  generation: number;
  swarmId: string;
}

interface Player {
  composite: Composite;
  size: number;
  diet: Record<FoodType, number>;
  experience: number;
  totalKills: number;
  tier: number;
  isAscended: boolean;
}

const FOOD_COLORS: Record<FoodType, string> = {
  red: "#ff4444",
  blue: "#44aaff",
  yellow: "#ffe066",
  green: "#44ff88",
};

const FOOD_SHAPES: Record<FoodType, number> = {
  red: 6,
  blue: 8,
  yellow: 7,
  green: 9,
};

const CANVAS_BG = "#181818";

function centroid(bodies: Matter.Body[]) {
  let x = 0,
    y = 0;
  for (const b of bodies) {
    x += b.position.x;
    y += b.position.y;
  }
  return { x: x / bodies.length, y: y / bodies.length };
}

function random(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function distance(
  a: { x: number; y: number },
  b: { x: number; y: number },
) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function createFoodCell(
  x: number,
  y: number,
  type: FoodType,
  size: number,
  energy: number,
  intelligence: number,
  evolutionLevel: number,
  generation: number,
  swarmId: string,
): FoodCell {
  const points = FOOD_SHAPES[type];
  const composite = Matter.Composites.softBody(
    x,
    y,
    points,
    1,
    0,
    0,
    true,
    size,
    {
      friction: 0.05,
      restitution: 0.8,
      render: { fillStyle: FOOD_COLORS[type] },
    },
  );
  return {
    id: Math.random().toString(36).slice(2),
    composite,
    type,
    color: FOOD_COLORS[type],
    size,
    age: 0,
    energy,
    intelligence,
    evolutionLevel,
    canEat: evolutionLevel >= 2,
    aggressiveness: evolutionLevel * 0.3,
    reproductionCooldown: 0,
    generation,
    swarmId,
  };
}

function createPlayer(
  x: number,
  y: number,
  size: number,
): Player {
  const composite = Matter.Composites.softBody(
    x,
    y,
    12,
    1,
    0,
    0,
    true,
    size,
    {
      friction: 0.05,
      restitution: 0.8,
      render: { fillStyle: "#fff" },
    },
  );
  return {
    composite,
    size,
    diet: { red: 0, blue: 0, yellow: 0, green: 0 },
    experience: 0,
    totalKills: 0,
    tier: 1,
    isAscended: false,
  };
}

export default function AmoebaGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);

  // Physics engine and world refs
  const engineRef = useRef<Matter.Engine>();
  const playerRef = useRef<Player>();
  const foodRef = useRef<FoodCell[]>([]);
  const [canvasSize, setCanvasSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  // --- INIT ---
  useEffect(() => {
    // Setup Matter.js
    const engine = Matter.Engine.create();
    engine.gravity.y = 0;
    engine.gravity.x = 0;
    engineRef.current = engine;

    // Player
    const player = createPlayer(
      canvasSize.width / 2,
      canvasSize.height / 2,
      18,
    );
    playerRef.current = player;
    Matter.World.add(engine.world, player.composite);

    // Food
    const food: FoodCell[] = [];
    for (let i = 0; i < 400; i++) {
      const type: FoodType = (
        ["red", "blue", "yellow", "green"] as FoodType[]
      )[Math.floor(Math.random() * 4)];
      const size = random(7, 13);
      const x = random(60, canvasSize.width - 60);
      const y = random(60, canvasSize.height - 60);
      food.push(
        createFoodCell(
          x,
          y,
          type,
          size,
          random(8, 20),
          random(0.7, 2.5),
          Math.floor(random(0, 3)),
          1,
          Math.random().toString(36).slice(2, 8),
        ),
      );
    }
    foodRef.current = food;
    for (const f of food)
      Matter.World.add(engine.world, f.composite);

    // Walls (keep everything in bounds)
    const wallOpts = {
      isStatic: true,
      restitution: 1,
      friction: 0,
    };
    const walls = [
      Matter.Bodies.rectangle(
        canvasSize.width / 2,
        -20,
        canvasSize.width,
        40,
        wallOpts,
      ),
      Matter.Bodies.rectangle(
        canvasSize.width / 2,
        canvasSize.height + 20,
        canvasSize.width,
        40,
        wallOpts,
      ),
      Matter.Bodies.rectangle(
        -20,
        canvasSize.height / 2,
        40,
        canvasSize.height,
        wallOpts,
      ),
      Matter.Bodies.rectangle(
        canvasSize.width + 20,
        canvasSize.height / 2,
        40,
        canvasSize.height,
        wallOpts,
      ),
    ];
    Matter.World.add(engine.world, walls);

    // Start physics loop
    let lastTime = performance.now();
    let running = true;
    function physicsLoop(now: number) {
      if (!running) return;
      const dt = Math.min(1000 / 60, now - lastTime);
      Matter.Engine.update(engine, dt);
      lastTime = now;
      requestAnimationFrame(physicsLoop);
    }
    requestAnimationFrame(physicsLoop);

    // Cleanup
    return () => {
      running = false;
    };
    // eslint-disable-next-line
  }, []);

  // --- PLAYER INPUT ---
  useEffect(() => {
    function handle(e: KeyboardEvent, down: boolean) {
      if (!playerRef.current) return;
      const composite = playerRef.current.composite;
      const bodies = composite.bodies;
      const c = centroid(bodies);
      let dx = 0,
        dy = 0;
      if (e.key === "ArrowUp") dy -= 1;
      if (e.key === "ArrowDown") dy += 1;
      if (e.key === "ArrowLeft") dx -= 1;
      if (e.key === "ArrowRight") dx += 1;
      if (dx !== 0 || dy !== 0) {
        for (const b of bodies) {
          Matter.Body.applyForce(b, b.position, {
            x: dx * 0.0007,
            y: dy * 0.0007,
          });
        }
      }
    }
    window.addEventListener("keydown", (e) => handle(e, true));
    return () =>
      window.removeEventListener("keydown", (e) =>
        handle(e, true),
      );
  }, []);

  // --- GAME LOGIC LOOP ---
  useEffect(() => {
    let running = true;
    function logicLoop() {
      if (!running) return;
      // --- PLAYER EATS FOOD ---
      const player = playerRef.current;
      if (player) {
        const playerBodies = player.composite.bodies;
        const playerPos = centroid(playerBodies);
        let eaten = 0;
        foodRef.current = foodRef.current.filter((food) => {
          const foodPos = centroid(food.composite.bodies);
          const canEat = food.size <= player.size * 0.85;
          if (
            distance(playerPos, foodPos) < player.size * 0.8 &&
            canEat
          ) {
            player.diet[food.type] += 1;
            player.experience +=
              food.generation * 3 + food.evolutionLevel * 5;
            eaten++;
            Matter.World.remove(
              engineRef.current!.world,
              food.composite,
            );
            return false;
          }
          return true;
        });
        if (eaten > 0) setScore((s) => s + eaten);
      }

      // --- FOOD SWARMING, BREEDING, EVOLUTION ---
      const foodArr = foodRef.current;
      for (let i = 0; i < foodArr.length; i++) {
        const food = foodArr[i];
        const bodies = food.composite.bodies;
        const pos = centroid(bodies);

        // Swarm: Cohesion with same-type
        let sameTypeCount = 0,
          centerX = 0,
          centerY = 0;
        for (let j = 0; j < foodArr.length; j++) {
          if (i === j) continue;
          const other = foodArr[j];
          if (other.type === food.type) {
            const op = centroid(other.composite.bodies);
            const d = distance(pos, op);
            if (d < 80) {
              sameTypeCount++;
              centerX += op.x;
              centerY += op.y;
              // Separation
              if (d < 18) {
                const dir = {
                  x: (pos.x - op.x) / d,
                  y: (pos.y - op.y) / d,
                };
                for (const b of bodies) {
                  Matter.Body.applyForce(b, b.position, {
                    x: dir.x * 0.0005,
                    y: dir.y * 0.0005,
                  });
                }
              }
            }
          }
        }
        if (sameTypeCount > 0) {
          centerX /= sameTypeCount;
          centerY /= sameTypeCount;
          const dir = normalize({
            x: centerX - pos.x,
            y: centerY - pos.y,
          });
          for (const b of bodies) {
            Matter.Body.applyForce(b, b.position, {
              x: dir.x * 0.0002 * food.intelligence,
              y: dir.y * 0.0002 * food.intelligence,
            });
          }
        }

        // Flee from player
        if (playerRef.current) {
          const playerPos = centroid(
            playerRef.current.composite.bodies,
          );
          const d = distance(pos, playerPos);
          if (d < 60) {
            const dir = normalize({
              x: pos.x - playerPos.x,
              y: pos.y - playerPos.y,
            });
            for (const b of bodies) {
              Matter.Body.applyForce(b, b.position, {
                x: dir.x * 0.001,
                y: dir.y * 0.001,
              });
            }
          }
        }

        // Random jitter
        if (Math.random() < 0.02) {
          for (const b of bodies) {
            Matter.Body.applyForce(b, b.position, {
              x: random(-0.0002, 0.0002),
              y: random(-0.0002, 0.0002),
            });
          }
        }

        // Breeding
        if (
          food.energy > 20 &&
          food.age > 200 &&
          food.reproductionCooldown <= 0
        ) {
          for (let j = 0; j < foodArr.length; j++) {
            if (i === j) continue;
            const mate = foodArr[j];
            if (mate.type === food.type) {
              const mp = centroid(mate.composite.bodies);
              if (distance(pos, mp) < 15 && mate.energy > 15) {
                if (Math.random() < 0.01) {
                  food.energy *= 0.6;
                  mate.energy *= 0.6;
                  food.reproductionCooldown = 200;
                  mate.reproductionCooldown = 200;
                  const child = createFoodCell(
                    (pos.x + mp.x) / 2,
                    (pos.y + mp.y) / 2,
                    food.type,
                    (food.size + mate.size) / 2,
                    (food.energy + mate.energy) / 2,
                    (food.intelligence + mate.intelligence) / 2,
                    Math.max(
                      food.evolutionLevel,
                      mate.evolutionLevel,
                    ),
                    Math.max(food.generation, mate.generation) +
                      1,
                    food.swarmId,
                  );
                  foodRef.current.push(child);
                  Matter.World.add(
                    engineRef.current!.world,
                    child.composite,
                  );
                }
              }
            }
          }
        }
        if (food.reproductionCooldown > 0)
          food.reproductionCooldown--;

        food.age++;
      }

      // --- FOOD POPULATION CONTROL ---
      const targetFoodCount = 1000;
      if (
        foodRef.current.length < targetFoodCount &&
        Math.random() < 0.5
      ) {
        const type: FoodType = (
          ["red", "blue", "yellow", "green"] as FoodType[]
        )[Math.floor(Math.random() * 4)];
        const size = random(7, 13);
        const x = random(60, canvasSize.width - 60);
        const y = random(60, canvasSize.height - 60);
        const f = createFoodCell(
          x,
          y,
          type,
          size,
          random(8, 20),
          random(0.7, 2.5),
          Math.floor(random(0, 3)),
          1,
          Math.random().toString(36).slice(2, 8),
        );
        foodRef.current.push(f);
        Matter.World.add(engineRef.current!.world, f.composite);
      }

      setScore(
        playerRef.current?.diet.red ??
          0 + playerRef.current?.diet.blue ??
          0 + playerRef.current?.diet.yellow ??
          0 + playerRef.current?.diet.green ??
          0,
      );

      setTimeout(logicLoop, 16);
    }
    logicLoop();
    return () => {
      running = false;
    };
    // eslint-disable-next-line
  }, [canvasSize]);

  // --- RENDER ---
  useEffect(() => {
    let running = true;
    function renderLoop() {
      if (!running) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = CANVAS_BG;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw food
      for (const food of foodRef.current) {
        const points = food.composite.bodies.map(
          (b) => b.position,
        );
        ctx.save();
        ctx.beginPath();
        points.forEach((p, i) => {
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.closePath();
        ctx.strokeStyle = food.color;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      }

      // Draw player
      if (playerRef.current) {
        const points = playerRef.current.composite.bodies.map(
          (b) => b.position,
        );
        ctx.save();
        ctx.beginPath();
        points.forEach((p, i) => {
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.closePath();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();
      }

      // UI
      ctx.fillStyle = "#fff";
      ctx.font = "18px monospace";
      ctx.fillText(`Score: ${score}`, 20, 30);
      ctx.fillText(`Food: ${foodRef.current.length}`, 20, 55);
      ctx.fillText(`(Arrow keys to move)`, 20, 80);

      requestAnimationFrame(renderLoop);
    }
    renderLoop();
    return () => {
      running = false;
    };
  }, [score]);

  // --- CANVAS RESIZE ---
  useEffect(() => {
    function resize() {
      setCanvasSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
    window.addEventListener("resize", resize);
    resize();
    return () => window.removeEventListener("resize", resize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={canvasSize.width}
      height={canvasSize.height}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 1000,
        background: CANVAS_BG,
      }}
    />
  );
}
