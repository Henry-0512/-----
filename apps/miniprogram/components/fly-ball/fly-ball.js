const T = require('../../styles/tokens.js')
Component({
  data:{ show:false, x:0, y:0, dx:0, dy:0, scale:1, T },
  methods:{
    launch({ fromSelector, toSelector, duration=600 }){
      const query = this.createSelectorQuery()
      query.select(fromSelector).boundingClientRect()
      query.select(toSelector).boundingClientRect()
      query.exec(res=>{
        const from = res[0], to = res[1]
        if(!from || !to) return
        const startX = from.left + from.width/2
        const startY = from.top + from.height/2
        const endX = to.left + to.width/2
        const endY = to.top + to.height/2
        this.setData({ show:true, x:startX, y:startY, dx:0, dy:0, scale:1 })
        const frames = 30, dt = duration/frames
        let i=0
        const timer = setInterval(()=>{
          i++
          const t = i/frames
          const ease = t*t*(3-2*t) // smoothstep
          this.setData({ dx:(endX-startX)*ease, dy:(endY-startY)*ease, scale:1-0.3*ease })
          if(i>=frames){ clearInterval(timer); this.setData({ show:false }) }
        }, dt)
      })
    }
  }
})


