use crate::error::{AppError, Result};
use crate::models::User;
use sqlx::SqlitePool;

const SELECT_COLS: &str = "id, username, email, password_hash, jwt_secret, created_at, updated_at, last_login";

pub struct UserRepo {
    pool: SqlitePool,
}

impl UserRepo {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    pub async fn insert(
        &self,
        id: &str,
        username: &str,
        password_hash: &str,
        jwt_secret: &str,
        now: i64,
    ) -> Result<()> {
        sqlx::query(
            "INSERT INTO users (id, username, password_hash, jwt_secret, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?)",
        )
        .bind(id)
        .bind(username)
        .bind(password_hash)
        .bind(jwt_secret)
        .bind(now)
        .bind(now)
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    pub async fn find_by_id(&self, id: &str) -> Result<Option<User>> {
        let sql = format!("SELECT {SELECT_COLS} FROM users WHERE id = ?");
        Ok(sqlx::query_as::<_, User>(&sql)
            .bind(id)
            .fetch_optional(&self.pool)
            .await?)
    }

    pub async fn find_by_id_required(&self, id: &str) -> Result<User> {
        self.find_by_id(id)
            .await?
            .ok_or_else(|| AppError::NotFound(format!("User {id}")))
    }

    pub async fn find_by_username(&self, username: &str) -> Result<Option<User>> {
        let sql = format!("SELECT {SELECT_COLS} FROM users WHERE username = ?");
        Ok(sqlx::query_as::<_, User>(&sql)
            .bind(username)
            .fetch_optional(&self.pool)
            .await?)
    }

    pub async fn update_password(&self, id: &str, password_hash: &str, now: i64) -> Result<()> {
        sqlx::query("UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?")
            .bind(password_hash)
            .bind(now)
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    pub async fn update_last_login(&self, id: &str, now: i64) -> Result<()> {
        sqlx::query("UPDATE users SET last_login = ?, updated_at = ? WHERE id = ?")
            .bind(now)
            .bind(now)
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    pub async fn update_email(&self, id: &str, email: &str, now: i64) -> Result<()> {
        sqlx::query("UPDATE users SET email = ?, updated_at = ? WHERE id = ?")
            .bind(email)
            .bind(now)
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    pub async fn delete(&self, id: &str) -> Result<()> {
        sqlx::query("DELETE FROM users WHERE id = ?")
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    pub async fn count(&self) -> Result<i64> {
        let (count,): (i64,) = sqlx::query_as("SELECT COUNT(*) FROM users")
            .fetch_one(&self.pool)
            .await?;
        Ok(count)
    }

    pub async fn list_all(&self) -> Result<Vec<User>> {
        let sql = format!("SELECT {SELECT_COLS} FROM users ORDER BY created_at DESC");
        Ok(sqlx::query_as::<_, User>(&sql)
            .fetch_all(&self.pool)
            .await?)
    }
}
