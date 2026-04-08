export type JumpState = {
  y: number;
  velocity: number;
  isJumping: boolean;
};

export class JumpSimulator {
  private gravity: number;
  private jumpHeight: number;
  private groundY: number;

  constructor(params: {
    gravity: number;
    jumpHeight: number;
    groundY: number;
  }) {
    this.gravity = params.gravity;
    this.jumpHeight = params.jumpHeight;
    this.groundY = params.groundY;
  }

  public createInitialState(): JumpState {
    return {
      y: this.groundY,
      velocity: 0,
      isJumping: false,
    };
  }

  public startJump(state: JumpState): JumpState {
    if (state.isJumping) return state;

    return {
      ...state,
      isJumping: true,
      velocity: Math.sqrt(2 * this.gravity * this.jumpHeight),
    };
  }

  public setGroundY(y: number) {
    this.groundY = y;
  }

  public step(state: JumpState, dt: number): JumpState {
    if (!state.isJumping) return state;
    // Защита от некорректного dt
    if (!Number.isFinite(dt) || dt <= 0) {
      console.warn("JumpSimulator.step: invalid dt", dt);
      return state;
    }
    let y = state.y + state.velocity * dt;
    let velocity = state.velocity - this.gravity * dt;
    let isJumping = true;
    if (y <= this.groundY) {
      y = this.groundY;
      velocity = 0;
      isJumping = false;
    }
    // Защита от NaN/Infinity
    if (!Number.isFinite(y) || !Number.isFinite(velocity)) {
      console.error("JumpSimulator.step: non-finite values", {
        y,
        velocity,
        dt,
      });
      y = this.groundY;
      velocity = 0;
      isJumping = false;
    }
    return { y, velocity, isJumping };
  }
}
