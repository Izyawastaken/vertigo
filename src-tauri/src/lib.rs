use serde::{Deserialize, Serialize};
use sqlx::{
    sqlite::{SqliteConnectOptions, SqliteJournalMode, SqlitePoolOptions, SqliteSynchronous},
    FromRow, SqlitePool,
};
use std::{
    fs,
    time::{Duration, SystemTime, UNIX_EPOCH},
};
use tauri::Manager;
use uuid::Uuid;

struct AppState {
    pool: SqlitePool,
}

type CommandResult<T> = Result<T, String>;

#[derive(Debug, Clone, Serialize, FromRow)]
#[serde(rename_all = "camelCase")]
struct ServerDto {
    id: String,
    label: String,
    badge: String,
    color: String,
    position: i64,
}

#[derive(Debug, Clone, Serialize, FromRow)]
#[serde(rename_all = "camelCase")]
struct ChannelDto {
    id: String,
    server_id: String,
    name: String,
    topic: String,
    category: String,
    #[serde(rename = "type")]
    channel_type: String,
    position: i64,
}

#[derive(Debug, Clone, Serialize, FromRow)]
#[serde(rename_all = "camelCase")]
struct MemberDto {
    id: String,
    name: String,
    status: String,
    role: String,
    role_color: String,
}

