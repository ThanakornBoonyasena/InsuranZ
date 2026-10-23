const customerFilterFields=["Age","Gender","Name","Yearly salary","Sex","Health"];
const customerGenderOptions=["Agender","Abimegender","Adamas gender","Aerogender","Aesthetigender","Affectugender","Agenderflux","Alexigender","Aliusgender","Amaregender","Ambigender","Ambonec","Amicagender","Androgyne","Anesigender","Angenital","Anogender","Anongender","Antegender","Anxiegender","Apagender","Apconsugender","Astergender","Astral gender","Autigender","Autogender","Axigender","Bigender","Biogender","Blurgender","Boyflux","Burstgender","Caelgender","Cassgender","Cassflux","Cavusgender","Cendgender","Ceterogender","Ceterofluid","Cisgender","Cloudgender","Collgender","Colorgender","Commogender","Condigender","Deliciagender","Demifluid","Demiflux","Demigender","Domgender","Duragender","Egogender","Epicene","Esspigender","Exgender","Existigender","Femfluid","Femgender","Fluidflux","Gemigender","Genderblank","Genderflow","Genderfluid","Genderfuzz","Genderflux","Genderpuck","Genderqueer","Gender witched","Girlflux","Healgender","Mirrorgender","Omnigender","Male","Female"];
const customerSexOptions=["Male","Female"];
const customerHealthOptions=["NORMAL","BAD","VERY_BAD","COMA","DYING"];
let customerFilterRules=[];
let customerFiltersVisible=false;
let customerGenderMenu=null;
let saCustomers=[];
let bankFilter={q:"",salary_min:"",salary_max:""};
let bankMatches=[];

async function customerPage(){
  saCustomers=await api.customerRecords();
  return `<div class="customer-page-head"><h1>Customer</h1><button class="add" style="width:44px;height:36px" title="Add bank customers" aria-label="Add bank customers" onclick="custForm()">+</button></div>
    <button class="btn customer-filter-toggle" aria-expanded="${customerFiltersVisible}" onclick="toggleCustomerFilters()">Filter</button>
    <div class="customer-filter-panel" id="customer-filter-panel" ${customerFiltersVisible?"":"hidden"}></div>
    <div class="customer-filter-count muted" id="customer-filter-count"></div><div id="customer-list"></div>`;
}

