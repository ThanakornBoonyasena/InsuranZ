// ---- Report ----
const reportDetailsCache=new Map();

function reportTimestamp(value){
  const date=new Date(value);
  if(Number.isNaN(date.getTime()))return "-";
  return `${fmt(date)}, ${date.toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})}`;
}

async function reportPage(){
  const appointments=await api.reports(true);
  const list=appointments.map(a=>`<div class="card row report-card ${openId==="r"+a.appointment_id?"open":""}" data-appointment-id="${a.appointment_id}">
    <div class="row-head" style="grid-template-columns:1fr 1fr auto" onclick="toggleReport(${a.appointment_id})">
      <div><b>${esc(a.customer_name)}</b></div><div class="muted">Appointment ${fmt(a.appointment_date)}</div>
      <div class="muted">${a.report_count} report${a.report_count===1?"":"s"}</div>
    </div><div class="detail" id="report-detail-${a.appointment_id}"></div></div>`).join("");
  return `<h1>Report</h1>${list||'<p class="muted">No reports yet.</p>'}`;
}
async function toggleReport(id){
  const key="r"+id;
  openId=openId===key?null:key;
  document.querySelectorAll(".report-card").forEach(card=>card.classList.toggle("open",openId===key&&card.dataset.appointmentId===String(id)));
  if(openId!==key)return;
  const detail=document.getElementById(`report-detail-${id}`);
  if(!detail)return;
  detail.innerHTML='<span class="muted">Loading report details...</span>';
  try{
    let appointment=reportDetailsCache.get(String(id));
    if(!appointment){appointment=(await api.reports(false,id))[0];if(appointment)reportDetailsCache.set(String(id),appointment)}
    if(!appointment)throw new Error("Appointment report not found");
    const reports=Array.isArray(appointment.reports)?appointment.reports:[];
    const packages=Array.isArray(appointment.packages)?appointment.packages:[];
    const html=`<div><b>Date and time</b>${reportTimestamp(appointment.appointment_date)}</div>
      <div><b>Packages</b>${packages.map(esc).join(", ")||"-"}</div>
      <div><b>Location</b>${esc(appointment.location)}</div>
      ${reports.map((report,index)=>`<div class="rep" style="grid-column:1/-1"><b>Report ${index+1}</b><span class="muted">${reportTimestamp(report.create_timestamp)}</span><br>${esc(report.content)}</div>`).join("")}`;
    if(openId===key)detail.innerHTML=html;
  }catch(error){if(openId===key)detail.innerHTML=`<span class="s-bad">${esc(error.message||"Unable to load report details")}</span>`}
}

async function render(){
  $("#main").innerHTML='<h1>Report</h1><div class="card">Loading reports...</div>';
  try{
    $("#main").innerHTML=await reportPage();
  }
  catch(error){
    showToast(error.message||"Unable to load reports");
    $("#main").innerHTML=`<h1>Report</h1><div class="card">${esc(error.message||"Unable to load reports")}</div>`;
  }
}

mountNav("report");
render();




