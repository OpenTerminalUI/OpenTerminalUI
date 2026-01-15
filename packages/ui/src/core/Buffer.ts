import { ANSI, type ColorInput, parseColor, RGBA } from './ansi';

export interface Cell {
  char: string;
  fg: RGBA;
  bg: RGBA;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
}

export interface ScissorRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

function createDefaultCell(): Cell {
  return {
    char: ' ',
    fg: new RGBA(255, 255, 255, 1),
    bg: new RGBA(0, 0, 0, 0),
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
  };
}

export class Buffer {
  private cells: Cell[][];
  private _width: number;
  private _height: number;
  private scissorStack: ScissorRect[] = [];
  private opacityStack: number[] = [];
  private currentOpacity = 1.0;

  constructor(width: number, height: number) {
    this._width = width;
    this._height = height;
    this.cells = this.createCells(width, height);
  }

  get width(): number {
    return this._width;
  }

  get height(): number {
    return this._height;
  }

  private createCells(width: number, height: number): Cell[][] {
    const cells: Cell[][] = [];
    for (let y = 0; y < height; y++) {
      const row: Cell[] = [];
      for (let x = 0; x < width; x++) {
        row.push(createDefaultCell());
      }
      cells.push(row);
    }
    return cells;
  }

  resize(width: number, height: number): void {
    this._width = width;
    this._height = height;
    this.cells = this.createCells(width, height);
  }

  clear(bg?: ColorInput): void {
    const bgColor = bg ? parseColor(bg) : new RGBA(0, 0, 0, 0);
    for (let y = 0; y < this._height; y++) {
      for (let x = 0; x < this._width; x++) {
        const cell = this.cells[y][x];
        cell.char = ' ';
        cell.fg = new RGBA(255, 255, 255, 1);
        cell.bg = bgColor;
        cell.bold = false;
        cell.italic = false;
        cell.underline = false;
        cell.strikethrough = false;
      }
    }
  }

  pushScissorRect(x: number, y: number, width: number, height: number): void {
    this.scissorStack.push({ x, y, width, height });
  }

  popScissorRect(): void {
    this.scissorStack.pop();
  }

  pushOpacity(opacity: number): void {
    this.opacityStack.push(this.currentOpacity);
    this.currentOpacity *= opacity;
  }

  popOpacity(): void {
    const prev = this.opacityStack.pop();
    this.currentOpacity = prev ?? 1.0;
  }

  private isInScissorRect(x: number, y: number): boolean {
    if (this.scissorStack.length === 0) return true;
    const rect = this.scissorStack[this.scissorStack.length - 1];
    return x >= rect.x && x < rect.x + rect.width && y >= rect.y && y < rect.y + rect.height;
  }

  setCell(x: number, y: number, char: string, fg?: ColorInput, bg?: ColorInput): void {
    if (x < 0 || x >= this._width || y < 0 || y >= this._height) return;
    if (!this.isInScissorRect(x, y)) return;

    const cell = this.cells[y][x];
    cell.char = char;
    if (fg) cell.fg = parseColor(fg);
    if (bg) cell.bg = parseColor(bg);
  }

  setCellStyle(
    x: number,
    y: number,
    options: { bold?: boolean; italic?: boolean; underline?: boolean; strikethrough?: boolean },
  ): void {
    if (x < 0 || x >= this._width || y < 0 || y >= this._height) return;
    const cell = this.cells[y][x];
    if (options.bold !== undefined) cell.bold = options.bold;
    if (options.italic !== undefined) cell.italic = options.italic;
    if (options.underline !== undefined) cell.underline = options.underline;
    if (options.strikethrough !== undefined) cell.strikethrough = options.strikethrough;
  }

  getCell(x: number, y: number): Cell | null {
    if (x < 0 || x >= this._width || y < 0 || y >= this._height) return null;
    return this.cells[y][x];
  }

  drawText(x: number, y: number, text: string, fg?: ColorInput, bg?: ColorInput): void {
    let currentX = x;
    for (const char of text) {
      if (char === '\n') {
        continue;
      }
      this.setCell(currentX, y, char, fg, bg);
      currentX++;
    }
  }

