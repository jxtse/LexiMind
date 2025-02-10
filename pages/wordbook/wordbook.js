Page({
  data: {
    wordList: []
  },

  onShow() {
    // 每次显示页面时刷新单词列表
    this.loadWordList()
  },

  loadWordList() {
    const wordList = wx.getStorageSync('wordbook') || []
    
    // 格式化添加时间
    const formattedList = wordList.map(word => ({
      ...word,
      addTimeStr: this.formatTime(word.addTime)
    })).reverse() // 最新添加的显示在前面

    this.setData({
      wordList: formattedList
    })
  },

  // 格式化时间
  formatTime(timestamp) {
    const date = new Date(timestamp)
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    const hour = date.getHours().toString().padStart(2, '0')
    const minute = date.getMinutes().toString().padStart(2, '0')
    return `${year}-${month}-${day} ${hour}:${minute}`
  },

  // 删除单词
  deleteWord(e) {
    const { index } = e.currentTarget.dataset
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个单词吗？',
      success: (res) => {
        if (res.confirm) {
          const wordList = this.data.wordList
          wordList.splice(index, 1)
          wx.setStorageSync('wordbook', wordList)
          this.setData({ wordList })
          
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          })
        }
      }
    })
  },

  onShareTimeline: function() {
    return {
      title: 'LexiMind生词本 - 智能管理你的词汇',
      query: '',
      imageUrl: '/images/share-timeline.png'
    }
  },

  onShareAppMessage: function () {
    return {
      title: 'LexiMind生词本',
      path: '/pages/wordbook/wordbook'
    }
  }
}) 