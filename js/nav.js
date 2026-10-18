// Shared helpers and the top navigation bar.
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const fmt=d=>new Date(d).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"});
const store={get:k=>{try{return sessionStorage.getItem(k)}catch{return null}},set:(k,v)=>{try{sessionStorage.setItem(k,v)}catch{}},del:k=>{try{sessionStorage.removeItem(k)}catch{}}};
const role=store.get("role");
const statusBadge=s=>s===true?'<span class="badge s-ok">Approved</span>':s===false?'<span class="badge s-bad">Denied</span>':'<span class="badge s-warn">Pending</span>';
const pkgHTML=i=>`<div><b>Package name</b>${esc(i.package.package_name)}</div><div><b>Package points</b>${i.package.point}</div><div><b>Package detail</b>${esc(i.package.package_detail)}</div><div><b>Detail</b>${esc(i.package.detail)}</div>`;
const okBadge=r=>r.is_successful?'<span class="badge s-ok">Successful</span>':'<span class="badge s-bad">Unsuccessful</span>';
let openId=null;
function toggle(id){openId=openId===id?null:id;render()}
function closeModal(){$("#overlay").classList.remove("show");$("#modal").className="card modal"}
if($("#overlay"))$("#overlay").addEventListener("click",e=>{if(e.target.id==="overlay")closeModal()});
function signOut(){store.del("role");location.href="login.html"}
const LINKS={company:[["insurance","Insurance"],["commission","Commission"]],broker:[["sign-contract","Sign Contract"],["dashboard","Dashboard"],["customer","Customer"],["report","Report"],["appointment","Appointment"]]};
async function mountNav(page){
  if(!role){location.href="login.html";return}
  let n=0;try{n=(await api.notifications()).length}catch{}
  const links=(LINKS[role]||[]).map(([h,t])=>`<a href="${h}.html" class="${page===h?"active":""}">${t}</a>`).join("");
  $("#nav").innerHTML=`<header class="nav"><button class="icon-btn" title="Notifications" onclick="location.href='notify.html'">✉️<span class="dot">${n}</span></button><nav class="links">${links}</nav><button class="profile" onclick="location.href='profile.html'"><span class="avatar">SW</span><span class="n">Profile</span></button></header>`;
}
