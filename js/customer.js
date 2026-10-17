// ---- Customer ----
let crit={};
async function customerPage(){
  const list=db.customers.map(c=>`<div class="card row ${openId==="c"+c.customer_id?"open":""}"><div class="row-head" style="grid-template-columns:1.5fr 1fr 1fr 1fr" onclick="toggle('c${c.customer_id}')"><div><b>${esc(c.customer_name)}</b></div><div class="muted">${esc(c.sex||"—")}</div><div class="muted">Age ${c.customer_age}</div><div class="muted">฿${c.income??"—"}</div></div><div class="detail"><div><b>Customer ID</b>${c.customer_id}</div><div><b>Customer since</b>${fmt(c.create_timestamp)}</div><div style="grid-column:1/-1"><b>Health info</b>${esc(c.health_info)}</div></div></div>`).join("");
  return `<div class="calhead"><h1>Customer</h1><span style="flex:1"></span><button class="add" style="width:44px;height:36px" title="Find customers" onclick="custForm()">+</button></div>${list}`;
}
const queryStr=()=>["age","income"].filter(k=>crit[k].open&&crit[k].val!=="").map(k=>k+crit[k].op+crit[k].val).join("&");
function custForm(){crit={age:{open:false,op:">",val:""},income:{open:false,op:">",val:""}};drawCust();$("#overlay").classList.add("show")}
function drawCust(msg){
  const row=(k,l)=>{const c=crit[k];return `<div class="crit"><b>${l}:</b>${c.open?`<select style="width:70px" onchange="crit.${k}.op=this.value;$('#qline').textContent=queryStr()||'none (all)'">${["<","=",">"].map(o=>`<option ${o===c.op?"selected":""}>${o}</option>`).join("")}</select><input inputmode="decimal" value="${esc(c.val)}" class="${c.val!==""?"mod":""}" oninput="this.value=this.value.replace(/[^0-9]/g,'');crit.${k}.val=this.value;this.classList.toggle('mod',this.value!=='');$('#qline').textContent=queryStr()||'none (all)'">`:`<button class="btn" onclick="crit.${k}.open=true;drawCust()">Any</button>`}</div>`};
  $("#modal").className="card modal";
  $("#modal").innerHTML=`<h1>Find customers</h1>${row("age","Age")}${row("income","Income")}<p class="muted">Query: <span id="qline">${esc(queryStr())||"none (all)"}</span></p>${msg?`<p class="s-ok">${esc(msg)}</p>`:""}<div class="actions"><button class="btn" onclick="closeModal()">Cancel</button><button class="btn ok" onclick="sendQuery()">Send</button></div>`;
}
// Mock of the bank API: the real version sends queryStr() to the bank and stores the customers it returns.
function sendQuery(){
  const q=queryStr(),ok=(k,v)=>{const c=crit[k];if(!(c.open&&c.val!==""))return true;return c.op==="<"?v<+c.val:c.op===">"?v>+c.val:v===+c.val};
  const pool=[["Pimchanok Saelim","Female"],["Kittipong Rattana","Male"],["Waraporn Chai","Female"],["Thanawat Srisuk","Male"]];let added=0;
  for(const [n,s] of pool){if(added>=2||db.customers.some(c=>c.customer_name===n))continue;
    for(let t=0;t<300;t++){const age=20+Math.floor(Math.random()*45),income=(10+Math.floor(Math.random()*90))*1000;
      if(ok("age",age)&&ok("income",income)){db.customers.push({customer_id:Math.max(...db.customers.map(c=>c.customer_id))+1,customer_name:n,sex:s,customer_age:age,income,create_timestamp:new Date().toISOString().slice(0,16),health_info:"No known conditions"});added++;break}}}
  render();drawCust(`Sent "${q||"all"}" – stored ${added} new customer(s).`);
}
async function render(){persist();$("#main").innerHTML=await customerPage()}
mountNav("customer");render();
