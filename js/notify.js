mountNav("notify");
let lastNotificationKey="";
let notificationListLoaded=false;
function notificationDateTime(value){
  if(!value)return "-";
  const match=String(value).match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
  if(!match)return esc(value);
  const [,year,month,day,hour,minute]=match;
  const date=new Date(Number(year),Number(month)-1,Number(day));
  return `${fmt(date)}, ${hour}:${minute}`;
}
function renderNotifications(list){
  const key=JSON.stringify(list.map(item=>[item.id,item.text,item.time,item.is_read]));
  if(key===lastNotificationKey)return;
  lastNotificationKey=key;
  notificationListLoaded=true;
  const rows=list.map(item=>`<div class="list-item notification-item ${item.is_read?"is-read":"is-unread"}">
    <div class="notification-copy"><span class="notification-text">${esc(item.text)}</span><span class="muted">${notificationDateTime(item.time)}</span></div>
    <div class="notification-state">${item.is_read?'<span class="badge s-warn">Read</span>':'<span class="badge s-ok">Unread</span>'}
      ${item.is_read?"":`<button class="btn" onclick="markNotificationRead(${Number(item.id)})">Mark as read</button>`}
    </div>
  </div>`).join("");
  $("#main").innerHTML=`<h1>Notifications</h1><div class="card notification-list">${rows||'<p class="muted notification-empty">No notifications yet.</p>'}</div>`;
}
async function markNotificationRead(id){
  try{
    await api.markNotificationRead(id);
    const list=await api.notifications();
    publishNotifications(list);
  }catch(error){
    showToast(error.message||"Unable to mark notification as read");
  }
}
window.addEventListener("notification:list",event=>renderNotifications(event.detail||[]));
window.addEventListener("notification:error",event=>{
  if(!notificationListLoaded){
    const error=event.detail;
    $("#main").innerHTML=`<h1>Notifications</h1><div class="card pad">${esc(error?.message||"Unable to load notifications")}</div>`;
  }
});
