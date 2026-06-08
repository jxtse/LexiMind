const { translateWord } = require('../../utils/translator.js')

Page({
  data: {
    searchWord: '',
    wordResult: null,
    searchFocused: false
  },

  onShareTimeline() {
    return {
      title: 'LexiMind智能词典 - AI驱动的英语学习助手',
      query: '',
      imageUrl: '/images/share-timeline.png'
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

  onInputChange(e) {
    this.setData({
      searchWord: e.detail.value
    })
  },

  async searchWord() {
    const word = this.data.searchWord.trim()

    if (!word) {
      wx.showToast({
        title: '请输入单词',
        icon: 'none'
      })
      this.focusSearchFromPull()
      return
    }

    wx.showLoading({
      title: '查询中...',
      mask: true
    })

    try {
      const result = await translateWord(word)

      this.setData({
        wordResult: result
      })
    } catch (error) {
      wx.showToast({
        title: error.message || '查询失败，请稍后重试',
        icon: 'none',
        duration: 2000
      })
    } finally {
      wx.hideLoading()
    }
  },

  addToWordbook() {
    if (!this.data.wordResult) return

    const wordList = wx.getStorageSync('wordbook') || []
    const exists = wordList.some((item) =>
      item.word.toLowerCase() === this.data.wordResult.word.toLowerCase()
    )

    if (exists) {
      wx.showToast({
        title: '该单词已在生词本中',
        icon: 'none'
      })
      return
    }

    wordList.push({
      ...this.data.wordResult,
      addTime: new Date().getTime()
    })

    wx.setStorageSync('wordbook', wordList)
    wx.showToast({
      title: '添加成功'
    })
  },

  clearInput() {
    this.setData({
      searchWord: '',
      wordResult: null
    })
    this.focusSearchFromPull()
  },

  onShareAppMessage() {
    return {
      title: 'LexiMind智能词典',
      path: '/pages/index/index'
    }
  }
})
