const T = require('../../styles/tokens.js')

Component({
  data:{ T, visible:false, title:'', subtitle:'', actionText:'', type:'info', icon:'', offsetY:-120, safeTop: 8, _timer:null, _onAction:null },
  methods:{
    show({ title='', subtitle='', actionText='', type='info', icon='', onAction=null, duration=2400 }={}){
      this.setData({ visible:true, title, subtitle, actionText, type, icon, offsetY:0 })
      this.data._onAction = typeof onAction==='function' ? onAction : null
      clearTimeout(this.data._timer)
      this.data._timer = setTimeout(()=> this.hide(), duration)
    },
    hide(){ this.setData({ offsetY:-120 }); setTimeout(()=> this.setData({ visible:false }), T.outMs) },
    onAction(){ if(this.data._onAction) this.data._onAction(); this.hide() }
  }
})


