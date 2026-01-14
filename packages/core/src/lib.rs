#![deny(clippy::all)]

use napi_derive::napi;
use std::fs;
use std::path::Path;

/// Represents the status of the "server" (simulated)
#[napi(object)]
pub struct SystemStatus {
    pub cpu_usage: f64,
    pub memory_usage: f64,
    pub uptime: u32,
    pub processes: Vec<String>,
    pub active_users: u32,
    pub status_message: String,
}

#[napi(object)]
pub struct FileEntry {
    pub name: String,
    pub is_dir: bool,
    pub size: i64,
}

#[napi]
pub fn get_system_status() -> SystemStatus {
    SystemStatus {
        cpu_usage: 42.5,
        memory_usage: 1024.0,
        uptime: 3600,
        processes: vec![
            "rust_server".to_string(),
            "ink_frontend".to_string(),
            "db_worker".to_string()
        ],
        active_users: 5,
        status_message: "System Operational".to_string(),
    }
}

#[napi]
pub fn render_server_view(width: u32, height: u32) -> String {
    let border_h = "─".repeat((width as usize).saturating_sub(2));
    let empty_line = " ".repeat((width as usize).saturating_sub(2));

    let mut output = String::new();
    output.push_str(&format!("┌{}┐\n", border_h));

    let center_text = " RUST SERVER ";
    let padding = (width as usize).saturating_sub(2).saturating_sub(center_text.len()) / 2;
    let padding_str = " ".repeat(padding);
    let padding_right = " ".repeat((width as usize).saturating_sub(2) - padding - center_text.len());

    for i in 0..(height.saturating_sub(2)) {
        if i == height / 2 - 1 {
            output.push_str(&format!("│{}{}{}│\n", padding_str, center_text, padding_right));
        } else {
            output.push_str(&format!("│{}│\n", empty_line));
        }
    }
    output.push_str(&format!("└{}┘", border_h));

    output
}

// ==========================
// File System Module
// ==========================

#[napi]
pub fn read_dir(path: String) -> Vec<FileEntry> {
    let path = Path::new(&path);
    let mut entries = Vec::new();

    if let Ok(read_dir) = fs::read_dir(path) {
        for entry in read_dir.flatten() {
            if let Ok(metadata) = entry.metadata() {
                entries.push(FileEntry {
                    name: entry.file_name().to_string_lossy().to_string(),
                    is_dir: metadata.is_dir(),
                    size: metadata.len() as i64,
                });
            }
        }
    }
    // Sort directories first, then files
    entries.sort_by(|a, b| {
        if a.is_dir == b.is_dir {
            a.name.cmp(&b.name)
        } else if a.is_dir {
            std::cmp::Ordering::Less
        } else {
            std::cmp::Ordering::Greater
        }
    });

    entries
}

#[napi]
pub fn read_file(path: String) -> String {
    fs::read_to_string(path).unwrap_or_else(|_| "Error reading file".to_string())
}

// ==========================
// Fuzzy Matcher Module (Simple Implementation)
// ==========================

#[napi]
pub fn fuzzy_match(query: String, items: Vec<String>) -> Vec<String> {
    if query.is_empty() {
        return items;
    }

    let query_lower = query.to_lowercase();
    let mut matches: Vec<(String, usize)> = items
        .into_iter()
        .filter_map(|item| {
            let item_lower = item.to_lowercase();
            // Simple subsequence check + score
            // A real fuzzy matcher would be better, but this suffices for "logic in Rust" demo
            let mut q_chars = query_lower.chars();
            let mut i_chars = item_lower.chars();

            let mut current_q = q_chars.next();
            let mut score = 0;
            let mut found = true;

            // Very basic check: all chars must exist in order
            while let Some(q) = current_q {
                match i_chars.find(|&c| c == q) {
                    Some(_) => {
                         current_q = q_chars.next();
                    }
                    None => {
                        found = false;
                        break;
                    }
                }
            }

            if found {
                // Determine relevance (e.g., contains exact substring)
                if item_lower.contains(&query_lower) {
                    score = 100; // high priority
                } else {
                    score = 50;
                }
                Some((item, score))
            } else {
                None
            }
        })
        .collect();

    // Sort by score desc, then alphabetical
    matches.sort_by(|a, b| b.1.cmp(&a.1).then(a.0.cmp(&b.0)));
    matches.into_iter().map(|(s, _)| s).collect()
}

// ==========================
// Syntax Highlighting (Simulated)
// ==========================

#[napi]
pub fn highlight_code(content: String, _extension: String) -> String {
    // In a real app, use `syntect`. Here, we just do basic keyword coloring manually
    // to prove we are modifying text on the server side.

    // Keywords to highlight in Blue
    let keywords = ["import", "export", "const", "let", "var", "function", "return", "if", "else", "for", "while", "interface", "type", "from"];

    let mut result = String::new();

    for line in content.lines() {
        let mut processed_line = line.to_string();
        for kw in keywords {
             // Dumb replace: problematic if keyword is inside word, but okay for demo
             // Using ANSI escape codes for Blue: \x1b[34m ... \x1b[39m
             let replacement = format!("\x1b[34m{}\x1b[39m", kw);
             // Use word boundary check regex in real world
             // Here we just replace " kw "
             processed_line = processed_line.replace(&format!("{} ", kw), &format!("{} ", replacement));
             processed_line = processed_line.replace(&format!("{} ", kw), &format!("{} ", replacement)); // repeat for multiple
             if processed_line.starts_with(kw) {
                 processed_line = processed_line.replacen(kw, &replacement, 1);
             }
        }

        // Highlight strings in Green
        // Very basic: between quotes
        // We won't implement a full parser here.

        result.push_str(&processed_line);
        result.push('\n');
    }

    result
}

// Keep old functions for backward compat with previous step demo if needed
#[napi]
pub fn fibonacci(n: u32) -> u64 {
    match n {
        0 => 0,
        1 => 1,
        _ => {
            let mut a = 0u64;
            let mut b = 1u64;
            for _ in 2..=n {
                let temp = a + b;
                a = b;
                b = temp;
            }
            b
        }
    }
}

#[napi]
pub fn process_text(input: String) -> String {
    format!("Processed: {}", input.to_uppercase())
}

#[napi]
pub fn parse_json(json_str: String) -> napi::Result<String> {
    let value: serde_json::Value = serde_json::from_str(&json_str)
        .map_err(|e| napi::Error::from_reason(format!("JSON parse error: {}", e)))?;

    Ok(format!("Parsed {} keys", value.as_object().map(|o| o.len()).unwrap_or(0)))
}
