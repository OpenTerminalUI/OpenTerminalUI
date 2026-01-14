# UI PACKAGE - Ink/React Terminal Components

## OVERVIEW

React component library for terminal UIs using Ink. Delegates heavy operations to Rust core.

## STRUCTURE

```
packages/ui/
├── src/
│   ├── index.tsx           # Exports all components + Ink primitives
│   └── components/         # Individual components
│       ├── Button.tsx      # Interactive button with focus
│       ├── Input.tsx       # Text input (wraps ink-text-input)
│       ├── FileTree.tsx    # Directory browser (uses Rust readDir)
│       ├── CodeViewer.tsx  # Syntax highlighting (uses Rust)
│       ├── CommandPalette.tsx  # Fuzzy search modal (uses Rust)
│       └── Dashboard.tsx   # System monitor (uses Rust)
├── examples/               # Demo applications
└── scripts/                # Dev runners
```

## WHERE TO LOOK

| Task | Location |
|------|----------|
| Add component | `src/components/` + export from `src/index.tsx` |
| Run demo | `bun run demo` |
| See advanced usage | `examples/editor.tsx` |

## COMPONENT PATTERN

```tsx
import { Box, Text, useInput } from 'ink';
import type React from 'react';

export interface MyComponentProps {
  label: string;
  isFocused?: boolean;  // Standard focus prop
  onSelect?: () => void;
}

export const MyComponent: React.FC<MyComponentProps> = ({ label, isFocused, onSelect }) => {
  useInput((input, key) => {
    if (!isFocused) return;
    if (key.return) onSelect?.();
  });

  return (
    <Box
      borderStyle={isFocused ? 'double' : 'single'}  // Focus indication
      borderColor={isFocused ? 'green' : 'gray'}
    >
      <Text color={isFocused ? 'green' : 'white'}>{label}</Text>
    </Box>
  );
};
```

## CONVENTIONS

### Focus Management
- Accept `isFocused` or `isActive` prop
- Change border style: `single` -> `double` when focused
- Change border/text color when focused
- Guard `useInput` callbacks with focus check

### Using Rust Core
```tsx
import { readDir, fuzzyMatch, type FileEntry } from '@openterminal-ui/core';

// Call directly - sync functions
const entries = readDir(path);
const matches = fuzzyMatch(query, items);
```

### Keyboard Input
```tsx
useInput((input, key) => {
  if (!isActive) return;  // Always guard
  if (key.upArrow) { /* ... */ }
  if (key.downArrow) { /* ... */ }
  if (key.return) { /* ... */ }
  if (key.escape) { /* ... */ }
});
```

### Ink Layout
- Use `Box` for layout (flexbox model)
- Use `Text` for content (supports color, bold, underline)
- `borderStyle`: 'single' | 'double' | 'round'
- `flexDirection`: 'row' | 'column'

## ANTI-PATTERNS

- **NEVER** use `any` types - Biome enforces strict typing
- **NEVER** mutate props - follow React immutability
- **AVOID** array index keys - use unique ids when available
  - Exception: use `// biome-ignore lint/suspicious/noArrayIndexKey: <reason>` if unavoidable

## BUILD

```bash
bun run build    # Build to dist/
bun run dev      # Watch mode
bun run demo     # Run demo app
bun run editor   # Run editor example
```
