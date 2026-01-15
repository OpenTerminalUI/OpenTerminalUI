export * from './core';
export * from './elements';
export * from './solid-components';
export {
  useRenderer,
  useTerminalDimensions,
  useKeyboard,
  onResize,
  RendererContext,
} from './elements/hooks';
export { createRenderer as createSolidRenderer } from './renderer/universal';

import { Renderer, type RendererConfig } from './core';
import { _render, createComponent, RendererContext } from './elements';
import type { JSX } from 'solid-js';

export async function render(
  node: () => JSX.Element,
  rendererOrConfig: Renderer | RendererConfig = {},
): Promise<() => void> {
  let isDisposed = false;
  let dispose: () => void;

  const renderer =
    rendererOrConfig instanceof Renderer ? rendererOrConfig : new Renderer(rendererOrConfig);

  if (!(rendererOrConfig instanceof Renderer)) {
    await renderer.start();
  }

  renderer.on('destroy', () => {
    if (!isDisposed) {
      isDisposed = true;
      dispose?.();
    }
  });

  dispose = _render(
    () =>
      createComponent(RendererContext.Provider, {
        get value() {
          return renderer;
        },
        get children() {
          return createComponent(node, {});
        },
      }),
    renderer.root,
  );

  return () => {
    if (!isDisposed) {
      isDisposed = true;
      dispose?.();
      renderer.destroy();
    }
  };
}
