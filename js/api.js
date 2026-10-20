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
    {customer_id:1,customer_name:"Somchai Prasert",telephone_number:"000-000-0001",customer_email:"somchai@example.com",customer_address:"12 Sukhumvit Road, Bangkok",customer_gender:"Male",customer_sex:"Male",salary:45000,job_description:"Software engineer",customer_dob:"1984-04-12T00:00:00",create_timestamp:"2026-01-12T09:30",health_info:"Non-smoker, mild hypertension"},
    {customer_id:2,customer_name:"Nattaya Wong",telephone_number:"000-000-0002",customer_email:"nattaya@example.com",customer_address:"88 Rattanathibet Road, Nonthaburi",customer_gender:"Female",customer_sex:"Female",salary:38000,job_description:"Marketing specialist",customer_dob:"1997-06-23T00:00:00",create_timestamp:"2026-03-02T14:10",health_info:"No known conditions"},
    {customer_id:3,customer_name:"Arthit Boonmee",telephone_number:"000-000-0003",customer_email:"arthit@example.com",customer_address:"45 Nimmanhaemin Road, Chiang Mai",customer_gender:"Male",customer_sex:"Male",salary:72000,job_description:"Business owner",customer_dob:"1971-09-07T00:00:00",create_timestamp:"2025-11-20T11:00",health_info:"Type 2 diabetes"}
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
for(const customer of db.customers||[]){
  if(!customer.telephone_number)customer.telephone_number=`000-000-${String(customer.customer_id).padStart(4,"0")}`;
  const mockCustomer=DEFAULTS.customers.find(item=>item.customer_id===customer.customer_id);
  if(mockCustomer)for(const field of ["salary","job_description","customer_gender","customer_sex","customer_dob","customer_email","customer_address"]){
    if(customer[field]===undefined)customer[field]=mockCustomer[field];
  }
}
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
  async customerRecords(){
    const result=await requestBackend("/customer/customer-info");
    return result.data||[];
  },
  async setInsuranceCondition(id,approved){return requestBackend("/insurance/approve",{method:"POST",body:JSON.stringify({insurance_id:id,insurance_condition:approved?"ACCEPT":"REJECT"})})},
  async sendInsurance(id){return requestBackend("/insurance/send",{method:"POST",body:JSON.stringify({insurance_id:id})})},
  async editInsurance(id,detail){return requestBackend("/insurance/edit",{method:"POST",body:JSON.stringify({insurance_id:id,additional_detail:detail})})},
  async insurances(){return db.insurances.map(i=>({...i,customer:db.customers.find(c=>c.customer_id===i.customer_id),package:db.packages.find(p=>p.package_id===i.package_id)}))},
  async update(id,patch){Object.assign(db.insurances.find(i=>i.insurance_id===id),patch);persist()},
  async commissionTable(){
    const result=await requestBackend("/commission/table");
    const records=result.data||[];
    if(records.length===0)return null;

    // The database stores each cell by its actual point and percent axes.
    // Rebuild the editable grid from those axes instead of positional indices.
    const cols=[...new Set(records.map(cell=>Number(cell.com_percent)))].sort((a,b)=>a-b).map(String);
    const rows=[...new Set(records.map(cell=>Number(cell.com_point)))].sort((a,b)=>a-b).map(String);
    const cells=Array.from({length:rows.length},()=>Array(cols.length).fill(""));
    const colIndex=new Map(cols.map((value,index)=>[Number(value),index]));
    const rowIndex=new Map(rows.map((value,index)=>[Number(value),index]));
    for(const record of records){
      const row=rowIndex.get(Number(record.com_point));
      const col=colIndex.get(Number(record.com_percent));
      if(row!==undefined&&col!==undefined)cells[row][col]=String(record.value);
    }
    return {cols,rows,cells};
  },
  async saveCommission(t){
    const data=[];
    const points=new Set(),percents=new Set();
    t.rows.forEach((value,index)=>{
      if(value===""||!Number.isInteger(Number(value))||Number(value)<0)return;
      const point=Number(value);
      if(points.has(point))throw new Error(`Duplicate point threshold: ${point}`);
      points.add(point);
    });
    t.cols.forEach(value=>{
      if(value===""||!Number.isFinite(Number(value))||Number(value)<0)return;
      const percent=Number(value);
      if(percents.has(percent))throw new Error(`Duplicate percent threshold: ${percent}`);
      percents.add(percent);
    });
    t.cells.forEach((row,i)=>row.forEach((value,j)=>{
      if(value==="")return;
      if(t.rows[i]===""||t.cols[j]==="")throw new Error("Each commission value needs a point and percent threshold");
      const point=Number(t.rows[i]);
      const percent=Number(t.cols[j]);
      const commission=Number(value);
      if(!Number.isInteger(point)||point<0)throw new Error("Point thresholds must be non-negative whole numbers");
      if(!Number.isFinite(percent)||percent<0)throw new Error("Percent thresholds must be non-negative numbers");
      if(!Number.isInteger(commission))throw new Error("Commission values must be whole numbers");
      data.push({com_point:point,com_percent:percent,value:commission});
    }));
    const result=await requestBackend("/commission/table",{method:"PUT",body:JSON.stringify({data})});
    const records=result.data||[];
    if(records.length===0)return null;
    const cols=[...new Set(records.map(cell=>Number(cell.com_percent)))].sort((a,b)=>a-b).map(String);
    const rows=[...new Set(records.map(cell=>Number(cell.com_point)))].sort((a,b)=>a-b).map(String);
    const cells=Array.from({length:rows.length},()=>Array(cols.length).fill(""));
    const colIndex=new Map(cols.map((value,index)=>[Number(value),index]));
    const rowIndex=new Map(rows.map((value,index)=>[Number(value),index]));
    for(const record of records)cells[rowIndex.get(Number(record.com_point))][colIndex.get(Number(record.com_percent))]=String(record.value);
    return {cols,rows,cells};
  },
  async commissionSettings(){
    const result=await requestBackend("/commission/settings");
    return {
      target:String(result.data?.target??""),
      period:String(result.data?.period??"")
    };
  },
  async saveSettings(s){
    return requestBackend("/commission/settings",{method:"PUT",body:JSON.stringify({target:String(s.target),period:String(s.period)})});
  },
  async sellingCases(userID){
    const query=userID?`?user_id=${encodeURIComponent(userID)}`:"";
    const result=await requestBackend(`/selling-cases${query}`);
    return result.data||[];
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
  // Demo storage for contracts until the backend has a contract endpoint.
  async packages(){return copy(db.packages||DEFAULTS.packages)},
  async contracts(){return copy(db.contracts||[])},
  async saveContract(c){
    db.contracts=db.contracts||[];
    const contract_id=Math.max(0,...db.contracts.map(x=>x.contract_id))+1;
    db.contracts.push({...c,contract_id});persist();
    return {contract_id};
  },
  async discardedContracts(){return copy(db.discarded||[])},
  async discardContract(insurance_id){
    db.discarded=db.discarded||[];
    if(!db.discarded.includes(insurance_id))db.discarded.push(insurance_id);
    persist();
    return {};
  },
  async notifications(){
    const result=await requestBackend("/notification");
    return (result.data||[]).map(n=>({...n,text:n.content??n.text??"",time:n.create_timestamp??n.created_at??n.time??""}));
  }
};
