import{d as M,ad as O,o,c as l,e as s,a7 as G,a8 as L,G as y,H as h,g as S,v as r,t as i,i as z,x as u,L as N,n as m,_ as A}from"./index-BTXJ9gep.js";import{u as E}from"./agent-ClDHZzJ_.js";const F={class:"poster-page"},H={class:"two-col"},I={class:"config-panel card"},J={class:"field"},R={key:0,class:"topic-chips"},U=["onClick"],q={key:1,class:"topic-chips"},K=["onClick"],Q={class:"field"},W={class:"style-grid"},X=["onClick"],Y={class:"style-icon"},Z={class:"style-name"},ee={class:"style-desc"},se={class:"field"},te={class:"chip-group"},oe=["onClick"],le={class:"field"},ae={class:"chip-group"},ne=["onClick"],ie={class:"btn-row"},ce=["disabled"],de={key:0},re={key:1},ue=["disabled"],ve={class:"result-panel card"},pe={class:"result-header"},_e={class:"result-actions"},ye={key:0,class:"style-tag"},he={key:0,class:"result-empty"},me={key:1,class:"result-content text-area"},ke={key:0,class:"cursor-blink"},fe={key:1,class:"cursor-blink"},ge={key:2,class:"copy-toast"},be=`你是专业图文创作专家，擅长为不同平台设计图文内容方案。
你的输出是文字描述形式的图文内容脚本，包含：
- 画面/版式描述（布局、配色建议）
- 标题文案（主标题、副标题）
- 正文内容
- 配图说明（描述每张图的内容和风格）
- 发布建议（时间、标签、互动引导）
请根据指定风格输出详细的图文内容方案。`,Ce=M({__name:"Poster",setup(xe){const v=E(),c=u(""),k=u("小红书"),p=u("xiaohongshu"),f=u("清新活泼"),n=u(""),d=u(!1),g=u(!1),P=["小红书","抖音","微博","朋友圈","公众号"],b=[{key:"xiaohongshu",name:"小红书笔记风",icon:"📔",desc:"图文排版精美，种草感强"},{key:"poster",name:"大字报",icon:"📢",desc:"大字冲击力强，适合传播"},{key:"moments",name:"朋友圈",icon:"💬",desc:"轻松自然，引发共鸣"},{key:"promo",name:"宣传海报",icon:"🎯",desc:"专业品牌感，结构完整"}],j=["清新活泼","简约高级","国潮复古","科技感","温暖治愈","深色高冷"],x={xiaohongshu:`【小红书笔记风格】
排版要求：封面图吸睛+正文分段清晰+emoji点缀
格式：
🌟 封面设计建议：[描述封面图内容、配色、字体风格]
📝 标题方案：[3个标题备选]
✨ 正文内容：[分段落的图文内容，每段配图说明]
🏷️ 标签建议：[5-8个话题标签]
💡 互动钩子：[评论区引导语]`,poster:`【大字报风格】
排版要求：大字冲击、简洁有力、背景突出
格式：
🎯 主题大字：[核心词/金句，3-5字最佳]
📌 副标题：[补充说明，10-15字]
🖼️ 背景设计：[描述背景色彩、元素、氛围]
💥 视觉亮点：[特殊设计元素说明]
📤 传播建议：[适合哪些场景扩散]`,moments:`【朋友圈图文风格】
排版要求：真实自然、情感共鸣、引发互动
格式：
📸 配图建议：[1-9张图的内容描述]
✍️ 文案正文：[朋友圈文字内容，200字以内]
😊 情感触点：[能引发共鸣的细节]
💬 互动引导：[自然引出评论的结尾]`,promo:`【宣传海报风格】
排版要求：专业品牌感、信息层级清晰
格式：
🎨 整体设计方案：[版式、主色调、设计风格描述]
📣 主标题：[品牌/活动核心信息]
📋 副标题+正文要点：[3-5条核心卖点]
🔴 CTA按钮文案：[行动号召语]
📐 尺寸规格建议：[适合各平台的尺寸]
🌈 配色方案：[主色+辅色+文字色]`},T=N(()=>{const a=[],t=new Set,e=v.trendingData||v.trending;for(const _ of Object.values(e))for(const C of _)t.has(C.title)||(t.add(C.title),a.push(C.title));return a}),V=N(()=>b.find(a=>a.key===p.value)?.name||"");O(()=>{v.selectedTopics.length>0&&(c.value=v.selectedTopics[0]||"")});function $(a){c.value=a}function B(){const a=x[p.value]||x.xiaohongshu,t=b.find(e=>e.key===p.value)?.name||"图文内容";return`请为【${k.value}】平台生成一套${t}内容方案。

话题主题：${c.value}
色调风格：${f.value}

${a}

请按照上述格式输出完整的图文内容方案，内容要具体可执行，文案要符合${k.value}平台调性。`}async function w(){d.value=!0,n.value="";try{const t=await(await fetch("/api/ai-chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:[{role:"user",content:B()}],systemPrompt:be})})).json();n.value=t.content?.[0]?.text||""}finally{d.value=!1}}async function D(){await navigator.clipboard.writeText(n.value),g.value=!0,setTimeout(()=>{g.value=!1},2e3)}return(a,t)=>(o(),l("div",F,[t[8]||(t[8]=s("div",{class:"page-title"},"图文海报",-1)),s("div",H,[s("div",I,[s("div",J,[t[2]||(t[2]=s("label",{class:"field-label"},"话题 / 主题",-1)),G(s("textarea",{"onUpdate:modelValue":t[0]||(t[0]=e=>c.value=e),class:"field-textarea text-area",rows:"2",placeholder:"输入话题或从热搜选择..."},null,512),[[L,c.value]]),T.value.length>0?(o(),l("div",R,[t[1]||(t[1]=s("div",{class:"chips-label"},"从热搜选择：",-1)),(o(!0),l(y,null,h(T.value.slice(0,10),e=>(o(),l("span",{key:e,class:m(["topic-chip",{active:c.value.includes(e)}]),onClick:_=>$(e)},i(e),11,U))),128))])):S(v).selectedTopics.length>0?(o(),l("div",q,[(o(!0),l(y,null,h(S(v).selectedTopics,e=>(o(),l("span",{key:e,class:m(["topic-chip",{active:c.value.includes(e)}]),onClick:_=>$(e)},i(e),11,K))),128))])):r("",!0)]),s("div",Q,[t[3]||(t[3]=s("label",{class:"field-label"},"图文风格",-1)),s("div",W,[(o(),l(y,null,h(b,e=>s("div",{key:e.key,class:m(["style-card",{active:p.value===e.key}]),onClick:_=>p.value=e.key},[s("div",Y,i(e.icon),1),s("div",Z,i(e.name),1),s("div",ee,i(e.desc),1)],10,X)),64))])]),s("div",se,[t[4]||(t[4]=s("label",{class:"field-label"},"发布平台",-1)),s("div",te,[(o(),l(y,null,h(P,e=>s("span",{key:e,class:m(["chip",{active:k.value===e}]),onClick:_=>k.value=e},i(e),11,oe)),64))])]),s("div",le,[t[5]||(t[5]=s("label",{class:"field-label"},"色调风格",-1)),s("div",ae,[(o(),l(y,null,h(j,e=>s("span",{key:e,class:m(["chip",{active:f.value===e}]),onClick:_=>f.value=e},i(e),11,ne)),64))])]),s("div",ie,[s("button",{class:"btn-generate",disabled:d.value||!c.value.trim(),onClick:w},[d.value?(o(),l("span",de,"✨ 生成中...")):(o(),l("span",re,"✨ 一键生成"))],8,ce),n.value?(o(),l("button",{key:0,class:"btn-regen",disabled:d.value,onClick:w}," 重新生成 ",8,ue)):r("",!0)])]),s("div",ve,[s("div",pe,[t[6]||(t[6]=s("span",{class:"result-label"},"图文内容方案",-1)),s("div",_e,[p.value?(o(),l("span",ye,i(V.value),1)):r("",!0),n.value?(o(),l("button",{key:1,class:"btn-copy",onClick:D},"📋 复制")):r("",!0)])]),!n.value&&!d.value?(o(),l("div",he,[...t[7]||(t[7]=[s("div",{class:"empty-icon"},"🖼️",-1),s("div",{class:"empty-text"},"选择风格和话题后一键生成",-1)])])):(o(),l("div",me,[d.value&&!n.value?(o(),l("span",ke,"▌")):r("",!0),z(" "+i(n.value),1),d.value&&n.value?(o(),l("span",fe,"▌")):r("",!0)])),g.value?(o(),l("div",ge,"已复制 ✓")):r("",!0)])])]))}}),we=A(Ce,[["__scopeId","data-v-3094c795"]]);export{we as default};
