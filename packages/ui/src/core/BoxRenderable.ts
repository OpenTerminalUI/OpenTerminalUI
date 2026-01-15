import { Renderable, type RenderableOptions } from './Renderable';
import type { Buffer } from './Buffer';
import type { ColorInput } from './ansi';

export type BorderStyle = 'single' | 'double' | 'round' | 'none';

export interface BoxRenderableOptions extends RenderableOptions {
  borderStyle?: BorderStyle;
  borderColor?: ColorInput;
  backgroundColor?: ColorInput;
}

export class BoxRenderable extends Renderable {
  borderStyle: BorderStyle;
  borderColor?: ColorInput;
  backgroundColor?: ColorInput;

  constructor(options: BoxRenderableOptions = {}) {
    super(options);
    this.borderStyle = options.borderStyle ?? 'none';
    this.borderColor = options.borderColor;
    this.backgroundColor = options.backgroundColor;
  }

  protected override renderSelf(buffer: Buffer, deltaTime: number): void {
    const hasBorder = this.borderStyle !== 'none';

    if (hasBorder || this.backgroundColor) {
      buffer.drawBox(
        this.x,
        this.y,
        this.width,
        this.height,
        this.borderStyle,
        this.borderColor,
        this.backgroundColor,
      );
    }
  }
}
