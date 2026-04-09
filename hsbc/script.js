/* ============================================
   滙豐旅人卡 | 環哩匯通路獨家方案
   Script
   ============================================ */

/* ---- Data ---- */
const CC = {
    infinite: { name:'滙豐旅人無限卡', fee:8000, dr:18, or:10, uni:false, wb:8000, wt:10000,
        ch:{ premier:{c:8888,t:8888}, newcard:{c:4000,t:8000} },
        sg:{p:8000,t:10000}, ap:{tr:4,lg:8,pk:60} },
    signature: { name:'滙豐旅人御璽卡', fee:2500, dr:18, or:15, uni:false, wb:3000, wt:3000,
        ch:{ premier:{c:3388,t:8888}, newcard:{c:2388,t:8000} },
        sg:{p:3000,t:3000}, ap:{tr:2,lg:2,pk:45} },
    travelone: { name:'滙豐旅人輕旅卡', fee:0, ur:20, uni:true, wb:1000, wt:3000,
        ch:{ premier:{c:1388,t:8888}, newcard:{c:888,t:8000} },
        sg:null, ap:{tr:1,lg:0,pk:30} }
};
const DEST = [
    {n:'香港',e:'🇭🇰',m:15000},{n:'東京',e:'🇯🇵',m:20000},{n:'曼谷',e:'🇹🇭',m:17500},
    {n:'新加坡',e:'🇸🇬',m:25000},{n:'雪梨',e:'🇦🇺',m:45000},{n:'倫敦',e:'🇬🇧',m:60000}
];

let card=null, atype=null, qa={}, recCard=null;

/* ---- Utility ---- */
function $(id){ return document.getElementById(id); }
function fmt(n){ return Math.round(n).toLocaleString('zh-TW'); }
function gv(id){ return Math.max(0, parseInt($(id).value)||0); }

/* ---- Keyboard a11y: Enter/Space triggers click on role=button ---- */
document.addEventListener('keydown', function(e){
    if((e.key==='Enter'||e.key===' ')&&e.target.getAttribute('role')==='button'){
        e.preventDefault();
        e.target.click();
    }
});

/* ---- Scroll Reveal ---- */
const revealObs = new IntersectionObserver(entries=>{
    entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('visible'); revealObs.unobserve(e.target); }});
},{threshold:0.08, rootMargin:'0px 0px -40px 0px'});
document.querySelectorAll('.reveal').forEach(el=>revealObs.observe(el));

/* ---- Countdown ---- */
(function initCountdown(){
    const end=new Date('2026-04-30T23:59:59+08:00').getTime();
    const el=document.getElementById('countdown');
    if(!el) return;
    let timer;
    function upd(){
        const diff=end-Date.now();
        if(diff<=0){el.textContent='活動已截止';return;}
        const d=Math.floor(diff/864e5), h=Math.floor((diff%864e5)/36e5);
        el.textContent='距離活動截止還有 '+d+' 天 '+h+' 小時';
    }
    upd();
    timer=setInterval(upd,60000);
    document.addEventListener('visibilitychange',function(){
        if(document.hidden){clearInterval(timer)}
        else{upd();timer=setInterval(upd,60000)}
    });
})();

