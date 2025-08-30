// pages/about/about.js
const { track, TrackEvents } = require('../../utils/track.js')

Page({
  data: {
    appInfo: {
      name: '家具租赁',
      version: '1.0.0',
      description: '专业的家具使用服务平台，为您提供优质的家居解决方案',
      company: 'Durham Furniture Services Ltd.',
      founded: '2024',
      mission: '让优质家具触手可及，为每个家庭创造美好生活空间'
    },
    
    features: [
      {
        icon: '🛋️',
        title: '精选家具',
        description: '严选优质品牌，确保每件家具的品质与美观'
      },
      {
        icon: '🚚',
        title: '到家协助',
        description: 'Durham及周边地区快速到家协助服务'
      },
      {
        icon: '🔧',
        title: '专业安装',
        description: '提供专业的白手套安装和摆放服务'
      },
      {
        icon: '💰',
        title: '灵活费用',
        description: '周度或月度使用费，灵活选择适合的使用期限'
      },
      {
        icon: '📱',
        title: '便捷管理',
        description: '手机下单，在线管理，随时查看使用状态'
      },
      {
        icon: '🛡️',
        title: '服务保障',
        description: '完善的服务保证金制度，保障双方权益'
      }
    ],
    
    contactInfo: {
      phone: '400-888-6666',
      email: 'service@furniture-durham.co.uk',
      address: 'Durham Business Park, Durham, DH1 2AB, UK',
      workTime: '周一至周日 9:00-21:00',
      website: 'https://furniture-durham.co.uk'
    },
    
    socialMedia: [
      { platform: '微信公众号', account: 'DurhamFurniture' },
      { platform: '客服微信', account: 'furniture_service' },
      { platform: '官方网站', account: 'furniture-durham.co.uk' }
    ]
  },

  onLoad() {
    // 追踪关于页面访问
    track(TrackEvents.PAGE_VIEW, {
      page: 'about',
      source: 'profile_menu'
    })
  },

  /**
   * 拨打客服电话
   */
  onCallService() {
    const { phone } = this.data.contactInfo
    
    wx.makePhoneCall({
      phoneNumber: phone,
      success: () => {
        track('contact_phone_call', {
          phone,
          source: 'about_page'
        })
      },
      fail: (error) => {
        console.error('拨打电话失败:', error)
        wx.showToast({
          title: '拨打失败，请稍后重试',
          icon: 'none'
        })
      }
    })
  },

  /**
   * 复制联系信息
   */
  onCopyContact(e) {
    const { type } = e.currentTarget.dataset
    const { contactInfo } = this.data
    
    let copyText = ''
    switch (type) {
      case 'phone':
        copyText = contactInfo.phone
        break
      case 'email':
        copyText = contactInfo.email
        break
      case 'address':
        copyText = contactInfo.address
        break
      default:
        return
    }
    
    wx.setClipboardData({
      data: copyText,
      success: () => {
        wx.showToast({
          title: '已复制到剪贴板',
          icon: 'success'
        })
        
        track('contact_copy', {
          type,
          content: copyText,
          source: 'about_page'
        })
      }
    })
  },

  /**
   * 查看服务条款
   */
  onViewPolicy() {
    track('policy_access', {
      source: 'about_page',
      type: 'service_terms'
    })
    
    wx.navigateTo({
      url: '/pages/policy/policy?type=terms'
    })
  },

  /**
   * 查看隐私政策
   */
  onViewPrivacy() {
    track('policy_access', {
      source: 'about_page',
      type: 'privacy_policy'
    })
    
    wx.navigateTo({
      url: '/pages/policy/policy?type=privacy'
    })
  },

  /**
   * 分享应用
   */
  onShareApp() {
    track('app_share', {
      source: 'about_page',
      method: 'manual_trigger'
    })
    
    return {
      title: '家具使用服务 - 让优质家具触手可及',
      path: '/pages/index/index',
      imageUrl: '/images/share-home.png'
    }
  }
})
