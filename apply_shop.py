#!/usr/bin/env python3
"""Ajoute le magazinzin à Fabrice Clicker en utilisant les sprites existants dans files/."""
import sys, shutil
from pathlib import Path

path = Path(sys.argv[1] if len(sys.argv) > 1 else "index.html")
src = path.read_text(encoding="utf-8")

CSS = r'''
/* ===== Magazinzin ===== */
.chair{position:fixed;left:8px;top:50%;transform:translateY(-50%);z-index:40;width:clamp(72px,11vw,150px);padding:0;border:0;background:transparent;cursor:pointer;-webkit-tap-highlight-color:transparent;box-shadow:3px 3px 0 rgba(0,0,0,.45)}
.chair img{display:block;width:100%;height:auto;image-rendering:pixelated;pointer-events:none}
.chair:focus-visible{outline:2px dotted #fff;outline-offset:3px}
.chair.pop{animation:chairpop .6s steps(6)}
@keyframes chairpop{from{transform:translateY(-50%) translateX(-130%)}to{transform:translateY(-50%)}}
@media (prefers-reduced-motion:reduce){.chair.pop{animation:none}}
.shopveil{z-index:65}
.shopbody{flex:1;min-height:0;overflow:auto;padding:8px}
.shophead{display:flex;gap:10px;align-items:flex-end;justify-content:center;margin-bottom:10px}
.shophead img{display:block;width:100%;height:auto;image-rendering:pixelated}
.shophead .alan{width:min(50%,250px)}
.shophead .bankcol{width:min(42%,200px);display:flex;flex-direction:column;gap:6px}
.bankcol .score{text-align:center;font-size:16px;padding:4px 6px}
.shopgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px;align-items:start}
.item{display:flex;flex-direction:column;gap:6px;background:var(--face);padding:6px;border:2px solid;border-color:#fff #404040 #404040 #fff}
.item img{display:block;width:100%;height:auto;image-rendering:pixelated}
.item .b95{font-size:15px}
.item .b95:disabled{color:#808080;cursor:not-allowed}
.item small{display:block;font-size:13px;color:#404040;text-align:center;min-height:1.3em}
.loopbox{position:fixed;right:10px;bottom:calc(10px + env(safe-area-inset-bottom,0px));z-index:45;width:min(220px,60vw);background:var(--face);border:2px solid;border-color:#fff #000 #000 #fff;box-shadow:3px 3px 0 rgba(0,0,0,.45);padding:2px}
.loopbox .tb2{background:linear-gradient(90deg,#000080,#1084d0);color:#fff;font-size:14px;padding:3px 6px}
.loopbox .lb{display:flex;flex-direction:column;gap:6px;padding:6px}
.loopbox input{font:inherit;font-size:15px;width:100%;padding:4px 6px;color:#000;background:#fff;border:2px solid;border-color:#404040 #fff #fff #404040}
'''

HTML_TOP = r'''<div class="score" id="bankbox" hidden>Clik bank : <b id="bank">0</b></div>'''

HTML_FIXED = r'''<button class="chair" id="chair" type="button" hidden aria-label="Ouvrir le magazinzin"><img src="files/chaise.png" alt="" draggable="false"></button>
<div class="loopbox" id="loopbox" hidden>
  <div class="tb2"><span>Boucle</span></div>
  <div class="lb">
    <button class="b95" id="loopbtn" type="button" aria-pressed="false">Activer la boucle</button>
    <input id="loopname" maxlength="40" placeholder="Pseudo pour le top 5" autocomplete="off" aria-label="Pseudo pour la boucle">
  </div>
</div>
'''

