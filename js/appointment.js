// ---- Appointment ----
const now=new Date();let calY=now.getFullYear(),calM=now.getMonth(),ap=null,apSaved="";
const iso=(y,m,d)=>`${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
const jc=o=>JSON.parse(JSON.stringify(o));
function calMove(n){calM+=n;if(calM<0){calM=11;calY--}if(calM>11){calM=0;calY++}render()}
async function appointmentPage(){
  const first=new Date(calY,calM,1),days=new Date(calY,calM+1,0).getDate();let cells="".padEnd(0);
  for(let k=0;k<first.getDay();k++)cells+="<div></div>";
  for(let d=1;d<=days;d++){const key=iso(calY,calM,d);
    cells+=`<div class="day ${key===iso(now.getFullYear(),now.getMonth(),now.getDate())?"today":""}" onclick="apptForm(null,'${key}')"><div class="n">${d}</div>${db.appointments.filter(a=>a.appointment_date.slice(0,10)===key).map(a=>`<div class="appt" onclick="event.stopPropagation();apptForm(${a.id})"><b>${esc(a.customer_name)}</b><br>${a.appointment_date.slice(11,16)} · ${esc(a.location)}</div>`).join("")}</div>`}
  return `<div class="calhead"><button class="btn" onclick="calMove(-1)">‹</button><h1>${first.toLocaleString("en-GB",{month:"long",year:"numeric"})}</h1><button class="btn" onclick="calMove(1)">›</button></div><div class="cal">${["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d=>`<div class="dow">${d}</div>`).join("")}${cells}</div>`;
}
function apptForm(id,day){
  const a=id?db.appointments.find(x=>x.id===id):null;
  ap=a?jc(a):{id:null,customer_name:db.customers[0].customer_name,appointment_date:day+"T09:00",location:"",packages:[],reports:[]};
  apSaved=JSON.stringify(ap);drawAppt();$("#overlay").classList.add("show");
}
function drawAppt(){
  $("#modal").className="card modal wide";
  $("#modal").innerHTML=`<h1>${ap.id===null?"New appointment":"Appointment"}</h1><div class="cols"><div>
  <label>Customer</label><select onchange="ap.customer_name=this.value;drawActs()">${db.customers.map(c=>`<option ${c.customer_name===ap.customer_name?"selected":""}>${esc(c.customer_name)}</option>`).join("")}</select>
  <label>Date and time</label><input type="datetime-local" value="${ap.appointment_date}" oninput="ap.appointment_date=this.value;drawActs()" onchange="ap.appointment_date=this.value;drawActs()">
  <label>Packages to discuss</label><div class="muted" style="font-size:12px;margin-bottom:6px">Press enter or add a comma after each tag</div><div class="tagbox" id="tagbox" onclick="$('#tagin').focus()">${tagsInner()}</div><div class="tagfoot"><span class="muted" id="tagcount">${tagCount()}</span><button class="btn bad" onclick="clearTags()">Remove All</button></div><datalist id="pk">${db.packages.map(p=>`<option value="${esc(p.package_name)}">`).join("")}</datalist>
  <label>Location</label><input value="${esc(ap.location)}" oninput="ap.location=this.value;drawActs()">
  </div><div>${ap.id===null?"":repsHTML()}</div></div><div class="actions" id="apacts"></div>`;
  drawActs();
}
function drawActs(){
  const dirty=JSON.stringify(ap)!==apSaved;
  $("#apacts").innerHTML=ap.id===null?'<button class="btn" onclick="closeModal()">Cancel</button><button class="btn ok" onclick="saveAppt()">Make</button>':`${dirty?'<button class="btn ok" onclick="saveAppt()">Save</button>':""}<button class="btn bad" onclick="abortAppt()">Abort</button>`;
}
const tagCount=()=>`${ap.packages.length} package${ap.packages.length===1?"":"s"} added`;
const tagsInner=()=>ap.packages.map((p,i)=>`<span class="chip">${esc(p)}<button title="Remove" onclick="event.stopPropagation();rmTag(${i})">×</button></span>`).join("")+`<input id="tagin" list="pk" onkeydown="tagKey(event,this)">`;
function drawTags(){$("#tagbox").innerHTML=tagsInner();$("#tagcount").textContent=tagCount();$("#tagin").focus();drawActs()}
function rmTag(i){ap.packages.splice(i,1);drawTags()}
function clearTags(){ap.packages=[];drawTags()}
function tagKey(e,el){
  if(e.key==="Enter"||e.key===","){e.preventDefault();const v=el.value.replace(/,/g,"").trim();if(v&&!ap.packages.includes(v)){ap.packages.push(v);drawTags()}else el.value=""}
  else if(e.key==="Backspace"&&!el.value&&ap.packages.length){ap.packages.pop();drawTags()}
}

function repsHTML(){return `<label>Reports</label>${ap.reports.map(r=>`<div class="rep"><span class="muted">${fmt(r.date)}</span> ${okBadge(r)}<br>${esc(r.report_note)}</div>`).join("")||'<p class="muted">No reports yet.</p>'}<div id="repnew"><button class="add" style="width:100%;height:34px" onclick="newRep()">+</button></div>`}
function newRep(){$("#repnew").innerHTML=`<textarea id="rnote" rows="3" placeholder="Write the report..."></textarea><label style="display:flex;gap:6px;align-items:center"><input id="rok" type="checkbox" style="width:auto"> Successful</label><div class="actions"><button class="btn ok" id="saverep" onclick="saveRep()">Save report</button></div>`}
async function saveRep(){
  const note=$("#rnote").value.trim();if(!note)return;
  const button=$("#saverep");if(button.disabled)return;
  button.disabled=true;button.textContent="Saving…";
  const report={appointment_id:Number(ap.id),customer_name:ap.customer_name,report_note:note,scheduled_date_time:ap.appointment_date,is_successful:$("#rok").checked};
  try{
    await api.saveReport(report);
    const savedReport={date:new Date().toISOString().slice(0,16),report_note:note,is_successful:report.is_successful,scheduled_date_time:ap.appointment_date};
    const appointment=db.appointments.find(a=>a.id===ap.id);
    if(appointment)appointment.reports.push(jc(savedReport));
    ap.reports.push(savedReport);
    apSaved=JSON.stringify({...JSON.parse(apSaved),reports:ap.reports});
    persist();drawAppt();
    alert("Report saved. The backend also created the broker notification.");
  }catch(error){
    button.disabled=false;button.textContent="Save report";
    alert(error.message||"Unable to save report");
  }
}
function saveAppt(){
  if(!ap.customer_name||!ap.appointment_date)return;
  if(ap.id===null){ap.id=Math.max(0,...db.appointments.map(a=>a.id))+1;db.appointments.push(jc(ap))}
  else Object.assign(db.appointments.find(a=>a.id===ap.id),jc(ap));
  closeModal();render();
}
function abortAppt(){db.appointments=db.appointments.filter(a=>a.id!==ap.id);closeModal();render()}
async function render(){persist();$("#main").innerHTML=await appointmentPage()}
mountNav("appointment");render();
