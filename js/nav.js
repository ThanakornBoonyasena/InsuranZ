// Shared helpers and the top navigation bar.
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const fmt=d=>new Date(d).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"});
const store={get:k=>{try{return sessionStorage.getItem(k)}catch{return null}},set:(k,v)=>{try{sessionStorage.setItem(k,v)}catch{}},del:k=>{try{sessionStorage.removeItem(k)}catch{}}};
const role=store.get("role");
const statusBadge=s=>s===true?'<span class="badge s-ok">Approved</span>':s===false?'<span class="badge s-bad">Denied</span>':'<span class="badge s-warn">Pending</span>';
function insuranceDetailHTML(i){
  const customer=i.customer||{};
  const pkg=i.package||{};
  const age=customer.customer_age??i.customer_age??"-";
  const health=customer.health_info||i.health_info||"-";
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
    <div><b>Customer since</b>${customerSince?fmt(customerSince):"-"}</div>
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
async function mountNav(page){
  if(!role){location.href="login.html";return}
  let n=0;try{n=(await api.notifications()).length}catch{}
  const links=(LINKS[role]||[]).map(([h,t])=>`<a href="${h}.html" class="${page===h?"active":""}">${t}</a>`).join("");
  $("#nav").innerHTML=`<header class="nav"><button class="icon-btn" title="Notifications" onclick="location.href='notify.html'">✉️<span class="dot">${n}</span></button><nav class="links">${links}</nav><button class="profile" onclick="location.href='profile.html'"><span class="avatar">SW</span><span class="n">Profile</span></button></header>`;
}
