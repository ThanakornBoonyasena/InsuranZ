// Sign Contract (broker). Edited insurance is listed with a Sign button; "+" starts a new contract.
// Signature image and presentation metadata are retained in local demo storage.
const baht=n=>"฿"+Number(n||0).toLocaleString();
let CC={customers:[],packages:[]},cf=null;

function ageFromDOB(value){
  if(!value)return "";
  const birth=new Date(value);
  if(Number.isNaN(birth.getTime()))return "";
  const today=new Date();
  let age=today.getFullYear()-birth.getFullYear();
  if(today.getMonth()<birth.getMonth()||(today.getMonth()===birth.getMonth()&&today.getDate()<birth.getDate()))age--;
  return age>=0?age:"";
}

function calcContract(pkgs,claims){
  const items=pkgs.map(p=>{
    const premiumPerMonth=Number(p.package_price)||0;
    const periodMonths=Number(p.payment_period)||0;
    return {packageID:p.package_id,name:p.package_name,claim:Number(claims[p.package_id])||0,
      premiumPerMonth,premiumPerYear:premiumPerMonth*12,periodMonths,totalPayable:premiumPerMonth*periodMonths};
  });
  return {items,claim:items.reduce((total,item)=>total+item.claim,0)};
}

async function signContractPage(){
  const userID=currentBrokerUserID();
  const ins=await api.insuranceRecords(userID,true);
  const edited=ins.filter(i=>i.status==="Edited");
  const rows=edited.map(i=>{
    const name=i.customer_name||i.customer?.customer_name||"-";
    return `<div class="card row ${openId===i.insurance_id?"open":""}" data-contract-id="${i.insurance_id}">
      <div class="row-head" onclick="toggleSignContract(${i.insurance_id})"><div><b>#${i.insurance_id}</b></div><div>${esc(name)}</div><div class="muted">${fmt(i.sign_date)}</div>
        <div class="btns" onclick="event.stopPropagation()"><button class="btn" onclick="openContract(${i.insurance_id})">Sign again</button></div>
      </div><div class="detail" id="contract-detail-${i.insurance_id}"></div></div>`;
  }).join("");
  return `<div class="calhead"><h1>Sign Contract</h1><span style="flex:1"></span><button class="add" style="width:44px;height:36px" title="New contract" onclick="openContract()">+</button></div>${rows||'<div class="card pad">No edited insurance to sign.</div>'}`;
}
async function openContract(insId){
  try{
    const userID=currentBrokerUserID();
    const [customers,packages,i,contracts]=await Promise.all([api.customerRecords(),api.packages(),insId?api.insuranceRecord(insId,userID):Promise.resolve(null),api.contracts()]);
    CC={customers,packages:i?[i.package]:packages};
    let cid=i&&(i.customer_id??i.customer?.customer_id);
    if((cid===undefined||cid===null||cid==="")&&i)cid=customers.find(c=>c.customer_name===(i.customer_name||i.customer?.customer_name))?.customer_id;
    if(i){
      // Existing contract: read-only summary + signature. Reads the contract data from the insurance record.
      const previous=contracts.find(contract=>Number(contract.insurance_id)===Number(insId))||{};
      const ex={...previous,...i.contract,...i};
      const packageID=i.package_id??i.package?.package_id;
      const savedGuarantor=i.guarantor_information&&Object.keys(i.guarantor_information).length
        ?i.guarantor_information:ex.guarantor||{};
      cf={insId,customerId:String(cid??""),readonly:true,step:2,signed:false,
        g:{name:"",age:"",job:"",address:"",relation:"",...savedGuarantor},
        condition:i.additional_detail||"",
        pkgIds:packageID?[Number(packageID)]:[],
        claims:packageID?{[packageID]:Number(i.insurance_claim)||0}:{}};
    }else{
      cf={insId:null,customerId:"",readonly:false,step:1,signed:false,g:{name:"",age:"",job:"",address:"",relation:""},condition:"",pkgIds:[],claims:{}};
    }
    drawContract();
    $("#overlay").classList.add("show");
  }catch(error){
    $("#main").innerHTML=`<h1>Sign Contract</h1><div class="card pad">${esc(error?.message||"Unable to open the contract form")}</div>`;
  }
}

