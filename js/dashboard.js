async function dashboardPage(){
  const mine=(await api.insurances()).filter(i=>i.broker===db.brokerProfile.id);
  const s=await api.commissionSettings(),t=await api.commissionTable();
  const target=+s.target||0,pts=db.brokerProfile.points;
  const ap=mine.filter(i=>i.status===true),de=mine.filter(i=>i.status===false),pe=mine.filter(i=>i.status===null);
  const sum=a=>a.reduce((x,i)=>x+i.payment_amount,0);
  const pct=target?sum(ap)/target*100:0;
  let est=0;
  if(t){const cs=t.cols.map(x=>x===""?NaN:+x),rs=t.rows.map(x=>x===""?NaN:+x);let cj=-1,ri=-1;
    cs.forEach((c,j)=>{if(c<=pct&&(cj<0||c>cs[cj]))cj=j});rs.forEach((r,i)=>{if(r<=pts&&(ri<0||r>rs[ri]))ri=i});
    if(cj>=0&&ri>=0)est=+t.cells[ri][cj]||0}
  const list=mine.map(i=>`<div class="card row ${openId===i.insurance_id?"open":""}"><div class="row-head" onclick="toggle(${i.insurance_id})"><div><b>#${i.insurance_id}</b></div><div>${esc(i.customer.customer_name)}</div><div class="muted">${fmt(i.sign_date)}</div><div>${statusBadge(i.status)}</div></div><div class="detail"><div><b>Type</b>${esc(i.type)}</div><div><b>Selling case</b>${esc(i.selling_case)}</div><div><b>Payment</b>${i.payment_amount} every ${i.payment_interval_months} month(s)</div><div><b>Customer age</b>${i.customer.customer_age}</div><div><b>Health info</b>${esc(i.customer.health_info)}</div><div><b>Customer since</b>${fmt(i.customer.create_timestamp)}</div><div style="grid-column:1/-1"><b>Condition</b>${esc(i.additional_detail)||"—"}</div>${pkgHTML(i)}</div></div>`).join("");
  return `<h1>Dashboard</h1><div class="stats">
    <div class="card stat"><div class="muted"><span class="live"></span>Sales vs target (live)</div><div class="big">${pct.toFixed(1)}%</div><div class="bar" style="background:${pct<100?"var(--bad)":"var(--ok)"}"><i style="width:${Math.min(pct,100)}%"></i></div><div class="muted" style="margin-top:8px">฿${sum(ap)} of ฿${target} target</div></div>
    <div class="card stat"><div class="muted">Estimated commission</div><div class="big">฿${est}</div><div class="muted" style="margin-top:8px">At ${pts} points and ${pct.toFixed(0)}% of target</div></div>
    <div class="card stat"><div class="muted">Cumulative points</div><div class="big">${pts}</div><div class="muted" style="margin-top:8px">Total points earned so far</div></div>
    <div class="card stat"><div class="muted">Insurance stats</div><div class="mini"><div><b>${mine.length}</b><span class="muted">Sold</span></div><div><b class="s-warn">${pe.length}</b><span class="muted">Pending</span></div><div><b class="s-ok">${ap.length}</b><span class="muted">Approved</span></div><div><b class="s-bad">${de.length}</b><span class="muted">Denied</span></div></div></div>
  </div><div class="h2">My insurance sales</div>${list||'<p class="muted">No sales yet.</p>'}`;
}
async function render(){persist();$("#main").innerHTML=await dashboardPage()}
mountNav("dashboard");render();
setInterval(()=>{reloadDb();render()},5000);
