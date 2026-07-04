/**
 * CloudRun HTTP Server: generate-ps-server
 * 
 * 提供 HTTP POST 接口 /generate-ps
 * 接收问卷数据，调用 DeepSeek API 生成英文 Personal Statement
 * 
 * POST /generate-ps
 * Body: { apiKey, type, name, questions }
 * 
 * 默认监听端口 3000（CloudRun 会自动分配端口）
 */

const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS 配置 - 允许所有来源
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// DeepSeek API 配置
const DEEPSEEK_API = 'https://api.deepseek.com/v1/chat/completions';
const MODEL = 'deepseek-chat';

// ========== 系统提示词 ==========
function getSystemPrompt(type) {
  if (type === 'ucas') {
    return `你是一位资深的 UCAS Personal Statement 写作导师，拥有多年 Oxbridge 和 Russell Group 大学招生经验。

请根据用户提供的中文问卷答案，用英文撰写一篇 UCAS Personal Statement。

## 写作规范
- 字符限制：不超过 4000 个字符（含空格），不限行数
- 语言：学术英语
- 至少 80% 内容聚焦学术兴趣和能力

## 结构要求
1. **开头段**（~15%）：用一个具体、个人化的经历引出对专业的兴趣
2. **主体段1**（~25%）：课内学术拓展
3. **主体段2**（~25%）：课外学术延伸
4. **主体段3**（~20%）：实践经历
5. **结尾段**（~15%）：未来规划 + 对大学学习的期待

## 重要指示
- 用户的所有答案都是用中文写的，你需要把关键信息提取出来，转化为自然流畅的英文学术表达
- 不要逐字翻译中文原文，而是要理解核心信息后重新组织成地道的英文
- 保留具体的课程名称、书名、奖项名称、学校名称等专有名词
- 输出格式：每段之间空一行，不要有其他标记`;
  } else {
    return `你是一位资深的香港大学 Personal Statement 写作导师。

请根据用户提供的中文问卷答案，用英文撰写一篇香港大学申请的个人陈述。

## 写作规范
- 字数：500-1000 词
- 语言：学术英语

## 结构要求
1. **开头段**：动机陈述
2. **主体段1**：学术能力展示
3. **主体段2**：实践经历
4. **主体段3**：个人特质
5. **结尾段**：职业规划

## 重要指示
- 用户的所有答案都是用中文写的，你需要把关键信息提取出来，转化为自然流畅的英文学术表达
- 不要逐字翻译，要理解核心信息后重新组织成地道的英文
- 保留具体的课程名称、书名、奖项名称、学校名称等专有名词
- 输出格式：每段之间空一行，不要有其他标记`;
  }
}

// ========== 构建用户信息 ==========
function buildUserProfile(type, name, questions) {
  const qMap = {};
  questions.forEach(q => { qMap[q.id] = q.answer?.trim() || ''; });
  const get = (id) => qMap[id] || '';

  let profile = `## 申请信息\n\n`;
  profile += `目标专业：${get(1)}\n`;
  profile += `学校/课程：${get(2)}\n`;
  if (get(4)) profile += `英语成绩：${get(4)}\n\n`;
  else profile += '\n';
  profile += `## 学术兴趣起源\n\n${get(5) || get(6)}\n\n`;
  if (get(7)) profile += `感兴趣的细分方向：${get(7)}\n\n`;
  if (get(8)) profile += `相关阅读：${get(8)}\n\n`;
  profile += `## 学术经历\n\n`;
  if (get(9)) profile += `课程与成绩：${get(9)}\n`;
  if (get(10)) profile += `课程思考：${get(10)}\n`;
  if (get(11)) profile += `项目经历：${get(11)}\n`;
  if (get(12)) profile += `竞赛经历：${get(12)}\n`;
  if (get(13)) profile += `技能：${get(13)}\n\n`;
  profile += `## 实践经历\n\n`;
  if (get(14)) profile += `实习：${get(14)}\n`;
  if (get(15)) profile += `科研：${get(15)}\n`;
  if (get(16)) profile += `社团：${get(16)}\n`;
  if (get(17)) profile += `志愿：${get(17)}\n`;
  if (get(18)) profile += `跨文化经历：${get(18)}\n`;
  if (get(19)) profile += `领导力：${get(19)}\n`;
  if (get(20)) profile += `团队合作：${get(20)}\n\n`;
  profile += `## 个人特质\n\n`;
  if (get(21)) profile += `优点：${get(21)}\n`;
  if (get(22)) profile += `克服困难：${get(22)}\n`;
  if (get(29)) profile += `兴趣爱好：${get(29)}\n`;
  if (get(28)) profile += `成长背景：${get(28)}\n\n`;
  profile += `## 动机与规划\n\n`;
  if (get(23)) profile += `留学动机：${get(23)}\n`;
  if (get(24)) profile += `选校理由：${get(24)}\n`;
  if (get(25)) profile += `职业规划：${get(25)}\n`;
  if (get(26)) profile += `社区贡献：${get(26)}\n`;
  return profile;
}

// ========== POST /generate-ps ==========
app.post('/generate-ps', async (req, res) => {
  console.log('[generate-ps] Received request');

  try {
    const { apiKey, type, name, questions } = req.body;

    if (!apiKey) {
      return res.json({ success: false, error: '缺少 API Key' });
    }
    if (!type) {
      return res.json({ success: false, error: '请选择文书类型' });
    }
    if (!questions || questions.filter(q => q.answer?.trim()).length < 3) {
      return res.json({ success: false, error: '请至少回答 3 个问题' });
    }

    const userInfo = buildUserProfile(type, name, questions);
    const systemPrompt = getSystemPrompt(type);

    console.log('[generate-ps] Calling DeepSeek API...');

    const response = await axios.post(
      DEEPSEEK_API,
      {
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userInfo }
        ],
        temperature: 0.7,
        max_tokens: 4000
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      }
    );

    const ps = response.data.choices[0].message.content.trim();
    const charNoSpace = ps.replace(/\s/g, '').length;
    const charTotal = ps.length;
    const words = ps.split(/\s+/).filter(w => w.length > 0).length;
    const lines = ps.split('\n').filter(l => l.trim()).length;

    console.log('[generate-ps] Success');

    return res.json({
      success: true,
      ps: ps,
      stats: { charNoSpace, charTotal, words, lines }
    });

  } catch (error) {
    console.error('[generate-ps] Error:', error.message);
    if (error.response) {
      const status = error.response.status;
      if (status === 401) return res.json({ success: false, error: 'API Key 无效，请检查后重试' });
      if (status === 429) return res.json({ success: false, error: 'API 调用次数超限，请稍后重试' });
      return res.json({ success: false, error: `API 错误: ${error.response.data?.error?.message || '未知错误'}` });
    }
    return res.json({ success: false, error: `请求失败: ${error.message}` });
  }
});

// ========== Health Check ==========
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'generate-ps-server' });
});

app.listen(PORT, () => {
  console.log(`[generate-ps-server] Running on port ${PORT}`);
});
