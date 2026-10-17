const conditionLabel=value=>value==="ACCEPT"?"Approved":value==="REJECT"?"Denied":"Pending";
const conditionBadge=value=>value==="ACCEPT"
  ?'<span class="badge s-ok">Approved</span>'
  :value==="REJECT"
    ?'<span class="badge s-bad">Denied</span>'
    :'<span class="badge s-warn">Pending</span>';

async function insurancePage(){
  const list=await api.insuranceRecords();
  if(!list.length)return `<h1>Insurance</h1><div class="card">No insurance records found.</div>`;
  const rows=list.map(i=>{
    const condition=i.insurance_condition||"";
    return `<div class="card row ${openId===i.insurance_id?"open":""}">
      <div class="row-head" onclick="toggle(${i.insurance_id})">
        <div><b>#${i.insurance_id}</b></div>
        <div>${esc(i.type||"-")}</div>
        <div class="muted">${fmt(i.sign_date)}</div>
        <div class="btns" onclick="event.stopPropagation()">
          <button class="btn ok" onclick="setStatus(${i.insurance_id},'ACCEPT')">Approve</button>
          <button class="btn bad" onclick="setStatus(${i.insurance_id},'REJECT')" ${condition==="ACCEPT"?"disabled":""}>Deny</button>
          <button class="btn" onclick="editForm(${i.insurance_id})">Edit</button>
        </div>
      </div>
      <div class="detail">
        <div><b>Status</b>${conditionBadge(condition)}</div>
        <div><b>Type</b>${esc(i.type||"-")}</div>
        <div><b>Payment</b>${Number(i.payment_amount||0).toLocaleString()} per payment</div>
        <div><b>Insurance condition</b>${esc(conditionLabel(condition))}</div>
        <div style="grid-column:1/-1"><b>Additional detail</b>${esc(i.additional_detail)||"-"}</div>
      </div>
    </div>`;
  }).join("");
  return `<h1>Insurance</h1>${rows}`;
}

async function setStatus(id,condition){
  try{
    await api.setInsuranceCondition(id,condition);
    await render();
  }catch(error){
    showInsuranceError(error);
  }
}

async function editForm(id){
  try{
    const insurance=(await api.insuranceRecords()).find(item=>item.insurance_id===id);
    if(!insurance)throw new Error("Insurance record not found");
    const detail=String(insurance.additional_detail||"");
    $("#modal").innerHTML=`<h1>Edit insurance #${id}</h1>
      <label>Additional detail</label><textarea id="f-det" rows="6">${esc(detail)}</textarea>
      <div class="actions"><button class="btn" onclick="closeModal()">Cancel</button><button class="btn pri" onclick="saveEdit(${id})">Save</button></div>`;
    $("#overlay").classList.add("show");
  }catch(error){
    showInsuranceError(error);
  }
}

async function saveEdit(id){
  try{
    await api.editInsurance(id,$("#f-det").value);
    closeModal();
    await render();
  }catch(error){
    showInsuranceError(error);
  }
}

function showInsuranceError(error){
  const message=esc(error?.message||"Unable to complete the request");
  $("#main").innerHTML=`<h1>Insurance</h1><div class="card">${message}</div>`;
}

async function render(){
  $("#main").innerHTML="<h1>Insurance</h1><div class=\"card\">Loading insurance records...</div>";
  try{
    $("#main").innerHTML=await insurancePage();
  }catch(error){
    showInsuranceError(error);
  }
}

mountNav("insurance");
render();
