/**
 * CloudBase Event Function: generate-ps
 *
 * 两种模式：
 *   1. generate（默认）：接收问卷数据，调用 DeepSeek 生成英文 PS
 *   2. check：接收已生成的 PS 和目标大学信息，调用 DeepSeek 检查匹配度
 *
 * 请求参数（generate 模式）：
 *   { apiKey, type, name, questions }
 *
 * 请求参数（check 模式）：
 *   { mode: 'check', apiKey, psText, type, targetUniversity, major }
 */

const axios = require('axios');

const DEEPSEEK_API = 'https://api.deepseek.com/v1/chat/completions';
const MODEL = 'deepseek-chat';

exports.main = async (event, context) => {
  const mode = event.mode || 'generate';
  console.log(`[generate-ps] mode=${mode}`, JSON.stringify({
    type: event.type, name: event.name,
    answeredCount: event.questions?.filter(q => q.answer?.trim()).length || 0
  }));

  try {
    if (!event.apiKey) return { success: false, error: '缺少 API Key' };

    if (mode === 'check') {
      return await handleCheck(event);
    }
    return await handleGenerate(event);

  } catch (error) {
    console.error('[generate-ps] Error:', error.message);
    if (error.response) {
      const s = error.response.status;
      if (s === 401) return { success: false, error: 'API Key 无效，请检查后重试' };
      if (s === 429) return { success: false, error: 'API 调用次数超限，请稍后重试' };
      return { success: false, error: `API 错误 (${s}): ${error.response.data?.error?.message || ''}` };
    }
    if (error.code === 'ECONNABORTED') return { success: false, error: 'AI 响应超时，请重试' };
    return { success: false, error: `请求失败: ${error.message}` };
  }
};

/** 生成文书 */
async function handleGenerate(event) {
  const { type, name, questions } = event;
  if (!type) return { success: false, error: '请选择文书类型' };
  if (!questions || questions.filter(q => q.answer?.trim()).length < 3) {
    return { success: false, error: '请至少回答 3 个问题' };
  }

  const userInfo = buildUserProfile(type, name, questions);
  const systemPrompt = getSystemPrompt(type);

  const res = await axios.post(DEEPSEEK_API, {
    model: MODEL,
    messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userInfo }],
    temperature: 0.7, max_tokens: 4000
  }, {
    headers: { 'Authorization': `Bearer ${event.apiKey}`, 'Content-Type': 'application/json' },
    timeout: 60000
  });

  const ps = res.data.choices[0].message.content.trim();
  const stats = calculateStats(ps, type);
  return { success: true, ps, stats };
}

/** 检查文书与目标学校的匹配度 */
async function handleCheck(event) {
  const { psText, type, targetUniversity, major } = event;
  if (!psText) return { success: false, error: '缺少文书内容（psText）' };

  const typeLabel = type === 'ucas' ? '英国 UCAS' : '香港大学';
  const systemMsg = `你是资深大学招生官，擅长分析 Personal Statement 与目标院校的匹配度。

请严格按以下结构输出分析（不要加额外说明，直接按此格式）：

✅ 覆盖得好的方面
（列出 2-4 点该文书做得好的地方，针对该学校要求）

⚠️ 需要改进或补充的方面
（列出 2-4 点该文书的不足或遗漏，针对该学校要求）

💡 改进建议
（给出 2-3 条具体修改建议）

如果用户没有填写目标大学，请基于专业类型给出通用的建议。`;

  const userMsg = `目标大学/专业：${targetUniversity || '(未填写，请给出通用建议)'}
文书类型：${typeLabel}
目标专业：${major || '(未填写)'}

===== 文书全文 =====

${psText}`;

  const res = await axios.post(DEEPSEEK_API, {
    model: MODEL,
    messages: [{ role: 'system', content: systemMsg }, { role: 'user', content: userMsg }],
    temperature: 0.3, max_tokens: 2000
  }, {
    headers: { 'Authorization': `Bearer ${event.apiKey}`, 'Content-Type': 'application/json' },
    timeout: 30000
  });

  return { success: true, analysis: res.data.choices[0].message.content.trim() };
}

/**
 * 构建用户画像
 */
