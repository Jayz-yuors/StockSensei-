const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const api=async(url,body)=>{const o=body===undefined?{}:{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)};
  const r=await fetch(url,o);let d={};try{d=await r.json()}catch(e){}return{ok:r.ok&&d.ok!==false,status:r.status,...d}};
function toast(m){let t=$(".toast");if(!t){t=document.createElement("div");t.className="toast";document.body.appendChild(t)}t.textContent=m;t.classList.add("show");clearTimeout(t._h);t._h=setTimeout(()=>t.classList.remove("show"),3200)}
function setTheme(t){document.documentElement.dataset.theme=t;localStorage.setItem("qs_theme",t);$$("[data-theme-btn]").forEach(b=>b.textContent=t==="dark"?"☀️":"🌙")}
setTheme(localStorage.getItem("qs_theme")||"dark");
document.addEventListener("click",e=>{if(e.target.closest("[data-theme-btn]"))setTheme(document.documentElement.dataset.theme==="dark"?"light":"dark");
  const m=$(".menu");if(m&&!e.target.closest(".menu"))m.classList.remove("open");if(e.target.closest(".menu .avatar"))m.classList.toggle("open");
  if(e.target.closest("[data-logout]")){api("/api/auth/logout",{}).then(()=>location.href="/")}});
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const initials=n=>n.split(/\s+/).map(s=>s[0]).slice(0,2).join("").toUpperCase();
function avatarHTML(u){return u.avatar?`<img class="avatar" src="${esc(u.avatar)}" referrerpolicy="no-referrer" alt="">`:`<div class="avatar">${esc(initials(u.name))}</div>`}
function userMenu(u){return `<div class="menu">${avatarHTML(u)}<div class="dd"><div class="who"><b>${esc(u.name)}</b><br><small>${esc(u.email)}</small></div>
<a href="/dashboard">🏠 Dashboard</a><a href="/profile">⚙️ Profile &amp; settings</a><a href="/">📘 About the platform</a><button data-logout>🚪 Sign out</button></div></div>`}
const logo=`<a class="logo" href="/"><i>Q</i><span>Quant<b class="grad-t">Sensei</b></span></a>`;
const io=new IntersectionObserver(es=>es.forEach(e=>e.isIntersecting&&e.target.classList.add("in")),{threshold:.12});
function reveal(){$$(".rv").forEach(el=>io.observe(el))}
document.addEventListener("DOMContentLoaded",()=>setTheme(document.documentElement.dataset.theme));
