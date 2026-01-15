import { render } from '../src';
import { createSignal, createEffect } from 'solid-js';

const App = () => {
  const [count, setCount] = createSignal(0);

  createEffect(() => {
    const timer = setInterval(() => {
      setCount((c) => c + 1);
    }, 1000);
    return () => clearInterval(timer);
  });

  return (
    <box style={{ borderStyle: 'double', borderColor: 'green', padding: 1 }}>
      <text style={{ color: 'cyan', bold: true }}>OpenTerminalUI - SolidJS Demo</text>
      <text>Counter: {count()}</text>
      <text style={{ color: 'gray' }}>Press Ctrl+C to exit</text>
    </box>
  );
};

render(App, { backgroundColor: 'black' });
