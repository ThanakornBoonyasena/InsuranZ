let crit={};
let customerFilters={};
let saCustomers=[];
let bankMatches=[];
let bankFilterOptions={gender:[],sex:[]};
const bankSearchFields=[
  {key:"customer_name",label:"Name",type:"text",defaultOp:"contains"},
  {key:"customer_gender",label:"Gender",type:"select",optionsKey:"gender"},
  {key:"customer_sex",label:"Sex",type:"select",optionsKey:"sex"},
  {key:"age",label:"Age",type:"number",defaultOp:"Any"},
  {key:"salary",label:"Salary",type:"number",defaultOp:"Any"}
];
let bankSearchCriteria=Object.fromEntries(bankSearchFields.map(field=>[field.key,{open:false,op:field.defaultOp||"=",value:""}]));
const customerFilterFields=[
  {key:"customer_name",label:"Name",type:"text"},
  {key:"customer_gender",label:"Gender",type:"select"},
  {key:"customer_sex",label:"Sex",type:"select"},
  {key:"customer_age",label:"Age",type:"number"},
  {key:"salary",label:"Salary",type:"number",step:"any"}
];

async function customerPage(){
  const customers=await api.customerRecords();
  saCustomers=customers;
  const matches=customers.filter(customer=>Object.entries(customerFilters).every(([key,filter])=>{
    const field=customerFilterFields.find(item=>item.key===key);
    const raw=customer[key];
    if(raw===null||raw===undefined||raw==="")return false;
    if(field.type==="number"){
      const actual=Number(raw),expected=Number(filter.value);
      if(!Number.isFinite(actual)||!Number.isFinite(expected))return false;
      return filter.op==="<"?actual<expected:filter.op===">"?actual>expected:actual===expected;
    }
    if(field.type==="date"){
      const actual=String(raw).slice(0,10),expected=filter.value;
      return filter.op==="<"?actual<expected:filter.op===">"?actual>expected:actual===expected;
    }
    const actual=String(raw).toLocaleLowerCase(),expected=String(filter.value).toLocaleLowerCase();
    return filter.op==="="?actual===expected:actual.includes(expected);
  }));
  const list=matches.map(customer=>`<div class="card row ${openId==="c"+customer.customer_id?"open":""}">
    <div class="row-head" style="grid-template-columns:1.5fr 1fr 1fr" onclick="toggle('c${customer.customer_id}')">
      <div><b>${esc(customer.customer_name)}</b></div>
      <div class="muted">Age ${customer.customer_age??"—"}</div>
      <div class="muted">#${customer.customer_id}</div>
    </div>
    <div class="detail">
      <div><b>Customer ID</b>${customer.customer_id}</div>
      <div><b>Telephone number</b>${esc(customer.telephone_number||"-")}</div>
      <div><b>Salary</b>${customer.salary==null?"—":Number(customer.salary).toLocaleString("en")}</div>
      <div><b>Email</b>${esc(customer.customer_email||"—")}</div>
      <div><b>Address</b>${esc(customer.customer_address||"—")}</div>
      <div><b>Nationality</b>${esc(customer.customer_nationality||"—")}</div>
      <div><b>Gender</b>${esc(customer.customer_gender||"—")}</div>
      <div><b>Sex</b>${esc(customer.customer_sex||"—")}</div>
      <div><b>Date of birth</b>${customer.customer_dob?fmt(customer.customer_dob):"—"}</div>
      <div><b>Customer since</b>${customer.create_timestamp?fmt(customer.create_timestamp):"—"}</div>
      <div style="grid-column:1/-1"><b>Health condition</b>${esc(customer.health_info||"—")}</div>
      <div style="grid-column:1/-1"><b>Health detail</b>${esc(customer.health_detail||"—")}</div>
    </div>
  </div>`).join("");
  const filterCount=Object.keys(customerFilters).length;
  const filterLabel=filterCount?`${filterCount} filter${filterCount===1?"":"s"}`:"All customers";
  return `<div class="calhead"><h1>Customer</h1><span class="muted">${esc(filterLabel)} · ${matches.length} of ${customers.length} in sa</span><span style="flex:1"></span>${filterCount?'<button class="btn" onclick="clearCustomerFilter()">Clear filter</button> ':""}<button class="btn" onclick="customerFilterForm()">Filter</button><button class="add" style="width:44px;height:36px" title="Add bank customers" aria-label="Add bank customers" onclick="custForm()">+</button></div>${list||'<div class="card pad">No customer records found.</div>'}`;
}

function customerFilterForm(){
  crit=Object.fromEntries(customerFilterFields.map(field=>{
    const active=customerFilters[field.key];
    return [field.key,{open:Boolean(active),op:active?.op||defaultFilterOperator(field),value:active?.value??""}];
  }));
  drawCust();
  $("#overlay").classList.add("show");
}

function defaultFilterOperator(field){return field.type==="number"?"Any":field.type==="text"?"contains":"="}

