import path from 'node:path';
import { readDir } from '@openterminal-ui/core';
import { createSignal, createEffect, For } from 'solid-js';
import { useKeyboard } from '../elements/hooks';

interface FileEntry {
  name: string;
  isDir: boolean;
  size: number;
}

export interface FileTreeProps {
  initialPath?: string;
  onSelectFile: (path: string) => void;
  isActive: boolean;
}

export function FileTree(props: FileTreeProps) {
  const [currentPath, setCurrentPath] = createSignal(props.initialPath || '.');
  const [files, setFiles] = createSignal<FileEntry[]>([]);
  const [selectedIndex, setSelectedIndex] = createSignal(0);

  createEffect(() => {
    const p = currentPath();
    try {
      const entries = readDir(p);
      setFiles([{ name: '..', isDir: true, size: 0 }, ...entries]);
      setSelectedIndex(0);
    } catch {
      setFiles([]);
    }
  });

  useKeyboard((key) => {
    if (!props.isActive) return;

    if (key === 'up') {
      setSelectedIndex((prev) => Math.max(0, prev - 1));
    }
    if (key === 'down') {
      setSelectedIndex((prev) => Math.min(files().length - 1, prev + 1));
    }
    if (key === 'return') {
      const selected = files()[selectedIndex()];
      if (selected?.isDir) {
        setCurrentPath(path.join(currentPath(), selected.name));
      } else if (selected) {
        props.onSelectFile(path.join(currentPath(), selected.name));
      }
    }
  });

  return (
    <box
      style={{
        flexDirection: 'column',
        borderStyle: props.isActive ? 'double' : 'single',
        borderColor: props.isActive ? 'blue' : 'gray',
        padding: 1,
        width: 30,
      }}
    >
      <text style={{ bold: true, color: 'blue', underline: true }}>{currentPath()}</text>
      <box style={{ flexDirection: 'column' }}>
        <For each={files()}>
          {(file, i) => (
            <text
              style={{
                color: i() === selectedIndex() ? 'green' : file.isDir ? 'cyan' : 'white',
              }}
            >
              {i() === selectedIndex() ? '> ' : '  '}
              {file.isDir ? '[D] ' : '[F] '}
              {file.name}
            </text>
          )}
        </For>
      </box>
    </box>
  );
}
