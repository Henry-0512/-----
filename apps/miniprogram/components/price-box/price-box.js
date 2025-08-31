const pricing = require('../../utils/pricing.js')

Component({
  properties:{
    msrp: { type: Number, value: 100 },
    tier: { type: String, value: 'mid' },
    months: { type: Number, value: 1 },
    useWaiver: { type: Boolean, value: false },
    title: { type: String, value: '' },
    orderAmountForShipping: { type: Number, value: null }
  },
  data:{
    tenureOptions: [1,2,3,6,12],
    tenureIndex: 0,
    offer: {}
  },
  lifetimes:{
    attached(){ this.recalc() }
  },
  observers:{
    'msrp, tier, months, useWaiver, orderAmountForShipping': function(){ this.recalc() }
  },
  methods:{
    recalc(){
      const offer = pricing.computeOffer({
        msrp: this.data.msrp,
        tier: this.data.tier,
        months: this.data.months,
        useWaiver: this.data.useWaiver,
        orderAmountForShipping: this.data.orderAmountForShipping
      })
      this.setData({ offer })
      this.triggerEvent('change', offer)
    },
    onPickTenure(e){
      const idx = Number(e.detail.value || 0)
      this.setData({ tenureIndex: idx, months: this.data.tenureOptions[idx] })
      this.recalc()
    },
    toggleWaiver(e){
      this.setData({ useWaiver: !!e.detail.value })
      this.recalc()
    }
  }
})


