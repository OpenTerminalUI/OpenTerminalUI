import type { JSX as SolidJSX } from 'solid-js';
import type { BoxRenderableOptions } from './src/core/BoxRenderable';
import type { TextRenderableOptions } from './src/core/TextRenderable';
import type { RenderableOptions } from './src/core/Renderable';

type StyleProps = Partial<RenderableOptions> & {
  borderStyle?: 'single' | 'double' | 'round' | 'none';
  borderColor?: string;
  backgroundColor?: string;
  color?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  gap?: number;
  flexDirection?: 'row' | 'column';
  flexGrow?: number;
  overflow?: 'hidden' | 'visible';
  marginTop?: number;
  position?: 'relative' | 'absolute';
  alignItems?: string;
  justifyContent?: string;
};

declare module 'solid-js' {
  namespace JSX {
    interface IntrinsicElements {
      box: BoxRenderableOptions & {
        style?: StyleProps;
        children?: SolidJSX.Element | SolidJSX.Element[];
      };
      text: TextRenderableOptions & {
        style?: StyleProps;
        children?: SolidJSX.Element | SolidJSX.Element[] | string | number;
      };
    }
  }
}
