// pages/my/my.js
const { api, storage } = require('../../utils/request.js')

Page({
  data: {
    user: {
      loggedIn: false,
      nickname: '',
      phone: ''
    }
  },
  
  // 选择微信头像（或相册头像）
  onChooseAvatar(e) {
    if (this.choosingAvatar) return
    this.choosingAvatar = true
    try {
      const avatarUrl = e.detail.avatarUrl
      if (avatarUrl) {
        const user = { ...(this.data.user || {}), avatar: avatarUrl, loggedIn: !!(this.data.user && this.data.user.openid) }
        storage.set('user', user)
        const needComplete = !!user.loggedIn && (!user.avatar || !user.nickname)
        this.setData({ user, showCompleteTip: needComplete })
      }
    } catch (err) {
      wx.showToast({ title: '设置头像失败', icon: 'none' })
    }
    setTimeout(() => { this.choosingAvatar = false }, 500)
  },

  onShow() {
    try {
      const user = storage.get('user') || {}
      // 为每个访问者准备一个稳定的本地ID（即便未登录），并做旧ID迁移
      const normalized = this.normalizeOpenId(user.openid)
      if (!user || !user.openid) {
        const clientId = storage.get('client_id') || this.generateLocalId()
        storage.set('client_id', clientId)
        const patched = {
          openid: normalized || clientId,
          nickname: user.nickname || '微信用户',
          avatar: user.avatar || '',
          phone: user.phone || ''
        }
        storage.set('user', patched)
        this.setData({ user: { loggedIn: false, ...patched } })
      } else {
        // 如果旧格式ID不符合新规则，则生成并替换
        if (user.openid !== normalized) {
          const updated = { ...user, openid: normalized }
          storage.set('user', updated)
          storage.set('client_id', normalized)
          this.setData({ user: { loggedIn: !!updated.openid && !!updated.loggedIn, nickname: updated.nickname, phone: updated.phone, avatar: updated.avatar, openid: updated.openid } })
        } else {
          this.setData({ user: { loggedIn: !!user.openid && !!user.loggedIn, nickname: user.nickname, phone: user.phone, avatar: user.avatar, openid: user.openid } })
        }
      }
    } catch (e) {
      // ignore
    }
  },

  async onLogin() {
    try {
      // 1) 获取微信登录code
      const loginRes = await new Promise((resolve, reject) => {
        wx.login({
          timeout: 8000,
          success: resolve,
          fail: reject
        })
      })
      const code = loginRes.code
      if (!code) throw new Error('获取code失败')

      // 2) 发送到后端换取openid（已在request.js中封装）
      const res = await api.code2session(code)
      const { openid = '', nickname = '微信用户', avatar = '', phone = '' } = res.data || {}

      // 3) 持久化并更新UI
      const user = { openid, nickname, avatar, phone, loggedIn: true }
      storage.set('user', user)
      this.setData({ user: { loggedIn: true, ...user } })
      wx.showToast({ title: '登录成功', icon: 'success' })
    } catch (e) {
      // 后端不可用或网络错误时，生成本地ID保证可用性
      const localId = this.generateLocalId()
      const user = { openid: localId, nickname: '访客用户', avatar: this.data.user.avatar || '', phone: '', loggedIn: true }
      storage.set('client_id', localId)
      storage.set('user', user)
      this.setData({ user })
      wx.showToast({ title: '已使用本地ID登录', icon: 'none' })
    }
  },

  // 生成本地唯一ID
  generateLocalId() {
    const d = new Date()
    const pad = (n) => (n < 10 ? '0' + n : '' + n)
    const yyyy = d.getFullYear()
    const mm = pad(d.getMonth() + 1)
    const dd = pad(d.getDate())
    const HH = pad(d.getHours())
    const MM = pad(d.getMinutes())
    const rand = Math.floor(Math.random() * 9000 + 1000) // 4位随机数
    // 规则：guest-YYYYMMDD-HHMM-XXXX（更易读、便于筛选聚合）
    return `guest-${yyyy}${mm}${dd}-${HH}${MM}-${rand}`
  },

  // 规范化/迁移 openid：将 mock_openid_ / local_ 等旧式ID迁移为新规则
  normalizeOpenId(openid) {
    const pattern = /^guest-\d{8}-\d{4}-\d{4}$/
    if (pattern.test(openid)) return openid
    // 为空或旧前缀则生成新ID
    if (!openid || /^mock_openid_|^local_/.test(openid)) {
      return this.generateLocalId()
    }
    // 其它自带openid（真实后端返回）保持不变
    return openid
  },

  go(e) {
    const url = e.currentTarget.dataset.url
    if (!url) return
    // tabBar页用switchTab，其它用navigateTo
    if (['/pages/index/index', '/pages/category/category', '/pages/cart/cart', '/pages/my/my'].includes(url)) {
      wx.switchTab({ url })
    } else {
      wx.navigateTo({ url })
    }
  },

  goAuth() {
    const { user } = this.data
    if (!user || !user.loggedIn) {
      this.onLogin()
      return
    }
    wx.navigateTo({ url: '/pages/auth/security' })
  },

  onLogout() {
    try {
      storage.remove('user')
    } catch (e) {}
    this.setData({ user: { loggedIn: false } })
    wx.showToast({ title: '已退出', icon: 'none' })
  }
})


