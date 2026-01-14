#![deny(clippy::all)]

use napi_derive::napi;

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

/// Example: Calculate fibonacci number (demonstrates CPU-intensive task)
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

/// Example: Process text (demonstrates string handling)
#[napi]
pub fn process_text(input: String) -> String {
    format!("Processed: {}", input.to_uppercase())
}

/// Example: JSON parsing (demonstrates serde integration)
#[napi]
pub fn parse_json(json_str: String) -> napi::Result<String> {
    let value: serde_json::Value = serde_json::from_str(&json_str)
        .map_err(|e| napi::Error::from_reason(format!("JSON parse error: {}", e)))?;
    
    Ok(format!("Parsed {} keys", value.as_object().map(|o| o.len()).unwrap_or(0)))
}

/// Simulate fetching system status from the "Rust Server"
#[napi]
pub fn get_system_status() -> SystemStatus {
    // In a real app, this would query system crates.
    // Here we simulate dynamic data based on simple deterministic logic or placeholders.

    SystemStatus {
        cpu_usage: 42.5, // Mock value
        memory_usage: 1024.0, // Mock value (MB)
        uptime: 3600, // Mock value (seconds)
        processes: vec![
            "rust_server".to_string(),
            "ink_frontend".to_string(),
            "db_worker".to_string()
        ],
        active_users: 5,
        status_message: "System Operational".to_string(),
    }
}

/// A render helper that returns a formatted string layout
/// (simulating a server-side rendering logic)
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_fibonacci() {
        assert_eq!(fibonacci(0), 0);
        assert_eq!(fibonacci(1), 1);
        assert_eq!(fibonacci(10), 55);
        assert_eq!(fibonacci(20), 6765);
    }

    #[test]
    fn test_process_text() {
        assert_eq!(process_text("hello".to_string()), "Processed: HELLO");
    }

    #[test]
    fn test_server_status() {
        let status = get_system_status();
        assert_eq!(status.active_users, 5);
    }
}
