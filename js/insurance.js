async function insurancePage(){
  const list=await api.insuranceRecords();
  if(openId===null&&list.length)openId=list[0].insurance_id;
  const rows=list.map(i=>{
    const customer=i.customer||{};
    const name=i.customer_name||customer.customer_name||"-";
    return `<article class="card row insurance-card ${openId===i.insurance_id?"open":""}">
      <div class="row-head insurance-row-head" onclick="toggle(${i.insurance_id})" aria-expanded="${openId===i.insurance_id}">
        <div><b>#${i.insurance_id}</b></div>
        <div class="insurance-customer">${esc(name)}</div>
        <div class="muted">${fmt(i.sign_date)}</div>
        <div class="btns insurance-actions" onclick="event.stopPropagation()">
          ${i.status===null?`<button class="btn ok" onclick="setStatus(${i.insurance_id},true)">Approve</button>`:""}
          ${i.status===null?`<button class="btn bad" onclick="setStatus(${i.insurance_id},false)">Deny</button>`:""}
          <button class="btn" onclick="editForm(${i.insurance_id})">Edit</button>
          ${i.status===true?(i.sent?'<span class="s-ok" style="font-size:13px;padding:0 8px">Sent</span>':`<button class="btn pri" onclick="sendIns(${i.insurance_id})">Send</button>`):""}
        </div>
      </div>
      ${insuranceDetailHTML(i)}
    </article>`;
  }).join("");
  return `<section class="insurance-page"><h1>Insurance</h1><div class="insurance-list">${rows||'<div class="card pad">No insurance records found.</div>'}</div></section>`;
}

async function setStatus(id,approved){
  try{
    await api.setInsuranceCondition(id,approved);
    await render();
  }catch(error){
    showInsuranceError(error);
  }
}

async function sendIns(id){
  try{
    await api.sendInsurance(id);
    await render();
  }catch(error){
    showInsuranceError(error);
  }
}

async function editForm(id){
  try{
    const insurance=(await api.insuranceRecords()).find(item=>item.insurance_id===id);
    if(!insurance)throw new Error("Insurance record not found");
    $("#modal").innerHTML=`<h1>Edit insurance #${id}</h1>
      <label>Condition</label><textarea id="f-det" rows="6">${esc(insurance.additional_detail||"")}</textarea>
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
  $("#main").innerHTML=`<section class="insurance-page"><h1>Insurance</h1><div class="card pad">${message}</div></section>`;
}

async function render(){
  $("#main").innerHTML='<section class="insurance-page"><h1>Insurance</h1><div class="card pad">Loading insurance records...</div></section>';
  try{
    $("#main").innerHTML=await insurancePage();
  }catch(error){
    showInsuranceError(error);
  }
}

mountNav("insurance");
render();
