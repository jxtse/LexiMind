const AI_MODEL = 'hy3-preview'

const getCloudModel = () => {
  if (!wx.cloud || !wx.cloud.extend || !wx.cloud.extend.AI) {
    throw new Error('当前基础库不支持云开发 AI，请升级微信开发者工具和基础库')
  }

  return wx.cloud.extend.AI.createModel('cloudbase')
}

const parseModelText = (response) => {
  if (response && response.text) {
    return response.text
  }

  const content = response &&
    response.choices &&
    response.choices[0] &&
    response.choices[0].message &&
    response.choices[0].message.content

  if (content) {
    return content
  }

  throw new Error('AI 响应格式错误')
}

const parseJsonResponse = (text) => {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')

  return JSON.parse(cleaned)
}

const normalizeDifficultyLevel = (level) => {
  return Math.max(1, Math.min(10, Number(level) || 5))
}

const getDifficultyProfile = (level) => {
  if (level <= 3) {
    return {
      label: '基础日常',
      wordCount: '18-22',
      temperature: 0.28,
      instruction: `难度等级为 ${level}/10。请生成偏基础、日常、常见场景中高频出现的词汇，避免过多术语。`
    }
  }

  if (level <= 7) {
    return {
      label: '进阶实用',
      wordCount: '16-20',
      temperature: 0.32,
      instruction: `难度等级为 ${level}/10。请生成适合中级学习者的词汇，包含更精准的动词、名词搭配和常见专业表达。`
    }
  }

  return {
    label: '专业高阶',
    wordCount: '14-18',
    temperature: 0.38,
    instruction: `难度等级为 ${level}/10。请生成更高阶、更专业或更学术化的词汇，适合有较强英语基础的学习者。`
  }
}

const generateThematicWordsPrompt = (topic, difficultyLevel = 5) => {
  const level = normalizeDifficultyLevel(difficultyLevel)
  const profile = getDifficultyProfile(level)

  return [
    {
      role: 'system',
      content: '你是一个专业的英语词汇专家，专门帮助学习者扩展主题相关词汇量。请严格按照 JSON 格式返回结果。'
    },
    {
      role: 'user',
      content: `请根据主题 "${topic}" 生成 ${profile.wordCount} 个相关英文单词。

生成难度：${level}/10（${profile.label}）。
${profile.instruction}

请按以下 JSON 格式返回：
{
  "topic": "主题",
  "description": "主题的简短中文描述",
  "targetDifficultyLevel": ${level},
  "words": [
    {
      "word": "英文单词",
      "phonetic": "音标",
      "definition": "英文释义",
      "translation": "中文翻译",
      "difficulty": "beginner/intermediate/advanced",
      "difficultyLevel": ${level},
      "example": "例句"
    }
  ]
}

要求：
1. 单词覆盖该主题的核心词汇，并与用户输入的真实场景强相关
2. 每个单词的 difficultyLevel 必须是 1 到 10 的数字，尽量接近 ${level}，允许上下浮动 1 级
3. difficulty 根据 difficultyLevel 对应：1-3 为 beginner，4-7 为 intermediate，8-10 为 advanced
4. 音标使用国际音标格式
5. 每个单词提供一个实用例句
6. 只返回 JSON，不要包含 Markdown 或其他解释`
    }
  ]
}

const normalizeWordDifficulty = (word, targetLevel) => {
  const level = normalizeDifficultyLevel(word.difficultyLevel || targetLevel)

  let difficulty = 'intermediate'
  if (level <= 3) {
    difficulty = 'beginner'
  } else if (level >= 8) {
    difficulty = 'advanced'
  }

  return {
    ...word,
    difficulty,
    difficultyLevel: level
  }
}

const generateThematicWords = async (topic, difficultyLevel = 5) => {
  const targetLevel = normalizeDifficultyLevel(difficultyLevel)
  const profile = getDifficultyProfile(targetLevel)

  try {
    const model = getCloudModel()
    const response = await model.generateText({
      model: AI_MODEL,
      messages: generateThematicWordsPrompt(topic, targetLevel),
      temperature: profile.temperature
    })

    const result = parseJsonResponse(parseModelText(response))

    if (!result.topic || !result.words || !Array.isArray(result.words)) {
      throw new Error('返回数据格式不完整')
    }

    result.targetDifficultyLevel = normalizeDifficultyLevel(result.targetDifficultyLevel || targetLevel)
    result.words = result.words.map((word) => normalizeWordDifficulty(word, result.targetDifficultyLevel))

    return result
  } catch (error) {
    console.error('主题词汇生成失败:', error)
    throw error
  }
}

module.exports = {
  generateThematicWords
}
