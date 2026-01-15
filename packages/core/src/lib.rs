#![deny(clippy::all)]

use napi_derive::napi;
use std::collections::HashMap;
use std::fs;
use std::path::Path;
use std::sync::atomic::{AtomicU32, Ordering};
use taffy::prelude::*;

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
            "db_worker".to_string(),
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
    let padding = (width as usize)
        .saturating_sub(2)
        .saturating_sub(center_text.len())
        / 2;
    let padding_str = " ".repeat(padding);
    let padding_right =
        " ".repeat((width as usize).saturating_sub(2) - padding - center_text.len());

    for i in 0..(height.saturating_sub(2)) {
        if i == height / 2 - 1 {
            output.push_str(&format!(
                "│{}{}{}│\n",
                padding_str, center_text, padding_right
            ));
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
            let mut found = true;

            // Very basic check: all chars must exist in order
            while let Some(q) = current_q {
                match i_chars.find(|&c| c == q) {
                    Some(_) => {
                        current_q = q_chars.next();
                    },
                    None => {
                        found = false;
                        break;
                    },
                }
            }

            if found {
                // Determine relevance (e.g., contains exact substring)
                let score = if item_lower.contains(&query_lower) {
                    100 // high priority
                } else {
                    50
                };
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
    let keywords = [
        "import",
        "export",
        "const",
        "let",
        "var",
        "function",
        "return",
        "if",
        "else",
        "for",
        "while",
        "interface",
        "type",
        "from",
    ];

    let mut result = String::new();

    for line in content.lines() {
        let mut processed_line = line.to_string();
        for kw in keywords {
            // Dumb replace: problematic if keyword is inside word, but okay for demo
            // Using ANSI escape codes for Blue: \x1b[34m ... \x1b[39m
            let replacement = format!("\x1b[34m{}\x1b[39m", kw);
            // Use word boundary check regex in real world
            // Here we just replace " kw "
            processed_line =
                processed_line.replace(&format!("{} ", kw), &format!("{} ", replacement));
            processed_line =
                processed_line.replace(&format!("{} ", kw), &format!("{} ", replacement)); // repeat for multiple
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

#[napi]
pub fn process_text(input: String) -> String {
    format!("Processed: {}", input.to_uppercase())
}

#[napi]
pub fn parse_json(json_str: String) -> napi::Result<String> {
    let value: serde_json::Value = serde_json::from_str(&json_str)
        .map_err(|e| napi::Error::from_reason(format!("JSON parse error: {}", e)))?;

    Ok(format!(
        "Parsed {} keys",
        value.as_object().map(|o| o.len()).unwrap_or(0)
    ))
}

static NODE_COUNTER: AtomicU32 = AtomicU32::new(0);

#[napi(object)]
pub struct LayoutResult {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
}

#[napi(object)]
pub struct LayoutNodeResult {
    pub id: u32,
    pub layout: LayoutResult,
    pub children: Vec<LayoutNodeResult>,
}

#[napi(object)]
pub struct LayoutStyle {
    pub width: Option<f64>,
    pub height: Option<f64>,
    pub min_width: Option<f64>,
    pub min_height: Option<f64>,
    pub max_width: Option<f64>,
    pub max_height: Option<f64>,
    pub flex_grow: Option<f64>,
    pub flex_shrink: Option<f64>,
    pub flex_basis: Option<f64>,
    pub flex_direction: Option<String>,
    pub justify_content: Option<String>,
    pub align_items: Option<String>,
    pub align_content: Option<String>,
    pub align_self: Option<String>,
    pub flex_wrap: Option<String>,
    pub gap: Option<f64>,
    pub row_gap: Option<f64>,
    pub column_gap: Option<f64>,
    pub padding_top: Option<f64>,
    pub padding_right: Option<f64>,
    pub padding_bottom: Option<f64>,
    pub padding_left: Option<f64>,
    pub margin_top: Option<f64>,
    pub margin_right: Option<f64>,
    pub margin_bottom: Option<f64>,
    pub margin_left: Option<f64>,
    pub border_top: Option<f64>,
    pub border_right: Option<f64>,
    pub border_bottom: Option<f64>,
    pub border_left: Option<f64>,
    pub position: Option<String>,
    pub top: Option<f64>,
    pub right: Option<f64>,
    pub bottom: Option<f64>,
    pub left: Option<f64>,
}

#[napi(object)]
pub struct LayoutNode {
    pub id: u32,
    pub style: LayoutStyle,
    pub children: Vec<LayoutNode>,
}

fn parse_flex_direction(s: &str) -> FlexDirection {
    match s {
        "row" => FlexDirection::Row,
        "row-reverse" => FlexDirection::RowReverse,
        "column-reverse" => FlexDirection::ColumnReverse,
        _ => FlexDirection::Column,
    }
}

fn parse_justify_content(s: &str) -> JustifyContent {
    match s {
        "flex-start" | "start" => JustifyContent::Start,
        "flex-end" | "end" => JustifyContent::End,
        "center" => JustifyContent::Center,
        "space-between" => JustifyContent::SpaceBetween,
        "space-around" => JustifyContent::SpaceAround,
        "space-evenly" => JustifyContent::SpaceEvenly,
        _ => JustifyContent::Start,
    }
}

fn parse_align_items(s: &str) -> AlignItems {
    match s {
        "flex-start" | "start" => AlignItems::Start,
        "flex-end" | "end" => AlignItems::End,
        "center" => AlignItems::Center,
        "baseline" => AlignItems::Baseline,
        "stretch" => AlignItems::Stretch,
        _ => AlignItems::Stretch,
    }
}

fn parse_align_content(s: &str) -> AlignContent {
    match s {
        "flex-start" | "start" => AlignContent::Start,
        "flex-end" | "end" => AlignContent::End,
        "center" => AlignContent::Center,
        "space-between" => AlignContent::SpaceBetween,
        "space-around" => AlignContent::SpaceAround,
        "stretch" => AlignContent::Stretch,
        _ => AlignContent::Stretch,
    }
}

fn parse_align_self(s: &str) -> AlignSelf {
    match s {
        "flex-start" | "start" => AlignSelf::Start,
        "flex-end" | "end" => AlignSelf::End,
        "center" => AlignSelf::Center,
        "baseline" => AlignSelf::Baseline,
        _ => AlignSelf::Stretch,
    }
}

fn parse_flex_wrap(s: &str) -> FlexWrap {
    match s {
        "wrap" => FlexWrap::Wrap,
        "wrap-reverse" => FlexWrap::WrapReverse,
        _ => FlexWrap::NoWrap,
    }
}

fn parse_position(s: &str) -> Position {
    match s {
        "absolute" => Position::Absolute,
        _ => Position::Relative,
    }
}

fn build_taffy_style(style: &LayoutStyle) -> Style {
    let mut taffy_style = Style::default();

    if let Some(w) = style.width {
        taffy_style.size.width = Dimension::Length(w as f32);
    }
    if let Some(h) = style.height {
        taffy_style.size.height = Dimension::Length(h as f32);
    }
    if let Some(w) = style.min_width {
        taffy_style.min_size.width = Dimension::Length(w as f32);
    }
    if let Some(h) = style.min_height {
        taffy_style.min_size.height = Dimension::Length(h as f32);
    }
    if let Some(w) = style.max_width {
        taffy_style.max_size.width = Dimension::Length(w as f32);
    }
    if let Some(h) = style.max_height {
        taffy_style.max_size.height = Dimension::Length(h as f32);
    }

    if let Some(fg) = style.flex_grow {
        taffy_style.flex_grow = fg as f32;
    }
    if let Some(fs) = style.flex_shrink {
        taffy_style.flex_shrink = fs as f32;
    }
    if let Some(fb) = style.flex_basis {
        taffy_style.flex_basis = Dimension::Length(fb as f32);
    }

    if let Some(ref fd) = style.flex_direction {
        taffy_style.flex_direction = parse_flex_direction(fd);
    }
    if let Some(ref jc) = style.justify_content {
        taffy_style.justify_content = Some(parse_justify_content(jc));
    }
    if let Some(ref ai) = style.align_items {
        taffy_style.align_items = Some(parse_align_items(ai));
    }
    if let Some(ref ac) = style.align_content {
        taffy_style.align_content = Some(parse_align_content(ac));
    }
    if let Some(ref a_self) = style.align_self {
        taffy_style.align_self = Some(parse_align_self(a_self));
    }
    if let Some(ref fw) = style.flex_wrap {
        taffy_style.flex_wrap = parse_flex_wrap(fw);
    }

    if let Some(g) = style.gap {
        taffy_style.gap = Size {
            width: LengthPercentage::Length(g as f32),
            height: LengthPercentage::Length(g as f32),
        };
    }
    if let Some(rg) = style.row_gap {
        taffy_style.gap.height = LengthPercentage::Length(rg as f32);
    }
    if let Some(cg) = style.column_gap {
        taffy_style.gap.width = LengthPercentage::Length(cg as f32);
    }

    taffy_style.padding = Rect {
        top: LengthPercentage::Length(style.padding_top.unwrap_or(0.0) as f32),
        right: LengthPercentage::Length(style.padding_right.unwrap_or(0.0) as f32),
        bottom: LengthPercentage::Length(style.padding_bottom.unwrap_or(0.0) as f32),
        left: LengthPercentage::Length(style.padding_left.unwrap_or(0.0) as f32),
    };

    taffy_style.margin = Rect {
        top: LengthPercentageAuto::Length(style.margin_top.unwrap_or(0.0) as f32),
        right: LengthPercentageAuto::Length(style.margin_right.unwrap_or(0.0) as f32),
        bottom: LengthPercentageAuto::Length(style.margin_bottom.unwrap_or(0.0) as f32),
        left: LengthPercentageAuto::Length(style.margin_left.unwrap_or(0.0) as f32),
    };

    taffy_style.border = Rect {
        top: LengthPercentage::Length(style.border_top.unwrap_or(0.0) as f32),
        right: LengthPercentage::Length(style.border_right.unwrap_or(0.0) as f32),
        bottom: LengthPercentage::Length(style.border_bottom.unwrap_or(0.0) as f32),
        left: LengthPercentage::Length(style.border_left.unwrap_or(0.0) as f32),
    };

    if let Some(ref pos) = style.position {
        taffy_style.position = parse_position(pos);
    }

    taffy_style.inset = Rect {
        top: style
            .top
            .map(|v| LengthPercentageAuto::Length(v as f32))
            .unwrap_or(LengthPercentageAuto::Auto),
        right: style
            .right
            .map(|v| LengthPercentageAuto::Length(v as f32))
            .unwrap_or(LengthPercentageAuto::Auto),
        bottom: style
            .bottom
            .map(|v| LengthPercentageAuto::Length(v as f32))
            .unwrap_or(LengthPercentageAuto::Auto),
        left: style
            .left
            .map(|v| LengthPercentageAuto::Length(v as f32))
            .unwrap_or(LengthPercentageAuto::Auto),
    };

    taffy_style
}

fn build_node(
    tree: &mut TaffyTree,
    node: &LayoutNode,
    id_map: &mut HashMap<NodeId, u32>,
) -> NodeId {
    let taffy_style = build_taffy_style(&node.style);

    let child_ids: Vec<NodeId> = node
        .children
        .iter()
        .map(|child| build_node(tree, child, id_map))
        .collect();

    let node_id = tree
        .new_with_children(taffy_style, &child_ids)
        .expect("Failed to create node");
    id_map.insert(node_id, node.id);
    node_id
}

fn extract_layout(
    tree: &TaffyTree,
    node_id: NodeId,
    id_map: &HashMap<NodeId, u32>,
) -> LayoutNodeResult {
    let layout = tree.layout(node_id).expect("Failed to get layout");
    let children: Vec<LayoutNodeResult> = tree
        .children(node_id)
        .expect("Failed to get children")
        .iter()
        .map(|&child_id| extract_layout(tree, child_id, id_map))
        .collect();

    LayoutNodeResult {
        id: *id_map.get(&node_id).unwrap_or(&0),
        layout: LayoutResult {
            x: layout.location.x as f64,
            y: layout.location.y as f64,
            width: layout.size.width as f64,
            height: layout.size.height as f64,
        },
        children,
    }
}

#[napi]
pub fn compute_layout(
    root: LayoutNode,
    available_width: f64,
    available_height: f64,
) -> LayoutNodeResult {
    let mut tree: TaffyTree = TaffyTree::new();
    let mut id_map: HashMap<NodeId, u32> = HashMap::new();

    let root_id = build_node(&mut tree, &root, &mut id_map);

    tree.compute_layout(
        root_id,
        Size {
            width: AvailableSpace::Definite(available_width as f32),
            height: AvailableSpace::Definite(available_height as f32),
        },
    )
    .expect("Failed to compute layout");

    extract_layout(&tree, root_id, &id_map)
}

#[napi]
pub fn create_layout_node(style: LayoutStyle) -> LayoutNode {
    LayoutNode {
        id: NODE_COUNTER.fetch_add(1, Ordering::SeqCst),
        style,
        children: vec![],
    }
}