function drawCust(){
  const fields=customerFilterFields.map(field=>{
    const criterion=crit[field.key];
    if(!criterion.open)return `<div class="crit"><b>${esc(field.label)}:</b><button class="btn" onclick="crit['${field.key}'].open=true;drawCust()">Any</button></div>`;
    if(field.type==="select"){
      const values=[...new Set(saCustomers.map(customer=>customer[field.key]).filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b)));
      return `<div class="crit"><b>${esc(field.label)}:</b><select aria-label="${esc(field.label)}" onchange="crit['${field.key}'].value=this.value"><option value="">Any</option>${values.map(value=>`<option value="${esc(value)}" ${String(value)===String(criterion.value)?"selected":""}>${esc(value)}</option>`).join("")}</select></div>`;
    }
    const operators=field.type==="text"?["contains","="]:field.type==="number"?["Any","<","=",">"]:["<","=",">"];
    const inputType=field.type==="date"?"date":field.type==="number"?"number":"text";
    return `<div class="crit"><b>${esc(field.label)}:</b><select style="width:${field.type==="text"?"110":"70"}px" onchange="crit['${field.key}'].op=this.value;if(this.value==='Any')crit['${field.key}'].value='';drawCust()">${operators.map(op=>`<option value="${op}" ${op===criterion.op?"selected":""}>${op}</option>`).join("")}</select>${field.type==="number"&&criterion.op==="Any"?"":`<input type="${inputType}" ${field.type==="number"?`min="0" step="${field.step||1}"`:""} placeholder="${field.type==="text"||field.key==="salary"?"Any":""}" aria-label="${esc(field.label)} value" value="${esc(criterion.value)}" oninput="crit['${field.key}'].value=this.value">`}</div>`;
  }).join("");
  $("#modal").className="card modal";
  $("#modal").innerHTML=`<h1>Filter customers</h1><div class="customer-filter-list">${fields}</div><div class="actions"><button class="btn" onclick="closeModal()">Cancel</button><button class="btn ok" onclick="applyCustomerFilters()">Apply</button></div>`;
}

function applyCustomerFilters(){
  customerFilters=Object.fromEntries(customerFilterFields.flatMap(field=>{
    const criterion=crit[field.key];
    const value=String(criterion.value??"").trim();
    if(!criterion.open||value===""||(field.type==="number"&&criterion.op==="Any"))return [];
    return [[field.key,{op:criterion.op,value:field.type==="number"?Number(value):value}]];
  }));
  closeModal();
  render();
}

function clearCustomerFilter(){customerFilters={};render()}

async function custForm(){
  $("#overlay").classList.add("show");
  $("#modal").className="card modal";
  $("#modal").innerHTML="<h1>Loading bank filters...</h1>";
  try{
    bankFilterOptions=await api.bankCustomerFilterOptions();
    drawBankSearchForm();
  }catch(error){
    $("#modal").innerHTML=`<h1>Bank search unavailable</h1><p class="error">${esc(error.message||"Unable to load bank filter options")}</p><div class="actions"><button class="btn" onclick="closeModal()">Close</button></div>`;
  }
}

function openBankFilter(key){bankSearchCriteria[key].open=true;drawBankSearchForm()}

function drawBankSearchForm(){
  const fields=bankSearchFields.map(field=>{
    const criterion=bankSearchCriteria[field.key];
    if(!criterion.open)return `<div class="crit"><b>${esc(field.label)}:</b><button class="btn" onclick="openBankFilter('${field.key}')">Any</button></div>`;
    if(field.type==="select"){
      const options=bankFilterOptions[field.optionsKey]||[];
      return `<div class="crit"><b>${esc(field.label)}:</b><select aria-label="${esc(field.label)}" onchange="bankSearchCriteria['${field.key}'].value=this.value"><option value="">Any</option>${options.map(value=>`<option value="${esc(value)}" ${String(value)===String(criterion.value)?"selected":""}>${esc(value)}</option>`).join("")}</select></div>`;
    }
    const operators=field.type==="text"?["contains","="]:field.type==="number"?["Any","<","=",">"]:["<","=",">"];
    return `<div class="crit"><b>${esc(field.label)}:</b><select style="width:${field.type==="text"?"110":"70"}px" aria-label="${esc(field.label)} operator" onchange="bankSearchCriteria['${field.key}'].op=this.value;if(this.value==='Any')bankSearchCriteria['${field.key}'].value='';drawBankSearchForm()">${operators.map(op=>`<option value="${op}" ${op===criterion.op?"selected":""}>${op}</option>`).join("")}</select>${field.type==="number"&&criterion.op==="Any"?"":`<input type="${field.type==="number"?"number":"text"}" ${field.type==="number"?'min="0" step="1"':""} placeholder="${field.type==="text"||field.key==="salary"?"Any":"Value"}" aria-label="${esc(field.label)} value" value="${esc(criterion.value)}" oninput="bankSearchCriteria['${field.key}'].value=this.value">`}</div>`;
  }).join("");
  $("#modal").className="card modal";
  $("#modal").innerHTML=`<h1>Search bank customers</h1><div class="customer-filter-list">${fields}</div>
    <p class="muted">Choose one or more customer properties to search in the bank database.</p>
    <div class="actions"><button class="btn" onclick="closeModal()">Cancel</button><button class="btn ok" onclick="sendQuery()">Search</button></div>`;
}

