// pages/intent/list.js
const { isMockEnabled } = require('../../config/env.js')
const { api, storage } = isMockEnabled() ? require('../../utils/request-mock.js') : require('../../utils/request.js')
const intent = require('../../utils/intent.js')

// TODO: 将模板ID替换为你在微信公众平台配置的订阅消息模板ID
const TEMPLATE_ID_INTENT = 'YOUR_WECHAT_SUBSCRIBE_TEMPLATE_ID'

Page({
  data: {
    items: [],
    submitting: false,
    contact: { name: '', phone: '', wechat: '', email: '', preferred: 'email' },
    contactErrors: { name: false, email: false, wechat: false }
  },

  onLoad(options) {
    const items = intent.get()
    // quick=1 时只保留最新一条（确保从 PDP 快速提交）
    if (options && options.quick === '1' && items.length > 1) {
      const latest = items[0]
      intent.set([latest])
      this.setData({ items: [latest] })
    } else {
      this.setData({ items })
    }
  },

  onShow() {
    this.setData({ items: intent.get() })
  },

  onContactInput(e) {
    const key = e.currentTarget.dataset.key
    const val = e.detail.value
    this.setData({ [`contact.${key}`]: val, [`contactErrors.${key}`]: false })
  },

  onPreferredChange(e) {
    const value = e.currentTarget.dataset.value
    this.setData({ 'contact.preferred': value })
  },

  onQtyStep(e) {
    const { id, step } = e.currentTarget.dataset
    intent.updateQty(id, parseInt(step) || 1)
    this.setData({ items: intent.get() })
  },

  onRemove(e) {
    const { id } = e.currentTarget.dataset
    intent.remove(id)
    this.setData({ items: intent.get() })
  },

  onClear() {
    wx.showModal({
      title: '清空意向单',
      content: '确定清空所有意向商品吗？',
      success: (res) => {
        if (res.confirm) {
          intent.set([])
          this.setData({ items: [] })
        }
      }
    })
  },

  async onSubmit() {
    const items = intent.get()
    if (items.length === 0) {
      wx.showToast({ title: '请先添加商品', icon: 'none' })
      return
    }
    // 校验：名称必填；邮箱与微信至少填一项
    const { name, phone, wechat, email, preferred } = this.data.contact
    const nameMissing = !name || !String(name).trim()
    const emailMissing = !email || !String(email).trim()
    const wechatMissing = !wechat || !String(wechat).trim()

    if (nameMissing || (emailMissing && wechatMissing)) {
      this.setData({
        'contactErrors.name': nameMissing,
        'contactErrors.email': emailMissing && wechatMissing,
        'contactErrors.wechat': emailMissing && wechatMissing
      })
      wx.showToast({ title: nameMissing ? '请填写称呼' : '请填写邮箱或微信号（至少一项）', icon: 'none' })
      return
    }
    this.setData({ submitting: true })

    try {
      const user = storage.get('user') || {}
      const openid = user.openid || storage.get('client_id') || ''
      // 1) 申请订阅消息
      let subscribeAccepted = false
      if (TEMPLATE_ID_INTENT && TEMPLATE_ID_INTENT !== 'YOUR_WECHAT_SUBSCRIBE_TEMPLATE_ID') {
        try {
          const subRes = await new Promise((resolve) => {
            wx.requestSubscribeMessage({ tmplIds: [TEMPLATE_ID_INTENT], success: resolve, fail: resolve })
          })
          subscribeAccepted = (subRes && subRes[TEMPLATE_ID_INTENT] === 'accept')
        } catch (_) {}
      }

      // 2) 组装意向单数据（附带订阅意向，供后端发送消息时使用）
      const payload = {
        openid,
        items,
        createdAt: new Date().toISOString(),
        contact: { name, phone, wechat, email, preferred },
        subscribe: {
          template_id: TEMPLATE_ID_INTENT,
          accepted: subscribeAccepted,
          // 供后端发送消息的占位数据（字段名需与你的模板匹配后端再映射）
          data: {
            thing1: { value: (items[0] && items[0].title) ? items[0].title.slice(0,20) : '家具意向提交' },
            date2: { value: new Date().toLocaleString() },
            thing3: { value: `共${items.length}件，数量小计${items.reduce((s,i)=>s+(i.qty||1),0)}` }
          }
        }
      }
      const res = await api.submitIntentOrder(payload)
      if (res && res.success) {
        intent.set([])
        wx.redirectTo({ url: '/pages/intent/success' })
      } else {
        wx.showToast({ title: '提交失败，稍后可在意向单查看', icon: 'none' })
      }
    } catch (e) {
      wx.showToast({ title: '提交失败，稍后可在意向单查看', icon: 'none' })
    } finally {
      this.setData({ submitting: false })
    }
  },

  onGoHome() {
    wx.switchTab({ url: '/pages/index/index' })
  }
})


