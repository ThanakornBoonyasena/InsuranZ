// Sign Contract (broker). Edited insurance is listed with a Sign button; "+" starts a new contract.
// Contracts are stored through api.saveContract (demo storage) until the backend has a contract endpoint.
// Pricing below is a mock: premium per year = Sum Assured x rate (per package). Replace calcContract with the real rule.
const PRICING={1:{rate:0.012,years:10},2:{rate:0.008,years:20},3:{rate:0.02,years:1}};
const priceOf=p=>PRICING[p.package_id]||{rate:0.01,years:10};
const baht=n=>"฿"+Number(n||0).toLocaleString();
let CC={customers:[],packages:[]},cf=null;

function calcContract(pkgs,sums){
  const items=pkgs.map(p=>{const {rate,years}=priceOf(p);const sum=+sums[p.package_id]||0;return {name:p.package_name,sum,yearly:Math.round(sum*rate),years}});
  const yearly=items.reduce((a,i)=>a+i.yearly,0),years=Math.max(0,...items.map(i=>i.years));
  return {items,yearly,monthly:Math.round(yearly/12),years,sum:items.reduce((a,i)=>a+i.sum,0),total:items.reduce((a,i)=>a+i.yearly*i.years,0)};
}

async function signContractPage(){
  const [ins,contracts,discarded]=await Promise.all([api.insuranceRecords(),api.contracts(),api.discardedContracts()]);
  const edited=ins.filter(i=>i.edited===true||i.sent===true);
  const rows=edited.map(i=>{
    const name=i.customer_name||i.customer?.customer_name||"-";
    const signed=contracts.some(c=>c.insurance_id===i.insurance_id);
    return `<div class="card row ${openId===i.insurance_id?"open":""}">
      <div class="row-head" onclick="toggle(${i.insurance_id})">
        <div><b>#${i.insurance_id}</b></div>
        <div>${esc(name)}</div>
        <div class="muted">${fmt(i.sign_date)}</div>
        <div class="btns" onclick="event.stopPropagation()">${signed?'<span class="s-ok" style="font-size:13px;padding:0 8px">Signed</span>':discarded.includes(i.insurance_id)?'<span class="s-bad" style="font-size:13px;padding:0 8px">Discarded</span>':`<button class="btn" onclick="openContract(${i.insurance_id})">Sign</button>`}</div>
      </div>
      <div class="detail">
        <div><b>Type</b>${esc(i.type||"-")}</div>
        <div><b>Payment</b>${Number(i.payment_amount||0).toLocaleString()} every ${i.payment_interval_month||"-"} month(s)</div>
        <div style="grid-column:1/-1"><b>Condition</b>${esc(i.additional_detail)||"—"}</div>
      </div>
    </div>`;
  }).join("");
  return `<div class="calhead"><h1>Sign Contract</h1><span style="flex:1"></span><button class="add" style="width:44px;height:36px" title="New contract" onclick="openContract()">+</button></div>${rows||'<div class="card pad">No edited insurance to sign.</div>'}`;
}

