import { Box, Text } from 'ink';
import type React from 'react';

// ============================================
// 📦 Basic Components
// ============================================

export interface TitleProps {
  children: React.ReactNode;
  color?: string;
}

/**
 * Title component for displaying styled headings
 */
export const Title: React.FC<TitleProps> = ({ children, color = 'cyan' }) => (
  <Text bold color={color}>
    {children}
  </Text>
);

export interface StatusProps {
  status: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

/**
 * Status component for displaying status messages with icons
 */
export const Status: React.FC<StatusProps> = ({ status, message }) => {
  const config = {
    success: { icon: '✓', color: 'green' },
    error: { icon: '✗', color: 'red' },
    warning: { icon: '⚠', color: 'yellow' },
    info: { icon: 'ℹ', color: 'blue' },
  } as const;

  const { icon, color } = config[status];

  return (
    <Text>
      <Text color={color}>{icon}</Text>
      <Text> {message}</Text>
    </Text>
  );
};

export interface CardProps {
  title?: string;
  children: React.ReactNode;
  borderColor?: string;
}

/**
 * Card component with optional title and border
 */
export const Card: React.FC<CardProps> = ({ title, children, borderColor = 'gray' }) => (
  <Box flexDirection="column" borderStyle="round" borderColor={borderColor} paddingX={1}>
    {title && (
      <Box marginBottom={1}>
        <Title>{title}</Title>
      </Box>
    )}
    {children}
  </Box>
);

// ============================================
// 📤 Exports
// ============================================

export { Box, Text } from 'ink';
export { Button } from './components/Button';
export { CodeViewer } from './components/CodeViewer';
export { CommandPalette } from './components/CommandPalette';
export { Dashboard } from './components/Dashboard';
export { FileTree } from './components/FileTree';
export { Input } from './components/Input';
