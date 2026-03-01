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

  public step(state: JumpState): JumpState {
    if (!state.isJumping) return state;

    let y = state.y + state.velocity;
    let velocity = state.velocity - this.gravity;
    let isJumping = true;

    if (y <= this.groundY) {
      y = this.groundY;
      velocity = 0;
      isJumping = false;
    }

    return { y, velocity, isJumping };
  }
}
