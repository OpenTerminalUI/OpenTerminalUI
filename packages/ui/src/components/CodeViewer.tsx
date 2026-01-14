import { highlightCode, readFile } from '@openterminal-ui/core';
import { Box, Text } from 'ink';
import type React from 'react';
import { useEffect, useState } from 'react';

export interface CodeViewerProps {
  filePath: string | null;
  isActive: boolean;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({ filePath, isActive }) => {
  const [content, setContent] = useState<string>('');

  useEffect(() => {
    if (filePath) {
      try {
        const raw = readFile(filePath);
        // Apply syntax highlighting via Rust
        // Determine extension
        const ext = filePath.split('.').pop() || 'txt';
        const highlighted = highlightCode(raw, ext);
        setContent(highlighted);
      } catch (_e) {
        setContent(`Error reading file: ${filePath}`);
      }
    } else {
      setContent('No file selected.');
    }
  }, [filePath]);

  return (
    <Box
      flexDirection="column"
      borderStyle={isActive ? 'double' : 'single'}
      borderColor={isActive ? 'blue' : 'gray'}
      padding={1}
      flexGrow={1}
    >
      <Text bold color="yellow">
        {filePath || 'Code Viewer'}
      </Text>
      {/* Ink Text handles basic ANSI, but we might need to be careful with large files */}
      <Box overflowY="hidden">
        <Text>{content}</Text>
      </Box>
    </Box>
  );
};