function customerFilterOperators(field){
  if(field==="Name")return ["contains","equals","starts with"];
  if(field==="Gender"||field==="Sex")return ["is","is not"];
  if(field==="Health")return ["is","is not"];
  if(field==="Age"||field==="Yearly salary")return ["equals","greater than","less than","at least","at most"];
  return ["contains","equals","is empty","is not empty"];
}
function availableCustomerFilterFields(index=-1){
  const used=new Set(customerFilterRules.filter((_,ruleIndex)=>ruleIndex!==index).map(rule=>rule.field));
  return customerFilterFields.filter(field=>!used.has(field));
}
function customerGenderDropdown(rule,index,options){
  const key=`${rule.field}-${index}`,open=customerGenderMenu===key;
  return `<div class="customer-gender-select"><button type="button" class="customer-gender-toggle" aria-haspopup="listbox" aria-expanded="${open}" onclick="toggleCustomerGenderMenu('${rule.field}',${index})">${esc(rule.value||`Select ${rule.field.toLowerCase()}`)}<span aria-hidden="true">⌄</span></button>
    ${open?`<div class="customer-gender-menu" role="listbox" aria-label="${rule.field} options">${options.map((value,optionIndex)=>`<button type="button" role="option" aria-selected="${rule.value===value}" onclick="selectCustomerGender(${index},${optionIndex})">${esc(value)}</button>`).join("")}</div>`:""}</div>`;
}
function customerFilterValueControl(rule,index){
  if(rule.field==="Health"&&(rule.operator==="is empty"||rule.operator==="is not empty"))return '<span class="filter-value-empty"></span>';
  if(rule.field==="Gender")return customerGenderDropdown(rule,index,customerGenderOptions);
  if(rule.field==="Sex")return customerGenderDropdown(rule,index,customerSexOptions);
  if(rule.field==="Health")return customerGenderDropdown(rule,index,customerHealthOptions);
  const numeric=rule.field==="Age"||rule.field==="Yearly salary";
  return `<input aria-label="Filter value" ${numeric?'type="number" min="0" step="'+(rule.field==="Age"?"1":"any")+'" inputmode="decimal"':'type="text"'} placeholder="${numeric?(rule.field==="Yearly salary"?"Annual amount":"Number"):"Text"}" value="${esc(rule.value)}" oninput="customerFilterRules[${index}].value=this.value;renderCustomerList()">`;
}
function drawCustomerFilterPanel(){
  const panel=document.getElementById("customer-filter-panel");
  if(!panel)return;
  panel.hidden=!customerFiltersVisible;
  if(!customerFiltersVisible)return;
  const rules=customerFilterRules.map((rule,index)=>{
    const operators=customerFilterOperators(rule.field);
    const fields=availableCustomerFilterFields(index);
    return `<div class="customer-filter-rule">
      <select aria-label="Filter field" onchange="setCustomerFilterField(${index},this.value)">${fields.map(field=>`<option value="${field}" ${rule.field===field?"selected":""}>${field}</option>`).join("")}</select>
      <select aria-label="Filter operator" onchange="customerFilterRules[${index}].operator=this.value;customerFilterRules[${index}].value='';drawCustomerFilterPanel();renderCustomerList()">${operators.map(operator=>`<option value="${operator}" ${rule.operator===operator?"selected":""}>${operator}</option>`).join("")}</select>
      ${customerFilterValueControl(rule,index)}
      <button class="btn customer-filter-remove" aria-label="Remove filter" title="Remove filter" onclick="removeCustomerFilter(${index})">×</button>
    </div>`;
  }).join("");
  const canAdd=availableCustomerFilterFields().length>0;
  panel.innerHTML=`<div class="customer-filter-rules">${rules||'<p class="muted">No filters added.</p>'}</div>
    <div class="customer-filter-actions">${canAdd?'<button class="btn" onclick="addCustomerFilter()">+ Add filter</button>':""}<button class="btn" onclick="clearCustomerFilters()">Clear</button></div>`;
}
function toggleCustomerFilters(){
  customerFiltersVisible=!customerFiltersVisible;
  if(customerFiltersVisible&&!customerFilterRules.length)customerFilterRules.push({field:customerFilterFields[0],operator:customerFilterOperators(customerFilterFields[0])[0],value:""});
  const button=document.querySelector(".customer-filter-toggle");if(button)button.setAttribute("aria-expanded",String(customerFiltersVisible));
  drawCustomerFilterPanel();
}
function setCustomerFilterField(index,field){
  if(!availableCustomerFilterFields(index).includes(field))return;
  customerFilterRules[index]={field,operator:customerFilterOperators(field)[0],value:""};
  drawCustomerFilterPanel();renderCustomerList();
}
function addCustomerFilter(){
  const field=availableCustomerFilterFields()[0];
  if(!field)return;
  customerFilterRules.push({field,operator:customerFilterOperators(field)[0],value:""});
  drawCustomerFilterPanel();
}
function toggleCustomerGenderMenu(field,index){
  const key=`${field}-${index}`;customerGenderMenu=customerGenderMenu===key?null:key;drawCustomerFilterPanel();
}
function selectCustomerGender(index,optionIndex){
  const rule=customerFilterRules[index],options=rule.field==="Sex"?customerSexOptions:rule.field==="Health"?customerHealthOptions:customerGenderOptions;
  rule.value=options[optionIndex]||"";customerGenderMenu=null;drawCustomerFilterPanel();renderCustomerList();
}
function removeCustomerFilter(index){customerFilterRules.splice(index,1);drawCustomerFilterPanel();renderCustomerList()}
function clearCustomerFilters(){customerFilterRules=[];drawCustomerFilterPanel();renderCustomerList()}
function customerMatchesFilter(customer,rule){
  const value=String(rule.value??"");
  if(rule.field==="Health"){
    const health=String(customer.health_info||"").trim().toLocaleLowerCase();
    if(rule.operator==="is empty")return !health;
    if(rule.operator==="is not empty")return Boolean(health);
    if(!value.trim())return true;
    const selected=value.trim().toLocaleLowerCase();
    return rule.operator==="is not"?health!==selected:health===selected;
  }
  if(!value.trim())return true;
  if(rule.field==="Name"){
    const name=String(customer.customer_name||"").toLocaleLowerCase(),query=value.trim().toLocaleLowerCase();
    return rule.operator==="equals"?name===query:rule.operator==="starts with"?name.startsWith(query):name.includes(query);
  }
  if(rule.field==="Gender"||rule.field==="Sex"){
    const gender=String(rule.field==="Gender"?customer.customer_gender:customer.customer_sex||"").toLocaleLowerCase(),selected=value.toLocaleLowerCase();
    return rule.operator==="is not"?gender!==selected:gender===selected;
  }
  const actual=Number(rule.field==="Age"?customer.customer_age:Number(customer.salary_per_month)*12),expected=Number(value);
  if(!Number.isFinite(actual)||actual<=0||!Number.isFinite(expected))return false;
  return rule.operator==="greater than"?actual>expected:rule.operator==="less than"?actual<expected:rule.operator==="at least"?actual>=expected:rule.operator==="at most"?actual<=expected:actual===expected;
}
function renderCustomerList(){
  const activeRules=customerFilterRules.filter(rule=>rule.value!==""||rule.operator==="is empty"||rule.operator==="is not empty");
  const matches=saCustomers.filter(customer=>activeRules.every(rule=>customerMatchesFilter(customer,rule)));
  openId=null;
  const list=matches.map(customer=>`<div class="card row customer-card" data-customer-id="${esc(customer.customer_id)}">
    <div class="row-head" style="grid-template-columns:1.5fr 1fr 1fr" onclick="toggleCustomer('${esc(customer.customer_id)}')">
      <div><b>${esc(customer.customer_name)}</b></div><div class="muted">Age ${customer.customer_age??"—"}</div><div class="muted">#${customer.customer_id}</div>
    </div><div class="detail" id="customer-detail-${esc(customer.customer_id)}"></div></div>`).join("");
  const count=document.getElementById("customer-filter-count");if(count)count.textContent=`${matches.length} of ${saCustomers.length} customers`;
  const container=document.getElementById("customer-list");if(container)container.innerHTML=list||'<div class="card pad">No customers match these filters.</div>';
}
const customerDetailsCache=new Map();
function customerDetailHTML(customer){
  return `<div><b>Customer ID</b>${esc(customer.customer_id)}</div>
    <div><b>Telephone number</b>${esc(customer.telephone_number||"-")}</div>
    <div><b>Email</b>${esc(customer.customer_email||"-")}</div>
    <div><b>Address</b>${esc(customer.customer_address||"-")}</div>
    <div><b>Nationality</b>${esc(customer.customer_nationality||"-")}</div>
    <div><b>Gender</b>${esc(customer.customer_gender||"-")}</div>
    <div><b>Sex</b>${esc(customer.customer_sex||"-")}</div>
    <div><b>Date of birth</b>${customer.customer_dob?fmt(customer.customer_dob):"-"}</div>
    <div><b>Customer since</b>${customer.create_timestamp?fmt(customer.create_timestamp):"-"}</div>
    <div><b>Yearly salary</b>${customer.salary_per_month==null?"-":(Number(customer.salary_per_month)*12).toLocaleString("en")}</div>
    <div style="grid-column:1/-1"><b>Health condition</b>${esc(customer.health_info||"-")}</div>
    <div style="grid-column:1/-1"><b>Health detail</b>${esc(customer.health_detail||"-")}</div>`;
}
async function toggleCustomer(id){
  const key="c"+id;
  openId=openId===key?null:key;
  document.querySelectorAll(".customer-card").forEach(card=>card.classList.toggle("open",openId===key&&card.dataset.customerId===String(id)));
  if(openId!==key)return;
  const detail=document.getElementById(`customer-detail-${id}`);
  if(!detail)return;
  detail.innerHTML="<span class=muted>Loading customer details...</span>";
  try{
    let customer=customerDetailsCache.get(String(id));
    if(!customer){customer=await api.customerRecord(id);if(!customer)throw new Error("Customer not found");customerDetailsCache.set(String(id),customer)}
    if(openId===key)detail.innerHTML=customerDetailHTML(customer);
  }catch(error){if(openId===key)detail.innerHTML=`<span class="s-bad">${esc(error.message||"Unable to load customer details")}</span>`}
}

