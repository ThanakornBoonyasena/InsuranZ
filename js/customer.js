let crit={};
let customerFilter=null;

async function customerPage(){
  const customers=await api.customerRecords();
  const matches=customerFilter?customers.filter(customer=>{
    const age=ageFromDOB(customer.customer_dob);
    if(age===null)return false;
    const value=customerFilter.value;
    return customerFilter.op==="<"?age<value:customerFilter.op===">"?age>value:age===value;
  }):customers;
  const list=matches.map(customer=>`<div class="card row ${openId==="c"+customer.customer_id?"open":""}">
    <div class="row-head" style="grid-template-columns:1.5fr 1fr 1fr" onclick="toggle('c${customer.customer_id}')">
      <div><b>${esc(customer.customer_name)}</b></div>
      <div class="muted">Age ${ageFromDOB(customer.customer_dob)??"—"}</div>
      <div class="muted">#${customer.customer_id}</div>
    </div>
    <div class="detail">
      <div><b>Customer ID</b>${customer.customer_id}</div>
      <div><b>Telephone number</b>${esc(customer.telephone_number||"-")}</div>
      <div><b>Email</b>${esc(customer.customer_email||"—")}</div>
      <div><b>Address</b>${esc(customer.customer_address||"—")}</div>
      <div><b>Salary</b>${customer.salary?`฿${Number(customer.salary).toLocaleString()}`:"—"}</div>
      <div><b>Job description</b>${esc(customer.job_description||"—")}</div>
      <div><b>Gender</b>${esc(customer.customer_gender||"—")}</div>
      <div><b>Sex</b>${esc(customer.customer_sex||"—")}</div>
      <div><b>Date of birth</b>${customer.customer_dob?fmt(customer.customer_dob):"—"}</div>
      <div><b>Customer since</b>${fmt(customer.create_timestamp)}</div>
      <div style="grid-column:1/-1"><b>Health condition</b>${esc(customer.health_info||"—")}</div>
    </div>
  </div>`).join("");
  const filterLabel=customerFilter?`Age ${customerFilter.op} ${customerFilter.value}`:"All customers";
  return `<div class="calhead"><h1>Customer</h1><span class="muted">${esc(filterLabel)} · ${matches.length} of ${customers.length}</span><span style="flex:1"></span>${customerFilter?'<button class="btn" onclick="clearCustomerFilter()">Clear filter</button> ':""}<button class="add" style="width:44px;height:36px" title="Filter customers" onclick="custForm()">+</button></div>${list||'<div class="card pad">No customer records found.</div>'}`;
}

const queryStr=()=>crit.age?.open&&crit.age.val!==""?`age${crit.age.op}${crit.age.val}`:"";

function custForm(){
  crit={age:{open:false,op:">",val:""}};
  drawCust();
  $("#overlay").classList.add("show");
}

function drawCust(){
  const age=crit.age;
  const ageFilter=age.open
    ? `<select style="width:70px" onchange="crit.age.op=this.value;$('#qline').textContent=queryStr()||'none (all)'">${["<","=",">"].map(op=>`<option value="${op}" ${op===age.op?"selected":""}>${op}</option>`).join("")}</select><input inputmode="numeric" aria-label="Age" value="${esc(age.val)}" class="${age.val!==""?"mod":""}" oninput="this.value=this.value.replace(/[^0-9]/g,'');crit.age.val=this.value;$('#qline').textContent=queryStr()||'none (all)'">`
    : `<button class="btn" onclick="crit.age.open=true;drawCust()">Any</button>`;
  $("#modal").className="card modal";
  $("#modal").innerHTML=`<h1>Filter customers</h1><div class="crit"><b>Age:</b>${ageFilter}</div><p class="muted">Filter: <span id="qline">${esc(queryStr())||"none (all)"}</span></p><div class="actions"><button class="btn" onclick="closeModal()">Cancel</button><button class="btn ok" onclick="sendQuery()">Apply</button></div>`;
}

function sendQuery(){
  customerFilter=crit.age.open&&crit.age.val!==""
    ?{op:crit.age.op,value:Number(crit.age.val)}
    :null;
  closeModal();
  render();
}

function clearCustomerFilter(){customerFilter=null;render()}

async function render(){
  $("#main").innerHTML='<h1>Customer</h1><div class="card pad">Loading customers...</div>';
  try{
    $("#main").innerHTML=await customerPage();
  }catch(error){
    $("#main").innerHTML=`<h1>Customer</h1><div class="card pad">${esc(error.message||"Unable to load customers")}</div>`;
  }
}

mountNav("customer");
render();