/* ---- Number Counter Animation ---- */
function animNum(el,target,dur){
    const start=parseInt(el.textContent.replace(/,/g,''))||0;
    if(start===target) return;
    const t0=performance.now();
    function step(now){
        const p=Math.min((now-t0)/dur,1);
        el.textContent=fmt(Math.round(start+(target-start)*(1-Math.pow(1-p,3))));
        if(p<1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

/* ---- Quiz ---- */
function answerQuiz(s,v){
    qa[s]=v; $('qs'+s).classList.remove('active');
    if(s<3) $('qs'+(s+1)).classList.add('active'); else showRec();
}
function showRec(){
    let sc={infinite:0,signature:0,travelone:0};
    if(qa[1]==='high'){sc.infinite+=4;sc.signature+=1}
    else if(qa[1]==='mid'){sc.signature+=4;sc.infinite+=2;sc.travelone+=1}
    else{sc.travelone+=4;sc.signature+=2}
    if(qa[2]==='lng'||qa[2]==='all'){sc.infinite+=2;sc.signature+=1}
    else{sc.signature+=1;sc.travelone+=1}
    if(qa[3]==='yes'||qa[3]==='willing') sc.infinite+=1;
    let b='signature';
    if(sc.infinite>=sc.signature&&sc.infinite>=sc.travelone) b='infinite';
    else if(sc.travelone>=sc.signature) b='travelone';
    recCard=b; const c=CC[b]; $('rec-name').textContent=c.name;
    const R=[];
    if(b==='infinite'){R.push('海外消費 NT$10 = 1 哩，市場最優費率');R.push('年享 4 次免費機場接送 + 8 次貴賓室');R.push('通路折抵金最高 NT$8,888')}
    else if(b==='signature'){R.push('年費僅 NT$2,500，CP 值最高');R.push('16 家航空全部 1:1 轉換');R.push('機場接送 + 貴賓室各 2 次')}
    else{R.push('非紙本帳單免年費，零負擔入門');R.push('所有消費 NT$20 = 1 哩，簡單好算');R.push('同享 16 家航空 1:1 轉換')}
    $('rec-list').innerHTML=R.map(r=>'<li>'+r+'</li>').join('');
    $('rec-result').classList.add('show');
}
function applyRec(){ if(recCard){pickCard(recCard);$('calculator').scrollIntoView({behavior:'smooth'})} }
function resetQuiz(){ qa={}; recCard=null; $('rec-result').classList.remove('show');
    document.querySelectorAll('.quiz-step').forEach(s=>s.classList.remove('active')); $('qs1').classList.add('active'); }

/* ---- Card & Type ---- */
function pickCard(k){
    card=k; document.querySelectorAll('.crd').forEach(e=>e.classList.remove('on'));
    $('c-'+k).classList.add('on'); const c=CC[k];
    $('g-dom').style.display=c.uni?'none':''; $('g-ovs').style.display=c.uni?'none':'';
    $('g-tot').style.display=c.uni?'':'none'; $('inp-grid').className=c.uni?'inp-grid solo':'inp-grid';
    $('tv-premier').textContent='折抵金 NT$'+fmt(c.ch.premier.c);
    $('tv-newcard').textContent='折抵金 NT$'+fmt(c.ch.newcard.c);
    $('inp-panel').style.display=''; calc();
}
function pickType(t){
    atype=t; document.querySelectorAll('.topt').forEach(e=>e.classList.remove('on'));
    $('t-'+t).classList.add('on'); calc();
}

/* ---- Calculator ---- */
function calc(){
    if(!card||!atype){ $('results').classList.remove('show'); return; }
    const c=CC[card]; let ts=0,dm=0,om=0;
    if(c.uni){ ts=gv('i-tot'); dm=Math.floor(ts/c.ur); }
    else{ const d=gv('i-dom'),o=gv('i-ovs'); ts=d+o; dm=Math.floor(d/c.dr); om=Math.floor(o/c.or); }
    const sm=dm+om, wOk=ts>=c.wt, wb=wOk?c.wb:0;
    const ch=c.ch[atype], chOk=ts>=ch.t, cd=chOk?ch.c:0;
    const ad=$('chk-auto').checked?1000:0, tot=sm+wb+ad;

    $('results').classList.add('show');
    animNum($('r-miles'),tot,600);
    $('r-cash').textContent='NT$'+fmt(cd);

    let bk='';
    bk+=bkItem('消費累積哩程', c.uni?'消費 NT$'+fmt(ts)+' ÷ '+c.ur:'國內 ÷'+c.dr+' + 海外 ÷'+c.or, sm, sm>0);
    bk+=bkItem('首刷禮','消費滿 NT$'+fmt(c.wt), wb, wOk);
    if(ad) bk+=bkItem('自動扣繳加碼','綁定銀行帳戶自動扣繳',1000,true);
    bk+='<div class="bk-divider">';
    bk+='<span class="bk-divider-label">環哩匯折抵金<span class="tag-ex" style="margin-left:6px">通路獨家</span></span>';
    bk+='<span class="bk-divider-val" style="color:'+(chOk?'#FF6B7A':'var(--text-3)')+'">'+(chOk?'NT$'+fmt(cd):'未達門檻')+'</span></div>';
    if(!chOk) bk+='<div class="bk-threshold">需消費滿 NT$'+fmt(ch.t)+'</div>';
    $('r-bk').innerHTML=bk;

    const ef=Math.max(0,c.fee-cd);
    $('rv-fee').textContent='NT$'+fmt(ef);
    $('rv-fee').className='roi-v '+(ef===0?'grn':'red');
    $('rv-cpm').textContent=(tot>0&&ts>0)?'NT$'+(ts/tot).toFixed(1):'–';
    if(c.fee>0&&!c.uni){ const nf=Math.max(0,c.fee-cd);
        $('rv-be').textContent=nf>0?'NT$'+fmt(Math.ceil(nf/(0.5/c.or))):'已回本!';
    } else $('rv-be').textContent=c.fee===0?'免年費':'–';
    updDest(tot);
}
function bkItem(l,cond,v,ok){
    return '<div class="bk-item"><div class="bk-left"><span class="bk-dot '+(ok?'yes':'no')+'"></span><div><div class="bk-label">'+l+'</div><div class="bk-cond">'+cond+'</div></div></div><div class="bk-val '+(ok&&v>0?'gold':'')+'">'+(ok?'+'+fmt(v):'0')+' 哩</div></div>';
}

/* ---- Destinations ---- */
function updDest(tot){
    const sec=$('dest-sec'),g=$('dest-grid');
    if(tot<=0){sec.style.display='none';return} sec.style.display='';
    g.innerHTML=DEST.map(d=>{
        const p=Math.min(100,Math.round(tot/d.m*100)),ok=tot>=d.m,nr=!ok&&p>=70;
        let sc='st-no',bc='x',cc='',st=p+'% — 還差 '+fmt(d.m-tot)+' 哩';
        if(ok){sc='st-ok';bc='g';cc='ok';st='已解鎖！可兌換來回機票'}
        else if(nr){sc='st-nr';bc='a';cc='near';st='即將達成 — 還差 '+fmt(d.m-tot)+' 哩'}
        return '<div class="dst '+cc+'"><div class="d-em">'+d.e+'</div><div class="d-nm">'+d.n+'</div><div class="d-mi">經濟艙來回 ~'+fmt(d.m)+' 哩</div><div class="bar"><div class="bar-fill '+bc+'" style="width:'+p+'%"></div></div><div class="d-st '+sc+'">'+st+'</div></div>';
    }).join('');
}

/* ---- Accordions ---- */
function togAcc(id){
    const el=$(id),o=el.classList.contains('open');
    document.querySelectorAll('.acc').forEach(a=>{
        a.classList.remove('open');
        a.querySelector('.acc-bd').style.maxHeight='0';
        a.querySelector('.acc-hd').setAttribute('aria-expanded','false');
    });
    if(!o){
        el.classList.add('open');
        const b=el.querySelector('.acc-bd');
        b.style.maxHeight=b.scrollHeight+'px';
        el.querySelector('.acc-hd').setAttribute('aria-expanded','true');
    }
}
function togFaq(el){
    const it=el.parentElement,o=it.classList.contains('open');
    document.querySelectorAll('.fq').forEach(f=>{
        f.classList.remove('open');
        f.querySelector('.fq-a').style.maxHeight='0';
        f.querySelector('.fq-q').setAttribute('aria-expanded','false');
    });
    if(!o){
        it.classList.add('open');
        const a=it.querySelector('.fq-a');
        a.style.maxHeight=a.scrollHeight+'px';
        el.setAttribute('aria-expanded','true');
    }
}
