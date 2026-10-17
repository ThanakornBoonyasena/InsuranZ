// Shared helpers and the top navigation bar.
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const fmt=d=>new Date(d).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"});
const store={get:k=>{try{return sessionStorage.getItem(k)}catch{return null}},set:(k,v)=>{try{sessionStorage.setItem(k,v)}catch{}},del:k=>{try{sessionStorage.removeItem(k)}catch{}}};
const role=store.get("role");
function signOut(){store.del("role");location.href="login.html"}
async function mountNav(page){
  if(!role){location.href="login.html";return}
  const n=(await api.notifications()).length;
  const links=[["insurance","Insurance"],["commission","Commission"]].map(([h,t])=>`<a href="${h}.html" class="${page===h?"active":""}">${t}</a>`).join("");
  $("#nav").innerHTML=`<header class="nav"><button class="icon-btn" title="Notifications" onclick="location.href='notify.html'">✉️<span class="dot">${n}</span></button><nav class="links">${links}</nav><button class="profile" onclick="location.href='profile.html'"><span class="avatar">SW</span><span class="n">Profile</span></button></header>`;
}