async function toggleSignContract(id){
  openId=openId===id?null:id;
  document.querySelectorAll(".card.row[data-contract-id]").forEach(card=>card.classList.toggle("open",openId===id&&card.dataset.contractId===String(id)));
  if(openId!==id)return;
  const detail=document.getElementById(`contract-detail-${id}`);
  if(!detail)return;
  detail.innerHTML='<span class="muted">Loading contract details...</span>';
  try{
    const record=await loadInsuranceDetail(id,currentBrokerUserID());
    if(openId===id)detail.innerHTML=`<div><b>Payment</b>${Number(record.package?.package_price||0).toLocaleString()} every ${record.package?.payment_period||"-"} month(s)</div><div style="grid-column:1/-1"><b>Condition</b>${esc(record.additional_detail)||"—"}</div>`;
  }catch(error){if(openId===id)detail.innerHTML=`<span class="s-bad">${esc(error.message||"Unable to load contract details")}</span>`}
}

function drawContract(){
  $("#modal").className="card modal wide";
  $("#modal").innerHTML=cf.step===1?formHTML():summaryHTML();
  if(cf.step===2)initSig();
}

function formHTML(){
  const gf=[["name","Name"],["age","Age"],["job","Job"],["address","Address"],["relation","Relation"]];
  return `<h1>New contract</h1>
  <div class="sec"><h2>1. Customer</h2>
    <select onchange="cf.customerId=this.value">
      <option value="">Select customer…</option>
      ${CC.customers.map(c=>`<option value="${esc(String(c.customer_id))}" ${String(c.customer_id)===String(cf.customerId)?"selected":""}>${esc(c.customer_name)}</option>`).join("")}
    </select></div>
  <div class="sec"><h2>2. Guarantor information</h2><div class="g2">
    ${gf.map(([k,l])=>`<div><label>${l}</label><input ${k==="age"?'inputmode="numeric"':""} value="${esc(cf.g[k])}" oninput="${k==="age"?"this.value=this.value.replace(/[^0-9]/g,'');":""}cf.g.${k}=this.value"></div>`).join("")}
  </div></div>
  <div class="sec"><h2>3. Packages</h2>
    ${CC.packages.map(p=>{const on=cf.pkgIds.includes(p.package_id);return `<div class="pkg">
      <label class="chk"><input type="checkbox" ${on?"checked":""} onchange="togglePkg(${p.package_id},this.checked)">${esc(p.package_name)}</label>
      ${on?`<input class="pkgsum" inputmode="numeric" placeholder="Claim (฿)" value="${esc(cf.claims[p.package_id]||"")}" oninput="this.value=this.value.replace(/[^0-9]/g,'');cf.claims[${p.package_id}]=this.value">`:""}
    </div>`}).join("")}
  </div>
  <p class="s-bad" id="cerr"></p>
  <div class="actions"><button class="btn" onclick="closeModal()">Cancel</button><button class="btn pri" onclick="contractNext()">Next</button></div>`;
}

function togglePkg(id,on){
  cf.pkgIds=on?[...new Set([...cf.pkgIds,id])]:cf.pkgIds.filter(x=>x!==id);
  drawContract();
}

function contractNext(){
  const miss=[];
  if(!String(cf.customerId??"").trim())miss.push("customer");
  for(const k of ["name","age","job","address","relation"])if(!String(cf.g[k]).trim())miss.push("guarantor "+k);
  if(!cf.pkgIds.length)miss.push("a package");
  for(const p of CC.packages)if(cf.pkgIds.includes(p.package_id)&&!(+cf.claims[p.package_id]>0))miss.push("Claim for "+p.package_name);
  if(miss.length){
    const error=$("#cerr");
    error.textContent="Please complete: "+miss.join(", ")+".";
    error.scrollIntoView({block:"nearest",behavior:"smooth"});
    return;
  }
  cf.step=2;cf.signed=false;drawContract();
}

