-- 1. 创建数据库
CREATE DATABASE IF NOT EXISTS collab_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE collab_db;

-- 2. 创建协同房间主表
CREATE TABLE IF NOT EXISTS collab_sessions (
  session_id VARCHAR(50) PRIMARY KEY,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. 创建家人反馈表
CREATE TABLE IF NOT EXISTS collab_feedbacks (
  id VARCHAR(50) PRIMARY KEY,
  session_id VARCHAR(50) NOT NULL,
  role VARCHAR(20) NOT NULL,
  feedback_data JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_session (session_id)
);
