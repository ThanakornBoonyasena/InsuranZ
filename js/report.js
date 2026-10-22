// ---- Report ----
function reportTimestamp(value){
  const date=new Date(value);
  if(Number.isNaN(date.getTime()))return "—";
  return `${fmt(date)}, ${date.toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})}`;
}
async function reportPage(){
  const appointments=await api.reports();
  const list=appointments.map(a=>{
    const reports=Array.isArray(a.reports)?a.reports:[];
    const packages=Array.isArray(a.packages)?a.packages:[];
    return `<div class="card row ${openId==="r"+a.appointment_id?"open":""}">
      <div class="row-head" style="grid-template-columns:1fr 1fr auto" onclick="toggle('r${a.appointment_id}')">
        <div><b>${esc(a.customer_name)}</b></div>
        <div class="muted">Appointment ${fmt(a.appointment_date)}</div>
        <div class="muted">${reports.length} report${reports.length===1?"":"s"}</div>
      </div>
      <div class="detail">
        <div><b>Date and time</b>${reportTimestamp(a.appointment_date)}</div>
        <div><b>Packages</b>${packages.map(esc).join(", ")||"—"}</div>
        <div><b>Location</b>${esc(a.location)}</div>
        ${reports.map((r,i)=>`<div class="rep" style="grid-column:1/-1"><b>Report ${i+1}</b><span class="muted">${reportTimestamp(r.create_timestamp)}</span><br>${esc(r.content)}</div>`).join("")}
      </div>
    </div>`;
  }).join("");
  return `<h1>Report</h1>${list||'<p class="muted">No reports yet.</p>'}`;
}
async function render(){
  $("#main").innerHTML='<h1>Report</h1><div class="card">Loading reports...</div>';
  try{
    $("#main").innerHTML=await reportPage();
  }catch(error){
    showToast(error.message||"Unable to load reports");
    $("#main").innerHTML=`<h1>Report</h1><div class="card">${esc(error.message||"Unable to load reports")}</div>`;
  }
}
mountNav("report");
render();