async function openContract(insId){
  try{
    const [customers,packages,ins]=await Promise.all([api.customerRecords(),api.packages(),api.insuranceRecords()]);
    CC={customers,packages};
    const i=insId?ins.find(x=>x.insurance_id===insId):null;
    let cid=i&&(i.customer_id??i.customer?.customer_id);
    if(!cid&&i)cid=customers.find(c=>c.customer_name===(i.customer_name||i.customer?.customer_name))?.customer_id;
    if(i){
      // Existing contract: read-only summary + signature. Reads the contract data from the insurance record.
      const ex=i.contract||i;
      cf={insId,customerId:cid||"",readonly:true,step:2,signed:false,
        g:{name:"",age:"",job:"",address:"",relation:"",...(ex.guarantor||{})},
        pkgIds:ex.package_ids||(i.package_id?[i.package_id]:[]),
        sums:ex.sums||(ex.sum_assured&&i.package_id?{[i.package_id]:ex.sum_assured}:{})};
    }else{
      cf={insId:null,customerId:"",readonly:false,step:1,signed:false,g:{name:"",age:"",job:"",address:"",relation:""},pkgIds:[],sums:{}};
    }
    drawContract();
    $("#overlay").classList.add("show");
  }catch(error){
    $("#main").innerHTML=`<h1>Sign Contract</h1><div class="card pad">${esc(error?.message||"Unable to open the contract form")}</div>`;
  }
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
    <select onchange="cf.customerId=+this.value">
      <option value="">Select customer…</option>
      ${CC.customers.map(c=>`<option value="${c.customer_id}" ${c.customer_id==cf.customerId?"selected":""}>${esc(c.customer_name)}</option>`).join("")}
    </select></div>
  <div class="sec"><h2>2. Guarantor information</h2><div class="g2">
    ${gf.map(([k,l])=>`<div><label>${l}</label><input ${k==="age"?'inputmode="numeric"':""} value="${esc(cf.g[k])}" oninput="${k==="age"?"this.value=this.value.replace(/[^0-9]/g,'');":""}cf.g.${k}=this.value"></div>`).join("")}
  </div></div>
  <div class="sec"><h2>3. Packages and Sum Assured</h2>
    ${CC.packages.map(p=>{const on=cf.pkgIds.includes(p.package_id);return `<div class="pkg">
      <label class="chk"><input type="checkbox" ${on?"checked":""} onchange="togglePkg(${p.package_id},this.checked)">${esc(p.package_name)}</label>
      ${on?`<input class="pkgsum" inputmode="numeric" placeholder="Sum Assured (฿)" value="${esc(cf.sums[p.package_id]||"")}" oninput="this.value=this.value.replace(/[^0-9]/g,'');cf.sums[${p.package_id}]=this.value">`:""}
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
  if(!cf.customerId)miss.push("customer");
  for(const k of ["name","age","job","address","relation"])if(!String(cf.g[k]).trim())miss.push("guarantor "+k);
  if(!cf.pkgIds.length)miss.push("a package");
  for(const p of CC.packages)if(cf.pkgIds.includes(p.package_id)&&!(+cf.sums[p.package_id]>0))miss.push("Sum Assured for "+p.package_name);
  if(miss.length){$("#cerr").textContent="Please fill in: "+miss.join(", ")+".";return}
  cf.step=2;cf.signed=false;drawContract();
}

function summaryHTML(){
  const c=CC.customers.find(x=>x.customer_id==cf.customerId)||{};
  const calc=calcContract(CC.packages.filter(p=>cf.pkgIds.includes(p.package_id)),cf.sums);
  const kv=(k,v,wide)=>`<div${wide?' style="grid-column:1/-1"':""}><b>${k}</b>${esc(v||"—")}</div>`;
  return `<h1>${cf.readonly?"Re-sign contract":"Contract summary"}</h1>
  <div class="sec"><h2>Customer</h2><div class="sum">
    ${kv("Name",c.customer_name)}${kv("Age",ageFromDOB(c.customer_dob)??"")}${kv("Customer ID",c.customer_id)}${kv("Telephone number",c.telephone_number)}
    ${kv("Email",c.customer_email)}${kv("Address",c.customer_address)}${kv("Salary",c.salary?baht(c.salary):"")}${kv("Job description",c.job_description)}
    ${kv("Gender",c.customer_gender)}${kv("Sex",c.customer_sex)}${kv("Date of birth",c.customer_dob?fmt(c.customer_dob):"")}${kv("Customer since",c.create_timestamp?fmt(c.create_timestamp):"")}
    ${kv("Health condition",c.health_info,true)}
  </div></div>
  <div class="sec"><h2>Guarantor</h2><div class="sum">${kv("Name",cf.g.name)}${kv("Age",cf.g.age)}${kv("Job",cf.g.job)}${kv("Address",cf.g.address)}${kv("Relation",cf.g.relation)}</div></div>
  <div class="sec"><h2>Packages and cost</h2>
    <table class="cost">
      ${calc.items.map(i=>`<tr><td>${esc(i.name)}<br><span class="muted">Sum Assured ${baht(i.sum)}</span></td><td>${baht(i.yearly)} / year</td></tr>`).join("")||'<tr><td>No package</td><td>—</td></tr>'}
      <tr><td>Total Sum Assured</td><td>${baht(calc.sum)}</td></tr>
      <tr><td>Premium per year</td><td>${baht(calc.yearly)}</td></tr>
      <tr><td>Premium per month</td><td>${baht(calc.monthly)}</td></tr>
      <tr><td>Payment period</td><td>${calc.years} year(s), paid monthly</td></tr>
      <tr class="tot"><td>Total payable</td><td>${baht(calc.total)}</td></tr>
    </table></div>
  <div class="sec"><h2>Customer signature</h2>
    <canvas id="sig" width="720" height="150"></canvas>
    <div class="actions" style="margin-top:6px"><button class="btn" onclick="clearSig()">Clear signature</button></div></div>
  <div class="actions" id="sumacts">${cf.readonly?'<button class="btn bad" onclick="askDiscard()">Discard</button><button class="btn" onclick="closeModal()">Cancel</button>':'<button class="btn" onclick="cf.step=1;drawContract()">Back</button>'}<button class="btn ok" id="signbtn" disabled onclick="signContract()">Sign</button></div>
  <div class="actions" id="discardask" style="display:none"><span class="muted" style="margin-right:auto;align-self:center">Discard this contract? This can’t be undone.</span><button class="btn" onclick="cancelDiscard()">No</button><button class="btn bad" onclick="discardContract()">Yes, discard</button></div>`;
}

function askDiscard(){$("#sumacts").style.display="none";$("#discardask").style.display="flex"}
function cancelDiscard(){$("#discardask").style.display="none";$("#sumacts").style.display="flex"}
async function discardContract(){
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
  const c=CC.customers.find(x=>x.customer_id==cf.customerId)||{};
  const calc=calcContract(CC.packages.filter(p=>cf.pkgIds.includes(p.package_id)),cf.sums);
  try{
    await api.saveContract({
      customer_id:c.customer_id,customer_name:c.customer_name,insurance_id:cf.insId,
      guarantor:{...cf.g},package_ids:[...cf.pkgIds],sums:{...cf.sums},
      premium_per_year:calc.yearly,premium_per_month:calc.monthly,period_years:calc.years,total:calc.total,
      signature:$("#sig").toDataURL("image/png"),signed_at:new Date().toISOString()
    });
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