function invalidSearch(message){
  $("#modal").insertAdjacentHTML("afterbegin",`<p class="error">${esc(message)}</p>`);
}

async function sendQuery(){
  const filters={};
  for(const field of bankSearchFields){
    const criterion=bankSearchCriteria[field.key];
    const value=String(criterion.value||"").trim();
    if(field.type==="number"&&criterion.op==="Any")continue;
    if(!criterion.open||!value)continue;
    if(field.type==="number"&&!/^\d+$/.test(value)){invalidSearch(`${field.label} must be a non-negative whole number.`);return}
    if(field.type==="text"){
      filters.customer_name=value;
      if(criterion.op==="=")filters.customer_name_exact="true";
    }else if(field.type==="select"){
      filters[field.key]=value;
    }else if(field.key==="age"){
      filters.age=value;filters.age_op=criterion.op;
    }else{
      const filterName=criterion.op==="="?"salary":criterion.op==="<"?"salary_lt":"salary_gt";
      filters[filterName]=value;
    }
  }
  if(!Object.keys(filters).length){invalidSearch("Choose at least one customer property to search.");return}
  $("#modal").innerHTML='<h1>Searching bank customers...</h1>';
  try{
    const results=await api.searchBankCustomers(filters);
    const existingIDs=new Set(saCustomers.map(customer=>Number(customer.customer_id)));
    const existingEmails=new Set(saCustomers.map(customer=>String(customer.customer_email||"").trim().toLocaleLowerCase()).filter(Boolean));
    const existingPhones=new Set(saCustomers.map(customer=>String(customer.telephone_number||"").replace(/\D/g,"")).filter(Boolean));
    bankMatches=results.filter(customer=>{
      const email=String(customer.customer_email||"").trim().toLocaleLowerCase();
      const phone=String(customer.telephone_number||"").replace(/\D/g,"");
      return !existingIDs.has(Number(customer.customer_id))&&(!email||!existingEmails.has(email))&&(!phone||!existingPhones.has(phone));
    });
    drawBankMatches(results.length-bankMatches.length);
  }catch(error){
    $("#modal").innerHTML=`<h1>Bank search failed</h1><p class="error">${esc(error.message||"Unable to search bank customers")}</p><div class="actions"><button class="btn" onclick="custForm()">Back</button><button class="btn" onclick="closeModal()">Cancel</button></div>`;
  }
}

function drawBankMatches(alreadyAdded=0){
  const options=bankMatches.map(customer=>`<label class="bank-candidate"><input type="checkbox" value="${customer.customer_id}" checked><span><b>${esc(customer.customer_name)}</b><br><span class="muted">#${customer.customer_id} · ${esc(customer.customer_email||customer.telephone_number||"No contact details")}</span></span></label>`).join("");
  $("#modal").className="card modal";
  $("#modal").innerHTML=`<h1>Select bank customers</h1><p class="muted">${bankMatches.length} new result${bankMatches.length===1?"":"s"}${alreadyAdded?` · ${alreadyAdded} already in sa`:""}</p>${options||'<p class="muted">No new customers found. They may already be in sa.</p>'}<div class="actions"><button class="btn" onclick="custForm()">Back</button><button class="btn" onclick="closeModal()">Cancel</button><button class="btn ok" onclick="addSelected()" ${bankMatches.length?"":"disabled"}>Add selected</button></div>`;
}

async function addSelected(){
  const selected=new Set(Array.from($("#modal").querySelectorAll('input[type="checkbox"]:checked'),input=>Number(input.value)));
  const customers=bankMatches.filter(customer=>selected.has(Number(customer.customer_id)));
  if(!customers.length)return;
  const button=Array.from($("#modal").querySelectorAll("button")).find(item=>item.textContent==="Add selected");
  if(button){button.disabled=true;button.textContent="Adding..."}
  try{
    const result=await api.addCustomers(customers);
    closeModal();
    await render();
    if(result.count<customers.length)console.info(`${customers.length-result.count} customer(s) were already in sa.`);
  }catch(error){
    invalidSearch(error.message||"Unable to add customers to sa.");
    if(button){button.disabled=false;button.textContent="Add selected"}
  }
}

async function render(){
  $("#main").innerHTML='<h1>Customer</h1><div class="card pad">Loading customers from sa...</div>';
  try{
    $("#main").innerHTML=await customerPage();
  }catch(error){
    $("#main").innerHTML=`<h1>Customer</h1><div class="card pad">${esc(error.message||"Unable to load customers from sa")}</div>`;
  }
}

mountNav("customer");
render();