#[derive(Debug, Clone, Serialize, FromRow)]
#[serde(rename_all = "camelCase")]
struct MessageDto {
    id: String,
    channel_id: String,
    author: String,
    avatar: String,
    body: String,
    created_at: i64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct ChatBootstrap {
    servers: Vec<ServerDto>,
    members: Vec<MemberDto>,
    active_server_id: Option<String>,
    channels: Vec<ChannelDto>,
    active_channel_id: Option<String>,
    messages: Vec<MessageDto>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ServerChannelsInput {
    server_id: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ChannelMessagesInput {
    channel_id: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct CreateServerInput {
    label: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct CreateServerResult {
    server: ServerDto,
    initial_channel: ChannelDto,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct CreateChannelInput {
    server_id: String,
    name: String,
    topic: Option<String>,
    category: Option<String>,
    #[serde(default, rename = "type")]
    channel_type: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SendMessageInput {
    channel_id: String,
    body: String,
    author: Option<String>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            let pool = tauri::async_runtime::block_on(async {
                let app_data_dir = app
                    .path()
                    .app_data_dir()
                    .map_err(|error| error.to_string())?;
                fs::create_dir_all(&app_data_dir).map_err(|error| error.to_string())?;

                let db_path = app_data_dir.join("vertigo-chat.sqlite");
                let connect_options = SqliteConnectOptions::new()
                    .filename(db_path)
                    .create_if_missing(true)
                    .foreign_keys(true)
                    .journal_mode(SqliteJournalMode::Wal)
                    .synchronous(SqliteSynchronous::Normal)
                    .busy_timeout(Duration::from_secs(4));

                let pool = SqlitePoolOptions::new()
                    .max_connections(8)
                    .connect_with(connect_options)
                    .await
                    .map_err(|error| error.to_string())?;

                init_schema(&pool)
                    .await
                    .map_err(|error| error.to_string())?;
                seed_defaults(&pool)
                    .await
                    .map_err(|error| error.to_string())?;

                Ok::<SqlitePool, String>(pool)
            })?;

            app.manage(AppState { pool });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            chat_bootstrap,
            list_channels,
            list_messages,
            create_server,
            create_channel,
            send_message
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
async fn chat_bootstrap(state: tauri::State<'_, AppState>) -> CommandResult<ChatBootstrap> {
    let servers = query_servers(&state.pool)
        .await
        .map_err(|error| error.to_string())?;
    let members = query_members(&state.pool)
        .await
        .map_err(|error| error.to_string())?;

    let active_server_id = servers.first().map(|server| server.id.clone());
    let channels = if let Some(server_id) = active_server_id.as_deref() {
        query_channels_by_server(&state.pool, server_id)
            .await
            .map_err(|error| error.to_string())?
    } else {
        Vec::new()
    };

    let active_channel_id = channels.first().map(|channel| channel.id.clone());
    let messages = if let Some(channel_id) = active_channel_id.as_deref() {
        query_messages_by_channel(&state.pool, channel_id)
            .await
            .map_err(|error| error.to_string())?
    } else {
        Vec::new()
    };

    Ok(ChatBootstrap {
        servers,
        members,
        active_server_id,
        channels,
        active_channel_id,
        messages,
    })
}

#[tauri::command]
async fn list_channels(
    state: tauri::State<'_, AppState>,
    input: ServerChannelsInput,
) -> CommandResult<Vec<ChannelDto>> {
    query_channels_by_server(&state.pool, &input.server_id)
        .await
        .map_err(|error| error.to_string())
}

#[tauri::command]
async fn list_messages(
    state: tauri::State<'_, AppState>,
    input: ChannelMessagesInput,
) -> CommandResult<Vec<MessageDto>> {
    query_messages_by_channel(&state.pool, &input.channel_id)
        .await
        .map_err(|error| error.to_string())
}

#[tauri::command]
async fn create_server(
    state: tauri::State<'_, AppState>,
    input: CreateServerInput,
) -> CommandResult<CreateServerResult> {
    let label = normalize_label(&input.label);
    if label.is_empty() {
        return Err("Server name cannot be empty.".to_string());
    }

    let server_id = Uuid::now_v7().to_string();
    let position: i64 = sqlx::query_scalar("SELECT COALESCE(MAX(position), -1) + 1 FROM servers")
        .fetch_one(&state.pool)
        .await
        .map_err(|error| error.to_string())?;

    sqlx::query("INSERT INTO servers (id, label, badge, color, position) VALUES (?, ?, ?, ?, ?)")
        .bind(&server_id)
        .bind(&label)
        .bind(make_badge(&label))
        .bind("#f2f2f2")
        .bind(position)
        .execute(&state.pool)
        .await
        .map_err(|error| error.to_string())?;

    let channel_id = Uuid::now_v7().to_string();
    sqlx::query(
        "INSERT INTO channels (id, server_id, name, topic, category, kind, position)
    VALUES (?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(&channel_id)
    .bind(&server_id)
    .bind("general")
    .bind("Your default text channel.")
    .bind("Text Channels")
    .bind("text")
    .bind(0_i64)
    .execute(&state.pool)
    .await
    .map_err(|error| error.to_string())?;

    let server = query_server(&state.pool, &server_id)
        .await
        .map_err(|error| error.to_string())?;
    let initial_channel = query_channel(&state.pool, &channel_id)
        .await
        .map_err(|error| error.to_string())?;

    Ok(CreateServerResult {
        server,
        initial_channel,
    })
}

#[tauri::command]
async fn create_channel(
    state: tauri::State<'_, AppState>,
    input: CreateChannelInput,
) -> CommandResult<ChannelDto> {
    let name = normalize_label(&input.name)
        .to_lowercase()
        .replace(' ', "-");
    if name.is_empty() {
        return Err("Channel name cannot be empty.".to_string());
    }

    let server_exists: i64 = sqlx::query_scalar("SELECT COUNT(1) FROM servers WHERE id = ?")
        .bind(&input.server_id)
        .fetch_one(&state.pool)
        .await
        .map_err(|error| error.to_string())?;
    if server_exists == 0 {
        return Err("Server not found.".to_string());
    }

    let channel_type = match input.channel_type.as_deref() {
        Some("voice") => "voice",
        _ => "text",
    };

    let category = input
        .category
        .as_deref()
        .map(normalize_label)
        .filter(|value| !value.is_empty())
        .unwrap_or_else(|| {
            if channel_type == "voice" {
                "Voice Channels".to_string()
            } else {
                "Text Channels".to_string()
            }
        });
    let topic = input
        .topic
        .as_deref()
        .map(normalize_label)
        .unwrap_or_default();

    let position: i64 = sqlx::query_scalar(
        "SELECT COALESCE(MAX(position), -1) + 1 FROM channels WHERE server_id = ?",
    )
    .bind(&input.server_id)
    .fetch_one(&state.pool)
    .await
    .map_err(|error| error.to_string())?;

    let channel_id = Uuid::now_v7().to_string();
    sqlx::query(
        "INSERT INTO channels (id, server_id, name, topic, category, kind, position)
    VALUES (?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(&channel_id)
    .bind(&input.server_id)
    .bind(&name)
    .bind(&topic)
    .bind(&category)
    .bind(channel_type)
    .bind(position)
    .execute(&state.pool)
    .await
    .map_err(|error| error.to_string())?;

    query_channel(&state.pool, &channel_id)
        .await
        .map_err(|error| error.to_string())
}

#[tauri::command]
async fn send_message(
    state: tauri::State<'_, AppState>,
    input: SendMessageInput,
) -> CommandResult<MessageDto> {
    let body = input.body.trim().to_string();
    if body.is_empty() {
        return Err("Message cannot be empty.".to_string());
    }
    if body.len() > 2000 {
        return Err("Message is too long.".to_string());
    }

    let channel_exists: i64 = sqlx::query_scalar("SELECT COUNT(1) FROM channels WHERE id = ?")
        .bind(&input.channel_id)
        .fetch_one(&state.pool)
        .await
        .map_err(|error| error.to_string())?;
    if channel_exists == 0 {
        return Err("Channel not found.".to_string());
    }

    let author = input
        .author
        .as_deref()
        .map(normalize_label)
        .filter(|value| !value.is_empty())
        .unwrap_or_else(|| "You".to_string());

    let message = MessageDto {
        id: Uuid::now_v7().to_string(),
        channel_id: input.channel_id,
        author: author.clone(),
        avatar: make_avatar(&author),
        body,
        created_at: now_unix_ms(),
    };

    sqlx::query(
        "INSERT INTO messages (id, channel_id, author, avatar, body, created_at)
    VALUES (?, ?, ?, ?, ?, ?)",
    )
    .bind(&message.id)
    .bind(&message.channel_id)
    .bind(&message.author)
    .bind(&message.avatar)
    .bind(&message.body)
    .bind(message.created_at)
    .execute(&state.pool)
    .await
    .map_err(|error| error.to_string())?;

    Ok(message)
}

async fn init_schema(pool: &SqlitePool) -> Result<(), sqlx::Error> {
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS servers (
      id TEXT PRIMARY KEY NOT NULL,
      label TEXT NOT NULL,
      badge TEXT NOT NULL,
      color TEXT NOT NULL,
      position INTEGER NOT NULL DEFAULT 0
    )",
    )
    .execute(pool)
    .await?;

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS channels (
      id TEXT PRIMARY KEY NOT NULL,
      server_id TEXT NOT NULL,
      name TEXT NOT NULL,
      topic TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL,
      kind TEXT NOT NULL CHECK (kind IN ('text', 'voice')),
      position INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
    )",
    )
    .execute(pool)
    .await?;

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY NOT NULL,
      channel_id TEXT NOT NULL,
      author TEXT NOT NULL,
      avatar TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE
    )",
    )
    .execute(pool)
    .await?;

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS members (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('online', 'idle', 'dnd', 'offline')),
      role TEXT NOT NULL,
      role_color TEXT NOT NULL
    )",
    )
    .execute(pool)
    .await?;

    sqlx::query(
        "CREATE INDEX IF NOT EXISTS idx_channels_server_id_position
    ON channels(server_id, position)",
    )
    .execute(pool)
    .await?;

    sqlx::query(
        "CREATE INDEX IF NOT EXISTS idx_messages_channel_id_created_at
    ON messages(channel_id, created_at)",
    )
    .execute(pool)
    .await?;

    Ok(())
}

async fn seed_defaults(pool: &SqlitePool) -> Result<(), sqlx::Error> {
    let server_count: i64 = sqlx::query_scalar("SELECT COUNT(1) FROM servers")
        .fetch_one(pool)
        .await?;

    if server_count > 0 {
        return Ok(());
    }

    let server_id = Uuid::now_v7().to_string();
    sqlx::query("INSERT INTO servers (id, label, badge, color, position) VALUES (?, ?, ?, ?, ?)")
        .bind(&server_id)
        .bind("Vertigo")
        .bind("VG")
        .bind("#f2f2f2")
        .bind(0_i64)
        .execute(pool)
        .await?;

    let seed_channels = [
        (
            "general",
            "Workspace-wide updates and quick chat.",
            "Text Channels",
            "text",
        ),
        (
            "build-log",
            "Engineering updates and release notes.",
            "Text Channels",
            "text",
        ),
        (
            "voice-lobby",
            "Drop in for live sessions.",
            "Voice Channels",
            "voice",
        ),
    ];

    for (position, (name, topic, category, kind)) in seed_channels.iter().enumerate() {
        sqlx::query(
            "INSERT INTO channels (id, server_id, name, topic, category, kind, position)
      VALUES (?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(Uuid::now_v7().to_string())
        .bind(&server_id)
        .bind(name)
        .bind(topic)
        .bind(category)
        .bind(kind)
        .bind(position as i64)
        .execute(pool)
        .await?;
    }

    sqlx::query(
        "INSERT INTO members (id, name, status, role, role_color)
    VALUES (?, ?, ?, ?, ?)",
    )
    .bind(Uuid::now_v7().to_string())
    .bind("You")
    .bind("online")
    .bind("Owner")
    .bind("#ffffff")
    .execute(pool)
    .await?;

    Ok(())
}

async fn query_servers(pool: &SqlitePool) -> Result<Vec<ServerDto>, sqlx::Error> {
    sqlx::query_as::<_, ServerDto>(
        "SELECT id, label, badge, color, position FROM servers ORDER BY position ASC, label ASC",
    )
    .fetch_all(pool)
    .await
}

async fn query_members(pool: &SqlitePool) -> Result<Vec<MemberDto>, sqlx::Error> {
    sqlx::query_as::<_, MemberDto>(
        "SELECT id, name, status, role, role_color FROM members ORDER BY name COLLATE NOCASE ASC",
    )
    .fetch_all(pool)
    .await
}

async fn query_channels_by_server(
    pool: &SqlitePool,
    server_id: &str,
) -> Result<Vec<ChannelDto>, sqlx::Error> {
    sqlx::query_as::<_, ChannelDto>(
        "SELECT id, server_id, name, topic, category, kind as channel_type, position
    FROM channels
    WHERE server_id = ?
    ORDER BY position ASC, name COLLATE NOCASE ASC",
    )
    .bind(server_id)
    .fetch_all(pool)
    .await
}

async fn query_messages_by_channel(
    pool: &SqlitePool,
    channel_id: &str,
) -> Result<Vec<MessageDto>, sqlx::Error> {
    sqlx::query_as::<_, MessageDto>(
        "SELECT id, channel_id, author, avatar, body, created_at
    FROM messages
    WHERE channel_id = ?
    ORDER BY created_at ASC
    LIMIT 500",
    )
    .bind(channel_id)
    .fetch_all(pool)
    .await
}

async fn query_server(pool: &SqlitePool, server_id: &str) -> Result<ServerDto, sqlx::Error> {
    sqlx::query_as::<_, ServerDto>(
        "SELECT id, label, badge, color, position FROM servers WHERE id = ?",
    )
    .bind(server_id)
    .fetch_one(pool)
    .await
}

async fn query_channel(pool: &SqlitePool, channel_id: &str) -> Result<ChannelDto, sqlx::Error> {
    sqlx::query_as::<_, ChannelDto>(
        "SELECT id, server_id, name, topic, category, kind as channel_type, position
    FROM channels
    WHERE id = ?",
    )
    .bind(channel_id)
    .fetch_one(pool)
    .await
}

fn normalize_label(value: &str) -> String {
    value.split_whitespace().collect::<Vec<_>>().join(" ")
}

fn make_badge(label: &str) -> String {
    let letters: String = label
        .chars()
        .filter(|ch| ch.is_ascii_alphanumeric())
        .take(2)
        .collect::<String>()
        .to_uppercase();

    if letters.is_empty() {
        "SV".to_string()
    } else if letters.len() == 1 {
        format!("{letters}{letters}")
    } else {
        letters
    }
}

fn make_avatar(author: &str) -> String {
    let avatar = author
        .chars()
        .filter(|ch| !ch.is_whitespace())
        .take(2)
        .collect::<String>()
        .to_uppercase();

    if avatar.is_empty() {
        "YU".to_string()
    } else {
        avatar
    }
}

fn now_unix_ms() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as i64
}
