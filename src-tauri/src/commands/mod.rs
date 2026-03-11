use crate::db::{get_db, Session, Prompt};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize)]
pub struct CliHistoryEntry {
    pub display: String,
    pub timestamp: i64,
    pub project: String,
    #[serde(rename = "sessionId")]
    pub session_id: String,
    #[serde(rename = "pastedContents", default)]
    pub pasted_contents: Option<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ImportSession {
    pub session_id: String,
    pub project_path: String,
    pub created_at: i64,
    pub updated_at: i64,
    pub prompts: Vec<ImportPrompt>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ImportPrompt {
    pub display: String,
    pub timestamp: i64,
    pub idx: i64,
}

#[tauri::command]
pub async fn import_history(jsonl_data: String, is_cli_format: bool) -> Result<usize, String> {
    eprintln!("=== import_history called ===");
    eprintln!("is_cli_format={}", is_cli_format);
    eprintln!("jsonl_data length={}", jsonl_data.len());
    let preview: String = jsonl_data.chars().take(100).collect();
    eprintln!("First 100 chars: {:?}", preview);

    if !is_cli_format {
        eprintln!("ERROR: is_cli_format is false");
        return Err("Only Claude Code CLI format is supported".to_string());
    }

    let pool = get_db()?;
    eprintln!("Got database pool");

    // Parse JSONL
    let entries = match parse_cli_jsonl(&jsonl_data) {
        Ok(e) => {
            eprintln!("Parsed {} entries", e.len());
            e
        }
        Err(e) => {
            eprintln!("ERROR parsing JSONL: {}", e);
            return Err(e);
        }
    };

    // Group by session_id
    let sessions = group_by_session(entries);
    eprintln!("Grouped into {} sessions", sessions.len());

    let mut imported = 0;

    for session in &sessions {
        eprintln!("Inserting session: {}, prompts: {}", session.session_id, session.prompts.len());

        // Insert or update session
        let result = sqlx::query(
            r#"
            INSERT OR REPLACE INTO sessions
            (session_id, project_path, created_at, updated_at, prompt_count, is_archived)
            VALUES (?1, ?2, ?3, ?4, ?5,
                COALESCE((SELECT is_archived FROM sessions WHERE session_id = ?1), 0))
            "#
        )
        .bind(&session.session_id)
        .bind(&session.project_path)
        .bind(session.created_at)
        .bind(session.updated_at)
        .bind(session.prompts.len() as i64)
        .execute(&pool)
        .await;

        if let Err(e) = result {
            eprintln!("Error inserting session: {}", e);
            continue;
        }

        // Clear existing prompts for this session
        let _ = sqlx::query("DELETE FROM prompts WHERE session_id = ?1")
            .bind(&session.session_id)
            .execute(&pool)
            .await;

        // Insert prompts
        for prompt in &session.prompts {
            if let Err(e) = sqlx::query(
                r#"
                INSERT INTO prompts
                (session_id, display, timestamp, idx)
                VALUES (?1, ?2, ?3, ?4)
                "#
            )
            .bind(&session.session_id)
            .bind(&prompt.display)
            .bind(prompt.timestamp)
            .bind(prompt.idx)
            .execute(&pool)
            .await {
                eprintln!("Error inserting prompt: {}", e);
            }
        }

        imported += 1;
    }

    eprintln!("Import completed, imported {} sessions", imported);
    Ok(imported)
}

fn parse_cli_jsonl(data: &str) -> Result<Vec<CliHistoryEntry>, String> {
    let mut entries = Vec::new();
    let mut line_num = 0;
    let mut error_count = 0;

    eprintln!("Starting parse_cli_jsonl, total chars: {}", data.len());

    for line in data.lines() {
        line_num += 1;
        let line = line.trim();
        if line.is_empty() {
            continue;
        }

        let preview: String = line.chars().take(50).collect();
        eprintln!("Processing line {}: length={}, content={}", line_num, line.len(), preview);

        // Try to parse as JSON first to check structure
        let json_val: serde_json::Value = match serde_json::from_str(line) {
            Ok(v) => v,
            Err(e) => {
                eprintln!("Line {}: JSON parse error: {}", line_num, e);
                error_count += 1;
                if error_count <= 3 {
                    eprintln!("Line {} content: {:?}", line_num, line);
                }
                continue;
            }
        };

        let keys: Vec<_> = json_val.as_object().map(|o| o.keys().collect()).unwrap_or_default();
        eprintln!("Line {}: JSON keys: {:?}", line_num, keys);

        // Check required fields
        if json_val.get("display").is_none() {
            eprintln!("Line {}: missing 'display' field", line_num);
            continue;
        }
        if json_val.get("sessionId").is_none() {
            eprintln!("Line {}: missing 'sessionId' field", line_num);
            continue;
        }

        // Now parse into struct
        match serde_json::from_value::<CliHistoryEntry>(json_val) {
            Ok(entry) => {
                let session_preview: String = entry.session_id.chars().take(8).collect();
                eprintln!("Line {}: Successfully parsed entry for session {}", line_num, session_preview);
                entries.push(entry);
            }
            Err(e) => {
                eprintln!("Line {}: Failed to convert to entry: {}", line_num, e);
            }
        }
    }

    eprintln!("Parse complete: {} lines processed, {} entries found, {} errors", line_num, entries.len(), error_count);

    if entries.is_empty() {
        return Err(format!("No valid entries found in JSONL. Processed {} lines, found {} errors. Check logs for details.", line_num, error_count));
    }

    Ok(entries)
}

fn group_by_session(entries: Vec<CliHistoryEntry>) -> Vec<ImportSession> {
    let mut groups: HashMap<String, Vec<CliHistoryEntry>> = HashMap::new();

    for entry in entries {
        groups.entry(entry.session_id.clone()).or_default().push(entry);
    }

    let mut sessions = Vec::new();

    for (session_id, mut entries) in groups {
        // Sort by timestamp
        entries.sort_by_key(|e| e.timestamp);

        let project_path = entries.first().map(|e| e.project.clone()).unwrap_or_default();
        let created_at = entries.first().map(|e| e.timestamp).unwrap_or(0);
        let updated_at = entries.last().map(|e| e.timestamp).unwrap_or(created_at);

        let prompts: Vec<ImportPrompt> = entries
            .into_iter()
            .enumerate()
            .map(|(idx, e)| ImportPrompt {
                display: e.display,
                timestamp: e.timestamp,
                idx: idx as i64,
            })
            .collect();

        sessions.push(ImportSession {
            session_id,
            project_path,
            created_at,
            updated_at,
            prompts,
        });
    }

    // Sort sessions by updated_at desc
    sessions.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));

