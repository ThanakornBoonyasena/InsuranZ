// Shared helpers and the top navigation bar.
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>\"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const fmt=d=>new Date(d).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"});
const store={get:k=>{try{return sessionStorage.getItem(k)}catch{return null}},set:(k,v)=>{try{sessionStorage.setItem(k,v)}catch{}},del:k=>{try{sessionStorage.removeItem(k)}catch{}}};
const role=store.get("role");
const statusBadge=s=>s===true?'<span class="badge s-ok">Approved</span>':s===false?'<span class="badge s-bad">Denied</span>':'<span class="badge s-warn">Pending</span>';
function insuranceDetailHTML(i){
  const customer=i.customer||{};
  const pkg=i.package||{};
  const age=customer.customer_age??i.customer_age??"-";
  const health=customer.health_info||i.health_info||"-";
  const healthDetail=customer.health_detail||i.health_detail||"-";
  const customerSince=customer.create_timestamp||i.customer_since||"";
  const interval=i.payment_interval_month??i.payment_interval_months;
  const payment=`${Number(i.payment_amount||0).toLocaleString()} every ${interval||"-"} month(s)`;
  const packageExtra=[
    pkg.package_price!=null?`${Number(pkg.package_price).toLocaleString()} for ${pkg.payment_period||"-"} month(s)`:"",
    pkg.age_range?`Ages ${pkg.age_range}`:""
  ].filter(Boolean).join("; ");
  return `<div class="detail insurance-detail">
    <div><b>Status</b>${statusBadge(i.status)}</div>
    <div><b>Type</b>${esc(i.type||"-")}</div>
    <div><b>Selling case</b>${esc(i.selling_case||"-")}</div>
    <div><b>Payment</b>${payment}</div>
    <div><b>Customer age</b>${age}</div>
    <div><b>Health info</b>${esc(health)}</div>
    <div><b>Health detail</b>${esc(healthDetail)}</div>
    <div><b>Customer since</b>${customerSince?fmt(customerSince):"-"}</div>
    <div><b>Claim amount</b>THB ${Number(i.insurance_claim||0).toLocaleString()}</div>
    <div class="insurance-condition"><b>Condition</b>${esc(i.additional_detail||"-")}</div>
    <div><b>Package name</b>${esc(pkg.package_name||i.package_name||"-")}</div>
    <div><b>Package points</b>${pkg.point??i.package_points??"-"}</div>
    <div><b>Package detail</b>${esc(pkg.package_detail||i.package_detail||"-")}</div>
    <div><b>Detail</b>${esc(pkg.detail||i.package_description||packageExtra||"-")}</div>
  </div>`;
}
const okBadge=r=>r.is_successful?'<span class="badge s-ok">Successful</span>':'<span class="badge s-bad">Unsuccessful</span>';
let openId=null;
function toggle(id){openId=openId===id?null:id;render()}
function closeModal(){$("#overlay").classList.remove("show");$("#modal").className="card modal"}
if($("#overlay"))$("#overlay").addEventListener("click",e=>{if(e.target.id==="overlay")closeModal()});
function signOut(){store.del("role");store.del("user_id");store.del("user_name");location.href="login.html"}
const LINKS={company:[["insurance","Insurance"],["commission","Commission"]],broker:[["sign-contract","Sign Contract"],["dashboard","Dashboard"],["customer","Customer"],["report","Report"],["appointment","Appointment"]]};
let toastTimer;
function showToast(message){
  let toast=$("#app-toast");
  if(!toast){toast=document.createElement("div");toast.id="app-toast";toast.className="app-toast";toast.setAttribute("role","status");document.body.appendChild(toast)}
  toast.textContent=message||"Something went wrong";
  toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>toast.classList.remove("visible"),4000);
}
function publishNotifications(list){
  const unread=list.filter(item=>!item.is_read).length;
  const badge=$(".nav .dot");
  if(badge){badge.textContent=String(unread);badge.classList.toggle("hidden",unread===0)}
  window.dispatchEvent(new CustomEvent("notification:list",{detail:list}));
}
let notificationQueryFailed=false;
let notificationRefreshInProgress=false;
async function refreshNotifications(){
  if(notificationRefreshInProgress)return;
  notificationRefreshInProgress=true;
  try{
    const list=await api.notifications();
    notificationQueryFailed=false;
    publishNotifications(list);
  }catch(error){
    if(!notificationQueryFailed)showToast(error.message||"Unable to load notifications");
    notificationQueryFailed=true;
    window.dispatchEvent(new CustomEvent("notification:error",{detail:error}));
  }finally{
    notificationRefreshInProgress=false;
  }
}
async function mountNav(page){
  if(!role){location.href="login.html";return}
  let notifications=[];
  try{notifications=await api.notifications();notificationQueryFailed=false}
  catch(error){notificationQueryFailed=true;showToast(error.message||"Unable to load notifications");window.dispatchEvent(new CustomEvent("notification:error",{detail:error}))}
  const links=(LINKS[role]||[]).map(([h,t])=>`<a href="${h}.html" class="${page===h?"active":""}">${t}</a>`).join("");
  const unread=notifications.filter(item=>!item.is_read).length;
  $("#nav").innerHTML=`<header class="nav"><button class="icon-btn" title="Notifications" onclick="location.href='notify.html'">&#9993;<span class="dot ${unread===0?"hidden":""}">${unread}</span></button><nav class="links">${links}</nav><button class="profile" onclick="location.href='profile.html'"><span class="avatar">SW</span><span class="n">Profile</span></button></header>`;
  publishNotifications(notifications);
  if(window.__notificationPollTimer)clearInterval(window.__notificationPollTimer);
  window.__notificationPollTimer=setInterval(refreshNotifications,2000);
}
