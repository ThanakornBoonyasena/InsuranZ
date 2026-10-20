async function dashboardPage(){
  const records=await api.insuranceRecords();
  const userID=String(db.brokerProfile.id||"").match(/\d+$/)?.[0]||"";
  const sellingCases=await api.sellingCases(userID);
  const settings=await api.commissionSettings();
  const table=await api.commissionTable();
  const target=Number(settings.target)||0;
  const points=Number(db.brokerProfile.points)||0;
  const approved=records.filter(record=>record.status===true);
  const denied=records.filter(record=>record.status===false);
  const pending=records.filter(record=>record.status===null);
  const approvedPremium=approved.reduce((sum,record)=>sum+Number(record.payment_amount||0),0);
  const percent=target?approvedPremium/target*100:0;

  let estimatedCommission=0;
  if(table){
    const columns=table.cols.map(value=>value===""?NaN:Number(value));
    const rows=table.rows.map(value=>value===""?NaN:Number(value));
    let columnIndex=-1,rowIndex=-1;
    columns.forEach((value,index)=>{
      if(value<=percent&&(columnIndex<0||value>columns[columnIndex]))columnIndex=index;
    });
    rows.forEach((value,index)=>{
      if(value<=points&&(rowIndex<0||value>rows[rowIndex]))rowIndex=index;
    });
    if(columnIndex>=0&&rowIndex>=0){
      estimatedCommission=Number(table.cells[rowIndex]?.[columnIndex])||0;
    }
  }

  const list=records.map(record=>{
    const customer=record.customer||{};
    return `<div class="card row ${openId===record.insurance_id?"open":""}" data-insurance-id="${record.insurance_id}">
      <div class="row-head" onclick="toggleDashboardInsurance(${record.insurance_id})">
        <div><b>#${record.insurance_id}</b></div>
        <div>${esc(customer.customer_name||"-")}</div>
        <div class="muted">${fmt(record.sign_date)}</div>
        <div>${statusBadge(record.status)}</div>
      </div>
      <div class="detail">
        <div><b>Type</b>${esc(record.type||"-")}</div>
        <div><b>Payment</b>${Number(record.payment_amount||0).toLocaleString()} every ${record.payment_interval_month||"-"} month(s)</div>
        <div><b>Customer telephone</b>${esc(customer.telephone_number||"-")}</div>
        <div><b>Customer age</b>${customer.customer_age??"-"}</div>
        <div><b>Health condition</b>${esc(customer.health_info||"-")}</div>
        ${customer.create_timestamp?`<div><b>Customer since</b>${fmt(customer.create_timestamp)}</div>`:""}
        <div style="grid-column:1/-1"><b>Additional detail</b>${esc(record.additional_detail||"-")}</div>
      </div>
    </div>`;
  }).join("");

  const caseList=sellingCases.map(saleCase=>{
    const appointment=saleCase.appointment||{};
    const assignedBrokers=(saleCase.brokers||[]).map(broker=>
      `<span class="badge">${esc(broker.user_name)} (#${broker.user_id})</span>`
    ).join(" ")||"-";
    return `<div class="card pad" style="margin:8px 0">
      <div class="calhead"><b>Case #${saleCase.sell_case_id}</b><span class="badge">${esc(saleCase.case_status)}</span><span style="flex:1"></span><span class="muted">${fmt(appointment.appointment_date)}</span></div>
      <div class="detail">
        <div><b>Customer</b>${esc(appointment.customer_name||"-")}</div>
        <div><b>Appointment</b>#${appointment.appointment_id??"-"}</div>
        <div><b>Location</b>${esc(appointment.location||"-")}</div>
        <div><b>Assigned brokers</b>${assignedBrokers}</div>
      </div>
    </div>`;
  }).join("");

  return `<h1>Dashboard</h1><div class="stats">
    <div class="card stat"><div class="muted"><span class="live"></span>Approved premium vs target</div><div class="big">${percent.toFixed(1)}%</div><div class="bar" style="background:${percent<100?"var(--bad)":"var(--ok)"}"><i style="width:${Math.min(percent,100)}%"></i></div><div class="muted" style="margin-top:8px">฿${approvedPremium.toLocaleString()} of ฿${target.toLocaleString()} target</div></div>
    <div class="card stat"><div class="muted">Estimated commission</div><div class="big">฿${estimatedCommission.toLocaleString()}</div><div class="muted" style="margin-top:8px">At ${points} points and ${percent.toFixed(0)}% of target</div></div>
    <div class="card stat"><div class="muted">Cumulative points</div><div class="big">${points}</div><div class="muted" style="margin-top:8px">Total points earned so far</div></div>
    <div class="card stat"><div class="muted">Insurance stats</div><div class="mini"><div><b>${records.length}</b><span class="muted">Records</span></div><div><b class="s-warn">${pending.length}</b><span class="muted">Pending</span></div><div><b class="s-ok">${approved.length}</b><span class="muted">Approved</span></div><div><b class="s-bad">${denied.length}</b><span class="muted">Denied</span></div></div></div>
  </div><div class="h2">Selling cases</div>${caseList||'<p class="muted">No selling cases assigned.</p>'}<div class="h2">Insurance records</div>${list||'<p class="muted">No insurance records yet.</p>'}`;
}

function toggleDashboardInsurance(id){
  const nextOpenId=openId===id?null:id;
  document.querySelectorAll("[data-insurance-id]").forEach(card=>{
    card.classList.toggle("open",nextOpenId!==null&&card.dataset.insuranceId===String(nextOpenId));
  });
  openId=nextOpenId;
}

async function render(){
  $("#main").innerHTML='<h1>Dashboard</h1><div class="card pad">Loading dashboard...</div>';
  try{
    $("#main").innerHTML=await dashboardPage();
  }catch(error){
    $("#main").innerHTML=`<h1>Dashboard</h1><div class="card pad">${esc(error.message||"Unable to load dashboard")}</div>`;
  }
}

mountNav("dashboard");
render();
