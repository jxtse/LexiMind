const { generateThematicWords } = require('../../utils/thematicWords.js')

const getDifficultyCopy = (level) => {
  if (level <= 3) {
    return '偏日常表达，适合快速建立场景词汇'
  }

  if (level <= 7) {
    return '偏进阶表达，兼顾准确性和实用性'
  }

  return '偏专业表达，加入更高阶或学术化词汇'
}

Page({
  data: {
    inputTopic: '',
    loading: false,
    result: null,
    difficultyLevel: 5,
    difficultyHint: getDifficultyCopy(5),
    filteredWords: [],
    searchFocused: false
  },

  onShareTimeline() {
    return {
      title: 'LexiMind主题词汇生成器 - 根据场景学习英语词汇',
      query: '',
      imageUrl: '/images/share-timeline.png'
    }
  },

  onShareAppMessage() {
    return {
      title: 'LexiMind主题词汇生成器',
      path: '/pages/thematic/thematic'
    }
  },

  onPageScroll(e) {
    this.scrollTop = e.scrollTop
  },

  onTouchStart(e) {
    const touch = e.touches && e.touches[0]
    if (!touch) return

    this.touchStartX = touch.clientX
    this.touchStartY = touch.clientY
    this.pullReady = false
  },

  onTouchMove(e) {
    const touch = e.touches && e.touches[0]
    if (!touch || this.scrollTop > 40) return

    const deltaX = touch.clientX - this.touchStartX
    const deltaY = touch.clientY - this.touchStartY

    if (deltaY > 48 && Math.abs(deltaX) < 70) {
      this.pullReady = true
    }
  },

  onTouchEnd() {
    if (this.pullReady) {
      this.focusSearchFromPull()
    }

    this.pullReady = false
  },

  focusSearchFromPull() {
    wx.pageScrollTo({
      scrollTop: 0,
      duration: 180
    })

    this.setData({
      searchFocused: false
    })

    setTimeout(() => {
      this.setData({
        searchFocused: true
      })
    }, 80)

  },

  onSearchFocus() {
    this.setData({
      searchFocused: true
    })
  },

  onSearchBlur() {
    this.setData({
      searchFocused: false
    })
  },

  onKeyboardHeightChange(e) {
    if (e.detail.height === 0) {
      this.setData({
        searchFocused: false
      })
    }
  },

  onTopicInput(e) {
    this.setData({
      inputTopic: e.detail.value
    })
  },

  clearInput() {
    this.setData({
      inputTopic: '',
      result: null,
      filteredWords: []
    })
    this.focusSearchFromPull()
  },

  onDifficultyChanging(e) {
    this.updateDifficulty(e.detail.value)
  },

  onDifficultyChange(e) {
    this.updateDifficulty(e.detail.value)
  },

  updateDifficulty(value) {
    const level = Math.max(1, Math.min(10, Number(value) || 5))

    this.setData({
      difficultyLevel: level,
      difficultyHint: getDifficultyCopy(level)
    })
  },

  async generateWords() {
    const topic = this.data.inputTopic.trim()

    if (!topic) {
      wx.showToast({
        title: '请输入主题',
        icon: 'none'
      })
      this.focusSearchFromPull()
      return
    }

    this.setData({
      loading: true,
      result: null,
      filteredWords: []
    })

    wx.showLoading({
      title: 'AI生成中...',
      mask: true
    })

    try {
      const result = await generateThematicWords(topic, this.data.difficultyLevel)

      result.targetDifficultyLevel = result.targetDifficultyLevel || this.data.difficultyLevel

      this.setData({
        result,
        filteredWords: result.words
      })

      wx.showToast({
        title: `生成${result.words.length}个词`,
        icon: 'success'
      })
    } catch (error) {
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

  addToWordbook(e) {
    const word = e.currentTarget.dataset.word

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
      difficultyLevel: word.difficultyLevel || this.data.result.targetDifficultyLevel,
      targetDifficultyLevel: this.data.result.targetDifficultyLevel
    }

    const wordList = wx.getStorageSync('wordbook') || []
    const exists = wordList.some((item) => item.word.toLowerCase() === word.word.toLowerCase())

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

    this.data.result.words.forEach((word) => {
      const exists = wordList.some((item) => item.word.toLowerCase() === word.word.toLowerCase())

      if (!exists) {
        wordList.push({
          word: word.word,
          phonetic: word.phonetic,
          definition: word.definition,
          translation: word.translation,
          examples: [word.example],
          addTime: new Date().getTime(),
          source: 'thematic',
          topic: this.data.result.topic,
          difficulty: word.difficulty,
          difficultyLevel: word.difficultyLevel || this.data.result.targetDifficultyLevel,
          targetDifficultyLevel: this.data.result.targetDifficultyLevel
        })
        addedCount++
      }
    })

    wx.setStorageSync('wordbook', wordList)

    wx.showToast({
      title: addedCount > 0 ? `添加${addedCount}个词` : '单词已在生词本中',
      icon: addedCount > 0 ? 'success' : 'none'
    })
  },

  clearResult() {
    this.setData({
      result: null,
      filteredWords: []
    })
    this.focusSearchFromPull()
  }
})
