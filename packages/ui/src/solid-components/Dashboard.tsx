import { getSystemStatus, renderServerView, type SystemStatus } from '@openterminal-ui/core';
import { createSignal, onCleanup, onMount, For, Show, type Accessor } from 'solid-js';

export function Dashboard() {
  const [data, setData] = createSignal<SystemStatus | null>(null);
  const [view, setView] = createSignal<string>('');
  const [loading, setLoading] = createSignal(true);

  onMount(() => {
    const timer = setInterval(() => {
      try {
        const status = getSystemStatus();
        status.uptime += Math.floor(Math.random() * 100);
        status.cpuUsage = parseFloat((Math.random() * 100).toFixed(1));
        setData(status);

        const serverView = renderServerView(40, 10);
        setView(serverView);
        setLoading(false);
      } catch {
        setLoading(false);
      }
    }, 1000);

    onCleanup(() => clearInterval(timer));
  });

  return (
    <Show
      when={!loading()}
      fallback={<text style={{ color: 'cyan' }}>Connecting to Rust Server...</text>}
    >
      <Show when={data()} fallback={<text style={{ color: 'red' }}>Failed to fetch data</text>}>
        {(currentData: Accessor<SystemStatus>) => (
          <box style={{ flexDirection: 'column', gap: 1 }}>
            <text style={{ bold: true, color: 'cyan' }}>
              --- SERVER DASHBOARD (RUST BACKEND) ---
            </text>

            <box style={{ flexDirection: 'row', gap: 2 }}>
              <box
                style={{
                  flexDirection: 'column',
                  borderStyle: 'single',
                  borderColor: 'green',
                  padding: 1,
                }}
              >
                <text>CPU: {currentData().cpuUsage}%</text>
                <text>MEM: {currentData().memoryUsage} MB</text>
                <text>UPTIME: {currentData().uptime}s</text>
              </box>

              <box
                style={{
                  flexDirection: 'column',
                  borderStyle: 'single',
                  borderColor: 'yellow',
                  padding: 1,
                }}
              >
                <text style={{ bold: true }}>Processes:</text>
                <For each={currentData().processes}>{(process) => <text>- {process}</text>}</For>
              </box>
            </box>

            <box style={{ flexDirection: 'column' }}>
              <text style={{ bold: true }}>Server Rendered View (from Rust):</text>
              <text style={{ color: 'gray' }}>{view()}</text>
            </box>

            <text style={{ color: 'green' }}>Status: {currentData().statusMessage}</text>
          </box>
        )}
      </Show>
    </Show>
  );
}
