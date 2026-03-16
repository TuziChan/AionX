use crate::error::{AppError, Result};
use crate::models::user::{CreateUser, User, UserUpdate};
use sqlx::SqlitePool;

const USER_COLUMNS: &str = "id, username, email, password_hash, jwt_secret, created_at, updated_at, last_login";

pub struct UserDao {
    pool: SqlitePool,
}

impl UserDao {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    pub async fn insert(&self, input: &CreateUser) -> Result<User> {
        let id = uuid::Uuid::new_v4().to_string();
        let now = chrono::Utc::now().timestamp();
        let jwt_secret = uuid::Uuid::new_v4().to_string();

        sqlx::query(
            "INSERT INTO users (id, username, email, password_hash, jwt_secret, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(&id)
        .bind(&input.username)
        .bind(input.email.as_deref())
        .bind(&input.password_hash)
        .bind(&jwt_secret)
        .bind(now)
        .bind(now)
        .execute(&self.pool)
        .await?;

        self.find_by_id(&id).await?.ok_or_else(|| {
            AppError::Internal("Failed to retrieve created user".into())
        })
    }

    pub async fn find_by_id(&self, id: &str) -> Result<Option<User>> {
        let sql = format!("SELECT {USER_COLUMNS} FROM users WHERE id = ?");
        let user = sqlx::query_as::<_, User>(&sql)
            .bind(id)
            .fetch_optional(&self.pool)
            .await?;
        Ok(user)
    }

    pub async fn find_by_username(&self, username: &str) -> Result<Option<User>> {
        let sql = format!("SELECT {USER_COLUMNS} FROM users WHERE username = ?");
        let user = sqlx::query_as::<_, User>(&sql)
            .bind(username)
            .fetch_optional(&self.pool)
            .await?;
        Ok(user)
    }

    pub async fn find_all(&self) -> Result<Vec<User>> {
        let sql = format!("SELECT {USER_COLUMNS} FROM users ORDER BY created_at ASC");
        let users = sqlx::query_as::<_, User>(&sql)
            .fetch_all(&self.pool)
            .await?;
        Ok(users)
    }

    pub async fn update(&self, id: &str, updates: &UserUpdate) -> Result<bool> {
        let now = chrono::Utc::now().timestamp();
        let mut qb: sqlx::QueryBuilder<sqlx::Sqlite> =
            sqlx::QueryBuilder::new("UPDATE users SET updated_at = ");
        qb.push_bind(now);

        if let Some(ref username) = updates.username {
            qb.push(", username = ").push_bind(username.clone());
        }
        if let Some(ref email) = updates.email {
            qb.push(", email = ").push_bind(email.clone());
        }
        if let Some(ref password_hash) = updates.password_hash {
            qb.push(", password_hash = ").push_bind(password_hash.clone());
        }

        qb.push(" WHERE id = ").push_bind(id.to_string());
        let result = qb.build().execute(&self.pool).await?;
        Ok(result.rows_affected() > 0)
    }

    pub async fn update_last_login(&self, id: &str) -> Result<()> {
        let now = chrono::Utc::now().timestamp();
        sqlx::query("UPDATE users SET last_login = ?, updated_at = ? WHERE id = ?")
            .bind(now)
            .bind(now)
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    pub async fn update_jwt_secret(&self, id: &str) -> Result<String> {
        let new_secret = uuid::Uuid::new_v4().to_string();
        sqlx::query("UPDATE users SET jwt_secret = ? WHERE id = ?")
            .bind(&new_secret)
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(new_secret)
    }

    pub async fn delete(&self, id: &str) -> Result<bool> {
        let result = sqlx::query("DELETE FROM users WHERE id = ?")
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(result.rows_affected() > 0)
    }

    pub async fn count(&self) -> Result<i64> {
        let (count,): (i64,) = sqlx::query_as("SELECT COUNT(*) FROM users")
            .fetch_one(&self.pool)
            .await?;
        Ok(count)
    }
}
