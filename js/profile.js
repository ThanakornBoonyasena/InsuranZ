mountNav("profile");
const userName=store.get("user_name")||"-";
const userID=store.get("user_id")||"-";
$("#main").innerHTML=`<h1>Profile</h1><div class="card pad"><p><b class="profile-name">${esc(userName)}</b></p><div class="profile-details"><div><b>User ID</b>${esc(userID)}</div><div><b>Role</b>${esc(role||"-")}</div></div><p><button class="btn" onclick="signOut()">Sign out</button></p></div>`;
