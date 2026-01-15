/**
 * ANSI escape codes for terminal control
 */
export const ANSI = {
  // Cursor control
  hideCursor: '\x1b[?25l',
  showCursor: '\x1b[?25h',
  moveCursor: (row: number, col: number) => `\x1b[${row};${col}H`,
  moveCursorUp: (n: number) => `\x1b[${n}A`,
  moveCursorDown: (n: number) => `\x1b[${n}B`,
  saveCursor: '\x1b[s',
  restoreCursor: '\x1b[u',

  // Screen control
  clearScreen: '\x1b[2J',
  clearLine: '\x1b[2K',
  clearToEndOfLine: '\x1b[K',
  clearToEndOfScreen: '\x1b[J',
  scrollUp: (n: number) => `\x1b[${n}S`,
  scrollDown: (n: number) => `\x1b[${n}T`,

  // Alternate screen buffer
  enterAltScreen: '\x1b[?1049h',
  exitAltScreen: '\x1b[?1049l',

  // Mouse support
  enableMouse: '\x1b[?1000h\x1b[?1002h\x1b[?1006h',
  disableMouse: '\x1b[?1000l\x1b[?1002l\x1b[?1006l',
  enableMouseMovement: '\x1b[?1003h',
  disableMouseMovement: '\x1b[?1003l',

  // Colors
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  underline: '\x1b[4m',
  inverse: '\x1b[7m',
  strikethrough: '\x1b[9m',

  // Foreground colors
  fgBlack: '\x1b[30m',
  fgRed: '\x1b[31m',
  fgGreen: '\x1b[32m',
  fgYellow: '\x1b[33m',
  fgBlue: '\x1b[34m',
  fgMagenta: '\x1b[35m',
  fgCyan: '\x1b[36m',
  fgWhite: '\x1b[37m',
  fgDefault: '\x1b[39m',

  // Background colors
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m',
  bgDefault: '\x1b[49m',

  // RGB colors
  setRgbForeground: (r: number, g: number, b: number) => `\x1b[38;2;${r};${g};${b}m`,
  setRgbBackground: (r: number, g: number, b: number) => `\x1b[48;2;${r};${g};${b}m`,
  resetForeground: '\x1b[39m',
  resetBackground: '\x1b[49m',

  // 256 color mode
  set256Foreground: (color: number) => `\x1b[38;5;${color}m`,
  set256Background: (color: number) => `\x1b[48;5;${color}m`,

  // Combined helpers
  moveCursorAndClear: (row: number, col: number) => `\x1b[${row};${col}H\x1b[J`,
};

/**
 * RGBA color representation
 */
export class RGBA {
  constructor(
    public r: number,
    public g: number,
    public b: number,
    public a: number = 1.0,
  ) {}

  static fromInts(r: number, g: number, b: number, a: number = 255): RGBA {
    return new RGBA(r, g, b, a / 255);
  }

  static fromHex(hex: string): RGBA {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(hex);
    if (!result) {
      return new RGBA(0, 0, 0, 1);
    }
    return new RGBA(
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16),
      result[4] ? parseInt(result[4], 16) / 255 : 1,
    );
  }

  toInts(): [number, number, number, number] {
    return [this.r, this.g, this.b, Math.round(this.a * 255)];
  }

  toHex(): string {
    const toHex = (n: number) => n.toString(16).padStart(2, '0');
    return `#${toHex(this.r)}${toHex(this.g)}${toHex(this.b)}`;
  }

  equals(other: RGBA): boolean {
    return this.r === other.r && this.g === other.g && this.b === other.b && this.a === other.a;
  }

  isTransparent(): boolean {
    return this.a === 0;
  }
}

export type ColorInput =
  | string
  | RGBA
  | [number, number, number]
  | [number, number, number, number];

export function parseColor(input: ColorInput): RGBA {
  if (input instanceof RGBA) {
    return input;
  }
  if (typeof input === 'string') {
    // Named colors
    const namedColors: Record<string, string> = {
      black: '#000000',
      white: '#ffffff',
      red: '#ff0000',
      green: '#00ff00',
      blue: '#0000ff',
      yellow: '#ffff00',
      cyan: '#00ffff',
      magenta: '#ff00ff',
      gray: '#808080',
      grey: '#808080',
    };
    const hex = namedColors[input.toLowerCase()] || input;
    return RGBA.fromHex(hex);
  }
  if (Array.isArray(input)) {
    if (input.length === 3) {
      return new RGBA(input[0], input[1], input[2], 1);
    }
    return new RGBA(input[0], input[1], input[2], input[3] / 255);
  }
  return new RGBA(0, 0, 0, 1);
}
