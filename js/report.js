// ---- Report ----
async function reportPage(){
  const list=db.appointments.filter(a=>a.reports.length).map(a=>`<div class="card row ${openId==="r"+a.id?"open":""}"><div class="row-head" style="grid-template-columns:1fr 1fr 1fr" onclick="toggle('r${a.id}')"><div><b>${esc(a.customer_name)}</b></div><div class="muted">Appointment ${fmt(a.appointment_date)}</div><div class="muted">Broker: ${esc(db.brokerProfile.name)}</div></div><div class="detail"><div><b>Date and time</b>${fmt(a.appointment_date)}, ${a.appointment_date.slice(11,16)}</div><div><b>Packages</b>${a.packages.map(esc).join(", ")||"—"}</div><div><b>Location</b>${esc(a.location)}</div>${a.reports.map((r,i)=>`<div class="rep" style="grid-column:1/-1"><b>Report ${i+1}</b><span class="muted">${fmt(r.date)}, ${r.date.slice(11,16)}</span> ${okBadge(r)}<br>${esc(r.report_note)}</div>`).join("")}</div></div>`).join("");
  return `<h1>Report</h1>${list||'<p class="muted">No reports yet.</p>'}`;
}
async function render(){persist();$("#main").innerHTML=await reportPage()}
mountNav("report");render();
