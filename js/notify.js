mountNav("notify");
function notificationDateTime(value){
  if(!value)return "—";
  const match=String(value).match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
  if(!match)return esc(value);
  const [,year,month,day,hour,minute]=match;
  const date=new Date(Number(year),Number(month)-1,Number(day));
  return `${fmt(date)}, ${hour}:${minute}`;
}
(async()=>{
  try{
    const list=await api.notifications();
    $("#main").innerHTML=`<h1>Notifications</h1><div class="card">${list.map(n=>`<div class="list-item"><span>${esc(n.text)}</span><span class="muted">${notificationDateTime(n.time)}</span></div>`).join("")||'<p class="muted">No notifications yet.</p>'}</div>`;
  }catch(error){
    $("#main").innerHTML=`<h1>Notifications</h1><div class="card">${esc(error.message||"Unable to load notifications")}</div>`;
  }
})();
