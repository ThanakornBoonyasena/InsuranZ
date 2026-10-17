// Mock data layer, saved in localStorage so changes survive between pages.
// When the real DB is ready, replace the bodies of the api functions with fetch('/api/...') calls.
const KEY="insuranz_db_v1";
const copy=o=>JSON.parse(JSON.stringify(o));
const DEFAULTS = {
  customers: [
    {customer_id:1,customer_name:"Somchai Prasert",customer_age:42,create_timestamp:"2026-01-12T09:30",health_info:"Non-smoker, mild hypertension"},
    {customer_id:2,customer_name:"Nattaya Wong",customer_age:29,create_timestamp:"2026-03-02T14:10",health_info:"No known conditions"},
    {customer_id:3,customer_name:"Arthit Boonmee",customer_age:55,create_timestamp:"2025-11-20T11:00",health_info:"Type 2 diabetes"}
  ],
  insurances: [
    {insurance_id:1001,customer_id:1,selling_case:"Referral",status:null,sign_date:"2026-09-14T10:00",additional_detail:"Family coverage add-on requested.",type:"Health",payment_amount:1500,payment_interval_months:1},
    {insurance_id:1002,customer_id:2,selling_case:"Walk-in",status:true,sign_date:"2026-08-30T16:45",additional_detail:"",type:"Life",payment_amount:3200,payment_interval_months:3},
    {insurance_id:1003,customer_id:3,selling_case:"Online",status:false,sign_date:"2026-10-01T13:20",additional_detail:"Pre-existing condition under review.",type:"Health",payment_amount:2100,payment_interval_months:6}
  ],
  commissions: [
    {insurance_id:1002,broker:"B-204",amount:960,date:"2026-09-05"},
    {insurance_id:1001,broker:"B-117",amount:450,date:"2026-09-20"}
  ],
  commissionSettings:{target:"100000",period:"Monthly"},
  commissionTable:{cols:[100,120],rows:[70,100],cells:[[5,8],[10,15]]},
  notifications: [
    {text:"Insurance #1001 is waiting for approval.",time:"Today, 09:12"},
    {text:"Commission for #1002 was paid out.",time:"Yesterday"}
  ]
};

let db;
try{db=JSON.parse(localStorage.getItem(KEY))}catch{}
db=db||copy(DEFAULTS);
const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(db))}catch{}};
const api={
  async insurances(){return db.insurances.map(i=>({...i,customer:db.customers.find(c=>c.customer_id===i.customer_id)}))},
  async update(id,patch){Object.assign(db.insurances.find(i=>i.insurance_id===id),patch);persist()},
  async commissionTable(){return db.commissionTable?copy(db.commissionTable):null},
  async saveCommission(t){db.commissionTable=copy(t);persist()},
  async commissionSettings(){return copy(db.commissionSettings)},
  async saveSettings(s){db.commissionSettings=copy(s);persist()},
  async notifications(){return copy(db.notifications)}
};
