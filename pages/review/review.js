Page({
  data: {
    wordList: [],
    currentWord: null,
    currentIndex: 0,
    totalWords: 0,
    score: 0,
    showAnswer: false
  },

  onShow() {
    this.loadWords()
  },

  loadWords() {
    const wordList = wx.getStorageSync('wordbook') || []
    if (wordList.length > 0) {
      // 随机打乱单词顺序
      const shuffledList = this.shuffleArray([...wordList])
      this.setData({
        wordList: shuffledList,
        currentWord: shuffledList[0],
        currentIndex: 0,
        totalWords: shuffledList.length,
        score: 0,
        showAnswer: false
      })
    } else {
      this.setData({
        wordList: [],
        currentWord: null,
        currentIndex: 0,
        totalWords: 0,
        score: 0,
        showAnswer: false
      })
    }
  },

  // Fisher-Yates 洗牌算法
  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]]
    }
    return array
  },

  showAnswer() {
    this.setData({
      showAnswer: true
    })
  },

  markAsRight() {
    this.setData({
      score: this.data.score + 1
    })
    this.nextWord()
  },

  markAsWrong() {
    this.nextWord()
  },

  nextWord() {
    const nextIndex = this.data.currentIndex + 1
    if (nextIndex < this.data.wordList.length) {
      this.setData({
        currentIndex: nextIndex,
        currentWord: this.data.wordList[nextIndex],
        showAnswer: false
      })
    } else {
      // 复习完成
      wx.showModal({
        title: '复习完成',
        content: `本次得分：${this.data.score}/${this.data.totalWords}`,
        showCancel: false,
        success: () => {
          this.loadWords() // 重新开始
        }
      })
    }
  }
}) 