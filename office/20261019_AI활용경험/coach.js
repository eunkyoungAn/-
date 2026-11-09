// 커리어캐쳐 코치 캐릭터 (안은경 코치 사진 참고: 낮게 묶은 머리, 옆으로 흐르는 앞머리, 회색 더블 재킷, 흰 블라우스)
const arm=(d)=>`<path d="${d}" stroke="#8E8E93" stroke-width="30" fill="none" stroke-linecap="round"/>`;
const hand=(x,y)=>`<circle cx="${x}" cy="${y}" r="15" fill="#FBE3D6"/>`;
function catchy(pose='mitt',s=1){return `<svg viewBox="0 0 300 330" width="${300*s}" height="${330*s}">
<ellipse cx="150" cy="318" rx="95" ry="10" fill="rgba(0,0,0,.15)"/>
<!-- 뒷머리(묶은 머리) -->
<ellipse cx="150" cy="100" rx="78" ry="80" fill="#2A1F1D"/><ellipse cx="208" cy="168" rx="20" ry="28" fill="#2A1F1D"/>
<!-- 몸: 회색 더블 재킷 -->
<path d="M70 320 Q66 230 105 205 L195 205 Q234 230 230 320 Z" fill="#8E8E93"/>
<path d="M128 205 L150 262 L172 205 Z" fill="#fff"/>
<path d="M118 205 L150 280 L132 300 M182 205 L150 280" stroke="#6E6E73" stroke-width="5" fill="none"/>
<circle cx="138" cy="292" r="5" fill="#3a3a3c"/><circle cx="168" cy="278" r="5" fill="#3a3a3c"/><circle cx="168" cy="304" r="5" fill="#3a3a3c"/>
<!-- 목·얼굴 -->
<rect x="137" y="180" width="26" height="30" fill="#FBE3D6"/>
<ellipse cx="150" cy="125" rx="64" ry="68" fill="#FDEBE1"/>
<!-- 앞머리: 가르마 + 옆으로 흐르는 시스루 -->
<path d="M86 118 Q84 50 150 46 Q216 50 214 118 Q200 80 160 72 Q150 95 118 104 Q100 110 86 118Z" fill="#2A1F1D"/>
<path d="M118 104 Q108 130 98 150 M160 72 Q178 100 204 118" stroke="#2A1F1D" stroke-width="7" fill="none" stroke-linecap="round"/>
<!-- 눈(웃는 눈매)·볼·입 -->
<path d="M112 132 Q122 124 132 132" stroke="#2A1F1D" stroke-width="5" fill="none" stroke-linecap="round"/>
<path d="M168 132 Q178 124 188 132" stroke="#2A1F1D" stroke-width="5" fill="none" stroke-linecap="round"/>
<ellipse cx="110" cy="152" rx="11" ry="6" fill="#F7B3A8"/><ellipse cx="190" cy="152" rx="11" ry="6" fill="#F7B3A8"/>
<path d="M136 160 Q150 172 164 160" stroke="#D9576A" stroke-width="5" fill="#E57A86" stroke-linecap="round"/>
${pose==='mitt'?arm('M100 225 Q60 200 52 150')+hand(52,145)+`<path d="M52 92 l9 19 21 3 -15 14 4 21 -19 -10 -19 10 4 -21 -15 -14 21 -3z" fill="#FFD23F" stroke="#E0A800" stroke-width="3"/>`+arm('M200 225 Q228 260 226 300')+hand(226,302)
:pose==='point'?arm('M100 225 Q78 265 80 300')+hand(80,302)+arm('M200 222 Q246 190 262 140')+hand(264,134)
:arm('M100 222 Q58 190 52 130')+hand(52,124)+arm('M200 222 Q242 190 248 130')+hand(248,124)}
</svg>`}
module.exports={catchy};
