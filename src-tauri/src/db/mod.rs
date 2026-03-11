use once_cell::sync::Lazy;
use sqlx::sqlite::{SqliteConnectOptions, SqlitePool};
use std::sync::Mutex;
use tauri::Manager;

pub static DB_POOL: Lazy<Mutex<Option<SqlitePool>>> = Lazy::new(|| Mutex::new(None));

/// Initialize database connection
pub async fn init_db(app_handle: &tauri::AppHandle) -> Result<(), anyhow::Error> {
    let app_dir = app_handle
        .path()
        .app_local_data_dir()
        .expect("Failed to get app local data dir");

    std::fs::create_dir_all(&app_dir)?;

    let db_path = app_dir.join("claude_cli_history.db");

    let options = SqliteConnectOptions::new()
        .filename(&db_path)
        .create_if_missing(true);

    let pool = SqlitePool::connect_with(options).await?;

    // Create tables
    create_tables(&pool).await?;

    let mut db = DB_POOL.lock().unwrap();
    *db = Some(pool);

    Ok(())
}

async fn create_tables(pool: &SqlitePool) -> Result<(), anyhow::Error> {
    sqlx::query(
        r#"
        -- Sessions table (grouped by sessionId)
        CREATE TABLE IF NOT EXISTS sessions (
            session_id TEXT PRIMARY KEY,
            project_path TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            prompt_count INTEGER NOT NULL DEFAULT 0,
            is_archived BOOLEAN NOT NULL DEFAULT 0
        );

        -- Prompts table (individual user prompts)
        CREATE TABLE IF NOT EXISTS prompts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            display TEXT NOT NULL,
            timestamp INTEGER NOT NULL,
            idx INTEGER NOT NULL,
            FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
        );

        -- Indexes
        CREATE INDEX IF NOT EXISTS idx_prompts_session ON prompts(session_id);
        CREATE INDEX IF NOT EXISTS idx_sessions_updated ON sessions(updated_at);
        CREATE INDEX IF NOT EXISTS idx_sessions_project ON sessions(project_path);
        "#
    )
    .execute(pool)
    .await?;

    Ok(())
}

pub fn get_db() -> Result<SqlitePool, String> {
    let db = DB_POOL.lock().map_err(|e| e.to_string())?;
    db.clone().ok_or_else(|| "Database not initialized".to_string())
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, sqlx::FromRow)]
pub struct Session {
    pub session_id: String,
    pub project_path: String,
    pub created_at: i64,
    pub updated_at: i64,
    pub prompt_count: i64,
    pub is_archived: bool,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, sqlx::FromRow)]
pub struct Prompt {
    pub id: i64,
    pub session_id: String,
    pub display: String,
    pub timestamp: i64,
    pub idx: i64,
}
