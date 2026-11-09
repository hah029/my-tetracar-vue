export type CubeColor = 'bullet' | 'shield' | 'nitro' | 'magnet';

export const CUBE_COLORS: CubeColor[] = ['bullet', 'shield', 'nitro', 'magnet'];

export const CUBE_COLOR_HEX: Record<CubeColor, string> = {
  bullet: '#dd0000',
  shield: '#aaddff',
  nitro: '#00dd00',
  magnet: '#0088ff',
};

/** Спрайт, летящий от машины к очкам. */
export interface FlyingToScoreCube {
  id: number;
  color: CubeColor;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

/** Спрайт, падающий внутри стакана. */
export interface FallingCube {
  id: number;
  color: CubeColor;
  startRow: number;   // откуда начинается (обычно rows — над стаканом)
  targetRow: number;  // куда падает
  currentRow: number; // текущая позиция (дробная для анимации)
}