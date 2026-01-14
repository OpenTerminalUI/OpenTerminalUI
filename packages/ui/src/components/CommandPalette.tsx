import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { fuzzyMatch } from '@openterminal-ui/core';

export interface CommandPaletteProps {
  isVisible: boolean;
  onClose: () => void;
  onSelect: (command: string) => void;
  commands: string[];
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isVisible, onClose, onSelect, commands }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Get matches from Rust
  const matches = React.useMemo(() => {
     return fuzzyMatch(query, commands);
  }, [query, commands]);

  useInput((input, key) => {
    if (!isVisible) return;

    if (key.escape) {
      onClose();
      setQuery('');
    }
    if (key.upArrow) {
      setSelectedIndex(prev => Math.max(0, prev - 1));
    }
    if (key.downArrow) {
      setSelectedIndex(prev => Math.min(matches.length - 1, prev + 1));
    }
    if (key.return) {
      if (matches[selectedIndex]) {
        onSelect(matches[selectedIndex]);
        onClose();
        setQuery('');
      }
    }
  });

  if (!isVisible) return null;

  return (
    <Box position="absolute" width="100%" height="100%" alignItems="center" justifyContent="center">
      <Box
        width="60%"
        height="50%"
        borderStyle="double"
        borderColor="magenta"
        flexDirection="column"
        padding={1}
        // bg="black" // Not supported directly in all Ink versions, rely on stacking
      >
        <Text bold>Command Palette</Text>
        <Box borderStyle="single" borderColor="gray">
             <Text color="magenta">❯ </Text>
             <TextInput value={query} onChange={(v) => {
                 setQuery(v);
                 setSelectedIndex(0);
             }} focus={true} />
        </Box>
        <Box flexDirection="column" marginTop={1}>
            {matches.slice(0, 10).map((cmd, i) => (
                <Text key={cmd} color={i === selectedIndex ? "magenta" : "white"}>
                    {i === selectedIndex ? "> " : "  "} {cmd}
                </Text>
            ))}
        </Box>
      </Box>
    </Box>
  );
};
