import Yoga, {
  Display,
  Edge,
  FlexDirection,
  Align,
  Justify,
  Wrap,
  Overflow,
  PositionType,
  type Node as YogaNode,
} from 'yoga-layout';
import type { Buffer } from './Buffer';
import { EventEmitter } from 'node:events';

export interface RenderContext {
  requestRender(): void;
  width: number;
  height: number;
}

export type FlexDirectionString = 'row' | 'column' | 'row-reverse' | 'column-reverse';
export type AlignString = 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'auto';
export type JustifyString =
  | 'flex-start'
  | 'center'
  | 'flex-end'
  | 'space-between'
  | 'space-around'
  | 'space-evenly';
export type OverflowString = 'visible' | 'hidden' | 'scroll';
export type PositionTypeString = 'relative' | 'absolute';
export type WrapString = 'nowrap' | 'wrap' | 'wrap-reverse';
export type DimensionValue = number | 'auto' | `${number}%`;

export interface RenderableOptions {
  id?: string;
  width?: DimensionValue;
  height?: DimensionValue;
  minWidth?: DimensionValue;
  minHeight?: DimensionValue;
  maxWidth?: DimensionValue;
  maxHeight?: DimensionValue;
  flexGrow?: number;
  flexShrink?: number;
  flexBasis?: number | 'auto';
  flexDirection?: FlexDirectionString;
  flexWrap?: WrapString;
  alignItems?: AlignString;
  alignSelf?: AlignString;
  justifyContent?: JustifyString;
  position?: PositionTypeString;
  overflow?: OverflowString;
  top?: DimensionValue;
  right?: DimensionValue;
  bottom?: DimensionValue;
  left?: DimensionValue;
  margin?: DimensionValue;
  marginTop?: DimensionValue;
  marginRight?: DimensionValue;
  marginBottom?: DimensionValue;
  marginLeft?: DimensionValue;
  padding?: number | `${number}%`;
  paddingTop?: number | `${number}%`;
  paddingRight?: number | `${number}%`;
  paddingBottom?: number | `${number}%`;
  paddingLeft?: number | `${number}%`;
  visible?: boolean;
  zIndex?: number;
}

const yogaConfig = Yoga.Config.create();
yogaConfig.setUseWebDefaults(false);
yogaConfig.setPointScaleFactor(1);

function parseFlexDirection(value?: FlexDirectionString): FlexDirection {
  switch (value) {
    case 'row':
      return FlexDirection.Row;
    case 'row-reverse':
      return FlexDirection.RowReverse;
    case 'column-reverse':
      return FlexDirection.ColumnReverse;
    case 'column':
    default:
      return FlexDirection.Column;
  }
}

function parseAlign(value?: AlignString): Align {
  switch (value) {
    case 'center':
      return Align.Center;
    case 'flex-end':
      return Align.FlexEnd;
    case 'stretch':
      return Align.Stretch;
    case 'auto':
      return Align.Auto;
    case 'flex-start':
    default:
      return Align.FlexStart;
  }
}

function parseJustify(value?: JustifyString): Justify {
  switch (value) {
    case 'center':
      return Justify.Center;
    case 'flex-end':
      return Justify.FlexEnd;
    case 'space-between':
      return Justify.SpaceBetween;
    case 'space-around':
      return Justify.SpaceAround;
    case 'space-evenly':
      return Justify.SpaceEvenly;
    case 'flex-start':
    default:
      return Justify.FlexStart;
  }
}

function parseWrap(value?: WrapString): Wrap {
  switch (value) {
    case 'wrap':
      return Wrap.Wrap;
    case 'wrap-reverse':
      return Wrap.WrapReverse;
    case 'nowrap':
    default:
      return Wrap.NoWrap;
  }
}

function parseOverflow(value?: OverflowString): Overflow {
  switch (value) {
    case 'hidden':
      return Overflow.Hidden;
    case 'scroll':
      return Overflow.Scroll;
    case 'visible':
    default:
      return Overflow.Visible;
  }
}

function parsePositionType(value?: PositionTypeString): PositionType {
  return value === 'absolute' ? PositionType.Absolute : PositionType.Relative;
}

let renderableCounter = 0;

export abstract class Renderable extends EventEmitter {
  static renderablesByNumber: Map<number, Renderable> = new Map();

  readonly num: number;
  protected _id: string;
  protected _ctx: RenderContext | null = null;
  protected _visible = true;
  protected _isDestroyed = false;
  protected _zIndex = 0;
  protected _x = 0;
  protected _y = 0;
  protected _widthValue = 0;
  protected _heightValue = 0;

  protected yogaNode: YogaNode;
  protected _children: Renderable[] = [];
  protected _childrenByZIndex: Renderable[] = [];
  protected _needsZIndexSort = false;
  parent: Renderable | null = null;
  private childrenById: Map<string, Renderable> = new Map();