function renderPackageCostRows(calc){
  if(!calc.items.length)return "<tr><td>No package</td><td>—</td></tr>";
  return calc.items.map(item=>{
    const periodYears=item.periodMonths/12;
    const periodLabel=Number.isInteger(periodYears)?`${periodYears} year(s)`:`${item.periodMonths} month(s)`;
    return `<tr><td>Package</td><td>${esc(item.name)}</td></tr>
      <tr><td>Claim</td><td>${baht(item.claim)}</td></tr>
      <tr><td>Premium per year</td><td>${baht(item.premiumPerYear)}</td></tr>
      <tr><td>Premium per month</td><td>${baht(item.premiumPerMonth)}</td></tr>
      <tr><td>Payment period</td><td>${periodLabel}</td></tr>
      <tr class="tot"><td>Total payable</td><td>${baht(item.totalPayable)}</td></tr>`;
  }).join("");
}

function summaryHTML(){
  const c=CC.customers.find(x=>String(x.customer_id)===String(cf.customerId))||{};
  const calc=calcContract(CC.packages.filter(p=>cf.pkgIds.includes(p.package_id)),cf.claims);
  const kv=(k,v,wide)=>`<div${wide?' style="grid-column:1/-1"':""}><b>${esc(k)}</b><span>${esc(v||"—")}</span></div>`;
  const jobs=Array.isArray(c.jobs)?c.jobs:[];
  const jobsHTML=jobs.length?jobs.map(job=>`<div class="customer-job"><div class="customer-job-fields">
    <div><b>Job name</b>${esc(job.job_name||"—")}</div>
    <div><b>Salary per month</b>${baht(job.salary_per_month)}</div>
    <div><b>Location</b>${esc(job.location||"—")}</div>
    <div><b>Job type</b>${esc(job.job_type||"—")}</div>
  </div></div>`).join(""):'<div class="customer-job">—</div>';
  return `<h1>${cf.readonly?"Re-sign contract":"Contract summary"}</h1>
  <div class="sec"><h2>Customer</h2><div class="sum">
    ${kv("Name",c.customer_name)}${kv("Age",ageFromDOB(c.customer_dob)??"")}${kv("Customer ID",c.customer_id)}${kv("Telephone number",c.telephone_number)}
    ${kv("Email",c.customer_email)}${kv("Address",c.customer_address)}
    ${kv("Gender",c.customer_gender)}${kv("Sex",c.customer_sex)}${kv("Date of birth",c.customer_dob?fmt(c.customer_dob):"")}${kv("Customer since",c.create_timestamp?fmt(c.create_timestamp):"")}
    ${kv("Health condition",c.health_info)}${kv("Health detail",c.health_detail,true)}
  </div></div>
  <div class="sec job-description"><h2>Job description</h2><div class="customer-job-list">${jobsHTML}</div></div>
  <div class="sec"><h2>Guarantor</h2><div class="sum">${kv("Name",cf.g.name)}${kv("Age",cf.g.age)}${kv("Job",cf.g.job)}${kv("Address",cf.g.address)}${kv("Relation",cf.g.relation)}</div></div>
  <div class="sec"><h2>Packages and cost</h2>
    <table class="cost">
      ${renderPackageCostRows(calc)}
    </table></div>
  <div class="sec"><h2>Condition</h2><p>${esc(cf.condition||"—")}</p></div>
  <div class="sec"><h2>Customer signature</h2>
    <p class="muted">Draw your signature in the box to enable the Sign button.</p>
    <canvas id="sig" width="720" height="150"></canvas>
    <div class="actions" style="margin-top:6px"><button class="btn" onclick="clearSig()">Clear signature</button></div></div>
  <div class="actions" id="sumacts">${cf.readonly?'<button class="btn bad" onclick="discardContract()">Discard</button><button class="btn" onclick="closeModal()">Cancel</button>':'<button class="btn" onclick="cf.step=1;drawContract()">Back</button>'}<button class="btn ok" id="signbtn" disabled onclick="signContract()">${cf.readonly?"Sign again":"Create insurance"}</button></div>`;
}

