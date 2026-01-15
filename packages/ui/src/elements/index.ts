import { useContext } from 'solid-js';
import { BoxRenderable, TextRenderable } from '../core';
import type { Renderable } from '../core';
import { createRenderer } from '../renderer/universal';
import { RendererContext } from './hooks';

let idCounter = 0;
const getNextId = (prefix: string) => `${prefix}-${++idCounter}`;

class TextNode extends TextRenderable {
  static fromString(text: string, id: string): TextNode {
    const node = new TextNode({ id, content: text });
    return node;
  }

  replace(text: string): void {
    this.content = text;
  }
}

type RenderableConstructor = new (options: Record<string, unknown>) => Renderable;

export const baseComponents: Record<string, RenderableConstructor> = {
  box: BoxRenderable as unknown as RenderableConstructor,
  text: TextRenderable as unknown as RenderableConstructor,
};

const componentCatalogue = { ...baseComponents };

export function extend(components: Record<string, RenderableConstructor>): void {
  Object.assign(componentCatalogue, components);
}

export function getComponentCatalogue() {
  return componentCatalogue;
}

const rendererResult = createRenderer<Renderable>({
  createElement(tagName: string): Renderable {
    const id = getNextId(tagName);
    const solidRenderer = useContext(RendererContext);
    if (!solidRenderer) {
      throw new Error('No renderer found');
    }
    const elements = getComponentCatalogue();
    if (!elements[tagName]) {
      throw new Error(`Unknown component type: ${tagName}`);
    }
    const element = new elements[tagName]({ id });
    element.ctx = solidRenderer;
    return element;
  },

  createTextNode(value: string | number): Renderable {
    const id = getNextId('text-node');
    const text = typeof value === 'number' ? String(value) : value;
    return TextNode.fromString(text, id);
  },

  replaceText(textNode: Renderable, value: string): void {
    if (textNode instanceof TextNode) {
      textNode.replace(value);
    }
  },

  setProperty(node: Renderable, name: string, value: unknown): void {
    if (name === 'id') {
      node.id = value as string;
      return;
    }

    if (name === 'style' && typeof value === 'object' && value !== null) {
      for (const [prop, propVal] of Object.entries(value)) {
        (node as unknown as Record<string, unknown>)[prop] = propVal;
      }
      return;
    }

    (node as unknown as Record<string, unknown>)[name] = value;
  },

  isTextNode(node: Renderable): boolean {
    return node instanceof TextNode;
  },

  insertNode(parent: Renderable, node: Renderable, anchor?: Renderable): void {
    if (anchor) {
      parent.insertBefore(node, anchor);
    } else {
      parent.add(node);
    }
  },

  removeNode(parent: Renderable, node: Renderable): void {
    parent.remove(node.id);
    process.nextTick(() => {
      if (!node.parent) {
        node.destroyRecursively();
      }
    });
  },

  getParentNode(node: Renderable): Renderable | undefined {
    return node.parent ?? undefined;
  },

  getFirstChild(node: Renderable): Renderable | undefined {
    const children = node.getChildren();
    return children[0];
  },

  getNextSibling(node: Renderable): Renderable | undefined {
    const parent = node.parent;
    if (!parent) return undefined;
    const siblings = parent.getChildren();
    const index = siblings.indexOf(node);
    if (index === -1 || index === siblings.length - 1) return undefined;
    return siblings[index + 1];
  },
});

export const _render = rendererResult.render;
export const effect = rendererResult.effect;
export const memo = rendererResult.memo;
export const createComponent = rendererResult.createComponent;
export const createElement = rendererResult.createElement;
export const createTextNode = rendererResult.createTextNode;
export const insertNode = rendererResult.insertNode;
export const insert = rendererResult.insert;
export const spread = rendererResult.spread;
export const setProp = rendererResult.setProp;
export const mergeProps = rendererResult.mergeProps;
export const use = rendererResult.use;

export { RendererContext } from './hooks';
