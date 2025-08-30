// pages/policy/policy.js
const { track, TrackEvents } = require('../../utils/track.js')
const { safeText } = require('../../utils/safe-text.js')

Page({
  data: {
    policyType: 'terms', // 'terms' | 'privacy'
    pageTitle: '服务条款',
    
    termsContent: {
      title: '家具使用服务条款',
      lastUpdated: '2024年8月30日',
      sections: [
        {
          title: '1. 服务概述',
          content: '本平台为用户提供家具使用服务，包括家具选择、到家协助、安装服务等。用户通过本平台可以灵活选择使用期限，享受优质的家居解决方案。'
        },
        {
          title: '2. 使用规则',
          content: '用户需按照约定的使用期限使用家具，保持家具的良好状态。使用期间如有损坏，需要承担相应的维护费用。'
        },
        {
          title: '3. 费用说明',
          content: '使用费按照选择的期限计算，包括基础使用费和可选的增值服务费。服务保证金在使用期结束后无损退还。'
        },
        {
          title: '4. 到家协助',
          content: '我们为Durham及周边地区提供到家协助服务。Newcastle和Sunderland地区预计2-3天送达，Durham地区当天或隔天送达。'
        },
        {
          title: '5. 安装服务',
          content: '提供专业的白手套安装服务，包括家具摆放、组装和调试。安装服务需要额外收费，具体费用在下单时显示。'
        },
        {
          title: '6. 用户责任',
          content: '用户需要妥善保管使用的家具，避免人为损坏。如需提前结束使用，请提前7天通知我们。'
        },
        {
          title: '7. 服务保障',
          content: '我们承诺提供优质的家具和专业的服务。如有任何问题，请及时联系我们的服务顾问。'
        },
        {
          title: '8. 争议解决',
          content: '如有争议，双方应友好协商解决。协商不成的，可通过法律途径解决。'
        }
      ]
    },
    
    privacyContent: {
      title: '隐私政策',
      lastUpdated: '2024年8月30日',
      sections: [
        {
          title: '1. 信息收集',
          content: '我们收集您的基本信息（如微信openid）、使用偏好、地址信息等，用于提供更好的服务体验。'
        },
        {
          title: '2. 信息使用',
          content: '收集的信息仅用于订单处理、服务提供、用户支持等目的，不会用于其他商业用途。'
        },
        {
          title: '3. 信息保护',
          content: '我们采用行业标准的安全措施保护您的个人信息，包括数据加密、访问控制等。'
        },
        {
          title: '4. 信息共享',
          content: '我们不会向第三方出售、交易或转让您的个人信息，除非获得您的明确同意或法律要求。'
        },
        {
          title: '5. Cookie使用',
          content: '我们使用本地存储技术改善用户体验，包括保存登录状态、偏好设置等。'
        },
        {
          title: '6. 用户权利',
          content: '您有权查看、修改或删除您的个人信息。如需行使这些权利，请联系我们的服务顾问。'
        },
        {
          title: '7. 政策更新',
          content: '我们可能会不时更新本隐私政策。重大变更时，我们会通过适当方式通知您。'
        },
        {
          title: '8. 联系我们',
          content: '如对本隐私政策有任何疑问，请通过应用内联系方式与我们联系。'
        }
      ]
    }
  },

  onLoad(options) {
    const { type = 'terms' } = options
    
    this.setData({
      policyType: type,
      pageTitle: type === 'privacy' ? '隐私政策' : '服务条款'
    })
    
    // 设置导航栏标题
    wx.setNavigationBarTitle({
      title: this.data.pageTitle
    })
    
    // 追踪政策页面访问
    track(TrackEvents.PAGE_VIEW, {
      page: 'policy',
      type: type,
      source: 'about_page'
    })
  },

  /**
   * 分享政策页面
   */
  onShareAppMessage() {
    const { policyType, pageTitle } = this.data
    
    track('policy_share', {
      type: policyType,
      source: 'share_button'
    })
    
    return {
      title: `${pageTitle} - 家具使用服务`,
      path: `/pages/policy/policy?type=${policyType}`
    }
  },

  /**
   * 联系客服
   */
  onContactService() {
    track('contact_from_policy', {
      policyType: this.data.policyType,
      source: 'policy_page'
    })
    
    wx.makePhoneCall({
      phoneNumber: '400-888-6666',
      fail: (error) => {
        wx.showToast({
          title: '拨打失败，请稍后重试',
          icon: 'none'
        })
      }
    })
  }
})