    sessions
}

#[tauri::command]
pub async fn get_sessions(
    search: Option<String>,
    show_archived: bool,
    sort_by: String,
    sort_order: String,
) -> Result<Vec<Session>, String> {
    let pool = get_db()?;

    let mut query = String::from(
        "SELECT session_id, project_path, created_at, updated_at, prompt_count, is_archived
         FROM sessions WHERE 1=1"
    );

    if !show_archived {
        query.push_str(" AND is_archived = 0");
    }

    if let Some(search) = search {
        if !search.is_empty() {
            query.push_str(&format!(" AND (project_path LIKE '%{}%' OR session_id LIKE '%{}%')",
                search.replace("'", "''"), search.replace("'", "''")));
        }
    }

    let order = if sort_order == "asc" { "ASC" } else { "DESC" };
    let order_by = match sort_by.as_str() {
        "created" => "created_at",
        "project" => "project_path",
        _ => "updated_at",
    };

    query.push_str(&format!(" ORDER BY {} {}", order_by, order));

    let sessions = sqlx::query_as::<_, Session>(&query)
        .fetch_all(&pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(sessions)
}

#[tauri::command]
pub async fn get_session(session_id: String) -> Result<Option<Session>, String> {
    let pool = get_db()?;

    let session = sqlx::query_as::<_, Session>(
        "SELECT session_id, project_path, created_at, updated_at, prompt_count, is_archived
         FROM sessions WHERE session_id = ?1"
    )
    .bind(&session_id)
    .fetch_optional(&pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(session)
}

#[tauri::command]
pub async fn get_prompts(session_id: String) -> Result<Vec<Prompt>, String> {
    let pool = get_db()?;

    let prompts = sqlx::query_as::<_, Prompt>(
        r#"
        SELECT id, session_id, display, timestamp, idx
        FROM prompts
        WHERE session_id = ?1
        ORDER BY idx ASC
        "#
    )
    .bind(&session_id)
    .fetch_all(&pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(prompts)
}

#[tauri::command]
pub async fn delete_sessions(session_ids: Vec<String>) -> Result<usize, String> {
    let pool = get_db()?;
    let mut deleted = 0;

    for session_id in session_ids {
        let result = sqlx::query("DELETE FROM sessions WHERE session_id = ?1")
            .bind(&session_id)
            .execute(&pool)
            .await;

        if let Ok(res) = result {
            deleted += res.rows_affected() as usize;
        }
    }

    Ok(deleted)
}

#[tauri::command]
pub async fn archive_sessions(session_ids: Vec<String>) -> Result<usize, String> {
    let pool = get_db()?;
    let mut archived = 0;

    for session_id in session_ids {
        let result = sqlx::query("UPDATE sessions SET is_archived = 1 WHERE session_id = ?1")
            .bind(&session_id)
            .execute(&pool)
            .await;

        if let Ok(res) = result {
            archived += res.rows_affected() as usize;
        }
    }

    Ok(archived)
}

#[tauri::command]
pub async fn get_stats() -> Result<Stats, String> {
    let pool = get_db()?;

    let total_sessions = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM sessions")
        .fetch_one(&pool)
        .await
        .unwrap_or(0);

    let total_prompts = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM prompts")
        .fetch_one(&pool)
        .await
        .unwrap_or(0);

    let unique_projects = sqlx::query_scalar::<_, i64>("SELECT COUNT(DISTINCT project_path) FROM sessions")
        .fetch_one(&pool)
        .await
        .unwrap_or(0);

    let by_date_rows = sqlx::query_as::<_, DateCountRow>(
        r#"
        SELECT
            DATE(updated_at / 1000, 'unixepoch') as date,
            COUNT(*) as count
        FROM sessions
        GROUP BY DATE(updated_at / 1000, 'unixepoch')
        ORDER BY date ASC
        "#
    )
    .fetch_all(&pool)
    .await
    .unwrap_or_default();

    let by_date: Vec<(String, i64)> = by_date_rows
        .into_iter()
        .filter_map(|r| r.date.map(|d| (d, r.count)))
        .collect();

    Ok(Stats {
        total_sessions,
        total_prompts,
        unique_projects,
        by_date,
    })
}

#[derive(sqlx::FromRow)]
struct DateCountRow {
    date: Option<String>,
    count: i64,
}

#[derive(Debug, Serialize)]
pub struct Stats {
    pub total_sessions: i64,
    pub total_prompts: i64,
    pub unique_projects: i64,
    pub by_date: Vec<(String, i64)>,
}
