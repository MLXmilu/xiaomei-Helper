require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
app.use(cors());
app.use(express.json());

// MySQL 连接池
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'collab_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// --- 协同反馈 API ---

// 1. 提交家人偏好
app.post('/api/feedback/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  const feedback = req.body;
  try {
    // 自动确保 sessions 表有一条记录，防止外键报错
    await pool.query('INSERT IGNORE INTO collab_sessions (session_id) VALUES (?)', [sessionId]);
    
    // 插入反馈数据
    const query = 'INSERT INTO collab_feedbacks (id, session_id, role, feedback_data) VALUES (?, ?, ?, ?)';
    await pool.query(query, [feedback.id, sessionId, feedback.role, JSON.stringify(feedback)]);
    
    res.json({ success: true });
  } catch (err) {
    console.error('Insert feedback error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// 2. 轮询拉取家人偏好
app.get('/api/feedback/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM collab_feedbacks WHERE session_id = ? ORDER BY created_at ASC', [sessionId]);
    // 映射回前端需要的结构
    const feedbacks = rows.map(r => r.feedback_data);
    res.json(feedbacks);
  } catch (err) {
    console.error('Fetch feedback error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// --- 大模型代理 API (隐藏 API Key) ---
app.post('/api/chat', async (req, res) => {
  const { messages, model, temperature, stream } = req.body;
  
  if (!process.env.AI_API_KEY) {
    return res.status(500).json({ error: 'Server AI_API_KEY is not configured.' });
  }

  try {
    const aiResponse = await fetch(process.env.AI_BASE_URL || 'https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.AI_API_KEY}`
      },
      body: JSON.stringify({ messages, model, temperature, stream })
    });

    // 如果前端要求流式传输，则透传数据流
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      const { Readable } = require('stream');
      if (aiResponse.body.pipe) {
        aiResponse.body.pipe(res); // Node-fetch 等情况
      } else {
        Readable.fromWeb(aiResponse.body).pipe(res); // Native Fetch 情况
      }
    } else {
      const data = await aiResponse.json();
      res.json(data);
    }
  } catch (err) {
    console.error('AI Proxy error:', err);
    res.status(500).json({ error: 'AI Service Error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Collab Server running on port ${PORT}`);
});
