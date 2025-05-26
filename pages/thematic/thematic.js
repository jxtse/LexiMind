const { generateThematicWords } = require('../../utils/thematicWords.js')

Page({
  data: {
    inputTopic: '',
    loading: false,
    result: null,
    selectedDifficulty: 'all',
    generateDifficulty: 'all',
    filteredWords: [],
    presetTopics: [
      '大都会博物馆',
      '咖啡厅',
      '医院就诊',
      '机场出行',
      '酒店住宿',
      '餐厅用餐',
      '购物中心',
      '图书馆',
      '健身房',
      '银行办事',
      '邮局寄件'
    ]
  },

  // 分享配置
  onShareTimeline: function() {
    return {
      title: 'LexiMind主题词汇生成器 - 根据场景学习英语词汇',
      query: '',
      imageUrl: '/images/share-timeline.png'
    }
  },

  onShareAppMessage: function () {
    return {
      title: 'LexiMind主题词汇生成器',
      path: '/pages/thematic/thematic'
    }
  },

  // 输入框内容变化
  onTopicInput(e) {
    this.setData({
      inputTopic: e.detail.value
    })
  },

  // 清空输入
  clearInput() {
    this.setData({
      inputTopic: '',
      result: null,
      filteredWords: [],
      selectedDifficulty: 'all'
    })
  },

  // 选择生成难度
  selectGenerateDifficulty(e) {
    const difficulty = e.currentTarget.dataset.difficulty
    this.setData({
      generateDifficulty: difficulty
    })
  },

  // 选择预设主题
  selectPresetTopic(e) {
    const topic = e.currentTarget.dataset.topic
    this.setData({
      inputTopic: topic
    })
    this.generateWords()
  },

  // 生成主题词汇
  async generateWords() {
    if (!this.data.inputTopic.trim()) {
      wx.showToast({
        title: '请输入主题',
        icon: 'none'
      })
      return
    }

    this.setData({
      loading: true,
      result: null
    })

    wx.showLoading({
      title: 'AI生成中...',
      mask: true
    })

    try {
      console.log('开始生成主题词汇:', this.data.inputTopic, '难度:', this.data.generateDifficulty)
      const result = await generateThematicWords(this.data.inputTopic, this.data.generateDifficulty)
      console.log('生成结果:', result)

      result.targetDifficulty = this.data.generateDifficulty

      this.setData({
        result: result,
        selectedDifficulty: 'all',
        filteredWords: result.words
      })

      const difficultyText = this.data.generateDifficulty === 'all' ? '各种难度的' : 
                            this.data.generateDifficulty === 'beginner' ? '初级' :
                            this.data.generateDifficulty === 'intermediate' ? '中级' : '高级'

      wx.showToast({
        title: `成功生成${result.words.length}个${difficultyText}单词`,
        icon: 'success'
      })
    } catch (error) {
      console.error('生成词汇失败:', error)
      wx.showToast({
        title: error.message || '生成失败，请稍后重试',
        icon: 'none',
        duration: 3000
      })
    } finally {
      this.setData({
        loading: false
      })
      wx.hideLoading()
    }
  },

  // 根据难度筛选词汇
  filterByDifficulty(e) {
    const difficulty = e.currentTarget.dataset.difficulty
    this.setData({
      selectedDifficulty: difficulty
    })

    if (difficulty === 'all') {
      this.setData({
        filteredWords: this.data.result.words
      })
    } else {
      const filtered = this.data.result.words.filter(word => word.difficulty === difficulty)
      this.setData({
        filteredWords: filtered
      })
    }
  },

  // 添加单个单词到生词本
  addToWordbook(e) {
    const word = e.currentTarget.dataset.word
    
    // 构造符合生词本格式的数据
    const wordData = {
      word: word.word,
      phonetic: word.phonetic,
      definition: word.definition,
      translation: word.translation,
      examples: [word.example], // 转换为数组格式
      addTime: new Date().getTime(),
      source: 'thematic', // 标记来源
      topic: this.data.result.topic, // 记录主题
      difficulty: word.difficulty, // 记录难度
      targetDifficulty: this.data.result.targetDifficulty // 记录生成时的目标难度
    }

    const wordList = wx.getStorageSync('wordbook') || []
    
    // 检查是否已存在
    const exists = wordList.some(item => item.word.toLowerCase() === word.word.toLowerCase())
    if (exists) {
      wx.showToast({
        title: '该单词已在生词本中',
        icon: 'none'
      })
      return
    }

    wordList.push(wordData)
    wx.setStorageSync('wordbook', wordList)
    
    wx.showToast({
      title: '添加成功',
      icon: 'success'
    })
  },

  // 将所有单词加入生词本
  addAllToWordbook() {
    if (!this.data.result || !this.data.result.words) {
      wx.showToast({
        title: '没有可添加的单词',
        icon: 'none'
      })
      return
    }

    const wordList = wx.getStorageSync('wordbook') || []
    let addedCount = 0

    this.data.result.words.forEach(word => {
      const wordData = {
        word: word.word,
        phonetic: word.phonetic,
        definition: word.definition,
        translation: word.translation,
        examples: [word.example],
        addTime: new Date().getTime(),
        source: 'thematic',
        topic: this.data.result.topic,
        difficulty: word.difficulty,
        targetDifficulty: this.data.result.targetDifficulty
      }

      // 检查是否已存在
      const exists = wordList.some(item => item.word.toLowerCase() === word.word.toLowerCase())
      if (!exists) {
        wordList.push(wordData)
        addedCount++
      }
    })

    wx.setStorageSync('wordbook', wordList)
    
    if (addedCount > 0) {
      wx.showToast({
        title: `成功添加${addedCount}个单词`,
        icon: 'success'
      })
    } else {
      wx.showToast({
        title: '所有单词已在生词本中',
        icon: 'none'
      })
    }
  },

  // 清空结果，重新生成
  clearResult() {
    this.setData({
      result: null,
      filteredWords: [],
      selectedDifficulty: 'all'
    })
  }
}) 