// Insurance, commission, and report creation use the backend API; remaining demo sections use localStorage.
const KEY="insuranz_db_v2";
const API_BASE=window.API_BASE_URL||"http://localhost:3000/api/v1";
const BANK_API_BASE=window.BANK_API_BASE_URL||"http://localhost:3001/api/v1";
async function requestBackend(path,options={}){
  const response=await fetch(`${API_BASE}${path}`,{
    ...options,
    headers:{"Content-Type":"application/json",...(options.headers||{})}
  });
  const payload=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(payload.error||payload.message||`Request failed (${response.status})`);
  return payload;
}
async function requestBank(path){
  const response=await fetch(`${BANK_API_BASE}${path}`);
  const payload=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(payload.error||payload.message||`Request failed (${response.status})`);
  return payload;
}
const copy=o=>JSON.parse(JSON.stringify(o));
const DEFAULTS = {
  customers: [
    {customer_id:1,customer_name:"Somchai Prasert",telephone_number:"000-000-0001",customer_email:"somchai@example.com",customer_address:"12 Sukhumvit Road, Bangkok",customer_gender:"Male",customer_sex:"Male",salary_per_month:45000,job_description:"Software engineer",customer_dob:"1984-04-12T00:00:00",create_timestamp:"2026-01-12T09:30",health_info:"Non-smoker, mild hypertension"},
    {customer_id:2,customer_name:"Nattaya Wong",telephone_number:"000-000-0002",customer_email:"nattaya@example.com",customer_address:"88 Rattanathibet Road, Nonthaburi",customer_gender:"Female",customer_sex:"Female",salary_per_month:38000,job_description:"Marketing specialist",customer_dob:"1997-06-23T00:00:00",create_timestamp:"2026-03-02T14:10",health_info:"No known conditions"},
    {customer_id:3,customer_name:"Arthit Boonmee",telephone_number:"000-000-0003",customer_email:"arthit@example.com",customer_address:"45 Nimmanhaemin Road, Chiang Mai",customer_gender:"Male",customer_sex:"Male",salary_per_month:72000,job_description:"Business owner",customer_dob:"1971-09-07T00:00:00",create_timestamp:"2025-11-20T11:00",health_info:"Type 2 diabetes"}
  ],
  insurances: [
    {insurance_id:1001,customer_id:1,package_id:1,broker:"B-204",selling_case:"Referral",status:null,sign_date:"2026-09-14T10:00",additional_detail:"Family coverage add-on requested."},
    {insurance_id:1002,customer_id:2,package_id:2,broker:"B-204",selling_case:"Walk-in",status:true,sign_date:"2026-08-30T16:45",additional_detail:""},
    {insurance_id:1004,customer_id:2,package_id:3,broker:"B-117",selling_case:"Online",status:true,sign_date:"2026-10-05T09:00",additional_detail:""},
    {insurance_id:1003,customer_id:3,package_id:1,broker:"B-204",selling_case:"Online",status:false,sign_date:"2026-10-01T13:20",additional_detail:"Pre-existing condition under review."}
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
    {id:1,customer_id:"1",customer_name:"Somchai Prasert",user_id:204,location:"Central World, Bangkok",appointment_date:"2026-10-19T10:00",packages:["Family Health Plus"],report_count:1,reports:[{report_id:1,date:"2026-10-19T11:30",create_timestamp:"2026-10-19T11:30",report_note:"Interested in adding family members. Will decide next week.",content:"Interested in adding family members. Will decide next week."}]},
    {id:2,customer_id:"2",customer_name:"Nattaya Wong",user_id:204,location:"Office, Nonthaburi",appointment_date:"2026-10-22T14:00",packages:["Life Secure 20","Auto Care"],report_count:0,reports:[]}
  ],
  notifications: [
    {id:1,audience:"broker",text:"A broker searched the bank customer database.",time:"2026-10-24T09:12:00",is_read:false},
    {id:2,audience:"company",text:"A new item is waiting for company review.",time:"2026-10-23T15:30:00",is_read:false},
    {id:3,audience:"all",text:"A contract was signed for customer 1.",time:"2026-10-22T11:45:00",is_read:true}
  ]
};

