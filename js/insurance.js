async function insurancePage(){
  const list=await api.insuranceRecords();
  const rows=list.map(i=>{
    const customer=i.customer||{};
    const name=i.customer_name||customer.customer_name||"-";
    const detail=esc(i.additional_detail)||"—";
    const packageInfo=i.package?pkgHTML(i):"";
    return `<div class="card row ${openId===i.insurance_id?"open":""}">
      <div class="row-head" onclick="toggle(${i.insurance_id})">
        <div><b>#${i.insurance_id}</b></div>
        <div>${esc(name)}</div>
        <div class="muted">${fmt(i.sign_date)}</div>
        <div class="btns" onclick="event.stopPropagation()">
          ${i.status===null?`<button class="btn ok" onclick="setStatus(${i.insurance_id},true)">Approve</button>`:""}
          ${i.status===null?`<button class="btn bad" onclick="setStatus(${i.insurance_id},false)">Deny</button>`:""}
          ${i.sent!==true?`<button class="btn" onclick="editForm(${i.insurance_id})">Edit</button>`:""}
          ${i.status===true?(i.sent?'<span class="s-ok" style="font-size:13px;padding:0 8px">Sent</span>':`<button class="btn pri" onclick="sendIns(${i.insurance_id})">Send</button>`):""}
        </div>
      </div>
      <div class="detail">
        <div><b>Status</b>${statusBadge(i.status)}</div>
        <div><b>Type</b>${esc(i.type||"-")}</div>
        <div><b>Selling case</b>${esc(i.selling_case||"-")}</div>
        <div><b>Payment</b>${Number(i.payment_amount||0).toLocaleString()} every ${i.payment_interval_month||"-"} month(s)</div>
        <div><b>Customer telephone</b>${esc(customer.telephone_number||"-")}</div>
        <div><b>Customer age</b>${customer.customer_age??i.customer_age??"-"}</div>
        <div><b>Health info</b>${esc(customer.health_info||i.health_info||"-")}</div>
        ${customer.create_timestamp?`<div><b>Customer since</b>${fmt(customer.create_timestamp)}</div>`:""}
        <div style="grid-column:1/-1"><b>Condition</b>${detail}</div>
        ${packageInfo}
      </div>
    </div>`;
  }).join("");
  return `<h1>Insurance</h1>${rows||'<div class="card">No insurance records found.</div>'}`;
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
  $("#main").innerHTML=`<h1>Insurance</h1><div class="card">${message}</div>`;
}

async function render(){
  $("#main").innerHTML='<h1>Insurance</h1><div class="card">Loading insurance records...</div>';
  try{
    $("#main").innerHTML=await insurancePage();
  }catch(error){
    showInsuranceError(error);
  }
}

mountNav("insurance");
render();
