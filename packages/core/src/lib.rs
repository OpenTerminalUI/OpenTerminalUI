#![deny(clippy::all)]

use napi_derive::napi;

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
}
