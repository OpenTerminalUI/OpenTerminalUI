import React, { useState } from 'react';
import { render, Box, Text, useInput, useApp } from 'ink';
import { Dashboard, Button, Input, Title, Card } from '../src';

const App = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'input' | 'exit'>('dashboard');
  const [inputText, setInputText] = useState('');
  const { exit } = useApp();

  useInput((input, key) => {
    if (key.escape) {
      exit();
    }
    // Simple tab switching logic
    if (key.tab) {
        setActiveTab(prev => {
            if (prev === 'dashboard') return 'input';
            if (prev === 'input') return 'exit';
            return 'dashboard';
        });
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Title color="magenta">OpenTerminalUI Demo</Title>
      <Text color="gray">Press Tab to switch focus, Esc to exit</Text>

      <Box marginTop={1} gap={1}>
          <Button
            label="Dashboard"
            isFocused={activeTab === 'dashboard'}
            onClick={() => setActiveTab('dashboard')}
          />
          <Button
            label="Input Test"
            isFocused={activeTab === 'input'}
            onClick={() => setActiveTab('input')}
          />
          <Button
            label="Exit"
            isFocused={activeTab === 'exit'}
            onClick={() => exit()}
          />
      </Box>

      <Box marginTop={1} borderStyle="single" borderColor="gray" padding={1} minHeight={15}>
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'input' && (
            <Box flexDirection="column">
                <Text>Type something below:</Text>
                <Input
                    value={inputText}
                    onChange={setInputText}
                    isFocused={true}
                    placeholder="Enter command..."
                    onSubmit={(val) => {
                        console.log("Submitted:", val);
                        setInputText('');
                    }}
                />
                <Text>Current Value: {inputText}</Text>
            </Box>
        )}
        {activeTab === 'exit' && <Text color="red">Press Enter to Exit</Text>}
      </Box>
    </Box>
  );
};

// Clear screen before render
console.clear();
render(<App />);