SHOP_JS = r'''/* ===== Magazinzin ===== */
var DEATH_BASE=0.10,HEART_STEP=0.001,DBL_STEP=0.01;
function deathChance(){return Math.max(0,DEATH_BASE-HEART_STEP*save.heart);}
function dblChance(){return DBL_STEP*save.dbl;}
var chair=document.getElementById("chair"),bankbox=document.getElementById("bankbox"),bankEl=document.getElementById("bank"),
    loopbox=document.getElementById("loopbox"),loopbtn=document.getElementById("loopbtn"),loopname=document.getElementById("loopname"),
    shopRedraw=null,looping=false;
var ITEMS=[
  {key:"loop",name:"Boucle",img:"boucle.png",price:2000,max:1,info:"Fabrice revient direct, sans high score."},
  {skin:"k9",name:"Nouveau Fabrice",img:"nouveau-fabrice.png",price:500,max:1,info:"Un nouveau skin pour Fabrice."},
  {key:"heart",name:"Meilleur coeur",img:"coeur.png",price:2000,max:10,info:"-0,001 de chance de mort par coeur."},
  {key:"dbl",name:"Double clik",img:"double-clik.png",price:2000,max:5,info:"+0,01 de chance de clic double par achat."},
  {skin:"k8",name:"Golden Fabrice",img:"golden-fabrice.png",price:0,max:1,info:"Le skin Golden Fabrice."}
];
function owned(it){return it.skin?(save.sk[it.skin]?1:0):save[it.key];}
function toast(h,t,d){q.push({h:h,t:t,d:d});if(!showing)nextToast();}
function refreshBank(){bankEl.textContent=save.bank;if(shopRedraw)shopRedraw();}
function syncShop(){
  chair.hidden=!save.shop;bankbox.hidden=!save.shop;loopbox.hidden=!save.loop;
  loopbtn.setAttribute("aria-pressed",save.loopOn?"true":"false");
  bankEl.textContent=save.bank;
}
function openShopDoor(){
  if(save.shop)return;
  save.shop=1;persist();syncShop();
  chair.classList.remove("pop");void chair.offsetWidth;chair.classList.add("pop");
  toast("Nouveau !","Le magazinzin est ouvert","Clique sur l'image à gauche de l'écran");
}
function buy(it){
  if(owned(it)>=it.max||save.bank<it.price)return;
  save.bank-=it.price;
  if(it.skin)unlockSkin(it.skin);else{save[it.key]++;toast("Achat",it.name,it.info);}
  persist();syncShop();refreshBank();
}
function openShop(){
  unlock("shop");
  var v=document.createElement("div");v.className="veil shopveil";
  v.innerHTML='<div class=\"panel big\" role=\"dialog\" aria-label=\"Magazinzin\"><div class=\"tb2\"><span>Magazinzin</span><button type=\"button\" aria-label=\"Fermer\">x</button></div>'+
    '<div class=\"shopbody\"><div class=\"shophead\"><img class=\"alan\" src=\"files/alan.png\" alt=\"Alan, le vendeur\" draggable=\"false\">'+
    '<div class=\"bankcol\"><img src=\"files/bank.png\" alt=\"Clik bank\" draggable=\"false\"><div class=\"score\">Clik bank : <b class=\"bk\">0</b></div></div></div>'+
    '<div class=\"shopgrid\"></div></div></div>';
  var grid=v.querySelector(".shopgrid"),bk=v.querySelector(".bk");
  function draw(){
    bk.textContent=save.bank;grid.innerHTML="";
    ITEMS.forEach(function(it){
      var own=owned(it),maxed=own>=it.max,lack=it.price-save.bank;
      var card=document.createElement("div");card.className="item";
      var im=new Image();im.src="files/"+it.img;im.alt=it.name;im.draggable=false;
      var b=document.createElement("button");b.type="button";b.className="b95";
      var label=maxed?(it.max>1?"Complet "+own+"/"+it.max:"Possédé ✔"):(it.price?"Acheter - "+it.price:"Prendre - gratuit")+(it.max>1?" ("+own+"/"+it.max+")":"");
      b.textContent=label;b.disabled=maxed||lack>0;
      var sm=document.createElement("small");
      sm.textContent=maxed?"":(lack>0?"Il te manque "+lack+" clics":"");
      b.addEventListener("click",function(){buy(it);});
      card.appendChild(im);card.appendChild(b);card.appendChild(sm);grid.appendChild(card);
    });
  }
  shopRedraw=draw;draw();
  function close(){shopRedraw=null;v.remove();document.removeEventListener(\"keydown\",esc);chair.focus();}
  function esc(e){if(e.key===\"Escape\")close();}
  v.addEventListener("click",function(e){if(e.target===v||(e.target.tagName===\"BUTTON\"&&e.target.parentNode.className===\"tb2\"))close();});
  document.addEventListener("keydown",esc);
  document.body.appendChild(v);
  v.querySelector(".tb2 button").focus();
}
chair.addEventListener("click",openShop);

function loopFinish(){
  if(looping)return;looping=true;
  var nm=loopname.value.trim().replace(/\\s+/g," ");
  function done(){looping=false;reset();}
  if(n<1||!nm||nm.toLowerCase()==="fabrice"){done();return;}
  load().then(function(){
    var rank=1+board().filter(function(e){return e.s>=n;}).length;
    if(rank>5)return;
    return fetch(API,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({name:nm,score:n})})
      .then(function(r){return r.json();}).then(function(d){if(d&&d.scores)setScores(d.scores);});
  }).catch(function(){}).then(done);
}
loopbtn.addEventListener("click",function(){save.loopOn=save.loopOn?0:1;persist();syncShop();});
try{loopname.value=localStorage.getItem(NK)||"";}catch(e){}
loopname.addEventListener("input",function(){try{localStorage.setItem(NK,loopname.value.trim());}catch(e){}});
syncShop();
'''

