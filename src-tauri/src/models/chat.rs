use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use specta::Type;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow, Type)]
pub struct Chat {
    pub id: String,
    pub title: String,
    pub agent_type: AgentType,
    #[specta(type = f64)]
    pub created_at: i64,
    #[specta(type = f64)]
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "lowercase")]
pub enum AgentType {
    Acp,
    Codex,
    Gemini,
    Nanobot,
    Openclaw,
}

impl sqlx::Type<sqlx::Sqlite> for AgentType {
    fn type_info() -> sqlx::sqlite::SqliteTypeInfo {
        <String as sqlx::Type<sqlx::Sqlite>>::type_info()
    }
}

impl sqlx::Encode<'_, sqlx::Sqlite> for AgentType {
    fn encode_by_ref(&self, buf: &mut Vec<sqlx::sqlite::SqliteArgumentValue<'_>>) -> Result<sqlx::encode::IsNull, sqlx::error::BoxDynError> {
        let s = match self {
            AgentType::Acp => "acp",
            AgentType::Codex => "codex",
            AgentType::Gemini => "gemini",
            AgentType::Nanobot => "nanobot",
            AgentType::Openclaw => "openclaw",
        };
        <&str as sqlx::Encode<sqlx::Sqlite>>::encode(s, buf)
    }
}

impl<'r> sqlx::Decode<'r, sqlx::Sqlite> for AgentType {
    fn decode(value: sqlx::sqlite::SqliteValueRef<'r>) -> Result<Self, sqlx::error::BoxDynError> {
        let s = <&str as sqlx::Decode<sqlx::Sqlite>>::decode(value)?;
        match s {
            "acp" => Ok(AgentType::Acp),
            "codex" => Ok(AgentType::Codex),
            "gemini" => Ok(AgentType::Gemini),
            "nanobot" => Ok(AgentType::Nanobot),
            "openclaw" => Ok(AgentType::Openclaw),
            _ => Err(format!("Invalid agent type: {}", s).into()),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow, Type)]
pub struct Message {
    pub id: String,
    pub chat_id: String,
    pub role: MessageRole,
    pub content: String,
    #[specta(type = f64)]
    pub created_at: i64,
    pub metadata: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "lowercase")]
pub enum MessageRole {
    User,
    Assistant,
    System,
}

impl sqlx::Type<sqlx::Sqlite> for MessageRole {
    fn type_info() -> sqlx::sqlite::SqliteTypeInfo {
        <String as sqlx::Type<sqlx::Sqlite>>::type_info()
    }
}

impl sqlx::Encode<'_, sqlx::Sqlite> for MessageRole {
    fn encode_by_ref(&self, buf: &mut Vec<sqlx::sqlite::SqliteArgumentValue<'_>>) -> Result<sqlx::encode::IsNull, sqlx::error::BoxDynError> {
        let s = match self {
            MessageRole::User => "user",
            MessageRole::Assistant => "assistant",
            MessageRole::System => "system",
        };
        <&str as sqlx::Encode<sqlx::Sqlite>>::encode(s, buf)
    }
}

impl<'r> sqlx::Decode<'r, sqlx::Sqlite> for MessageRole {
    fn decode(value: sqlx::sqlite::SqliteValueRef<'r>) -> Result<Self, sqlx::error::BoxDynError> {
        let s = <&str as sqlx::Decode<sqlx::Sqlite>>::decode(value)?;
        match s {
            "user" => Ok(MessageRole::User),
            "assistant" => Ok(MessageRole::Assistant),
            "system" => Ok(MessageRole::System),
            _ => Err(format!("Invalid message role: {}", s).into()),
        }
    }
}
