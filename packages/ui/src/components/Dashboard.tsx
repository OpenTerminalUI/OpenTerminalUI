import { getSystemStatus, renderServerView, type SystemStatus } from '@openterminal-ui/core';
import { Box, Text } from 'ink';
import type React from 'react';
import { useEffect, useState } from 'react';

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<SystemStatus | null>(null);
  const [view, setView] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching from the Rust "server"
    const timer = setInterval(() => {
      try {
        const status = getSystemStatus();
        // Simulate changing data
        status.uptime += Math.floor(Math.random() * 100);
        status.cpu_usage = parseFloat((Math.random() * 100).toFixed(1));
        setData(status);

        const serverView = renderServerView(40, 10);
        setView(serverView);
        setLoading(false);
      } catch (_e) {}
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (loading) {
    return <Text>Connecting to Rust Server...</Text>;
  }

  if (!data) {
    return <Text color="red">Failed to fetch data</Text>;
  }

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold color="cyan">
        --- SERVER DASHBOARD (RUST BACKEND) ---
      </Text>

      <Box gap={2}>
        <Box flexDirection="column" borderStyle="single" borderColor="green" padding={1}>
          <Text>CPU: {data.cpu_usage}%</Text>
          <Text>MEM: {data.memory_usage} MB</Text>
          <Text>UPTIME: {data.uptime}s</Text>
        </Box>

        <Box flexDirection="column" borderStyle="single" borderColor="yellow" padding={1}>
          <Text bold>Processes:</Text>
          {data.processes.map((p, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: demo data has no unique ids
            <Text key={i}>- {p}</Text>
          ))}
        </Box>
      </Box>

      <Box flexDirection="column">
        <Text bold>Server Rendered View (from Rust):</Text>
        <Text color="gray">{view}</Text>
      </Box>

      <Text color="green">Status: {data.status_message}</Text>
    </Box>
  );
};
