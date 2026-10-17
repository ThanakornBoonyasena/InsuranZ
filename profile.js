mountNav("profile");
$("#main").innerHTML=`<h1>Profile</h1><div class="card pad"><p><b class="profile-name">Syntax Waiyakorn</b><br><span class="muted">Role: ${esc(role)}</span></p><button class="btn" onclick="signOut()">Sign out</button></div>`;
