window.__workspaceShell=true;
const workspaceRoutes=new Set(["insurance","commission","sign-contract","dashboard","customer","report","appointment","notify","profile"]);
const workspaceFrame=$("#workspace-frame");

function setWorkspaceActivePage(page){
  document.querySelectorAll(".nav [data-page]").forEach(link=>link.classList.toggle("active",link.dataset.page===page));
}

function navigateContentPage(page,addHistory=true){
  if(!workspaceRoutes.has(page))return false;
  if(addHistory)history.pushState({page},"",`workspace.html?page=${encodeURIComponent(page)}`);
  workspaceFrame.dataset.page=page;
  setWorkspaceActivePage(page);
  workspaceFrame.src=`${page}.html?embedded=1`;
  return false;
}

workspaceFrame.addEventListener("load",()=>{
  if(workspaceFrame.dataset.page==="notify"&&window.__notificationSnapshot){
    workspaceFrame.contentWindow.postMessage({type:"notification-list",data:window.__notificationSnapshot},location.origin);
  }
});

window.addEventListener("popstate",()=>{
  const page=new URLSearchParams(location.search).get("page")||"";
  navigateContentPage(workspaceRoutes.has(page)?page:(role==="company"?"insurance":"dashboard"),false);
});

if(!role){location.href="login.html"}else{
  const requested=new URLSearchParams(location.search).get("page")||"";
  const defaultPage=role==="company"?"insurance":"dashboard";
  const initialPage=workspaceRoutes.has(requested)?requested:defaultPage;
  if(!requested||requested!==initialPage)history.replaceState({page:initialPage},"",`workspace.html?page=${initialPage}`);
  mountNav(initialPage);
  navigateContentPage(initialPage,false);
}