  constructor(options: RenderableOptions = {}) {
    super();
    this.num = ++renderableCounter;
    this._id = options.id ?? `renderable-${this.num}`;
    this._visible = options.visible !== false;
    this._zIndex = options.zIndex ?? 0;

    this.yogaNode = Yoga.Node.create(yogaConfig);
    this.yogaNode.setDisplay(this._visible ? Display.Flex : Display.None);
    this.setupYogaProperties(options);

    Renderable.renderablesByNumber.set(this.num, this);
  }

  get id(): string {
    return this._id;
  }

  set id(value: string) {
    if (this.parent) {
      this.parent.childrenById.delete(this._id);
      this.parent.childrenById.set(value, this);
    }
    this._id = value;
  }

  get ctx(): RenderContext | null {
    return this._ctx;
  }

  set ctx(value: RenderContext | null) {
    this._ctx = value;
    for (const child of this._children) {
      child.ctx = value;
    }
  }

  get visible(): boolean {
    return this._visible;
  }

  set visible(value: boolean) {
    if (this._visible === value) return;
    this._visible = value;
    this.yogaNode.setDisplay(value ? Display.Flex : Display.None);
    this.requestRender();
  }

  get x(): number {
    return this.parent ? this.parent.x + this._x : this._x;
  }

  get y(): number {
    return this.parent ? this.parent.y + this._y : this._y;
  }

  get width(): number {
    return this._widthValue;
  }

  set width(value: DimensionValue) {
    this.yogaNode.setWidth(value);
    this.requestRender();
  }

  get height(): number {
    return this._heightValue;
  }

  set height(value: DimensionValue) {
    this.yogaNode.setHeight(value);
    this.requestRender();
  }

  get zIndex(): number {
    return this._zIndex;
  }

  set zIndex(value: number) {
    if (this._zIndex !== value) {
      this._zIndex = value;
      this.parent?.requestZIndexSort();
      this.requestRender();
    }
  }

  get isDestroyed(): boolean {
    return this._isDestroyed;
  }

  private setupYogaDimensions(options: RenderableOptions): void {
    const node = this.yogaNode;
    if (options.width !== undefined) node.setWidth(options.width);
    if (options.height !== undefined) node.setHeight(options.height);
    if (options.minWidth !== undefined && options.minWidth !== 'auto') {
      node.setMinWidth(options.minWidth);
    }
    if (options.minHeight !== undefined && options.minHeight !== 'auto') {
      node.setMinHeight(options.minHeight);
    }
    if (options.maxWidth !== undefined && options.maxWidth !== 'auto') {
      node.setMaxWidth(options.maxWidth);
    }
    if (options.maxHeight !== undefined && options.maxHeight !== 'auto') {
      node.setMaxHeight(options.maxHeight);
    }
  }

  private setupYogaFlexAndPosition(options: RenderableOptions): void {
    const node = this.yogaNode;
    node.setFlexGrow(options.flexGrow ?? 0);
    node.setFlexShrink(options.flexShrink ?? 1);
    if (options.flexBasis !== undefined) node.setFlexBasis(options.flexBasis);

    node.setFlexDirection(parseFlexDirection(options.flexDirection));
    node.setFlexWrap(parseWrap(options.flexWrap));
    node.setAlignItems(parseAlign(options.alignItems));
    node.setAlignSelf(parseAlign(options.alignSelf));
    node.setJustifyContent(parseJustify(options.justifyContent));
    node.setPositionType(parsePositionType(options.position));
    node.setOverflow(parseOverflow(options.overflow));

    if (options.top !== undefined && options.top !== 'auto') {
      node.setPosition(Edge.Top, options.top);
    }
    if (options.right !== undefined && options.right !== 'auto') {
      node.setPosition(Edge.Right, options.right);
    }
    if (options.bottom !== undefined && options.bottom !== 'auto') {
      node.setPosition(Edge.Bottom, options.bottom);
    }
    if (options.left !== undefined && options.left !== 'auto') {
      node.setPosition(Edge.Left, options.left);
    }
  }

  private setupYogaProperties(options: RenderableOptions): void {
    this.setupYogaDimensions(options);
    this.setupYogaFlexAndPosition(options);
    this.setupMarginPadding(options);
  }

