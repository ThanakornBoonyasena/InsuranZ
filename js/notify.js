mountNav("notify");
(async()=>{
  try{
    const list=await api.notifications();
    $("#main").innerHTML=`<h1>Notifications</h1><div class="card">${list.map(n=>`<div class="list-item"><span>${esc(n.text)}</span><span class="muted">${esc(n.time)}</span></div>`).join("")||'<p class="muted">No notifications yet.</p>'}</div>`;
  }catch(error){
    $("#main").innerHTML=`<h1>Notifications</h1><div class="card">${esc(error.message||"Unable to load notifications")}</div>`;
  }
})();
