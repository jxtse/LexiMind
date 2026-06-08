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

const translatePrompt = (word) => {
  return [
    {
      role: 'system',
      content: '你是一个专业的英语词典助手，请严格按照 JSON 格式返回查询结果。'
    },
    {
      role: 'user',
      content: `请按以下 JSON 格式返回英文单词 "${word}" 的详细信息：
{
  "word": "单词",
  "phonetic": "音标",
  "definition": "英文释义",
  "translation": "中文翻译",
  "examples": ["例句1", "例句2"]
}

要求：
1. 音标使用国际音标
2. 英文释义简明扼要
3. 中文翻译准确
4. 提供 2 个常用例句
5. 只返回 JSON，不要包含 Markdown 或其他解释`
    }
  ]
}

const translateWord = async (word) => {
  try {
    const model = getCloudModel()
    const response = await model.generateText({
      model: AI_MODEL,
      messages: translatePrompt(word),
      temperature: 0.1
    })

    const result = parseJsonResponse(parseModelText(response))

    if (!result.word || !result.translation) {
      throw new Error('返回数据格式不完整')
    }

    return result
  } catch (error) {
    console.error('翻译失败:', error)
    throw error
  }
}

module.exports = {
  translateWord
}