  private setupMarginPadding(options: RenderableOptions): void {
    const node = this.yogaNode;

    if (options.margin !== undefined) {
      node.setMargin(Edge.Top, options.margin);
      node.setMargin(Edge.Right, options.margin);
      node.setMargin(Edge.Bottom, options.margin);
      node.setMargin(Edge.Left, options.margin);
    }
    if (options.marginTop !== undefined) node.setMargin(Edge.Top, options.marginTop);
    if (options.marginRight !== undefined) node.setMargin(Edge.Right, options.marginRight);
    if (options.marginBottom !== undefined) node.setMargin(Edge.Bottom, options.marginBottom);
    if (options.marginLeft !== undefined) node.setMargin(Edge.Left, options.marginLeft);

    if (options.padding !== undefined) {
      node.setPadding(Edge.Top, options.padding);
      node.setPadding(Edge.Right, options.padding);
      node.setPadding(Edge.Bottom, options.padding);
      node.setPadding(Edge.Left, options.padding);
    }
    if (options.paddingTop !== undefined) node.setPadding(Edge.Top, options.paddingTop);
    if (options.paddingRight !== undefined) node.setPadding(Edge.Right, options.paddingRight);
    if (options.paddingBottom !== undefined) node.setPadding(Edge.Bottom, options.paddingBottom);
    if (options.paddingLeft !== undefined) node.setPadding(Edge.Left, options.paddingLeft);
  }

  requestRender(): void {
    this._ctx?.requestRender();
  }

  private requestZIndexSort(): void {
    this._needsZIndexSort = true;
  }

  private ensureZIndexSorted(): void {
    if (this._needsZIndexSort) {
      this._childrenByZIndex.sort((a, b) => a.zIndex - b.zIndex);
      this._needsZIndexSort = false;
    }
  }

  add(child: Renderable, index?: number): number {
    if (child._isDestroyed) return -1;

    if (child.parent === this) {
      this.yogaNode.removeChild(child.yogaNode);
      const idx = this._children.indexOf(child);
      if (idx !== -1) this._children.splice(idx, 1);
    } else {
      if (child.parent) child.parent.remove(child.id);
      child.parent = this;
      child.ctx = this._ctx;
      this._needsZIndexSort = true;
      this.childrenById.set(child.id, child);
      this._childrenByZIndex.push(child);
    }

    const insertIndex = index ?? this._children.length;
    this._children.splice(insertIndex, 0, child);
    this.yogaNode.insertChild(child.yogaNode, insertIndex);
    this.requestRender();
    return insertIndex;
  }

  insertBefore(child: Renderable, anchor?: Renderable): number {
    if (!anchor) return this.add(child);
    const anchorIndex = this._children.indexOf(anchor);
    if (anchorIndex === -1) return this.add(child);
    return this.add(child, anchorIndex);
  }

  remove(id: string): void {
    const child = this.childrenById.get(id);
    if (!child) return;

    this.yogaNode.removeChild(child.yogaNode);
    child.parent = null;

    this.childrenById.delete(id);
    const idx = this._children.indexOf(child);
    if (idx !== -1) this._children.splice(idx, 1);
    const zIdx = this._childrenByZIndex.indexOf(child);
    if (zIdx !== -1) this._childrenByZIndex.splice(zIdx, 1);

    this.requestRender();
  }

  getChildren(): Renderable[] {
    return [...this._children];
  }

  getChildrenCount(): number {
    return this._children.length;
  }

  getRenderable(id: string): Renderable | undefined {
    return this.childrenById.get(id);
  }

  findDescendantById(id: string): Renderable | undefined {
    for (const child of this._children) {
      if (child.id === id) return child;
      const found = child.findDescendantById(id);
      if (found) return found;
    }
    return undefined;
  }

  updateFromLayout(): void {
    const layout = this.yogaNode.getComputedLayout();
    this._x = layout.left;
    this._y = layout.top;
    this._widthValue = Math.max(layout.width, 1);
    this._heightValue = Math.max(layout.height, 1);
  }

  updateLayout(deltaTime: number): void {
    if (!this._visible) return;
    this.updateFromLayout();
    this.ensureZIndexSorted();
    for (const child of this._childrenByZIndex) {
      child.updateLayout(deltaTime);
    }
  }

  render(buffer: Buffer, deltaTime: number): void {
    if (!this._visible) return;
    this.renderSelf(buffer, deltaTime);
    for (const child of this._childrenByZIndex) {
      child.render(buffer, deltaTime);
    }
  }

  protected renderSelf(buffer: Buffer, deltaTime: number): void {}

  destroy(): void {
    if (this._isDestroyed) return;
    this._isDestroyed = true;

    if (this.parent) this.parent.remove(this.id);

    for (const child of [...this._children]) {
      child.destroy();
    }
    this._children = [];
    this.childrenById.clear();
    this._childrenByZIndex = [];

    Renderable.renderablesByNumber.delete(this.num);
    this.removeAllListeners();

    try {
      this.yogaNode.free();
    } catch {
      // empty
    }
  }

  destroyRecursively(): void {
    const children = [...this._children];
    for (const child of children) {
      child.destroyRecursively();
    }
    this.destroy();
  }
}
