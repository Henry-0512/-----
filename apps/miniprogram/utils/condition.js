function _hash(s=''){ let h=0; for (let i=0;i<s.length;i++) h=(h*31 + s.charCodeAt(i))>>>0; return h }
function pickSample(seed){
  const r = _hash(seed)%10
  if (r < 4)  return '九五新'  // 40%
  if (r < 7)  return '全新'    // 30%
  return '九成新'              // 30%
}
function deriveConditionText(item){
  const c = item && item.condition
  // 字符串：直接用
  if (typeof c === 'string' && c.trim()) return c.trim()
  // 对象：常见 key 尝试
  if (c && typeof c === 'object'){
    const t = c.label || c.text || c.name || c.title
    if (typeof t === 'string' && t.trim()) return t.trim()
  }
  // 没有就给个稳定样本
  const seed = (item && (item.id || item.sku || item.title || '')) + ''
  return pickSample(seed)
}
module.exports = { deriveConditionText }
