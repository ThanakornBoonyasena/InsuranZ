async function insurancePage(){
  const list=await api.insurances();
  const rows=list.map(i=>`<div class="card row ${openId===i.insurance_id?"open":""}">
    <div class="row-head" onclick="toggle(${i.insurance_id})">
      <div><b>#${i.insurance_id}</b></div>
      <div>${esc(i.customer.customer_name)}</div>
      <div class="muted">${fmt(i.sign_date)}</div>
      <div class="btns" onclick="event.stopPropagation()">
        <button class="btn ok" onclick="setStatus(${i.insurance_id},true)">Approve</button>
        <button class="btn bad" onclick="setStatus(${i.insurance_id},false)">Deny</button>
        <button class="btn" onclick="editForm(${i.insurance_id})">Edit</button>${i.status===true?(i.sent?'<span class="s-ok" style="font-size:13px;padding:0 8px">Sent</span>':`<button class="btn pri" onclick="sendIns(${i.insurance_id})">Send</button>`):""}
      </div>
    </div>
    <div class="detail">
      <div><b>Status</b>${statusBadge(i.status)}</div>
      <div><b>Type</b>${esc(i.type)}</div>
      <div><b>Selling case</b>${esc(i.selling_case)}</div>
      <div><b>Payment</b>${i.payment_amount} every ${i.payment_interval_months} month(s)</div>
      <div><b>Customer age</b>${i.customer.customer_age}</div>
      <div><b>Health info</b>${esc(i.customer.health_info)}</div>
      <div><b>Customer since</b>${fmt(i.customer.create_timestamp)}</div>
      <div style="grid-column:1/-1"><b>Condition</b>${esc(i.additional_detail)||"—"}</div>${pkgHTML(i)}
    </div></div>`).join("");
  return `<h1>Insurance</h1>${rows}`;
}
async function setStatus(id,v){await api.update(id,v?{status:true}:{status:false,sent:false});render()}
async function sendIns(id){await api.update(id,{sent:true});render()}
async function editForm(id){
  const i=(await api.insurances()).find(x=>x.insurance_id===id);
  $("#modal").innerHTML=`<h1>Edit insurance #${id}</h1>
  <label>Condition</label><textarea id="f-det" rows="6">${esc(i.additional_detail)}</textarea>
  <div class="actions"><button class="btn" onclick="closeModal()">Cancel</button><button class="btn pri" onclick="saveEdit(${id})">Save</button></div>`;
  $("#overlay").classList.add("show");
}
async function saveEdit(id){
  await api.update(id,{additional_detail:$("#f-det").value});
  closeModal();render();
}
async function render(){persist();$("#main").innerHTML=await insurancePage()}
mountNav("insurance");render();
