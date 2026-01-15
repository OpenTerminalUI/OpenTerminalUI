import { createContext, createSignal, onCleanup, onMount, useContext } from 'solid-js';
import type { Renderer } from '../core';

export const RendererContext = createContext<Renderer>();

export const useRenderer = () => {
  const renderer = useContext(RendererContext);
  if (!renderer) {
    throw new Error('No renderer found. Wrap your app with RendererContext.Provider');
  }
  return renderer;
};

export const useTerminalDimensions = () => {
  const renderer = useRenderer();
  const [dimensions, setDimensions] = createSignal({
    width: renderer.width,
    height: renderer.height,
  });

  onMount(() => {
    const callback = (width: number, height: number) => {
      setDimensions({ width, height });
    };
    renderer.on('resize', callback);
    onCleanup(() => renderer.off('resize', callback));
  });

  return dimensions;
};

export interface KeyEvent {
  name: string;
  sequence: string;
  ctrl: boolean;
  meta: boolean;
  shift: boolean;
}

export const useKeyboard = (callback: (key: string) => void) => {
  const renderer = useRenderer();

  onMount(() => {
    renderer.on('keypress', callback);
    onCleanup(() => renderer.off('keypress', callback));
  });
};

export const onResize = (callback: (width: number, height: number) => void) => {
  const renderer = useRenderer();

  onMount(() => {
    renderer.on('resize', callback);
    onCleanup(() => renderer.off('resize', callback));
  });
};
