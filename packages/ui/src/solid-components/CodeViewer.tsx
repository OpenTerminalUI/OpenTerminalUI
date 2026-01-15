import { highlightCode, readFile } from '@openterminal-ui/core';
import { createSignal, createEffect } from 'solid-js';

export interface CodeViewerProps {
  filePath: string | null;
  isActive: boolean;
}

export function CodeViewer(props: CodeViewerProps) {
  const [content, setContent] = createSignal<string>('');

  createEffect(() => {
    const fp = props.filePath;
    if (fp) {
      try {
        const raw = readFile(fp);
        const ext = fp.split('.').pop() || 'txt';
        const highlighted = highlightCode(raw, ext);
        setContent(highlighted);
      } catch {
        setContent(`Error reading file: ${fp}`);
      }
    } else {
      setContent('No file selected.');
    }
  });

  return (
    <box
      style={{
        flexDirection: 'column',
        borderStyle: props.isActive ? 'double' : 'single',
        borderColor: props.isActive ? 'blue' : 'gray',
        padding: 1,
        flexGrow: 1,
      }}
    >
      <text style={{ bold: true, color: 'yellow' }}>{props.filePath || 'Code Viewer'}</text>
      <box style={{ overflow: 'hidden' }}>
        <text>{content()}</text>
      </box>
    </box>
  );
}
