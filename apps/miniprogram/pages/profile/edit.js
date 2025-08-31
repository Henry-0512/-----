// pages/profile/edit.js
const { storage } = require('../../utils/request.js')

Page({
  data: {
    nickname: '',
    birthday: '',
    phone: '',
    email: ''
  },

  onLoad() {
    try {
      const user = storage.get('user') || {}
      const profile = storage.get('user_profile') || {}
      this.setData({
        nickname: user.nickname || profile.nickname || '',
        birthday: profile.birthday || '',
        phone: user.phone || profile.phone || '',
        email: profile.email || ''
      })
    } catch (e) {}
  },

  onNickInput(e) { this.setData({ nickname: e.detail.value }) },
  onBirthChange(e) { this.setData({ birthday: e.detail.value }) },
  onPhoneInput(e) { this.setData({ phone: e.detail.value }) },
  onEmailInput(e) { this.setData({ email: e.detail.value }) },

  onSave() {
    const { nickname, birthday, phone, email } = this.data
    // 简单校验
    if (!nickname) { wx.showToast({ title: '请输入昵称', icon: 'none' }); return }
    if (phone && !/^\d{11}$/.test(phone)) { wx.showToast({ title: '手机号格式不对', icon: 'none' }); return }
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { wx.showToast({ title: '邮箱格式不对', icon: 'none' }); return }

    try {
      // 保存资料
      storage.set('user_profile', { nickname, birthday, phone, email })
      // 同步基础user（昵称/手机号）
      const user = storage.get('user') || {}
      storage.set('user', { ...user, nickname, phone })
      wx.showToast({ title: '已保存', icon: 'success' })
      setTimeout(() => wx.navigateBack(), 500)
    } catch (e) {
      wx.showToast({ title: '保存失败', icon: 'none' })
    }
  }
})


