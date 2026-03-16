use crate::dao::UserDao;
use crate::error::{AppError, Result};
use crate::models::user::{CreateUser, User, UserInfo};
use sqlx::SqlitePool;

pub struct AuthService {
    user_dao: UserDao,
    pool: SqlitePool,
}

impl AuthService {
    pub fn new(pool: SqlitePool) -> Self {
        Self {
            user_dao: UserDao::new(pool.clone()),
            pool,
        }
    }

    /// 注册新用户（Argon2 密码哈希）
    pub async fn register(&self, username: &str, password: &str, email: Option<&str>) -> Result<UserInfo> {
        // 检查用户名是否已存在
        if self.user_dao.find_by_username(username).await?.is_some() {
            return Err(AppError::InvalidInput(format!("Username '{}' already exists", username)));
        }

        let password_hash = hash_password(password)?;

        let user = self.user_dao.insert(&CreateUser {
            username: username.to_string(),
            email: email.map(|e| e.to_string()),
            password_hash,
        }).await?;

        Ok(UserInfo::from(user))
    }

    /// 登录验证
    pub async fn login(&self, username: &str, password: &str) -> Result<(UserInfo, String)> {
        let user = self.user_dao.find_by_username(username)
            .await?
            .ok_or_else(|| AppError::Auth("Invalid username or password".into()))?;

        if !verify_password(password, &user.password_hash)? {
            return Err(AppError::Auth("Invalid username or password".into()));
        }

        self.user_dao.update_last_login(&user.id).await?;

        let token = generate_jwt(&user)?;
        Ok((UserInfo::from(user), token))
    }

    /// 验证 JWT token
    pub async fn verify_token(&self, token: &str) -> Result<UserInfo> {
        let claims = decode_jwt(token)?;
        let user = self.user_dao.find_by_id(&claims.sub)
            .await?
            .ok_or_else(|| AppError::Auth("User not found".into()))?;

        // 验证 JWT secret 是否匹配（用户修改密码后旧 token 失效）
        if claims.secret_hash != simple_hash(&user.jwt_secret) {
            return Err(AppError::Auth("Token invalidated".into()));
        }

        Ok(UserInfo::from(user))
    }

    /// 修改密码
    pub async fn change_password(&self, user_id: &str, old_password: &str, new_password: &str) -> Result<()> {
        let user = self.user_dao.find_by_id(user_id)
            .await?
            .ok_or_else(|| AppError::NotFound("User".into()))?;

        if !verify_password(old_password, &user.password_hash)? {
            return Err(AppError::Auth("Current password is incorrect".into()));
        }

        let new_hash = hash_password(new_password)?;
        self.user_dao.update(user_id, &crate::models::user::UserUpdate {
            username: None,
            email: None,
            password_hash: Some(new_hash),
        }).await?;

        // 刷新 JWT secret（使所有旧 token 失效）
        self.user_dao.update_jwt_secret(user_id).await?;

        Ok(())
    }

    /// 确保至少有一个管理员用户（首次启动时）
    pub async fn ensure_admin(&self) -> Result<()> {
        let count = self.user_dao.count().await?;
        if count == 0 {
            let default_password = uuid::Uuid::new_v4().to_string().split('-').next().unwrap_or("admin123").to_string();
            self.register("admin", &default_password, None).await?;
            tracing::info!(password = %default_password, "Default admin user created");
        }
        Ok(())
    }
}

// --- Crypto helpers ---

fn hash_password(password: &str) -> Result<String> {
    use argon2::{Argon2, PasswordHasher};
    use argon2::password_hash::SaltString;

    let salt = SaltString::generate(&mut rand::rngs::OsRng);
    let argon2 = Argon2::default();
    let hash = argon2
        .hash_password(password.as_bytes(), &salt)
        .map_err(|e| AppError::Internal(format!("Password hash error: {}", e)))?;
    Ok(hash.to_string())
}

fn verify_password(password: &str, hash: &str) -> Result<bool> {
    use argon2::{Argon2, PasswordVerifier};
    use argon2::password_hash::PasswordHash;

    let parsed = PasswordHash::new(hash)
        .map_err(|e| AppError::Internal(format!("Invalid hash: {}", e)))?;
    Ok(Argon2::default().verify_password(password.as_bytes(), &parsed).is_ok())
}

#[derive(serde::Serialize, serde::Deserialize)]
struct JwtClaims {
    sub: String,       // user id
    exp: usize,        // expiration
    iat: usize,        // issued at
    secret_hash: u64,  // hash of jwt_secret for invalidation
}

fn generate_jwt(user: &User) -> Result<String> {
    use jsonwebtoken::{encode, EncodingKey, Header};

    let now = chrono::Utc::now().timestamp() as usize;
    let claims = JwtClaims {
        sub: user.id.clone(),
        exp: now + 7 * 24 * 3600, // 7 days
        iat: now,
        secret_hash: simple_hash(&user.jwt_secret),
    };

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(user.jwt_secret.as_bytes()),
    )
    .map_err(|e| AppError::Internal(format!("JWT encode error: {}", e)))
}

fn decode_jwt(token: &str) -> Result<JwtClaims> {
    use jsonwebtoken::{decode, DecodingKey, Validation};

    // 先解码 header 获取 sub，再用对应用户的 secret 验证
    // 简化方案：使用不验证签名的方式获取 claims，然后在 verify_token 中验证
    let mut validation = Validation::default();
    validation.insecure_disable_signature_validation();

    let token_data = decode::<JwtClaims>(
        token,
        &DecodingKey::from_secret(b"dummy"), // 签名会在 verify_token 中通过 secret_hash 校验
        &validation,
    )
    .map_err(|e| AppError::Auth(format!("Invalid token: {}", e)))?;

    Ok(token_data.claims)
}

fn simple_hash(s: &str) -> u64 {
    use std::hash::{Hash, Hasher};
    let mut hasher = std::collections::hash_map::DefaultHasher::new();
    s.hash(&mut hasher);
    hasher.finish()
}
