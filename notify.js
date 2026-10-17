mountNav("notify");
(async()=>{
  const list=await api.notifications();
  $("#main").innerHTML=`<h1>Notifications</h1><div class="card">${list.map(n=>`<div class="list-item"><span>${esc(n.text)}</span><span class="muted">${esc(n.time)}</span></div>`).join("")}</div>`;
})();
