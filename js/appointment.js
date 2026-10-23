// ---- Appointment ----
const now=new Date();let calY=now.getFullYear(),calM=now.getMonth(),ap=null,apSaved="",appointments=[],customers=[],packageNames=[];
const iso=(y,m,d)=>`${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
const jc=o=>JSON.parse(JSON.stringify(o));
function localDateTime(value){const date=new Date(value);return `${iso(date.getFullYear(),date.getMonth(),date.getDate())}T${String(date.getHours()).padStart(2,"0")}:${String(date.getMinutes()).padStart(2,"0")}`}
function todayKey(){const date=new Date();return iso(date.getFullYear(),date.getMonth(),date.getDate())}
function appointmentMinDate(){return ap.id===null?`${todayKey()}T00:00`:""}
function thailandDateKey(value){const parts=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Bangkok",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date(value));const part=type=>parts.find(item=>item.type===type)?.value||"";return part("year")+"-"+part("month")+"-"+part("day")}
function canAbortAppointment(){if(ap.id===null)return false;const saved=JSON.parse(apSaved);return thailandDateKey(saved.appointment_date)>=thailandDateKey(new Date())}
function localDateKey(value){const date=new Date(value);return iso(date.getFullYear(),date.getMonth(),date.getDate())}
function localTime(value){return new Date(value).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})}
function calMove(n){calM+=n;if(calM<0){calM=11;calY--}if(calM>11){calM=0;calY++}render()}
async function appointmentPage(){
  const data=await api.appointmentData();
  appointments=data.appointments;
  customers=data.customers;
  packageNames=data.packages;
  const first=new Date(calY,calM,1),days=new Date(calY,calM+1,0).getDate();let cells="".padEnd(0);
  for(let k=0;k<first.getDay();k++)cells+="<div></div>";
  for(let d=1;d<=days;d++){const key=iso(calY,calM,d);
    cells+=`<div class="day ${key===iso(now.getFullYear(),now.getMonth(),now.getDate())?"today":""}" onclick="apptForm(null,'${key}')"><div class="n"><span>${d}</span><button class="day-plus" title="Add appointment" aria-label="Add appointment on ${key}" onclick="event.stopPropagation();apptForm(null,'${key}')">+</button></div>${appointments.filter(a=>localDateKey(a.appointment_date)===key).map(a=>`<div class="appt" onclick="event.stopPropagation();apptForm(${a.id})"><b>${esc(a.customer_name)}</b><br>${localTime(a.appointment_date)} · ${esc(a.location)}</div>`).join("")}</div>`}
  return `<div class="calhead"><button class="btn" onclick="calMove(-1)">‹</button><h1>${first.toLocaleString("en-GB",{month:"long",year:"numeric"})}</h1><button class="btn" onclick="calMove(1)">›</button></div><div class="cal">${["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d=>`<div class="dow">${d}</div>`).join("")}${cells}</div>`;
}
function apptForm(id,day){
  const a=id?appointments.find(x=>x.id===id):null;
  ap=a?jc(a):{id:null,customer_id:customers[0]?.customer_id||"",customer_name:customers[0]?.customer_name||"",sell_case_id:null,user_id:Number(store.get("user_id")),appointment_date:day+"T09:00",location:"",packages:[],reports:[]};
  apSaved=JSON.stringify(ap);drawAppt();$("#overlay").classList.add("show");
}
function drawAppt(){
  $("#modal").className="card modal wide";
  $("#modal").innerHTML=`<h1>${ap.id===null?"New appointment":"Appointment"}</h1><div class="cols"><div>
  <label>Customer</label><select value="${esc(ap.customer_id)}" onchange="ap.customer_id=this.value;ap.customer_name=customers.find(c=>c.customer_id===this.value)?.customer_name||'';drawActs()">${customers.map(c=>`<option value="${esc(c.customer_id)}" ${String(c.customer_id)===String(ap.customer_id)?"selected":""}>${esc(c.customer_name)}</option>`).join("")}</select>
  <label>Assigned user ID</label><input value="${esc(ap.user_id??store.get("user_id")??"")}" readonly>
  <label>Date and time</label><input type="datetime-local" min="${appointmentMinDate()}" value="${localDateTime(ap.appointment_date)}" oninput="ap.appointment_date=this.value;drawActs()" onchange="ap.appointment_date=this.value;drawActs()">
  <label>Packages to discuss</label><div class="muted" style="font-size:12px;margin-bottom:6px">Choose one or more packages from the list.</div><div class="package-picker"><div class="tagbox" id="tagbox" onclick="$('#tagin').focus()">${tagsInner()}</div><div class="package-options" id="package-options" role="listbox" hidden></div></div><div class="tagfoot"><span class="muted" id="tagcount">${tagCount()}</span><button class="btn bad" onclick="clearTags()">Remove All</button></div>
  <label>Location</label><input value="${esc(ap.location)}" oninput="ap.location=this.value;drawActs()">
  </div><div>${ap.id===null?"":repsHTML()}</div></div><div class="actions" id="apacts"></div>`;
  drawActs();
}
function drawActs(){
  const dirty=JSON.stringify(ap)!==apSaved;
  const actions=[];
  if(ap.id===null)actions.push('<button class="btn" onclick="closeModal()">Cancel</button>','<button class="btn ok" onclick="saveAppt()">Make</button>');
  else{if(dirty)actions.push('<button class="btn ok" onclick="saveAppt()">Save</button>');if(canAbortAppointment())actions.push('<button class="btn bad" onclick="abortAppt()">Abort</button>')}
  $("#apacts").innerHTML=actions.join("");
}
const tagCount=()=>`${ap.packages.length} package${ap.packages.length===1?"":"s"} added`;
const tagsInner=()=>ap.packages.map((p,i)=>`<span class="chip">${esc(p)}<button type="button" title="Remove ${esc(p)}" aria-label="Remove ${esc(p)}" onclick="event.stopPropagation();rmTag(${i})">×</button></span>`).join("")+`<input id="tagin" autocomplete="off" placeholder="Choose a package..." aria-label="Search packages to discuss" onfocus="showPackageOptions()" oninput="drawPackageOptions()" onblur="setTimeout(hidePackageOptions,150)" onkeydown="tagKey(event,this)">`;
function drawTags(){$("#tagbox").innerHTML=tagsInner();$("#tagcount").textContent=tagCount();$("#tagin").focus();drawPackageOptions();drawActs()}
function rmTag(i){ap.packages.splice(i,1);drawTags()}
function clearTags(){ap.packages=[];drawTags()}
function availablePackages(){
  const query=$("#tagin")?.value.trim().toLocaleLowerCase()||"";
  return packageNames.filter(name=>!ap.packages.includes(name)&&name.toLocaleLowerCase().includes(query));
}
function showPackageOptions(){const list=$("#package-options");if(list){drawPackageOptions();list.hidden=false}}
function hidePackageOptions(){const list=$("#package-options");if(list&&document.activeElement?.id!=="tagin")list.hidden=true}
function drawPackageOptions(){
  const list=$("#package-options");
  if(!list)return;
  const options=availablePackages();
  list.innerHTML=options.map((name,index)=>`<button type="button" class="package-option" role="option" onclick="event.stopPropagation();selectPackage(${packageNames.indexOf(name)})"><span>${esc(name)}</span></button>`).join("")||'<div class="package-empty">No matching packages</div>';
  list.hidden=false;
}
function selectPackage(index){
  const selected=packageNames[index];
  if(selected&&!ap.packages.includes(selected))ap.packages.push(selected);
  drawTags();
}
function tagKey(e,el){
  if(e.key==="Enter"||e.key===","){
    e.preventDefault();
    const matches=availablePackages();
    const exact=matches.find(name=>name.toLocaleLowerCase()===el.value.trim().toLocaleLowerCase());
    if(exact)selectPackage(packageNames.indexOf(exact));else if(matches.length)selectPackage(packageNames.indexOf(matches[0]));
  }
  else if(e.key==="Backspace"&&!el.value&&ap.packages.length){ap.packages.pop();drawTags()}
  else if(e.key==="Escape")hidePackageOptions();
}

function repsHTML(){return `<label>Reports</label>${ap.reports.map(r=>`<div class="rep"><span class="muted">${fmt(r.date)}</span><br>${esc(r.report_note)}</div>`).join("")||'<p class="muted">No reports yet.</p>'}<div id="repnew"><button class="add" style="width:100%;height:34px" onclick="newRep()">+</button></div>`}
function newRep(){$("#repnew").innerHTML=`<textarea id="rnote" rows="3" placeholder="Write the report..."></textarea><div class="actions"><button class="btn ok" id="saverep" onclick="saveRep()">Save report</button></div>`}
async function saveRep(){
  const note=$("#rnote").value.trim();if(!note)return;
  const button=$("#saverep");if(button.disabled)return;
  button.disabled=true;button.textContent="Saving…";
  const report={appointment_id:Number(ap.id),report_note:note};
  try{
    const result=await api.saveReport(report);
    const saved=result.data;
    ap.reports.push({report_id:saved.report_id,date:saved.create_timestamp,report_note:saved.content});
    const savedAppointment=JSON.parse(apSaved);
    savedAppointment.reports=ap.reports;
    apSaved=JSON.stringify(savedAppointment);drawAppt();
    alert("Report saved. The backend also created the broker notification.");
  }catch(error){
    button.disabled=false;button.textContent="Save report";
    alert(error.message||"Unable to save report");
  }
}
async function saveAppt(){
  if(!ap.customer_id||!ap.appointment_date||!ap.location.trim())return;
  if(ap.id===null&&ap.appointment_date.slice(0,10)<todayKey()){
    alert("Appointments cannot be scheduled before today's date.");
    return;
  }
  try{
    const result=await api.saveAppointment(ap);
    if(ap.id===null)ap.id=result.appointment_id;
    closeModal();
    await render();
  }catch(error){alert(error.message||"Unable to save appointment")}
}
async function abortAppt(){
  if(ap.id===null){closeModal();return}
  try{await api.deleteAppointment(ap.id);closeModal();await render()}
  catch(error){alert(error.message||"Unable to abort appointment")}
}
async function render(){
  $("#main").innerHTML='<div class="card pad">Loading appointments...</div>';
  try{$("#main").innerHTML=await appointmentPage()}
  catch(error){showToast(error.message||"Unable to load appointments");$("#main").innerHTML=`<div class="card pad">${esc(error.message||"Unable to load appointments")}</div>`}
}
mountNav("appointment");render();
