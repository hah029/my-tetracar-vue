import { JumpSimulator } from "./JumpSimulator";

export type JumpPoint = {
  y: number;
  zOffset: number;
};

export function simulateJumpTrajectory(params: {
  startY: number;
  jumpHeight: number;
  gravity: number;
  deltaTime: number;
  forwardSpeed: number;
  maxSteps?: number;
}): JumpPoint[] {
  const {
    startY,
    jumpHeight,
    gravity,
    deltaTime,
    forwardSpeed,
    maxSteps = 60,
  } = params;

  const simulator = new JumpSimulator({
    gravity,
    jumpHeight,
    groundY: startY,
  });

  let state = simulator.createInitialState();
  state = simulator.startJump(state);

  let z = 0;
  const points: JumpPoint[] = [];

  // console.log("[simulateJumpTrajectory]", {
  //   startY,
  //   jumpHeight,
  //   gravity,
  //   deltaTime,
  //   forwardSpeed,
  //   maxSteps,
  // });

  for (let i = 0; i < maxSteps; i++) {
    state = simulator.step(state);
    z -= deltaTime * forwardSpeed;

    if (!state.isJumping) break;

    points.push({
      y: state.y,
      zOffset: z,
    });
    // console.log(
    //   `  step ${i}: y=${state.y}, zOffset=${z}, isJumping=${state.isJumping}`,
    // );
  }

  // console.log("[simulateJumpTrajectory] total points:", points.length);
  return points;
}
