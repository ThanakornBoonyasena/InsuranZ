const loginForm=$("#login-form");
const loginMessage=$("#login-message");
const loginSubmit=$("#login-submit");

loginForm.addEventListener("submit",async event=>{
  event.preventDefault();
  loginMessage.textContent="";

  const userName=loginForm.elements.user_name.value.trim();
  const password=loginForm.elements.password.value;
  if(!userName||!password){
    loginMessage.textContent="Enter your username and password.";
    return;
  }

  loginSubmit.disabled=true;
  loginSubmit.textContent="Signing in...";
  try{
    const response=await requestBackend("/auth/login",{
      method:"POST",
      body:JSON.stringify({user_name:userName,password})
    });
    const account=response.data;
    const accountRole=String(account?.role||"").toLowerCase();
    if(!account?.user_id||!account.user_name||!["company","broker"].includes(accountRole)){
      throw new Error("The server returned an invalid account.");
    }

    store.set("role",accountRole);
    store.set("user_id",String(account.user_id));
    store.set("user_name",account.user_name);

    if(accountRole==="broker"){
      const broker=account.broker||{};
      db.brokerProfile={
        id:String(broker.user_id??account.user_id),
        name:broker.user_name??account.user_name,
        points:Number(broker.cum_point)||0,
        cum_sale:Number(broker.cum_sale)||0
      };
      persist();
    }

    location.href=accountRole==="company"?"insurance.html":"dashboard.html";
  }catch(error){
    loginMessage.textContent=error instanceof TypeError
      ?"Unable to connect to the server. Check that the backend is running."
      :error.message||"Unable to sign in.";
  }finally{
    loginSubmit.disabled=false;
    loginSubmit.textContent="Sign in";
  }
});
