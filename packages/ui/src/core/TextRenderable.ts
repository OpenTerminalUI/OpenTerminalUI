import type { ColorInput } from './ansi';
import type { Buffer } from './Buffer';
import { Renderable, type RenderableOptions } from './Renderable';

export interface TextRenderableOptions extends RenderableOptions {
  content?: string;
  color?: ColorInput;
  backgroundColor?: ColorInput;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
}

export class TextRenderable extends Renderable {
  private _content = '';
  color?: ColorInput;
  backgroundColor?: ColorInput;
  bold = false;
  italic = false;
  underline = false;

  constructor(options: TextRenderableOptions = {}) {
    super(options);
    this._content = options.content ?? '';
    this.color = options.color;
    this.backgroundColor = options.backgroundColor;
    this.bold = options.bold ?? false;
    this.italic = options.italic ?? false;
    this.underline = options.underline ?? false;
  }

  get content(): string {
    return this._content;
  }

  set content(value: string) {
    this._content = value;
    this.requestRender();
  }

  protected override renderSelf(buffer: Buffer, _deltaTime: number): void {
    if (!this._content) return;

    const lines = this._content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      buffer.drawText(this.x, this.y + i, line, this.color, this.backgroundColor);

      if (this.bold || this.italic || this.underline) {
        for (let j = 0; j < line.length; j++) {
          buffer.setCellStyle(this.x + j, this.y + i, {
            bold: this.bold,
            italic: this.italic,
            underline: this.underline,
          });
        }
      }
    }
  }
}
