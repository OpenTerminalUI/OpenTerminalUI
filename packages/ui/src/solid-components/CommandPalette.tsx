import { fuzzyMatch } from '@openterminal-ui/core';
import { createMemo, createSignal, For, Show } from 'solid-js';
import { useKeyboard } from '../elements/hooks';

export interface CommandPaletteProps {
  isVisible: boolean;
  onClose: () => void;
  onSelect: (command: string) => void;
  commands: string[];
}

export function CommandPalette(props: CommandPaletteProps) {
  const [query, setQuery] = createSignal('');
  const [selectedIndex, setSelectedIndex] = createSignal(0);

  const matches = createMemo(() => {
    return fuzzyMatch(query(), props.commands);
  });

  const resetState = () => {
    setQuery('');
    setSelectedIndex(0);
  };

  const handleEscape = () => {
    props.onClose();
    resetState();
  };

  const handleNavigation = (key: string) => {
    if (key === 'up') {
      setSelectedIndex((prev) => Math.max(0, prev - 1));
    } else if (key === 'down') {
      setSelectedIndex((prev) => Math.min(matches().length - 1, prev + 1));
    }
  };

  const handleSelect = () => {
    const selected = matches()[selectedIndex()];
    if (selected) {
      props.onSelect(selected);
      props.onClose();
      resetState();
    }
  };

  const handleTextInput = (key: string) => {
    if (key === 'backspace') {
      setQuery((prev) => prev.slice(0, -1));
      setSelectedIndex(0);
    } else if (key.length === 1 && key.match(/[a-zA-Z0-9\s\-_]/)) {
      setQuery((prev) => prev + key);
      setSelectedIndex(0);
    }
  };

  useKeyboard((key) => {
    if (!props.isVisible) return;

    if (key === 'escape') {
      handleEscape();
    } else if (key === 'up' || key === 'down') {
      handleNavigation(key);
    } else if (key === 'return') {
      handleSelect();
    } else {
      handleTextInput(key);
    }
  });

  return (
    <Show when={props.isVisible}>
      <box
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <box
          style={{
            width: '60%',
            height: '50%',
            borderStyle: 'double',
            borderColor: 'magenta',
            flexDirection: 'column',
            padding: 1,
          }}
        >
          <text style={{ bold: true, color: 'magenta' }}>Command Palette</text>
          <box
            style={{
              borderStyle: 'single',
              borderColor: 'gray',
              flexDirection: 'row',
            }}
          >
            <text style={{ color: 'magenta' }}>❯ </text>
            <text>{query() || ' '}</text>
          </box>
          <box style={{ flexDirection: 'column', marginTop: 1 }}>
            <For each={matches().slice(0, 10)}>
              {(cmd, i) => (
                <text
                  style={{
                    color: i() === selectedIndex() ? 'magenta' : 'white',
                  }}
                >
                  {i() === selectedIndex() ? '> ' : '  '} {cmd}
                </text>
              )}
            </For>
          </box>
        </box>
      </box>
    </Show>
  );
}
