import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { readDir, FileEntry } from '@openterminal-ui/core';
import path from 'path';

export interface FileTreeProps {
  initialPath?: string;
  onSelectFile: (path: string) => void;
  isActive: boolean;
}

export const FileTree: React.FC<FileTreeProps> = ({ initialPath = '.', onSelectFile, isActive }) => {
  const [currentPath, setCurrentPath] = useState(initialPath);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    try {
        // Resolve absolute path if needed, but for now relative is fine
        const entries = readDir(currentPath);
        setFiles([
            { name: '..', is_dir: true, size: 0 },
            ...entries
        ]);
        setSelectedIndex(0);
    } catch (e) {
        console.error("Failed to read dir", e);
    }
  }, [currentPath]);

  useInput((input, key) => {
    if (!isActive) return;

    if (key.upArrow) {
      setSelectedIndex(prev => Math.max(0, prev - 1));
    }
    if (key.downArrow) {
      setSelectedIndex(prev => Math.min(files.length - 1, prev + 1));
    }
    if (key.return) {
      const selected = files[selectedIndex];
      if (selected.is_dir) {
        setCurrentPath(path.join(currentPath, selected.name));
      } else {
        onSelectFile(path.join(currentPath, selected.name));
      }
    }
  });

  return (
    <Box flexDirection="column" borderStyle={isActive ? "double" : "single"} borderColor={isActive ? "blue" : "gray"} padding={1} width="30%">
      <Text bold color="blue" underline>{currentPath}</Text>
      <Box flexDirection="column">
        {files.map((file, i) => (
          <Text key={file.name + i} color={i === selectedIndex ? "green" : (file.is_dir ? "cyan" : "white")} wrap="truncate">
            {i === selectedIndex ? "> " : "  "}
            {file.is_dir ? "📁 " : "📄 "}
            {file.name}
          </Text>
        ))}
      </Box>
    </Box>
  );
};
