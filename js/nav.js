// Shared helpers and the top navigation bar.
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>\"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const fmt=d=>new Date(d).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"});
const store={get:k=>{try{return sessionStorage.getItem(k)}catch{return null}},set:(k,v)=>{try{sessionStorage.setItem(k,v)}catch{}},del:k=>{try{sessionStorage.removeItem(k)}catch{}}};
const currentBrokerUserID=()=>store.get("user_id")||String(db.brokerProfile.id||"").match(/\d+$/)?.[0]||"";
const role=store.get("role");
const statusBadge=s=>s===true||s==="Approve"?'<span class="badge s-ok">Approved</span>':s==="Send"?'<span class="badge s-ok">Sent</span>':s===false||s==="Deny"?'<span class="badge s-bad">Denied</span>':s==="Edited"?'<span class="badge">Edited</span>':'<span class="badge s-warn">Pending</span>';
function insuranceDetailHTML(i){
  const customer=i.customer||{};
  const pkg=i.package||{};
  const age=customer.customer_age??i.customer_age??"-";
  const health=customer.health_info||i.health_info||"-";
  const healthDetail=customer.health_detail||i.health_detail||"-";
  const queryTimestamp=customer.query_timestamp||i.query_timestamp||"";
  const payment=`${Number(pkg.package_price||0).toLocaleString()} every ${pkg.payment_period||"-"} month(s)`;
  const sellingCase=i.selling_case_id?"#"+i.selling_case_id+" · "+(i.selling_case_status||""):(i.selling_case||"-");
  const packageExtra=[
    pkg.package_price!=null?`${Number(pkg.package_price).toLocaleString()} for ${pkg.payment_period||"-"} month(s)`:"",
    pkg.age_range?`Ages ${pkg.age_range}`:""
  ].filter(Boolean).join("; ");
  return `<div class="detail insurance-detail">
    <div><b>Status</b>${statusBadge(i.status)}</div>
    <div><b>Selling case</b>${esc(sellingCase)}</div>
    <div><b>Payment</b>${payment}</div>
    <div><b>Customer age</b>${age}</div>
    <div><b>Health info</b>${esc(health)}</div>
    <div><b>Health detail</b>${esc(healthDetail)}</div>
    <div><b>Query timestamp</b>${queryTimestamp?fmt(queryTimestamp):"-"}</div>
    <div><b>Claim amount</b>THB ${Number(i.insurance_claim||0).toLocaleString()}</div>
    <div class="insurance-condition"><b>Condition</b>${esc(i.additional_detail||"-")}</div>
    <div><b>Package name</b>${esc(pkg.package_name||i.package_name||"-")}</div>
    <div><b>Package points</b>${pkg.point??i.package_points??"-"}</div>
    <div><b>Package detail</b>${esc(pkg.package_detail||i.package_detail||"-")}</div>
    <div><b>Detail</b>${esc(pkg.detail||i.package_description||packageExtra||"-")}</div>
  </div>`;
}
const insuranceDetailsCache=new Map();
async function loadInsuranceDetail(id,userID){
  const key=`${userID||"all"}:${id}`;
  if(insuranceDetailsCache.has(key))return insuranceDetailsCache.get(key);
  const record=await api.insuranceRecord(id,userID);
  if(!record)throw new Error("Insurance record not found");
  insuranceDetailsCache.set(key,record);
  return record;
}
const okBadge=r=>r.is_successful?'<span class="badge s-ok">Successful</span>':'<span class="badge s-bad">Unsuccessful</span>';
let openId=null;
function toggle(id){openId=openId===id?null:id;render()}
function closeModal(){$("#overlay").classList.remove("show");$("#modal").className="card modal"}
if($("#overlay"))$("#overlay").addEventListener("click",e=>{if(e.target.id==="overlay")closeModal()});
function confirmDialog(message,{title="Please confirm",confirmText="Continue",cancelText="Cancel",danger=false}={}){
  return new Promise(resolve=>{
    const previousFocus=document.activeElement;
    const backdrop=document.createElement("div");
    backdrop.className="confirm-backdrop";
    backdrop.innerHTML=`<section class="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-message">
      <h2 id="confirm-title"></h2><p id="confirm-message"></p>
      <div class="confirm-actions"><button type="button" class="btn confirm-cancel"></button><button type="button" class="btn confirm-accept"></button></div>
    </section>`;
    backdrop.querySelector("#confirm-title").textContent=title;
    backdrop.querySelector("#confirm-message").textContent=message;
    backdrop.querySelector(".confirm-cancel").textContent=cancelText;
    const accept=backdrop.querySelector(".confirm-accept");
    accept.textContent=confirmText;
    accept.classList.add(danger?"bad":"ok");
    const finish=accepted=>{
      document.removeEventListener("keydown",onKeyDown);
      backdrop.remove();
      if(previousFocus instanceof HTMLElement)previousFocus.focus();
      resolve(accepted);
    };
    const onKeyDown=event=>{if(event.key==="Escape")finish(false)};
    backdrop.addEventListener("click",event=>{if(event.target===backdrop)finish(false)});
    backdrop.querySelector(".confirm-cancel").addEventListener("click",()=>finish(false));
    accept.addEventListener("click",()=>finish(true));
    document.addEventListener("keydown",onKeyDown);
    document.body.appendChild(backdrop);
    backdrop.querySelector(".confirm-cancel").focus();
  });
}
function signOut(){store.del("role");store.del("user_id");store.del("user_name");if(window.self!==window.top)window.top.location.href="login.html";else location.href="login.html"}
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
  window.__notificationSnapshot=list;
  const unread=list.filter(item=>!item.is_read).length;
  const badge=$(".nav .dot");
  if(badge){badge.textContent=String(unread);badge.classList.toggle("hidden",unread===0)}
  window.dispatchEvent(new CustomEvent("notification:list",{detail:list}));
  if(window.__workspaceShell){
    const frame=$("#workspace-frame");
    if(frame?.dataset.page==="notify")frame.contentWindow?.postMessage({type:"notification-list",data:list},location.origin);
  }
}
let notificationQueryFailed=false;
let notificationRefreshInProgress=false;
function renderNavigation(page,unreadCount=0){
  const links=(LINKS[role]||[]).map(([h,t])=>`<a href="${window.__workspaceShell?`${h}.html?embedded=1`:`workspace.html?page=${h}`}" data-page="${h}" class="${page===h?"active":""}" ${window.__workspaceShell?`onclick="return navigateContentPage('${h}')"`:""}>${t}</a>`).join("");
  const unread=Number(unreadCount)||0;
  const notifyHref=window.__workspaceShell?"notify.html?embedded=1":"workspace.html?page=notify";
  const profileHref=window.__workspaceShell?"profile.html?embedded=1":"workspace.html?page=profile";
  const routeClick=target=>window.__workspaceShell?`onclick="return navigateContentPage('${target}')"`:"";
  $("#nav").innerHTML=`<header class="nav"><a class="icon-btn" title="Notifications" aria-label="Notifications" href="${notifyHref}" ${routeClick("notify")}>&#9993;<span class="dot ${unread===0?"hidden":""}">${unread}</span></a><nav class="links">${links}</nav><a class="profile" href="${profileHref}" ${routeClick("profile")}><span class="avatar">SW</span><span class="n">Profile</span></a></header>`;
}
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
  if(window.self!==window.top)return;
  if(!role){location.href="login.html";return}
	renderNavigation(page);
	try{
	  const notifications=await api.notifications();
	  notificationQueryFailed=false;
	  publishNotifications(notifications);
	}catch(error){
	  notificationQueryFailed=true;
	  showToast(error.message||"Unable to load notifications");
	  window.dispatchEvent(new CustomEvent("notification:error",{detail:error}));
	}
  if(window.__notificationPollTimer)clearInterval(window.__notificationPollTimer);
  window.__notificationPollTimer=setInterval(refreshNotifications,2000);
}
