const { translateWord } = require('../../utils/translator.js')

Page({
  data: {
    searchWord: '',
    wordResult: null
  },

  // 修改输入框内容变化的处理函数
  onInputChange(e) {
    this.setData({
      searchWord: e.detail.value
    })
  },

  // 查询单词
  async searchWord() {
    if (!this.data.searchWord) {
      wx.showToast({
        title: '请输入单词',
        icon: 'none'
      })
      return
    }
    
    wx.showLoading({
      title: '查询中...',
      mask: true
    })
    
    try {
      console.log('开始查询单词:', this.data.searchWord) // 添加调试日志
      const result = await translateWord(this.data.searchWord)
      console.log('查询结果:', result) // 添加调试日志
      
      this.setData({
        wordResult: result
      })
    } catch (error) {
      console.error('查询出错:', error) // 添加调试日志
      wx.showToast({
        title: error.message || '查询失败，请稍后重试',
        icon: 'none',
        duration: 2000
      })
    } finally {
      wx.hideLoading()
    }
  },

  // 添加到生词本
  addToWordbook() {
    if (!this.data.wordResult) return
    
    const wordList = wx.getStorageSync('wordbook') || []
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
  }
}) 