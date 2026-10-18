// Insurance, commission, and report creation use the backend API; remaining demo sections use localStorage.
const KEY="insuranz_db_v2";
const API_BASE=window.API_BASE_URL||"http://localhost:3000/api/v1";
async function requestBackend(path,options={}){
  const response=await fetch(`${API_BASE}${path}`,{
    ...options,
    headers:{"Content-Type":"application/json",...(options.headers||{})}
  });
  const payload=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(payload.error||payload.message||`Request failed (${response.status})`);
  return payload;
}
const copy=o=>JSON.parse(JSON.stringify(o));
const DEFAULTS = {
  customers: [
    {customer_id:1,customer_name:"Somchai Prasert",sex:"Male",income:45000,customer_age:42,create_timestamp:"2026-01-12T09:30",health_info:"Non-smoker, mild hypertension"},
    {customer_id:2,customer_name:"Nattaya Wong",sex:"Female",income:38000,customer_age:29,create_timestamp:"2026-03-02T14:10",health_info:"No known conditions"},
    {customer_id:3,customer_name:"Arthit Boonmee",sex:"Male",income:72000,customer_age:55,create_timestamp:"2025-11-20T11:00",health_info:"Type 2 diabetes"}
  ],
  insurances: [
    {insurance_id:1001,customer_id:1,package_id:1,broker:"B-204",selling_case:"Referral",status:null,sign_date:"2026-09-14T10:00",additional_detail:"Family coverage add-on requested.",type:"Health",payment_amount:1500,payment_interval_months:1},
    {insurance_id:1002,customer_id:2,package_id:2,broker:"B-204",selling_case:"Walk-in",status:true,sign_date:"2026-08-30T16:45",additional_detail:"",type:"Life",payment_amount:3200,payment_interval_months:3},
    {insurance_id:1004,customer_id:2,package_id:3,broker:"B-117",selling_case:"Online",status:true,sign_date:"2026-10-05T09:00",additional_detail:"",type:"Auto",payment_amount:900,payment_interval_months:1},
    {insurance_id:1003,customer_id:3,package_id:1,broker:"B-204",selling_case:"Online",status:false,sign_date:"2026-10-01T13:20",additional_detail:"Pre-existing condition under review.",type:"Health",payment_amount:2100,payment_interval_months:6}
  ],
  commissions: [
    {insurance_id:1002,broker:"B-204",amount:960,date:"2026-09-05"},
    {insurance_id:1001,broker:"B-117",amount:450,date:"2026-09-20"}
  ],
  packages: [
    {package_id:1,package_name:"Family Health Plus",package_detail:"Covers inpatient and outpatient care for up to 4 family members.",detail:"Annual health checkup included.",point:30},
    {package_id:2,package_name:"Life Secure 20",package_detail:"20-year life cover with a fixed payout.",detail:"Beneficiary can be changed at any time.",point:40},
    {package_id:3,package_name:"Auto Care",package_detail:"First-class auto cover with roadside assistance.",detail:"Includes 24-hour towing.",point:15}
  ],
  brokerProfile:{id:"B-204",name:"Syntax Waiyakorn",points:70},
  appointments:[
    {id:1,customer_name:"Somchai Prasert",location:"Central World, Bangkok",appointment_date:"2026-10-19T10:00",packages:["Family Health Plus"],reports:[{date:"2026-10-19T11:30",report_note:"Interested in adding family members. Will decide next week.",is_successful:true}]},
    {id:2,customer_name:"Nattaya Wong",location:"Office, Nonthaburi",appointment_date:"2026-10-22T14:00",packages:["Life Secure 20","Auto Care"],reports:[]}
  ],
  notifications: [
    {text:"Insurance #1001 is waiting for approval.",time:"Today, 09:12"},
    {text:"Commission for #1002 was paid out.",time:"Yesterday"}
  ]
};