function buildUserProfile(type, name, questions) {
  const qMap = {};
  questions.forEach(q => { qMap[q.id] = q.answer?.trim() || ''; });
  const get = (id) => qMap[id] || '';

  const major = get(1) || 'your chosen subject';
  const school = get(2) || 'my school';
  const grade = get(4) || '';
  const interestOrigin = get(5) || '';
  const triggerEvent = get(6) || get(5) || '';
  const subField = get(7) || '';
  const readings = get(8) || '';
  const courses = get(9) || '';
  const insight = get(10) || '';
  const projects = get(11) || '';
  const competitions = get(12) || '';
  const skills = get(13) || '';
  const internship = get(14) || '';
  const research = get(15) || '';
  const club = get(16) || '';
  const volunteer = get(17) || '';
  const crossCulture = get(18) || '';
  const leadership = get(19) || '';
  const teamwork = get(20) || '';
  const strengths = get(21) || '';
  const challenge = get(22) || '';
  const whyStudyAbroad = get(23) || '';
  const whyUniversity = get(24) || '';
  const careerGoal = get(25) || '';
  const contribution = get(26) || '';
  const otherInfo = get(27) || '';
  const background = get(28) || '';
  const hobbies = get(29) || '';
  const freeText = get(30) || '';

  let profile = `## 申请信息\n\n`;
  profile += `目标专业：${major}\n`;
  profile += `学校/课程：${school}\n`;
  if (grade) profile += `英语成绩：${grade}\n\n`;
  else profile += '\n';

  profile += `## 学术兴趣起源\n\n${interestOrigin}\n\n`;
  if (triggerEvent && triggerEvent !== interestOrigin) profile += `关键触发事件：${triggerEvent}\n\n`;
  if (subField) profile += `感兴趣的细分方向：${subField}\n\n`;
  if (readings) profile += `相关阅读：${readings}\n\n`;

  profile += `## 学术经历\n\n`;
  if (courses) profile += `课程与成绩：${courses}\n`;
  if (insight) profile += `课程思考：${insight}\n`;
  if (projects) profile += `项目经历：${projects}\n`;
  if (competitions) profile += `竞赛经历：${competitions}\n`;
  if (skills) profile += `技能：${skills}\n\n`;

  profile += `## 实践经历\n\n`;
  if (internship) profile += `实习：${internship}\n`;
  if (research) profile += `科研：${research}\n`;
  if (club) profile += `社团：${club}\n`;
  if (volunteer) profile += `志愿：${volunteer}\n`;
  if (crossCulture) profile += `跨文化经历：${crossCulture}\n`;
  if (leadership) profile += `领导力：${leadership}\n`;
  if (teamwork) profile += `团队合作：${teamwork}\n\n`;

  profile += `## 个人特质\n\n`;
  if (strengths) profile += `优点：${strengths}\n`;
  if (challenge) profile += `克服困难：${challenge}\n`;
  if (hobbies) profile += `兴趣爱好：${hobbies}\n`;
  if (background) profile += `成长背景：${background}\n\n`;

  profile += `## 动机与规划\n\n`;
  if (whyStudyAbroad) profile += `留学动机：${whyStudyAbroad}\n`;
  if (whyUniversity) profile += `选校理由：${whyUniversity}\n`;
  if (careerGoal) profile += `职业规划：${careerGoal}\n`;
  if (contribution) profile += `社区贡献：${contribution}\n\n`;

  if (otherInfo || freeText) {
    profile += `## 补充信息\n\n${otherInfo || ''}\n${freeText || ''}\n`;
  }
  return profile;
}

/**
 * 获取系统提示词
 */
function getSystemPrompt(type) {
  if (type === 'ucas') {
    return `你是一位资深的 UCAS Personal Statement 写作导师，拥有多年 Oxbridge 和 Russell Group 大学招生经验。

请根据用户提供的中文问卷答案，用英文撰写一篇 UCAS Personal Statement。

## 写作规范
- 字符限制：不超过 4000 个字符（含空格），不限行数
- 语言：学术英语
- 至少 80% 内容聚焦学术兴趣和能力

## 结构要求
1. **开头段**（~15%）：用一个具体、个人化的经历引出对专业的兴趣。不要用 "I have always been interested in" 等陈词滥调
2. **主体段1**（~25%）：课内学术拓展，展示在相关课程中的深度思考和学术好奇心
3. **主体段2**（~25%）：课外学术延伸（阅读、竞赛、项目、在线课程等）
4. **主体段3**（~20%）：实践经历（实习、社团、志愿者等）与专业的关联
5. **结尾段**（~15%）：未来规划 + 对大学学习的期待

## 写作原则
- Show, don't tell：用具体事例代替空泛描述
- 学术深度：展示批判性思维和独立思考
- 逻辑连贯：段落间有自然过渡，全文有一条清晰的"故事线"
- 个性化：保持真实，避免模板化
- 正面表述：所有内容都正面展示自身优势

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
1. **开头段**：动机陈述 — 为什么选择这个专业 + 为什么选择香港
2. **主体段1**：学术能力展示（课程成绩、项目、研究）
3. **主体段2**：实践经历（实习、竞赛、社会活动）
4. **主体段3**：个人特质（领导力、跨文化适应力、综合素质）
5. **结尾段**：职业规划 + 为什么你是合适的人选

## 写作要点
- 强调与香港大学的匹配度
- 展示对香港教育环境的了解
- 突出跨文化背景和中英双语能力
- 体现综合素质和全人发展

## 重要指示
- 用户的所有答案都是用中文写的，你需要把关键信息提取出来，转化为自然流畅的英文学术表达
- 不要逐字翻译中文原文，而是要理解核心信息后重新组织成地道的英文
- 保留具体的课程名称、书名、奖项名称、学校名称等专有名词
- 输出格式：每段之间空一行，不要有其他标记`;
  }
}

function calculateStats(ps, type) {
  const charNoSpace = ps.replace(/\s/g, '').length;
  const charTotal = ps.length;
  const words = ps.split(/\s+/).filter(w => w.length > 0).length;
  const lines = ps.split('\n').filter(l => l.trim()).length;
  return { charNoSpace, charTotal, words, lines };
}
