import { Buffer } from './Buffer';
import { ANSI, RGBA, parseColor, type ColorInput } from './ansi';
import { Renderable, type RenderContext } from './Renderable';
import { EventEmitter } from 'node:events';
import { Direction, FlexDirection } from 'yoga-layout';

export interface RendererConfig {
  stdin?: NodeJS.ReadStream;
  stdout?: NodeJS.WriteStream;
  exitOnCtrlC?: boolean;
  useAlternateScreen?: boolean;
  useMouse?: boolean;
  targetFps?: number;
  backgroundColor?: ColorInput;
}

export class RootRenderable extends Renderable {
  constructor(ctx: RenderContext, width: number, height: number) {
    super({ id: '__root__', width, height, visible: true });
    this._ctx = ctx;
    this.yogaNode.setFlexDirection(FlexDirection.Column);
  }

  calculateLayout(): void {
    this.yogaNode.calculateLayout(this._widthValue, this._heightValue, Direction.LTR);
  }

  resize(width: number, height: number): void {
    this.yogaNode.setWidth(width);
    this.yogaNode.setHeight(height);
    this._widthValue = width;
    this._heightValue = height;
  }

  override render(buffer: Buffer, deltaTime: number): void {
    this.calculateLayout();
    this.updateLayout(deltaTime);
    super.render(buffer, deltaTime);
  }
}

export class Renderer extends EventEmitter implements RenderContext {
  private stdin: NodeJS.ReadStream;
  private stdout: NodeJS.WriteStream;
  private _width: number;
  private _height: number;
  private exitOnCtrlC: boolean;
  private useAlternateScreen: boolean;
  private useMouse: boolean;
  private targetFps: number;
  private backgroundColor: RGBA;

  private currentBuffer: Buffer;
  private previousBuffer: Buffer | null = null;
  private _isRunning = false;
  private _isDestroyed = false;
  private renderTimeout: ReturnType<typeof setTimeout> | null = null;
  private renderRequested = false;

  readonly root: RootRenderable;

  private stdinListener: (data: Buffer) => void;
  private resizeHandler: () => void;

  constructor(config: RendererConfig = {}) {
    super();
    this.stdin = config.stdin ?? process.stdin;
    this.stdout = config.stdout ?? process.stdout;
    this._width = this.stdout.columns || 80;
    this._height = this.stdout.rows || 24;
    this.exitOnCtrlC = config.exitOnCtrlC ?? true;
    this.useAlternateScreen = config.useAlternateScreen ?? true;
    this.useMouse = config.useMouse ?? true;
    this.targetFps = config.targetFps ?? 30;
    this.backgroundColor = config.backgroundColor
      ? parseColor(config.backgroundColor)
      : new RGBA(0, 0, 0, 1);

    this.currentBuffer = new Buffer(this._width, this._height);
    this.root = new RootRenderable(this, this._width, this._height);

    this.stdinListener = this.handleInput.bind(this);
    this.resizeHandler = this.handleResize.bind(this);
  }

  get width(): number {
    return this._width;
  }

  get height(): number {
    return this._height;
  }

  get isRunning(): boolean {
    return this._isRunning;
  }

  get isDestroyed(): boolean {
    return this._isDestroyed;
  }

  async start(): Promise<void> {
    if (this._isRunning || this._isDestroyed) return;
    this._isRunning = true;

    if (this.stdin.setRawMode) {
      this.stdin.setRawMode(true);
    }
    this.stdin.resume();
    this.stdin.setEncoding('utf8');
    this.stdin.on('data', this.stdinListener);

    process.on('SIGWINCH', this.resizeHandler);

    if (this.useAlternateScreen) {
      this.stdout.write(ANSI.enterAltScreen);
    }
    this.stdout.write(ANSI.hideCursor);

    if (this.useMouse) {
      this.stdout.write(ANSI.enableMouse);
    }

    this.requestRender();
  }

  requestRender(): void {
    if (this._isDestroyed || this.renderRequested) return;
    this.renderRequested = true;

    if (this.renderTimeout) return;

    const frameTime = 1000 / this.targetFps;
    this.renderTimeout = setTimeout(() => {
      this.renderTimeout = null;
      this.renderRequested = false;
      this.renderFrame();
    }, frameTime);
  }

  private renderFrame(): void {
    if (this._isDestroyed) return;

    this.currentBuffer.clear(this.backgroundColor);
    this.root.render(this.currentBuffer, 0);

    const output = this.currentBuffer.toAnsi(this.previousBuffer ?? undefined);
    this.stdout.write(output);

    this.previousBuffer = this.currentBuffer;
    this.currentBuffer = new Buffer(this._width, this._height);
  }

  private handleInput(data: Buffer | string): void {
    const str = data.toString();

    if (this.exitOnCtrlC && str === '\x03') {
      this.destroy();
      process.exit(0);
    }

    this.emit('keypress', str);
  }

  private handleResize(): void {
    const newWidth = this.stdout.columns || 80;
    const newHeight = this.stdout.rows || 24;

    if (newWidth === this._width && newHeight === this._height) return;

    this._width = newWidth;
    this._height = newHeight;

    this.currentBuffer = new Buffer(this._width, this._height);
    this.previousBuffer = null;
    this.root.resize(this._width, this._height);

    this.emit('resize', this._width, this._height);
    this.requestRender();
  }

  destroy(): void {
    if (this._isDestroyed) return;
    this._isDestroyed = true;
    this._isRunning = false;

    if (this.renderTimeout) {
      clearTimeout(this.renderTimeout);
      this.renderTimeout = null;
    }

    this.stdin.removeListener('data', this.stdinListener);
    process.removeListener('SIGWINCH', this.resizeHandler);

    if (this.useMouse) {
      this.stdout.write(ANSI.disableMouse);
    }

    this.stdout.write(ANSI.showCursor);
    this.stdout.write(ANSI.reset);

    if (this.useAlternateScreen) {
      this.stdout.write(ANSI.exitAltScreen);
    }

    if (this.stdin.setRawMode) {
      this.stdin.setRawMode(false);
    }

    this.root.destroyRecursively();
    this.currentBuffer.destroy();
    this.previousBuffer?.destroy();

    this.emit('destroy');
    this.removeAllListeners();
  }
}

export async function createRenderer(config: RendererConfig = {}): Promise<Renderer> {
  const renderer = new Renderer(config);
  await renderer.start();
  return renderer;
}