EDITS = [
    ("</style>", CSS + "</style>"),
    ('<div class="top"><div class="score" aria-live="polite">Clics : <b id="n">0</b></div>', '<div class="top"><div class="score" aria-live="polite">Clics : <b id="n">0</b></div>' + HTML_TOP),
    ('<div class="veil hsveil" id="hs" hidden>', HTML_FIXED + '<div class="veil hsveil" id="hs" hidden>'),
    ('{id:"k7",name:"Fabrice drogue",src:"assets/skins/skin7.png"}', '{id:"k7",name:"Fabrice drogue",src:"assets/skins/skin7.png"},\\n    {id:"k8",name:"Golden Fabrice",src:"files/golden-fabrice.png"},\\n    {id:"k9",name:"Nouveau Fabrice",src:"files/nouveau-fabrice.png"}'),
    ('{id:"coll",secret:1,t:"Collectionneur",d:"Trouver et télécharger l\\'image de Fabrice tout en bas de la page"}', '{id:"coll",secret:1,t:"Collectionneur",d:"Trouver et télécharger l\\'image de Fabrice tout en bas de la page"},\\n    {id:"shop",secret:1,t:\"Client\",d:\"Ouvrir le magazinzin\"}'),
    ('var KEY="fabrice-clicker-save",save={u:{},sk:{},skin:"",last:-1,streak:0};', 'var KEY="fabrice-clicker-save",save={u:{},sk:{},skin:"",last:-1,streak:0,bank:0,shop:0,loop:0,loopOn:0,heart:0,dbl:0};'),
    ('if(typeof save.skin!=="string")save.skin="";', 'if(typeof save.skin!=="string")save.skin="";\\n  ["bank","shop","loop","loopOn","heart","dbl"].forEach(function(k){if(typeof save[k]!=="number")save[k]=0;});\\n  if(save.u.hand)save.shop=1;'),
    ('n++;out.textContent=n;play((n>10?0.45:0.6+Math.random()*1.2)*pitch);anim();\\n    setBg(n);if(n%10===0&&n<=100)unlock("s"+n);\\n    if(Math.random()<0.10){', 'var add=Math.random()<dblChance()?2:1;for(var kk=0;kk<add;kk++){n++;if(n%10===0&&n<=100)unlock(\"s\"+n);}save.bank+=add;persist();refreshBank();out.textContent=n;play((n>10?0.45:0.6+Math.random()*1.2)*pitch);anim();\\n    setBg(n);\\n    if(Math.random()<deathChance()){'),
    ('setTimeout(function(){thud();fab.style.visibility="hidden";showHS();},880);', 'setTimeout(function(){thud();fab.style.visibility="hidden";if(save.loop&&save.loopOn)loopFinish();else showHS();},880);'),
    ('unlock("hand");\\n    hit(1,wiggle);', 'unlock("hand");\\n    shopOpenDoor();\\n    hit(1,wiggle);'),
    ('/* Image à télécharger tout en bas de la page */', SHOP_JS + '/* Image à télécharger tout en bas de la page */'),
]

bad = [(o[:90], src.count(o)) for o, _ in EDITS if src.count(o) != 1]
if bad:
    print("Patch annulé : repères introuvables ou en double :", bad)
    sys.exit(1)

shutil.copyfile(path, path.with_suffix(path.suffix + ".bak"))
for old, new in EDITS:
    src = src.replace(old, new, 1)

path.write_text(src, encoding="utf-8")
print("OK : index.html patche avec le magazinzin.")
