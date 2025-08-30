// components/category-card/category-card.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    item: {
      type: Object,
      value: {}
    }
  },

  /**
   * 组件的初始数据
   */
  data: {

  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 点击卡片
     */
    onTap() {
      const { item } = this.properties
      this.triggerEvent('cardtap', {
        item: item,
        id: item.id
      })
    }
  }
})