async function discardContract(){
  if(!await confirmDialog("Discard this contract? This can’t be undone.",{title:"Discard contract",confirmText:"Discard",danger:true}))return;
  try{
    await api.discardContract(cf.insId);
    closeModal();
    await render();
  }catch(error){
    alert(error?.message||"Unable to discard the contract");
  }
}

function initSig(){
  const cv=$("#sig"),x=cv.getContext("2d");
  x.lineWidth=2.5;x.lineCap="round";x.lineJoin="round";x.strokeStyle="#FFF4E4";
  let down=false;
  const pos=e=>{const r=cv.getBoundingClientRect();return [(e.clientX-r.left)*cv.width/r.width,(e.clientY-r.top)*cv.height/r.height]};
  cv.onpointerdown=e=>{down=true;cv.setPointerCapture(e.pointerId);const [p,q]=pos(e);x.beginPath();x.moveTo(p,q)};
  cv.onpointermove=e=>{if(!down)return;const [p,q]=pos(e);x.lineTo(p,q);x.stroke();if(!cf.signed){cf.signed=true;$("#signbtn").disabled=false}};
  cv.onpointerup=cv.onpointercancel=()=>{down=false};
}

function clearSig(){
  const cv=$("#sig");cv.getContext("2d").clearRect(0,0,cv.width,cv.height);
  cf.signed=false;$("#signbtn").disabled=true;
}

async function signContract(){
  if(!cf.signed)return;
  try{
    const packageIDs=cf.pkgIds.map(Number);
    const signature={image_data:$("#sig").toDataURL("image/png"),signed_at:new Date().toISOString()};
    const result=await api.submitSignedContract({
      ...(cf.insId?{insurance_id:Number(cf.insId)}:{}),
      customer_id:String(cf.customerId),
      user_id:Number(currentBrokerUserID()),
      package_ids:packageIDs,
      claims:Object.fromEntries(packageIDs.map(packageID=>[String(packageID),Number(cf.claims[packageID])||0])),
      guarantor_information:{...cf.g},
      signature
    });
    const insuranceIDs=result?.data?.insurance_ids||[];
    const calculated=calcContract(CC.packages.filter(pkg=>packageIDs.includes(Number(pkg.package_id))),cf.claims);
    for(let index=0;index<insuranceIDs.length;index++){
      const insuranceID=Number(insuranceIDs[index]);
      const packageID=packageIDs[index];
      const item=calculated.items.find(entry=>Number(entry.packageID)===packageID);
      const pkg=CC.packages.find(entry=>Number(entry.package_id)===packageID);
      const claim=Number(cf.claims[packageID])||0;
      await api.saveContract({
        insurance_id:insuranceID,customer_id:String(cf.customerId),
        guarantor:{...cf.g},package_ids:[packageID],claims:{[packageID]:claim},
        package_price:item?.premiumPerMonth||0,payment_period:item?.periodMonths||0,
        total:item?.totalPayable||0,signature:signature.image_data,signed_at:signature.signed_at,package_name:pkg?.package_name||""
      });
    }
    closeModal();
    await render();
  }catch(error){
    alert(error?.message||"Unable to save the contract");
  }
}

async function render(){
  $("#main").innerHTML='<h1>Sign Contract</h1><div class="card pad">Loading…</div>';
  try{
    $("#main").innerHTML=await signContractPage();
  }catch(error){
    $("#main").innerHTML=`<h1>Sign Contract</h1><div class="card pad">${esc(error?.message||"Unable to load insurance records")}</div>`;
  }
}

mountNav("sign-contract");
render();