let db;
try{db=JSON.parse(localStorage.getItem(KEY))}catch{}
db=db||copy(DEFAULTS);
for(const customer of db.customers||[]){
  if(!customer.telephone_number)customer.telephone_number=`000-000-${String(customer.customer_id).padStart(4,"0")}`;
  const mockCustomer=DEFAULTS.customers.find(item=>item.customer_id===customer.customer_id);
  if(mockCustomer)for(const field of ["salary_per_month","job_description","customer_gender","customer_sex","customer_dob","customer_email","customer_address"]){
    if(customer[field]===undefined)customer[field]=mockCustomer[field];
  }
}
const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(db))}catch{}};
function reloadDb(){try{const d=JSON.parse(localStorage.getItem(KEY));if(d)db=d}catch{}}
persist();
const api={
  async insuranceRecords(userID,summary=false){
    const params=new URLSearchParams();
    if(userID)params.set("user_id",userID);
    if(summary)params.set("summary","true");
    const query=params.toString()?`?${params}`:"";
    const result=await requestBackend(`/insurance/insurance-info${query}`);
    return (result.data||[]).map(record=>{
      const condition=record.status||"";
      const statusMap={ACCEPT:"Approve",REJECT:"Deny",APPROVE:"Approve",DENY:"Deny"};
      return {...record,status:statusMap[String(condition).trim().toUpperCase()]||condition||"Pending"};
    });
  },
  async insuranceRecord(id,userID){
    const params=new URLSearchParams({insurance_id:String(id)});
    if(userID)params.set("user_id",userID);
    const result=await requestBackend(`/insurance/insurance-info?${params}`);
    return result.data?.[0]||null;
  },
  async customerRecords(summary=false){
    const query=summary?"?summary=true":"";
    const result=await requestBackend(`/customer/customer-info${query}`);
    return result.data||[];
  },
  async customerRecord(id){
    const result=await requestBackend(`/customer/customer-info?customer_id=${encodeURIComponent(id)}`);
    return result.data?.[0]||null;
  },
  async appointmentData(){
    const userID=store.get("user_id");
    const [result,customerList]=await Promise.all([
      requestBackend(`/appointments${userID?`?user_id=${encodeURIComponent(userID)}`:""}`),
      this.customerRecords()
    ]);
    return {
      appointments:(result.data||[]).map(appointment=>({
        ...appointment,
        id:appointment.appointment_id,
        reports:[]
      })),
      customers:customerList,
      packages:result.package_options||[]
    };
  },
  async saveAppointment(appointment){
    const payload={
      customer_id:appointment.customer_id,
      sell_case_id:appointment.sell_case_id?Number(appointment.sell_case_id):null,
      user_id:Number(appointment.user_id||store.get("user_id")),
      appointment_date:new Date(appointment.appointment_date).toISOString(),
      location:appointment.location,
      packages:appointment.packages||[]
    };
    const path=appointment.id?`/appointments/${appointment.id}`:"/appointments";
    return requestBackend(path,{method:appointment.id?"PUT":"POST",body:JSON.stringify(payload)});
  },
  async deleteAppointment(id){
    return requestBackend(`/appointments/${id}`,{method:"DELETE"});
  },
  async searchBankCustomers(filters={}){
    const params=new URLSearchParams();
    for(const [key,value] of Object.entries(filters))if(value!="")params.set(key,value);
    const result=await requestBank(`/bank/customers?${params.toString()}`);
    await requestBackend("/notification/bank-customer-search",{method:"POST",body:JSON.stringify({count:Number(result.count||0)})});
    return result.data||[];
  },
  async bankCustomerFilterOptions(){
    const result=await requestBank("/bank/customer-filter-options");
    return result.data||{gender:[],sex:[]};
  },
  async addCustomers(customers){
    return requestBackend("/customer/customer-info/add",{method:"POST",body:JSON.stringify({data:customers})});
  },
  async approveInsurance(id){return requestBackend("/insurance/approve",{method:"POST",body:JSON.stringify({insurance_id:id,insurance_condition:"ACCEPT"})})},
  async denyInsurance(id){return requestBackend("/insurance/deny",{method:"POST",body:JSON.stringify({insurance_id:id})})},
  async editInsurance(id,detail){
    return requestBackend("/insurance/edit",{method:"POST",body:JSON.stringify({insurance_id:id,additional_detail:detail})});
  },
  async submitSignedContract(contract){
    return requestBackend("/insurance/sign-contract",{method:"POST",body:JSON.stringify(contract)});
  },
  async insurances(){return db.insurances.map(i=>({...i,customer:db.customers.find(c=>c.customer_id===i.customer_id),package:db.packages.find(p=>p.package_id===i.package_id)}))},
  async update(id,patch){Object.assign(db.insurances.find(i=>i.insurance_id===id),patch);persist()},
  async commissionTable(){
    const result=await requestBackend("/commission/table");
    const records=result.data||[];
    if(records.length===0)return null;

    // The database stores each cell by its actual point and percent axes.
    // Rebuild the editable grid from those axes instead of positional indices.
    const cols=[...new Set(records.map(cell=>Number(cell.percentage)))].sort((a,b)=>a-b).map(String);
    const rows=[...new Set(records.map(cell=>Number(cell.point)))].sort((a,b)=>a-b).map(String);
    const cells=Array.from({length:rows.length},()=>Array(cols.length).fill(""));
    const colIndex=new Map(cols.map((value,index)=>[Number(value),index]));
    const rowIndex=new Map(rows.map((value,index)=>[Number(value),index]));
    for(const record of records){
      const row=rowIndex.get(Number(record.point));
      const col=colIndex.get(Number(record.percentage));
      if(row!==undefined&&col!==undefined)cells[row][col]=String(record.commission);
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
      data.push({point:point,percentage:percent,commission:commission});
    }));
    const result=await requestBackend("/commission/table",{method:"PUT",body:JSON.stringify({data})});
    const records=result.data||[];
    if(records.length===0)return null;
    const cols=[...new Set(records.map(cell=>Number(cell.percentage)))].sort((a,b)=>a-b).map(String);
    const rows=[...new Set(records.map(cell=>Number(cell.point)))].sort((a,b)=>a-b).map(String);
    const cells=Array.from({length:rows.length},()=>Array(cols.length).fill(""));
    const colIndex=new Map(cols.map((value,index)=>[Number(value),index]));
    const rowIndex=new Map(rows.map((value,index)=>[Number(value),index]));
    for(const record of records)cells[rowIndex.get(Number(record.point))][colIndex.get(Number(record.percentage))]=String(record.commission);
    return {cols,rows,cells};
  },
  async commissionSettings(){
    const result=await requestBackend("/commission/settings");
    return {
      target:String(result.data?.target??""),
      period:String(result.data?.period??"")
    };
  },
  async dashboardSummary(userID){
    const result=await requestBackend(`/dashboard/summary?user_id=${encodeURIComponent(userID)}`);
    return result.data;
  },
  async saveSettings(s){
    return requestBackend("/commission/settings",{method:"PUT",body:JSON.stringify({target:String(s.target),period:String(s.period)})});
  },
  async sellingCases(userID){
    const query=userID?`?user_id=${encodeURIComponent(userID)}`:"";
    const result=await requestBackend(`/selling-cases${query}`);
    return result.data||[];
  },
  async reports(summary=false,appointmentID=null,userID=store.get("user_id")){
    const params=new URLSearchParams();
    if(summary)params.set("summary","true");
    if(appointmentID)params.set("appointment_id",String(appointmentID));
    if(userID)params.set("user_id",String(userID));
    const query=params.toString()?`?${params}`:"";
    const result=await requestBackend(`/reports${query}`);
    return result.data||[];
  },
  async saveReport(report){
    return requestBackend("/reports",{method:"POST",body:JSON.stringify({
      appointment_fk:report.appointment_fk??report.appointment_id,
      content:report.content??report.report_note
    })});
  },
  // Demo storage for contracts until the backend has a contract endpoint.
  async packages(){
    const result=await requestBackend("/insurance/packages");
    return result.data||[];
  },
  async contracts(){return copy(db.contracts||[])},
  async saveContract(c){
    db.contracts=db.contracts||[];
    const existing=db.contracts.findIndex(item=>Number(item.insurance_id)===Number(c.insurance_id));
    if(existing>=0){
      db.contracts[existing]={...db.contracts[existing],...c};
      persist();
      return {contract_id:db.contracts[existing].contract_id};
    }
    const contract_id=Math.max(0,...db.contracts.map(x=>x.contract_id))+1;
    db.contracts.push({...c,contract_id});persist();
    return {contract_id};
  },
  async discardContract(insurance_id){
    return requestBackend("/insurance/discard",{method:"POST",body:JSON.stringify({insurance_id:Number(insurance_id),user_id:Number(store.get("user_id"))})});
  },
  async notifications(){
    const params=new URLSearchParams({user_id:String(store.get("user_id")||""),role:String(store.get("role")||"")});
    const result=await requestBackend(`/notification?${params.toString()}`);
    return (result.data||[]).map(n=>({
      ...n,
      id:n.notification_id??n.id,
      is_read:n.is_read===true,
      audience:n.audience??"all",
      text:n.content??n.text??"",
      time:n.create_timestamp??n.created_at??n.time??""
    }));
  },
  async markNotificationRead(id){
    const params=new URLSearchParams({user_id:String(store.get("user_id")||""),role:String(store.get("role")||"")});
    return requestBackend(`/notification/${encodeURIComponent(id)}/read?${params.toString()}`,{method:"PATCH"});
  }
};
