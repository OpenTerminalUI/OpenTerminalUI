import { Box, render, Text, useApp, useInput } from 'ink';
import { useState } from 'react';
import { Title } from '../src';
import { CodeViewer } from '../src/components/CodeViewer';
import { CommandPalette } from '../src/components/CommandPalette';
import { FileTree } from '../src/components/FileTree';

const EditorApp = () => {
  const [activePane, setActivePane] = useState<'sidebar' | 'editor'>('sidebar');
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [showPalette, setShowPalette] = useState(false);
  const { exit } = useApp();

  useInput((input, key) => {
    // Global shortcuts
    if (key.ctrl && input === 'p') {
      setShowPalette(true);
      return;
    }

    if (showPalette) return; // Let palette handle input

    if (key.escape) {
      exit();
    }
    if (key.tab) {
      setActivePane((p) => (p === 'sidebar' ? 'editor' : 'sidebar'));
    }
  });

  const handleCommand = (cmd: string) => {
    if (cmd === 'Quit') exit();
    if (cmd === 'Focus Editor') setActivePane('editor');
    if (cmd === 'Focus Sidebar') setActivePane('sidebar');
    if (cmd === 'Close File') setCurrentFile(null);
  };

  return (
    <Box flexDirection="column" height={30}>
      <Box justifyContent="space-between" paddingX={1}>
        <Title color="magenta">OpenCode TUI Editor (Rust Powered)</Title>
        <Text color="gray">TAB to switch • Ctrl+P for Commands • ESC to quit</Text>
      </Box>

      <Box flexGrow={1} borderStyle="round" borderColor="white">
        <FileTree
          isActive={activePane === 'sidebar' && !showPalette}
          onSelectFile={(f) => {
            setCurrentFile(f);
            setActivePane('editor');
          }}
        />
        <CodeViewer isActive={activePane === 'editor' && !showPalette} filePath={currentFile} />
      </Box>

      <Box paddingX={1}>
        <Text>
          Status: {activePane.toUpperCase()} Active |{' '}
          {currentFile ? `Editing: ${currentFile}` : 'No file'}
        </Text>
      </Box>

      <CommandPalette
        isVisible={showPalette}
        onClose={() => setShowPalette(false)}
        onSelect={handleCommand}
        commands={['Open File', 'Save File', 'Close File', 'Focus Editor', 'Focus Sidebar', 'Quit']}
      />
    </Box>
  );
};
render(<EditorApp />);