let db;
try{db=JSON.parse(localStorage.getItem(KEY))}catch{}
db=db||copy(DEFAULTS);
const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(db))}catch{}};
function reloadDb(){try{const d=JSON.parse(localStorage.getItem(KEY));if(d)db=d}catch{}}
persist();
const api={
  async insuranceRecords(){
    const result=await requestBackend("/insurance/insurance-info");
    return (result.data||[]).map(record=>{
      const condition=record.insurance_condition||record.status||"";
      return {...record,status:condition==="ACCEPT"?true:condition==="REJECT"?false:null,sent:record.sent===true};
    });
  },
  async setInsuranceCondition(id,approved){return requestBackend("/insurance/approve",{method:"POST",body:JSON.stringify({insurance_id:id,insurance_condition:approved?"ACCEPT":"REJECT"})})},
  async sendInsurance(id){return requestBackend("/insurance/send",{method:"POST",body:JSON.stringify({insurance_id:id})})},
  async editInsurance(id,detail){return requestBackend("/insurance/edit",{method:"POST",body:JSON.stringify({insurance_id:id,additional_detail:detail})})},
  async insurances(){return db.insurances.map(i=>({...i,customer:db.customers.find(c=>c.customer_id===i.customer_id),package:db.packages.find(p=>p.package_id===i.package_id)}))},
  async update(id,patch){Object.assign(db.insurances.find(i=>i.insurance_id===id),patch);persist()},
  async commissionTable(){
    const [result,settingsResult]=await Promise.all([
      requestBackend("/commission/table"),
      requestBackend("/commission/settings")
    ]);
    const cells=result.data||[];
    const settings=settingsResult.data||{};
    const columns=settings.columns||[];
    const rows=settings.rows||[];
    const columnCount=Math.max(columns.length,...cells.map(cell=>Number(cell.table_column)||0));
    const rowCount=Math.max(rows.length,...cells.map(cell=>Number(cell.table_row)||0));
    if(columnCount===0&&rowCount===0)return null;
    const table={
      cols:Array.from({length:columnCount},(_,i)=>String(columns[i]??"")),
      rows:Array.from({length:rowCount},(_,i)=>String(rows[i]??"")),
      cells:Array.from({length:rowCount},()=>Array(columnCount).fill(""))
    };
    for(const cell of cells){
      const row=Number(cell.table_row)-1,column=Number(cell.table_column)-1;
      if(row>=0&&row<rowCount&&column>=0&&column<columnCount)table.cells[row][column]=String(cell.value);
    }
    return table;
  },
  async saveCommission(t){
    const data=[];
    t.cells.forEach((row,i)=>row.forEach((value,j)=>{
      if(value==="")return;
      const commission=Number(value);
      if(!Number.isInteger(commission))throw new Error("Commission values must be whole numbers");
      data.push({table_column:j+1,table_row:i+1,value:commission});
    }));
    const result=await requestBackend("/commission/table",{method:"PUT",body:JSON.stringify({data})});
    const settings=await requestBackend("/commission/settings");
    await requestBackend("/commission/settings",{
      method:"PUT",
      body:JSON.stringify({
        target:settings.data.target,
        period:settings.data.period,
        columns:t.cols,
        rows:t.rows
      })
    });
    return result;
  },
  async commissionSettings(){
    const result=await requestBackend("/commission/settings");
    return {
      target:String(result.data?.target??""),
      period:String(result.data?.period??""),
      columns:result.data?.columns||[],
      rows:result.data?.rows||[]
    };
  },
  async saveSettings(s){
    return requestBackend("/commission/settings",{method:"PUT",body:JSON.stringify({target:String(s.target),period:String(s.period)})});
  },
  async reports(){
    const result=await requestBackend("/reports");
    return result.data||[];
  },
  async saveReport(report){
    return requestBackend("/reports",{method:"POST",body:JSON.stringify({
      appointment_fk:report.appointment_fk??report.appointment_id,
      content:report.content??report.report_note
    })});
  },
  async notifications(){
    const result=await requestBackend("/notification");
    return (result.data||[]).map(n=>({...n,text:n.content??n.text??"",time:n.created_at??n.time??""}));
  }
};
