$("#main").innerHTML='<h1>Notifications</h1><div class="card pad">Loading notifications...</div>';
mountNav("notify");
let lastNotificationKey="";
function notificationDateTime(value){
  if(!value)return "-";
  const match=String(value).match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
  if(!match)return esc(value);
  const [,year,month,day,hour,minute]=match;
  const date=new Date(Number(year),Number(month)-1,Number(day));
  return `${fmt(date)}, ${hour}:${minute}`;
}
function renderNotifications(list){
  const key=JSON.stringify(list.map(item=>[item.id,item.text,item.time,item.is_read,item.audience]));
  if(key===lastNotificationKey)return;
  lastNotificationKey=key;
  const rowsFor=audience=>list.filter(item=>(item.audience||"all")===audience).map(item=>`<div class="list-item notification-item ${item.is_read?"is-read":"is-unread"}">
    <div class="notification-copy"><span class="notification-text">${esc(item.text)}</span><span class="muted">${notificationDateTime(item.time)}</span></div>
    <div class="notification-state">${item.is_read?'<span class="badge s-warn">Read</span>':'<span class="badge s-ok">Unread</span>'}
      ${item.is_read?"":`<button class="btn" onclick="markNotificationRead(${Number(item.id)})">Mark as read</button>`}
    </div>
  </div>`).join("");
  const groups=[["broker","For brokers"],["company","For company"],["all","Everyone"]].map(([audience,title])=>{
    const rows=rowsFor(audience);
    return rows?`<section class="notification-group"><h2>${title}</h2><div class="card notification-list">${rows}</div></section>`:"";
  }).join("");
  $("#main").innerHTML=`<h1>Notifications</h1>${groups||'<div class="card notification-list"><p class="muted notification-empty">No notifications yet.</p></div>'}`;
}
async function markNotificationRead(id){
  try{
    await api.markNotificationRead(id);
    const list=await api.notifications();
    publishNotifications(list);
    showToast("Notification marked as read.","success");
  }catch(error){
    // Keep notification request failures from displaying an error toast.
  }
}
window.addEventListener("notification:list",event=>renderNotifications(event.detail||[]));
window.addEventListener("message",event=>{
  if(event.source===window.parent&&event.origin===location.origin&&event.data?.type==="notification-list"){
    renderNotifications(event.data.data||[]);
  }
});
async function refreshNotificationList(){
  try{
    const list=await api.notifications();
    publishNotifications(list);
  }catch(error){
    // Keep notification list refresh failures silent.
  }
}
refreshNotificationList();
if(window.__notificationListPollTimer)clearInterval(window.__notificationListPollTimer);
window.__notificationListPollTimer=setInterval(refreshNotificationList,30000);
