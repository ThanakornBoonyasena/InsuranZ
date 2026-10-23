async function insurancePage(){
  const list=(await api.insuranceRecords(null,true)).filter(i=>i.status!=="Edited");
  const rows=list.map(i=>{
    const customer=i.customer||{};
    const name=i.customer_name||customer.customer_name||"-";
    return `<article class="card row insurance-card ${openId===i.insurance_id?"open":""}" data-insurance-id="${i.insurance_id}">
      <div class="row-head insurance-row-head" onclick="toggleInsurance(${i.insurance_id})" aria-expanded="${openId===i.insurance_id}">
        <div><b>#${i.insurance_id}</b></div><div class="insurance-customer">${esc(name)}</div><div class="muted">${fmt(i.sign_date)}</div>
        <div class="btns insurance-actions" onclick="event.stopPropagation()">
          ${i.status==="Pending"?`<button class="btn ok" onclick="setStatus(${i.insurance_id},true)">Approve</button>`:""}
          ${i.status==="Pending"?`<button class="btn bad" onclick="setStatus(${i.insurance_id},false)">Deny</button>`:""}
          ${i.status==="Pending"?`<button class="btn" onclick="editForm(${i.insurance_id})">Edit</button>`:""}
        </div>
      </div><div class="detail insurance-detail" id="insurance-detail-${i.insurance_id}"></div></article>`;
  }).join("");
  return `<section class="insurance-page"><h1>Insurance</h1><div class="insurance-list">${rows||'<div class="card pad">No insurance records found.</div>'}</div></section>`;
}
async function toggleInsurance(id){
  openId=openId===id?null:id;
  document.querySelectorAll(".insurance-card[data-insurance-id]").forEach(card=>{
    const isOpen=openId!==null&&card.dataset.insuranceId===String(openId);
    card.classList.toggle("open",isOpen);
    card.querySelector(".insurance-row-head")?.setAttribute("aria-expanded",String(isOpen));
  });
  if(openId!==id)return;
  const detail=document.getElementById(`insurance-detail-${id}`);
  if(!detail)return;
  detail.innerHTML="<span class=muted>Loading insurance details...</span>";
  try{
    const record=await loadInsuranceDetail(id);
    if(openId===id)detail.innerHTML=insuranceDetailHTML(record).replace(/^<div[^>]*>|<\/div>$/g,"");
  }catch(error){if(openId===id)detail.innerHTML=`<span class="s-bad">${esc(error.message||"Unable to load insurance details")}</span>`}
}

async function setStatus(id,approved){
  try{
    if(approved)await api.approveInsurance(id);
    else await api.denyInsurance(id);
    insuranceDetailsCache.delete(`all:${id}`);
    openId=null;
    await render();
  }catch(error){
    showInsuranceError(error);
  }
}

async function editForm(id){
  try{
    const insurance=await loadInsuranceDetail(id);
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
    insuranceDetailsCache.delete(`all:${id}`);
    openId=null;
    closeModal();
    await render();
  }catch(error){
    showInsuranceError(error);
  }
}

function showInsuranceError(error){
  showToast(error?.message||"Unable to complete the request");
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



