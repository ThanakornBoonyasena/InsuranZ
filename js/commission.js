let saved=null,cur=null;
const blank=()=>({cols:["",""],rows:["",""],cells:[["",""],["",""]]});
const clone=o=>JSON.parse(JSON.stringify(o));
const strT=t=>({cols:t.cols.map(String),rows:t.rows.map(String),cells:t.cells.map(r=>r.map(String))});
const sv=(k,i,j)=>k==="c"?saved.cols[i]:k==="r"?saved.rows[i]:(saved.cells[i]||[])[j];
const cv=(k,i,j)=>k==="c"?cur.cols[i]:k==="r"?cur.rows[i]:cur.cells[i][j];
const mod=(k,i,j)=>{const s=sv(k,i,j);return s===undefined?cv(k,i,j)!=="":s!==cv(k,i,j)};
const dirty=()=>cur.cols.some((_,j)=>mod("c",j))||cur.rows.some((_,i)=>mod("r",i))||cur.cells.some((r,i)=>r.some((_,j)=>mod("x",i,j)))||cur.rows.length!==saved.rows.length||cur.cols.length!==saved.cols.length;
function tableHTML(){
  const inp=(k,i,j,ph)=>`<input data-k="${k}" data-i="${i}" data-j="${j??""}" placeholder="${ph}" inputmode="decimal" value="${esc(k==="c"&&cv(k,i,j)!==""?cv(k,i,j)+"%":cv(k,i,j))}" ${k==="c"?'onfocus="colFocus(this)" onblur="colBlur(this)"':""} class="${mod(k,i,j)?"mod":""}" oninput="cellInput(this)">`;
  const head=cur.cols.map((_,j)=>`<th><div class="axis-cell">${inp("c",j,null,"%")}<button class="axis-remove" title="Delete column" onclick="removeCol(${j})">×</button></div></th>`).join("");
  const body=cur.rows.map((_,i)=>`<tr><th><div class="axis-cell">${inp("r",i,null,"pts")}<button class="axis-remove" title="Delete row" onclick="removeRow(${i})">×</button></div></th>${cur.cols.map((_,j)=>`<td>${inp("x",i,j,"Commission")}</td>`).join("")}</tr>`).join("");
  return `<div class="cgrid"><table class="ctable"><tr><th class="corner">Commission Table</th>${head}</tr>${body}</table><button class="add addcol" title="Add column" onclick="addCol()">+</button><button class="add addrow" title="Add row" onclick="addRow()">+</button></div>`;
}
const hasValues=()=>cur.cols.some(v=>v!=="")||cur.rows.some(v=>v!=="")||cur.cells.some(r=>r.some(v=>v!==""));
const shapeChanged=()=>cur.rows.length!==saved.rows.length||cur.cols.length!==saved.cols.length;
const actionsHTML=()=>`${dirty()?'<button class="btn ok" onclick="saveComm()">Save</button>':""}${dirty()||shapeChanged()?'<button class="btn bad" onclick="cancelComm()">Cancel change</button>':hasValues()?'<button class="btn bad" onclick="clearComm()">Clear</button>':""}<button class="btn bad" onclick="resetComm()">Reset to 2 × 2</button>`;
function cancelComm(){cur=clone(saved);drawComm()}
const drawComm=()=>{$("#ctable").innerHTML=tableHTML();$("#cactions").innerHTML=actionsHTML()};
function cellInput(el){
  const {k,i,j}=el.dataset;
  el.value=el.value.replace(k==="x"?/[^0-9]/g:/[^0-9.%]/g,"");
  if(k==="c")cur.cols[i]=el.value.replace(/%/g,"");else if(k==="r")cur.rows[i]=el.value;else cur.cells[i][j]=el.value;
  el.classList.toggle("mod",mod(k,i,j));
  $("#cactions").innerHTML=actionsHTML();
}
let setSaved=null,setCur=null;
const setDirty=()=>JSON.stringify(setCur)!==JSON.stringify(setSaved);
function setInput(el){
  const f=el.dataset.f;let v=el.value;
  if(f==="target")v=v.replace(/[^0-9.]/g,"");
  el.value=v;setCur[f]=v;
  el.classList.toggle("mod",setCur[f]!==setSaved[f]);
  $("#sactions").innerHTML=setDirty()?'<button class="btn ok" onclick="saveSettings()">Save</button>':"";
}
async function saveSettings(){
  try{
    await api.saveSettings(setCur);setSaved=clone(setCur);
    document.querySelectorAll("#spanel input,#spanel select").forEach(e=>e.classList.remove("mod"));
    $("#sactions").innerHTML="";
  }catch(error){alert(error.message||"Unable to save commission settings")}
}
function colFocus(el){el.value=cur.cols[el.dataset.i]}
function colBlur(el){const v=cur.cols[el.dataset.i];el.value=v?v+"%":""}
function addCol(){cur.cols.push("");cur.cells.forEach(r=>r.push(""));drawComm()}
function addRow(){cur.rows.push("");cur.cells.push(cur.cols.map(()=>""));drawComm()}
function removeCol(index){cur.cols.splice(index,1);cur.cells.forEach(row=>row.splice(index,1));drawComm()}
function removeRow(index){cur.rows.splice(index,1);cur.cells.splice(index,1);drawComm()}
async function saveComm(){try{const t=clone(cur);await api.saveCommission(t);saved=t;cur=clone(t);drawComm()}catch(error){alert(error.message||"Unable to save commission table")}}
function clearComm(){cur.cols=cur.cols.map(()=>"");cur.rows=cur.rows.map(()=>"");cur.cells=cur.cells.map(r=>r.map(()=>""));drawComm()}
function resetComm(){cur=blank();drawComm()}
async function commissionPage(){
  const t=await api.commissionTable();
  saved=t?strT(t):blank();cur=clone(saved);
  setSaved=await api.commissionSettings();setCur=clone(setSaved);
  const panel=`<div class="card pad" id="spanel" style="margin-bottom:24px"><div class="setgrid"><div><label>Current target money (฿)</label><input data-f="target" inputmode="decimal" value="${esc(setCur.target)}" oninput="setInput(this)"></div><div><label>Commission period</label><select data-f="period" class="setting-select" onchange="setInput(this)"><option value="Week" ${setCur.period==="Week"?"selected":""}>Week</option><option value="Month" ${setCur.period==="Month"?"selected":""}>Month</option><option value="Year" ${setCur.period==="Year"?"selected":""}>Year</option></select></div></div><div class="actions" id="sactions" style="margin-top:12px"></div></div>`;
  return `<h1>Commission</h1>${panel}<div style="width:fit-content;max-width:100%"><div style="overflow-x:auto" id="ctable">${tableHTML()}</div><div class="actions" style="justify-content:flex-end" id="cactions">${actionsHTML()}</div></div>`;
}
mountNav("commission");
(async()=>{try{$("#main").innerHTML=await commissionPage()}catch(error){$("#main").innerHTML=`<h1>Commission</h1><div class="card">${esc(error.message||"Unable to load commission table")}</div>`}})();