  drawBox(
    x: number,
    y: number,
    width: number,
    height: number,
    borderStyle: 'single' | 'double' | 'round' | 'none' = 'single',
    borderColor?: ColorInput,
    bgColor?: ColorInput,
  ): void {
    if (borderStyle === 'none') {
      this.fillRect(x, y, width, height, bgColor);
      return;
    }

    const chars = {
      single: { tl: '┌', tr: '┐', bl: '└', br: '┘', h: '─', v: '│' },
      double: { tl: '╔', tr: '╗', bl: '╚', br: '╝', h: '═', v: '║' },
      round: { tl: '╭', tr: '╮', bl: '╰', br: '╯', h: '─', v: '│' },
    }[borderStyle];

    this.setCell(x, y, chars.tl, borderColor);
    this.setCell(x + width - 1, y, chars.tr, borderColor);
    this.setCell(x, y + height - 1, chars.bl, borderColor);
    this.setCell(x + width - 1, y + height - 1, chars.br, borderColor);

    for (let i = 1; i < width - 1; i++) {
      this.setCell(x + i, y, chars.h, borderColor);
      this.setCell(x + i, y + height - 1, chars.h, borderColor);
    }

    for (let i = 1; i < height - 1; i++) {
      this.setCell(x, y + i, chars.v, borderColor);
      this.setCell(x + width - 1, y + i, chars.v, borderColor);
    }

    if (bgColor) {
      this.fillRect(x + 1, y + 1, width - 2, height - 2, bgColor);
    }
  }

  fillRect(x: number, y: number, width: number, height: number, color?: ColorInput): void {
    for (let dy = 0; dy < height; dy++) {
      for (let dx = 0; dx < width; dx++) {
        this.setCell(x + dx, y + dy, ' ', undefined, color);
      }
    }
  }

  drawFrameBuffer(x: number, y: number, source: Buffer): void {
    for (let sy = 0; sy < source.height; sy++) {
      for (let sx = 0; sx < source.width; sx++) {
        const sourceCell = source.getCell(sx, sy);
        if (!sourceCell) continue;
        if (sourceCell.bg.isTransparent() && sourceCell.char === ' ') continue;
        this.setCell(x + sx, y + sy, sourceCell.char, sourceCell.fg, sourceCell.bg);
        this.setCellStyle(x + sx, y + sy, {
          bold: sourceCell.bold,
          italic: sourceCell.italic,
          underline: sourceCell.underline,
          strikethrough: sourceCell.strikethrough,
        });
      }
    }
  }

  destroy(): void {
    this.cells = [];
  }

  private cellEquals(cell: Cell, prevCell: Cell | null): boolean {
    if (!prevCell) return false;
    return (
      prevCell.char === cell.char &&
      prevCell.fg.equals(cell.fg) &&
      prevCell.bg.equals(cell.bg) &&
      prevCell.bold === cell.bold &&
      prevCell.italic === cell.italic &&
      prevCell.underline === cell.underline
    );
  }

  private buildFgAnsi(cell: Cell, state: { lastFg: RGBA | null }): string {
    if (state.lastFg?.equals(cell.fg)) return '';
    state.lastFg = cell.fg;
    return ANSI.setRgbForeground(cell.fg.r, cell.fg.g, cell.fg.b);
  }

  private buildBgAnsi(cell: Cell, state: { lastBg: RGBA | null }): string {
    if (state.lastBg?.equals(cell.bg)) return '';
    state.lastBg = cell.bg;
    return cell.bg.isTransparent()
      ? ANSI.bgDefault
      : ANSI.setRgbBackground(cell.bg.r, cell.bg.g, cell.bg.b);
  }

  private buildBoldAnsi(
    cell: Cell,
    state: { lastFg: RGBA | null; lastBg: RGBA | null; lastBold: boolean },
  ): string {
    if (cell.bold === state.lastBold) return '';
    state.lastBold = cell.bold;
    if (!cell.bold) return ANSI.reset;
    let out = ANSI.bold + ANSI.setRgbForeground(cell.fg.r, cell.fg.g, cell.fg.b);
    if (!cell.bg.isTransparent()) {
      out += ANSI.setRgbBackground(cell.bg.r, cell.bg.g, cell.bg.b);
    }
    return out;
  }

  private buildCellAnsi(
    cell: Cell,
    state: { lastFg: RGBA | null; lastBg: RGBA | null; lastBold: boolean },
  ): string {
    const fg = this.buildFgAnsi(cell, state);
    const bg = this.buildBgAnsi(cell, state);
    const bold = this.buildBoldAnsi(cell, state);
    const styles = (cell.italic ? ANSI.italic : '') + (cell.underline ? ANSI.underline : '');
    return fg + bg + bold + styles + cell.char;
  }

  toAnsi(previousBuffer?: Buffer): string {
    const parts: string[] = [];
    const state = { lastFg: null as RGBA | null, lastBg: null as RGBA | null, lastBold: false };

    for (let y = 0; y < this._height; y++) {
      for (let x = 0; x < this._width; x++) {
        const cell = this.cells[y][x];
        const prevCell = previousBuffer?.getCell(x, y) ?? null;
        if (this.cellEquals(cell, prevCell)) continue;
        parts.push(ANSI.moveCursor(y + 1, x + 1));
        parts.push(this.buildCellAnsi(cell, state));
      }
    }

    parts.push(ANSI.reset);
    return parts.join('');
  }
}
