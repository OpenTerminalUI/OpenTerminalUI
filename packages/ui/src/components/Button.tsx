import React from 'react';
import { Box, Text, useInput } from 'ink';

export interface ButtonProps {
  label: string;
  onClick?: () => void;
  isFocused?: boolean;
}

/**
 * A simple button that changes style when focused.
 */
export const Button: React.FC<ButtonProps> = ({ label, onClick, isFocused }) => {
  useInput((input, key) => {
    if (isFocused && (key.return || input === ' ')) {
      onClick?.();
    }
  });

  return (
    <Box
      borderStyle={isFocused ? 'double' : 'single'}
      borderColor={isFocused ? 'green' : 'gray'}
      paddingX={1}
    >
      <Text color={isFocused ? 'green' : 'white'} bold={isFocused}>
        {label}
      </Text>
    </Box>
  );
};
