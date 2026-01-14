# CORE PACKAGE - Rust/Napi-RS Native Module

## OVERVIEW

Rust native addon providing high-performance functions to UI components via Napi-RS FFI.

## STRUCTURE

```
packages/core/
├── src/lib.rs      # All Rust implementations (EDIT THIS)
├── Cargo.toml      # Rust dependencies
├── build.rs        # Napi-RS build hook
├── index.js        # AUTO-GENERATED loader (DO NOT EDIT)
├── index.d.ts      # AUTO-GENERATED types (DO NOT EDIT)
└── *.node          # Platform binaries (gitignored)
```

## WHERE TO LOOK

| Task | Location |
|------|----------|
| Add new function | `src/lib.rs` - add `#[napi]` function |
| Add new type | `src/lib.rs` - add `#[napi(object)]` struct |
| Change dependencies | `Cargo.toml` |

## CONVENTIONS

### Exporting Functions

```rust
#[napi]
pub fn my_function(arg: String) -> String {
    // Napi-RS auto-generates JS bindings + TS types
    format!("Result: {}", arg)
}
```

### Exporting Structs (becomes TS interface)

```rust
#[napi(object)]
pub struct MyData {
    pub field_name: String,  // becomes: fieldName: string
    pub count: i64,          // becomes: count: number
}
```

### Error Handling

```rust
#[napi]
pub fn fallible_op(input: String) -> napi::Result<String> {
    serde_json::from_str(&input)
        .map_err(|e| napi::Error::from_reason(format!("Parse error: {}", e)))
}
```

## ANTI-PATTERNS

- **NEVER** edit `index.js` or `index.d.ts` - regenerated on build
- **NEVER** commit `.node` files - platform-specific binaries
- **NEVER** use `unwrap()` in prod code - use `?` or proper error handling
- **AVOID** blocking async runtime (tokio disabled by default)

## BUILD

```bash
# Debug build (faster, larger)
bun run build:debug

# Release build (slower, optimized)
bun run build

# Full command
napi build --platform --release --dts index.d.ts
```

## NOTES

- After adding functions, rebuild to regenerate types
- UI imports functions directly: `import { myFunction } from '@openterminal-ui/core'`
- Rust field names auto-convert: `snake_case` -> `camelCase`
- Release builds use LTO + opt-level 3 + strip for minimal size
