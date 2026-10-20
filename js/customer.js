let crit={};
let ageFilter=null;
let bankFilter={q:"",salary_min:"",salary_max:""};
let saCustomers=[];
let bankMatches=[];

async function customerPage(){
  const customers=await api.customerRecords();
  saCustomers=customers;
  const matches=ageFilter?customers.filter(customer=>{
    const age=Number(customer.customer_age);
    if(!Number.isFinite(age))return false;
    const value=ageFilter.value;
    return ageFilter.op==="<"?age<value:ageFilter.op===">"?age>value:age===value;
  }):customers;
  const list=matches.map(customer=>`<div class="card row ${openId==="c"+customer.customer_id?"open":""}">
    <div class="row-head" style="grid-template-columns:1.5fr 1fr 1fr" onclick="toggle('c${customer.customer_id}')">
      <div><b>${esc(customer.customer_name)}</b></div>
      <div class="muted">Age ${customer.customer_age??"—"}</div>
      <div class="muted">#${customer.customer_id}</div>
    </div>
    <div class="detail">
      <div><b>Customer ID</b>${customer.customer_id}</div>
      <div><b>Telephone number</b>${esc(customer.telephone_number||"-")}</div>
      <div><b>Email</b>${esc(customer.customer_email||"—")}</div>
      <div><b>Address</b>${esc(customer.customer_address||"—")}</div>
      <div><b>Nationality</b>${esc(customer.customer_nationality||"—")}</div>
      <div><b>Gender</b>${esc(customer.customer_gender||"—")}</div>
      <div><b>Sex</b>${esc(customer.customer_sex||"—")}</div>
      <div><b>Date of birth</b>${customer.customer_dob?fmt(customer.customer_dob):"—"}</div>
      <div><b>Customer since</b>${customer.create_timestamp?fmt(customer.create_timestamp):"—"}</div>
      <div style="grid-column:1/-1"><b>Health condition</b>${esc(customer.health_info||"—")}</div>
    </div>
  </div>`).join("");
  const filterLabel=ageFilter?`Age ${ageFilter.op} ${ageFilter.value}`:"All customers";
  return `<div class="calhead"><h1>Customer</h1><span class="muted">${esc(filterLabel)} · ${matches.length} of ${customers.length} in sa</span><span style="flex:1"></span>${ageFilter?'<button class="btn" onclick="clearCustomerFilter()">Clear filter</button> ':""}<button class="btn" onclick="ageForm()">Filter</button><button class="add" style="width:44px;height:36px" title="Add bank customers" aria-label="Add bank customers" onclick="custForm()">+</button></div>${list||'<div class="card pad">No customer records found.</div>'}`;
}

const queryStr=()=>crit.age?.open&&crit.age.val!==""?`age${crit.age.op}${crit.age.val}`:"";

function ageForm(){
  crit={age:{open:Boolean(ageFilter),op:ageFilter?.op||">",val:ageFilter?String(ageFilter.value):""}};
  drawCust();
  $("#overlay").classList.add("show");
}

function drawCust(){
  const age=crit.age;
  const ageFilter=age.open
    ? `<select style="width:70px" onchange="crit.age.op=this.value;$('#qline').textContent=queryStr()||'none (all)'">${["<","=",">"].map(op=>`<option value="${op}" ${op===age.op?"selected":""}>${op}</option>`).join("")}</select><input inputmode="numeric" aria-label="Age" value="${esc(age.val)}" oninput="this.value=this.value.replace(/[^0-9]/g,'');crit.age.val=this.value;$('#qline').textContent=queryStr()||'none (all)'">`
    : `<button class="btn" onclick="crit.age.open=true;drawCust()">Any</button>`;
  $("#modal").className="card modal";
  $("#modal").innerHTML=`<h1>Filter customers</h1><div class="crit"><b>Age:</b>${ageFilter}</div><p class="muted">Filter: <span id="qline">${esc(queryStr())||"none (all)"}</span></p><div class="actions"><button class="btn" onclick="closeModal()">Cancel</button><button class="btn ok" onclick="applyAgeFilter()">Apply</button></div>`;
}

function applyAgeFilter(){
  ageFilter=crit.age.open&&crit.age.val!==""?{op:crit.age.op,value:Number(crit.age.val)}:null;
  closeModal();
  render();
}

function clearCustomerFilter(){ageFilter=null;render()}

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
  }catch(error){
    $("#main").innerHTML=`<h1>Customer</h1><div class="card pad">${esc(error.message||"Unable to load customers from sa")}</div>`;
  }
}

mountNav("customer");
render();
