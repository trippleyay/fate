document.addEventListener('keydown', (e)=>{
  // Ignore keystrokes when typing in inputs (e.g. cashout amount field)
  const tag = e.target && e.target.tagName;
  if(tag==="INPUT" || tag==="TEXTAREA" || tag==="SELECT") return;
  if(e.key==="Enter"){
    const enterBtn = app.querySelector('.enter-prompt');
    if(enterBtn){ enterBtn.click(); return; }
  }
  const n = parseInt(e.key,10);
  if(!n) return;
  const opts = app.querySelectorAll('.opt:not([disabled])');
  if(opts[n-1]) opts[n-1].click();
});