function custForm(){
  $("#modal").className="card modal";
  $("#modal").innerHTML=`<h1>Search bank customers</h1>
    <label for="customer-q">Name, email, telephone, or address</label><input id="customer-q" maxlength="200" value="${esc(bankFilter.q)}" placeholder="Search text">
    <label for="salary-min">Minimum salary</label><input id="salary-min" inputmode="numeric" value="${esc(bankFilter.salary_min)}" placeholder="Any">
    <label for="salary-max">Maximum salary</label><input id="salary-max" inputmode="numeric" value="${esc(bankFilter.salary_max)}" placeholder="Any">
    <p class="muted">Enter a search term or salary filter. Salary uses the units stored in the bank database.</p>
    <div class="actions"><button class="btn" onclick="closeModal()">Cancel</button><button class="btn ok" onclick="sendQuery()">Search</button></div>`;
  $("#overlay").classList.add("show");
}

function invalidSearch(message){
  $("#modal").insertAdjacentHTML("afterbegin",`<p class="error">${esc(message)}</p>`);
}

async function sendQuery(){
  const q=$("#customer-q").value.trim();
  const salary_min=$("#salary-min").value.trim();
  const salary_max=$("#salary-max").value.trim();
  if(!q&&!salary_min&&!salary_max){invalidSearch("Enter a search term or salary filter.");return}
  if((salary_min&&!/^\d+$/.test(salary_min))||(salary_max&&!/^\d+$/.test(salary_max))){invalidSearch("Salary filters must be non-negative whole numbers.");return}
  if(salary_min&&salary_max&&Number(salary_min)>Number(salary_max)){invalidSearch("Minimum salary must not exceed maximum salary.");return}
  bankFilter={q,salary_min,salary_max};
  $("#modal").innerHTML='<h1>Searching bank customers...</h1>';
  try{
    const results=await api.searchBankCustomers(bankFilter);
    const existing=new Set(saCustomers.map(customer=>Number(customer.customer_id)));
    bankMatches=results.filter(customer=>!existing.has(Number(customer.customer_id)));
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
    drawCustomerFilterPanel();
    renderCustomerList();
  }catch(error){
    $("#main").innerHTML=`<h1>Customer</h1><div class="card pad">${esc(error.message||"Unable to load customers from sa")}</div>`;
  }
}

mountNav("customer");
render();







