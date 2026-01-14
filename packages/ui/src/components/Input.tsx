import React from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';

export interface InputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (value: string) => void;
  isFocused?: boolean;
  placeholder?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  value,
  onChange,
  onSubmit,
  isFocused,
  placeholder
}) => {
  return (
    <Box flexDirection="column" borderStyle={isFocused ? "round" : undefined} borderColor="blue" paddingX={1}>
      {label && <Text bold color="blue">{label}</Text>}
      <Box>
        <Text color="green">❯ </Text>
        <TextInput
          value={value}
          onChange={onChange}
          onSubmit={onSubmit}
          focus={isFocused}
          placeholder={placeholder}
        />
      </Box>
    </Box>
  );
};
