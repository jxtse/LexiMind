const CLOUD_ENV_ID = 'leximind-d8gbt86zs20f2de28'

App({
  onLaunch() {
    if (wx.cloud && CLOUD_ENV_ID) {
      wx.cloud.init({
        env: CLOUD_ENV_ID,
        traceUser: true
      })
    }
  },

  globalData: {}
})
