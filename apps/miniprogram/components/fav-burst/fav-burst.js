const T = require('../../styles/tokens.js')
Component({
  data:{ T, scale:0.6, opacity:0, _timer:null },
  methods:{
    boom(){
      clearTimeout(this.data._timer)
      this.setData({ scale:1.2, opacity:1 })
      this.data._timer = setTimeout(()=> this.setData({ scale:0.6, opacity:0 }), 600)
    }
  }
})


