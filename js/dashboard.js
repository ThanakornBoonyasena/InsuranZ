async function dashboardPage(){
  const userID=currentBrokerUserID();
  const [records,summary]=await Promise.all([api.insuranceRecords(userID,true),api.dashboardSummary(userID)]);
  const list=records.map(record=>{
    const customer=record.customer||{};
    return `<div class="card row dashboard-insurance-card ${openId===record.insurance_id?"open":""}" data-insurance-id="${record.insurance_id}">
      <div class="row-head" onclick="toggleDashboardInsurance(${record.insurance_id})"><div><b>#${record.insurance_id}</b></div>
        <div>${esc(customer.customer_name||"-")}</div><div class="muted">${fmt(record.sign_date)}</div><div>${statusBadge(record.status)}</div>
      </div><div class="detail insurance-detail" id="dashboard-insurance-detail-${record.insurance_id}"></div></div>`;
  }).join("");
  return `<h1>Dashboard</h1><div class="stats">
    <div class="card stat"><div class="muted"><span class="live"></span>Sales vs target</div><div class="big">${summary.percent_label}%</div><div class="bar" style="background:${summary.target_reached?"var(--ok)":"var(--bad)"}"><i style="width:${summary.progress_percent}%"></i></div><div class="muted" style="margin-top:8px">฿${Number(summary.cum_sale).toLocaleString()} of ฿${Number(summary.target).toLocaleString()} target</div></div>
    <div class="card stat"><div class="muted">Estimated commission</div><div class="big">฿${Number(summary.commission).toLocaleString()}</div><div class="muted" style="margin-top:8px">At ${summary.cum_point} points and ${summary.percent_label}% of target</div></div>
    <div class="card stat"><div class="muted">Cumulative points</div><div class="big">${summary.cum_point}</div><div class="muted" style="margin-top:8px">Total points earned so far</div></div>
    <div class="card stat"><div class="muted">Insurance stats</div><div class="mini"><div><b>${summary.total_insurances}</b><span class="muted">Records</span></div><div><b class="s-warn">${summary.pending}</b><span class="muted">Pending</span></div><div><b class="s-ok">${summary.approved}</b><span class="muted">Approved</span></div><div><b class="s-bad">${summary.denied}</b><span class="muted">Denied</span></div></div></div>
  </div><div class="h2">Insurance records</div>${list||'<p class="muted">No insurance records yet.</p>'}`;
}async function toggleDashboardInsurance(id){
  const nextOpenId=openId===id?null:id;
  document.querySelectorAll("[data-insurance-id]").forEach(card=>{
    card.classList.toggle("open",nextOpenId!==null&&card.dataset.insuranceId===String(nextOpenId));
  });
  openId=nextOpenId;
  if(openId!==id)return;
  const detail=document.getElementById(`dashboard-insurance-detail-${id}`);
  if(!detail)return;
  detail.innerHTML="<span class=muted>Loading insurance details...</span>";
  try{
    const record=await loadInsuranceDetail(id,currentBrokerUserID());
    if(openId===id)detail.innerHTML=insuranceDetailHTML(record).replace(/^<div[^>]*>|<\/div>$/g,"");
  }catch(error){if(openId===id)detail.innerHTML=`<span class="s-bad">${esc(error.message||"Unable to load insurance details")}</span>`}
}

async function render(){
  $("#main").innerHTML='<h1>Dashboard</h1><div class="card pad">Loading dashboard...</div>';
  try{
    $("#main").innerHTML=await dashboardPage();
  }catch(error){
    showToast(error.message||"Unable to load dashboard");
    $("#main").innerHTML=`<h1>Dashboard</h1><div class="card pad">${esc(error.message||"Unable to load dashboard")}</div>`;
  }
}

mountNav("dashboard");
render();




