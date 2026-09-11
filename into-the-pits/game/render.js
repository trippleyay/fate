const app = document.getElementById('app');
let SCREEN = "splash";
let SCREEN_DATA = {};

function goto(screen, data){
  SCREEN = screen; SCREEN_DATA = data||{};
  if(typeof stopPendingTimer === "function") stopPendingTimer();
  render();
  if(SCREEN==="pending") startPendingTimer();
  window.scrollTo({top:0});
}

render();

/* Scales the title banner (and any .title-wrap) to fit its container with
   no clipping and no scrollbar, instead of the fixed font-size approach. */
function fitAllTitles(){
  document.querySelectorAll('.title-wrap').forEach(wrap=>{
    const pre = wrap.querySelector('pre');
    if(!pre) return;
    pre.style.transform = 'none';
    pre.style.marginLeft = '0px';
    const rect = pre.getBoundingClientRect();
    if(!rect.width) return;
    const availW = wrap.clientWidth;
    let scale = availW / rect.width;
    const maxScale = wrap.classList.contains('title-wrap-splash') ? 2.4 : 1;
    scale = Math.min(scale, maxScale);
    const scaledW = rect.width * scale;
    const marginLeft = Math.max(0, (availW - scaledW) / 2);
    pre.style.transform = 'scale('+scale+')';
    pre.style.marginLeft = marginLeft+'px';
    wrap.style.height = (rect.height*scale)+'px';
  });
}
window.addEventListener('resize', fitAllTitles);

const FATE_ICON_TOKEN = "\u0001"; /* survives esc(); swapped for the real icon post-escape */
const FATE_ICON_HTML = '<img class="fate-icon" src="./public/assets/fate-icon.png" alt="F">';
function statusPanel(){
  const rank = (()=>{
    const idx = LB_CACHE.findIndex(e=>e.playerId===PLAYER_ID);
    return idx>=0 ? "#"+(idx+1)+" of "+LB_CACHE.length : "unranked";
  })();
  return boxHtml("STATUS", [
    "FATE "+FATE_ICON_TOKEN+" "+(STATE?STATE.fate:0),
    "LEADERBOARD  "+rank,
    "TURN  "+(STATE?STATE.turn:1)+"   ROSTER  "+(STATE?STATE.roster.filter(f=>f.status==="active").length:0)+" active"
  ], 40).replace(/\u0001/g, FATE_ICON_HTML);
}

function navBar(active){
  const items = [["main","Main"],["book","Book Match"],["side","Side Bets"],["pending","Matches"],["lb","Leaderboard"],["store","Store"],["home","Home Menu"]];
  return '<div class="navrow">'+items.map(([id,label])=>
    '<button class="navbtn'+(active===id?' primary':'')+'" data-nav="'+id+'">'+esc(label)+'</button>'
  ).join('')+'</div>';
}

function render(){
  app.classList.toggle('splash-mode', SCREEN==="splash" || SCREEN==="walletConnect");
  let html = "";

  if(SCREEN==="splash"){
    html = renderSplash();
  } else if(SCREEN==="walletConnect"){
    html = renderWalletConnect();
  } else {
    html += '<div class="title-wrap">'+TITLE_BANNER_HTML+'</div>';
    if(SCREEN==="home") html += '<div class="tagline">A DEN. A CITY. A CROWD THAT ALWAYS WANTS MORE.</div>';

    if(SCREEN==="home") html += renderHome();
    else if(SCREEN==="main") html += renderMain();
    else if(SCREEN==="book") html += renderBook();
    else if(SCREEN==="side") html += renderSide();
    else if(SCREEN==="sideConfirm") html += renderSideConfirm();
    else if(SCREEN==="lb") html += renderLeaderboard();
    else if(SCREEN==="store") html += renderStore();
    else if(SCREEN==="settings") html += renderSettings();
    else if(SCREEN==="about") html += renderAbout();
    else if(SCREEN==="scene") html += renderScene();
    else if(SCREEN==="fightResolve") html += renderFightResolve();
    else if(SCREEN==="sideResolve") html += renderSideResolve();
    else if(SCREEN==="pending") html += renderPending();
    else if(SCREEN==="marketlog") html += renderMarketLog();
    else if(SCREEN==="winReward") html += renderWinReward();
    else if(SCREEN==="gameover") html += renderGameOver();
    else html += '<div class="story-text">Loading...</div>';
  }

  app.innerHTML = html;
  bindEvents();
  fitAllTitles();
}

/* ---------------------------------------------------------------------
   SPLASH + WALLET CONNECT
   (Wallet connect is a placeholder handshake, same status as the Store's
   buy/cash-out flow, until real DreamDEX/wallet wiring drops in.)
   --------------------------------------------------------------------- */
function renderSplash(){
  let out = '<div class="splash-screen">';
  out += '<div class="title-wrap title-wrap-splash">'+TITLE_BANNER_HTML+'</div>';
  out += '<div class="splash-tagline">A DEN. A CITY. A CROWD THAT ALWAYS WANTS MORE.</div>';
  out += '<div class="disclaimer-box"><b>FATE HAS REAL FINANCIAL VALUE.</b><br>'
       + 'Fate is bought and cashed out for real money through connected DreamDEX markets. '
       + 'Outcomes are not guaranteed and you can lose what you wager. Only play with money '
       + 'you can afford to lose. You must meet the legal age and eligibility requirements in '
       + 'your jurisdiction to participate. Play responsibly.</div>';
  out += '<button class="enter-prompt" data-action="splash-enter">[ENTER] CONNECT WALLET</button>';
  out += '</div>';
  return out;
}
function renderWalletConnect(){
  const stage = SCREEN_DATA.stage || "connecting";
  let out = '<div class="splash-screen">';
  out += '<div class="title-wrap title-wrap-splash">'+TITLE_BANNER_HTML+'</div>';
  if(stage==="connecting"){
    out += '<div class="story-text">Reaching out to your wallet provider...</div>';
    out += '<div class="connect-status"><span class="spinner"></span><span id="connect-status-text">Requesting your wallet account…</span></div>';
    out += '<button class="enter-prompt" data-action="wallet-confirm">[ENTER] CONFIRM CONNECTION</button>';
    out += '<div class="wallet-line">A valid wallet connection is required to enter the Pit.</div>';
  } else if(stage==="error"){
    out += '<div class="story-text" style="color:var(--red)">CONNECTION FAILED</div>';
    out += '<div class="wallet-line" style="max-width:560px">'+esc(SCREEN_DATA.error||"Unknown error")+'</div>';
    out += '<button class="enter-prompt" data-action="wallet-confirm" style="margin-top:22px">[ENTER] TRY AGAIN</button>';
    out += '<button class="navbtn" data-action="back-splash" style="margin-top:14px">Back</button>';
  } else {
    out += '<div class="story-text">Wallet connected.</div>';
    out += '<div class="wallet-line" style="margin-top:0">'+esc(PLAYER_ID||"")+'</div>';
    out += '<button class="enter-prompt" data-action="wallet-continue" style="margin-top:22px">[ENTER] CONTINUE</button>';
  }
  out += '</div>';
  return out;
}

/* ---------------------------------------------------------------------
   HOME
   --------------------------------------------------------------------- */
function renderHome(){
  let out = '<div class="screen home-hero">';
  out += '<div class="panel" data-label="THE PIT — HOME MENU">';
  out += '<div class="options">';
  out += optRow(1,"Continue","home-continue");
  out += optRow(2,"New Game","home-new");
  out += optRow(3,"Leaderboard","home-lb");
  out += optRow(4,"Store","home-store");
  out += optRow(5,"Market Log","home-marketlog");
  out += optRow(6,"Settings","home-settings");
  out += optRow(7,"About","home-about");
  out += '</div></div>';
  out += '<div class="fate-note" style="text-align:center">Saltmark, The Trench. Basement level. One floor legal. Everything below that is not.</div>';
  out += '</div>';
  return out;
}
function optRow(n,label,action,reactionHtml,disabled){
  return '<button class="opt" '+(disabled?'disabled':'')+' data-action="'+action+'"><span class="tag">['+n+']</span>'+esc(label)+(reactionHtml?'<span class="reaction">'+reactionHtml+'</span>':'')+'</button>';
}

/* ---------------------------------------------------------------------
   MAIN SCREEN — turn loop
   --------------------------------------------------------------------- */
function drawEvent(){
  const pool = EVENTS.filter(e=> !STATE.lastEvents.includes(e.id));
  const recruitmentAvailable = Object.keys(SCENES).some(k=>!STATE.scenesResolved[k]);
  const choices = [...pool];
  // weight recruitment as one "slot" in the pool if available and not drawn last 2 turns
  if(recruitmentAvailable && !STATE.lastEvents.includes("__recruit__")){
    choices.push({id:"__recruit__", isRecruitment:true});
  }
  const drawn = pick(choices);
  STATE.lastEvents.push(drawn.id);
  if(STATE.lastEvents.length>2) STATE.lastEvents.shift();
  return drawn;
}

function renderMain(){
  if(!STATE.pendingEventId){
    const drawn = drawEvent();
    STATE.pendingEventId = drawn.id;
    if(drawn.isRecruitment){
      const available = Object.keys(SCENES).filter(k=>!STATE.scenesResolved[k]);
      STATE.pendingRecruitSceneId = pick(available);
    }
    saveNow();
  }
  const isRecruit = STATE.pendingEventId === "__recruit__";
  const ev = isRecruit ? null : EVENTS.find(e=>e.id===STATE.pendingEventId);

  let out = '<div class="screen">';
  out += statusPanel();
  out += '<div class="panel" data-label="THE PIT — MAIN">';

  if(isRecruit){
    const sceneId = STATE.pendingRecruitSceneId;
    out += '<div class="story-text">Word reaches you that someone worth a look might be found tonight, if you go looking.</div>';
    out += '<div class="options">';
    out += optRow(1,"Go find them. ("+SCENES[sceneId].label+")","go-recruit");
    out += optRow(2,"Not tonight. Handle something closer to home instead.","skip-recruit");
    out += '</div>';
  } else {
    out += '<div class="with-head">';
    if(ev.speaker && HEADS[ev.speaker]){
      out += '<pre>'+esc(HEADS[ev.speaker])+'</pre>';
    }
    out += '<div style="flex:1">';
    if(ev.speaker && SPEAKER_NAMES[ev.speaker]) out += '<div class="speaker-name">'+esc(SPEAKER_NAMES[ev.speaker])+'</div>';
    out += '<div class="story-text">'+esc(ev.text)+'</div>';
    out += '</div></div>';
    out += '<div class="options">';
    ev.options.forEach((o,i)=>{
      out += optRow(i+1, o.label, "ev-opt-"+i);
    });
    out += '</div>';
  }

  out += '</div>';
  out += navBar("main");
  out += '</div>';
  return out;
}

function resolveEventOption(idx){
  const ev = EVENTS.find(e=>e.id===STATE.pendingEventId);
  const opt = ev.options[idx];
  opt.effect(STATE);
  saveNow();
  showReactionThenAdvance(opt.reaction);
}
function endTurn(){
  STATE.turn++;
  STATE.pendingEventId = null;
  STATE.pendingRecruitSceneId = null;
  saveNow();
  goto("main");
}
function showReactionThenAdvance(reactionText){
  const panel = app.querySelector('.panel[data-label="THE PIT — MAIN"]');
  if(!panel) return;
  panel.innerHTML = '<div class="story-text">'+esc(reactionText)+'</div><div class="options">'+optRow(1,"Continue","turn-end")+'</div>';
  bindEvents();
}

/* ---------------------------------------------------------------------
   RECRUITMENT SCENE RUNNER
   --------------------------------------------------------------------- */
function startScene(sceneId){
  STATE.sceneNode = {sceneId, nodeId: SCENES[sceneId].start, showedIntro:false};
  goto("scene");
}
function renderScene(){
  const {sceneId, nodeId} = STATE.sceneNode;
  const scene = SCENES[sceneId];
  const node = scene.nodes[nodeId];
  let out = '<div class="screen">';
  out += statusPanel();
  out += '<div class="panel" data-label="FINDING A FIGHTER — '+esc(scene.label)+'">';
  if(!STATE.sceneNode.showedIntro){
    out += '<div class="story-text">'+esc(scene.intro)+'</div>';
  }
  if(node.text){
    out += '<div class="with-head"><pre>'+esc(HEADS.fighter)+'</pre><div style="flex:1"><div class="speaker-name">'+esc(scene.label)+'</div><div class="story-text">'+esc(node.text)+'</div></div></div>';
  }
  out += '<div class="options">';
  node.options.forEach((o,i)=>{
    out += optRow(i+1, o.label, "scene-opt-"+i);
  });
  out += '</div></div></div>';
  return out;
}
function resolveSceneOption(idx){
  const {sceneId, nodeId} = STATE.sceneNode;
  const scene = SCENES[sceneId];
  const node = scene.nodes[nodeId];
  const opt = node.options[idx];
  STATE.sceneNode.showedIntro = true;
  if(node.isDecision){
    if(opt.effect) opt.effect(STATE);
    STATE.scenesResolved[sceneId] = true;
    saveNow();
    const panel = app.querySelector('.panel');
    panel.innerHTML = '<div class="story-text">'+esc(opt.resultText)+'</div><div class="options">'+optRow(1,"Return to the Pit","turn-end")+'</div>';
    bindEvents();
    return;
  }
  if(opt.effect) opt.effect(STATE);
  const panel = app.querySelector('.panel');
  panel.innerHTML = '<div class="story-text">'+esc(opt.reaction)+'</div><div class="options">'+optRow(1,"Continue","scene-advance-"+opt.next)+'</div>';
  bindEvents();
}
function advanceScene(nextId){
  STATE.sceneNode.nodeId = nextId;
  STATE.sceneNode.showedIntro = true;
  goto("scene");
}

/* ---------------------------------------------------------------------
   FIGHT NIGHT — outcomes decided by a REAL DreamDEX binary market.
   Booking a fight pins the escrow to the soonest-to-resolve market
   (YES = your fighter wins, arbitrary mapping the player never sees).
   The Teller reads the market's on-chain resolution at settle time;
   no local roll exists on the Fate path.
   --------------------------------------------------------------------- */
function applyFightResult(fighter, result){
  if(result==="WIN"){
    fighter.wins++; fighter.streakType==="W" ? fighter.streak++ : (fighter.streak=1, fighter.streakType="W");
    fighter.lossStreakCount = 0;
    STATE.wins++; STATE.winStreak++; STATE.lossStreak = 0;
  } else {
    fighter.losses++; fighter.streakType==="L" ? fighter.streak++ : (fighter.streak=1, fighter.streakType="L");
    fighter.lossStreakCount = (fighter.lossStreakCount||0)+1;
    STATE.losses++; STATE.lossStreak++; STATE.winStreak = 0;
  }
  STATE.totalFights++;
}

function recordMatchHistory(m, settleRes){
  addToMatchLog({
    escrowId: m.escrowId, marketId: m.marketId,
    question: settleRes.market?.question || m.question || "",
    asset: settleRes.market?.asset || m.asset || "",
    kind: m.kind, side: settleRes.market?.side || m.side,
    winningOutcome: settleRes.market?.winningOutcome || null,
    title: m.title, stake: m.stake, payout: settleRes.payout ?? 0,
    won: !!settleRes.won, settledAt: Date.now(),
    entryOdds: settleRes.entryOdds ?? m.meta?.entryOdds ?? null,
    resolvedAt: settleRes.market?.resolvedAt || null,
  });
}
/* Persistent, cross-game settled market log (Market Log screen / Home menu).
   Decoupled from the per-game save so New Game / Reset All never clear it. */
function addToMatchLog(entry){
  MATCH_LOG.unshift(entry);
  if(MATCH_LOG.length>100) MATCH_LOG.length=100;
  Persist.saveMatchLog(MATCH_LOG);
}

async function lockInFight(){
  const {fighter, opponent} = SCREEN_DATA;
  if(!Fate.live){ alert("A valid wallet connection is required to fight."); goto("splash"); return; }
  if(BET_IN_FLIGHT){ alert("Your call is already being booked — one moment."); return; }
  BET_IN_FLIGHT = true;
  try{
    let market;
    try{
      market = await Fate.findMarket();
    }catch(err){
      alert("No available DreamDEX market: "+(err.message||"unknown reason"));
      render(); return;
    }
    if(!market){ alert("No active DreamDEX market right now. Try again shortly."); render(); return; }
    const entryOdds = (market.odds != null) ? market.odds : 0.5; // YES-side odds
    const meta = { fighter: fighter.name, fighterId: fighter.id, opponent: opponent.name, matchTitle: fighter.name+" vs "+opponent.name, entryOdds };
    let r;
    try{
      r = await Fate.stake("fight_stake","YES",market.marketId,meta,new Date(market.expiryMs).toISOString());
    }catch(err){
      alert("Could not stake Fate — "+(err.message||"unknown reason")+". The match was not booked.");
      render(); return;
    }
    if(r && r.escrowId){
      STATE.pendingMatches.push({
        escrowId:r.escrowId, marketId:market.marketId, question:market.question,
        kind:"fight_stake", side:"YES", stake:FATE_STAKE,
        title:meta.matchTitle, fighterId:fighter.id, opponentName:opponent.name,
        expiresAt:market.expiryMs, placedAt:Date.now(), _check:null,
      });
      saveNow();
      goto("fightResolve",{fighter,opponent,booked:true,expiresAt:market.expiryMs});
      return;
    }
    alert("Could not stake Fate — the match was not booked for an unknown reason. Try again.");
    render();
  } finally {
    BET_IN_FLIGHT = false;
  }
}

/* Settle a pending match from the Pending Matches screen. The Teller verifies
   the pinned market's resolution; the client only learns the result here. */
async function settlePending(escrowId){
  const idx = STATE.pendingMatches.findIndex(m=>m.escrowId===escrowId);
  if(idx<0){ render(); return; }
  const m = STATE.pendingMatches[idx];
  const r = await Fate.settle(escrowId);
  if(!r){ render(); return; }
  if(r.voided){ m._check = {voided:true}; saveNow(); render(); return; }
  recordMatchHistory(m, r);
  STATE.pendingMatches.splice(idx,1);
  saveNow();
  if(m.kind==="fight_stake"){
    const fighter = STATE.roster.find(f=>f.id===m.fighterId);
    const result = r.won ? "WIN" : "LOSS";
    if(fighter) applyFightResult(fighter, result);
    pushLeaderboardNow();
    goto("fightResolve",{fighter: fighter || {name:(m.title||"").split(" vs ")[0], trait:"default"}, opponent:{name:m.opponentName||"", line:""}, resolved:true, result});
  } else {
    goto("sideResolve",{side:m.pick, result:r.won?"WIN":"LOSS", pair:null});
  }
}

/* Voided match → rematch: pin a NEW market, same pick, new escrow. */
async function rematchPending(escrowId){
  const idx = STATE.pendingMatches.findIndex(m=>m.escrowId===escrowId);
  if(idx<0){ render(); return; }
  const old = STATE.pendingMatches[idx];
  let market;
  try{
    market = await Fate.findMarket();
  }catch(err){
    alert("No available DreamDEX market: "+(err.message||"unknown reason"));
    render(); return;
  }
  if(!market){ alert("No active DreamDEX market right now. Try again shortly."); render(); return; }
  const entryOdds = (old.side === "YES") ? ((market.odds != null) ? market.odds : 0.5) : 1 - ((market.odds != null) ? market.odds : 0.5);
  const meta = { matchTitle: old.title, fighter: (old.title||"").split(" vs ")[0], opponent: (old.title||"").split(" vs ")[1]||"", entryOdds };
  let r;
  try{
    r = await Fate.stake(old.kind, old.side, market.marketId, meta, new Date(market.expiryMs).toISOString());
  }catch(err){
    alert("Rematch failed: "+(err.message||"unknown reason")+". Original escrow left untouched.");
    render(); return;
  }
  if(r && r.escrowId){
    STATE.pendingMatches.splice(idx,1);
    STATE.pendingMatches.push({
      escrowId:r.escrowId, marketId:market.marketId, question:market.question,
      kind:old.kind, side:old.side, stake:FATE_STAKE,
      title:old.title, fighterId:old.fighterId, opponentName:old.opponentName,
      pick:old.pick, expiresAt:market.expiryMs, placedAt:Date.now(), _check:null,
    });
    saveNow();
  } else { alert("Rematch failed: could not stake Fate. Original escrow left untouched."); }
  render();
}

/* Voided match → cancel: Teller re-verifies the void and refunds the stake. */
async function cancelPending(escrowId){
  const r = await Fate.cancel(escrowId);
  if(!r){ alert("Cancel failed (is the market really voided?)"); render(); return; }
  const idx = STATE.pendingMatches.findIndex(m=>m.escrowId===escrowId);
  if(idx>=0){
    const m = STATE.pendingMatches[idx];
    addToMatchLog({
      escrowId:m.escrowId, marketId:m.marketId, question:m.question||"",
      kind:m.kind, side:m.side, title:m.title, stake:m.stake, payout:0,
      won:null, voided:true, settledAt:Date.now(), resolvedAt:null,
    });
    STATE.pendingMatches.splice(idx,1);
    saveNow();
  }
  render();
}

/* Poll every pending escrow's pinned market via the Teller. */
async function refreshPending(){
  if(!Fate.live){ render(); return; }
  let changed = false;
  for(const m of STATE.pendingMatches){
    const c = await Fate.check(m.escrowId);
    if(c){
      if(m._check && (m._check.stateped !== c.stateped)){ changed = true; }
      m._check = c;
      const el = document.querySelector('span.cd[data-cd="'+m.escrowId+'"]');
      if(el){ el.textContent = m.expiresAt ? fmtCountdown(m.expiresAt - Date.now()) : "unknown"; }
    }
  }
  saveNow();
  if(changed){ render(); }
}

function renderBook(){
  let out = '<div class="screen">';
  out += statusPanel();
  out += '<div class="panel" data-label="BOOK MATCH — FIGHT NIGHT">';
  const active = STATE.roster.filter(f=>f.status==="active");
  if(active.length===0){
    out += '<div class="story-text">No active fighters on your roster. Recruit someone before you can stage a Fight Night.</div>';
  } else {
    const lines = active.map((f,i)=> "["+(i+1)+"] "+f.name.padEnd(14," ")+(f.streakType?f.streak+f.streakType:"—")+"   ("+f.trait+")");
    out += boxHtml("ACTIVE ROSTER", lines, 46);
    out += '<div class="options">';
    active.forEach((f,i)=>{
      out += optRow(i+1, "Book "+f.name+" for tonight's card", "book-fighter-"+f.id);
    });
    out += '</div>';
  }
  out += '</div>';
  out += navBar("book");
  out += '</div>';
  return out;
}

function doFightNight(fighterId){
  const fighter = STATE.roster.find(f=>f.id===fighterId);
  const opponent = pick(OPPONENTS);
  goto("fightResolve", {fighter, opponent, resolved:false});
}
function renderFightResolve(){
  const {fighter, opponent, resolved, result, booked, expiresAt} = SCREEN_DATA;
  let out = '<div class="screen">';
  out += statusPanel();
  out += '<div class="panel" data-label="FIGHT NIGHT">';
  out += '<div class="banner-holder banner-fight"><pre>'+esc(BANNER_FIGHT_NIGHT)+'</pre></div>';
  if(booked){
    const mins = Math.max(1, Math.round((expiresAt - Date.now())/60000));
    out += '<div class="story-text">'+esc(fighter.name)+"'s in the back, wrapping their hands. The card is booked — tonight's opponent: "+esc(opponent.name)+'.\n\n'+esc(opponent.line)+'\n\nThe result is in the crowd\'s hands now. Odds are live; when the market closes, the call is made. Check MATCHES for the countdown.</div>';
    out += '<div class="options">'
      + optRow(1,"Pending Matches ("+mins+" min left)","pending")
      + optRow(2,"Back to the Pit","back-to-main")
      + '</div>';
  } else if(!resolved){
    out += '<div class="story-text">'+esc(fighter.name)+"'s in the back, wrapping their hands, not saying much. Tonight's opponent: "+esc(opponent.name)+'.\n\n'+esc(opponent.line)+'\n\nThe crowd is already loud upstairs. Whatever happens tonight is happening whether you\'re ready or not.</div>';
    out += '<div class="options">'+optRow(1,"Lock in the call. Back "+fighter.name+" to win.","lock-in")+'</div>';
  } else {
    out += '<div class="banner-holder '+(result==="WIN"?"banner-win":"banner-lose")+'"><pre>'+esc(result==="WIN"?BANNER_WIN:BANNER_LOSE)+'</pre></div>';
    const line = (result==="WIN"?TRAIT_WIN_LINES:TRAIT_LOSS_LINES)[fighter.trait] || (result==="WIN"?TRAIT_WIN_LINES.default:TRAIT_LOSS_LINES.default);
    out += '<div class="story-text">'+esc(line)+'</div>';
    out += '<div class="options">'+optRow(1,"Continue","fight-continue")+'</div>';
  }
  out += '</div></div>';
  return out;
}

function lockInFightOldRemoved(){}

function afterFightContinue(){
  const {fighter, result} = SCREEN_DATA;
  saveNow();
  if(result==="LOSS" && (fighter.lossStreakCount||0) >= 3){
    triggerGameOver("A");
    return;
  }
  if(result==="LOSS" && STATE.lossStreak >= 5){
    triggerGameOver("B");
    return;
  }
  if(result==="WIN" && STATE.winStreak >= 5){
    STATE.winStreak = 0;
    goto("winReward");
    return;
  }
  goto("main");
}

function renderWinReward(){
  let out = '<div class="screen">';
  out += statusPanel();
  out += '<div class="panel" data-label="FIVE STRAIGHT WINS">';
  out += '<div class="story-text">Word travels fast in the Trench when a den\'s on a run like this. A man you don\'t recognize finds you after the last card, unbothered by the setting, like he\'s used to conducting business in worse places than a fight club basement.\n\n"I put money behind winners," he says. "You\'re winning. I\'d like that to continue being true."\n\nHe hands over the money and leaves. No conditions attached, at least not yet.</div>';
  out += '<div class="options">';
  out += optRow(1,"Take the money. Worry about strings later.","winreward-0");
  out += optRow(2,"Ask what he actually wants in return.","winreward-1");
  out += optRow(3,"Turn it down. Nothing's ever really free.","winreward-2");
  out += '</div></div></div>';
  return out;
}
function resolveWinReward(idx){
  STATE.fate += 100;
  if(idx===1) STATE.flags.add("asked_sponsor_what_he_wants");
  if(idx===2) STATE.flags.add("turned_down_sponsor_verbally");
  saveNow();
  const panel = app.querySelector('.panel');
  panel.innerHTML = '<div class="story-text">Whatever you said, +100 Fate lands in your balance regardless. He\'s already gone.</div><div class="options">'+optRow(1,"Continue","back-to-main")+'</div>';
  bindEvents();
}

/* ---------------------------------------------------------------------
   GAME OVER
   --------------------------------------------------------------------- */
function triggerGameOver(condition){
  const text = condition==="A" ?
    "THREE STRAIGHT LOSSES. SAME FIGHTER.\n\nNobody says it to your face at first. Then Wren does, because someone has to. \"They talked it over. All of them. They don't think you know what you're doing anymore, and honestly, three losses in a row with the same fighter, hard to blame them.\"\n\nBy morning the Pit is empty. Every fighter, gone, within the same week.\n\nTHE PIT IS CLOSED." :
    "FIVE STRAIGHT LOSSES.\n\nWord doesn't travel fast in the Trench so much as it travels honestly. Nobody's saying the Pit is finished, exactly. They don't have to. The fighters who are left stop showing up to train. The ones who still do won't look at you directly anymore.\n\nYou keep the doors open another night anyway. Nobody comes.\n\nTHE PIT IS CLOSED.";
  STATE.roster.forEach(f=>f.status="gone");
  STATE.totalFights = 0; STATE.wins = 0; STATE.losses = 0;
  pushLeaderboardNow();
  Persist.clearGame();
  goto("gameover", {text});
}
function renderGameOver(){
  let out = '<div class="screen">';
  out += '<div class="banner-holder banner-over"><pre>'+esc(BANNER_GAME_OVER)+'</pre></div>';
  out += '<div class="ending-text">'+esc(SCREEN_DATA.text)+'</div>';
  out += '<div class="navrow" style="justify-content:center"><button class="navbtn primary" data-action="gameover-home">Return to Home Menu</button></div>';
  out += '</div>';
  return out;
}

/* ---------------------------------------------------------------------
   SIDE BETS
   --------------------------------------------------------------------- */
function renderSide(){
  if(!SCREEN_DATA.pair){
    const shuffled = [...OPPONENTS].sort(()=>Math.random()-0.5);
    SCREEN_DATA.pair = [shuffled[0], shuffled[1]];
  }
  const [a,b] = SCREEN_DATA.pair;
  let out = '<div class="screen">';
  out += statusPanel();
  out += '<div class="panel" data-label="SIDE BETS">';
  out += '<div class="banner-holder banner-side"><pre>'+esc(BANNER_SIDE_BETS)+'</pre></div>';
  out += '<div class="story-text">'+esc(a.name.toUpperCase())+' vs. '+esc(b.name.toUpperCase())+'\n\n'+esc(a.line)+'\n'+esc(b.line)+'</div>';
  out += '<div class="options">';
  out += optRow(1,"Back "+a.name,"sidebet-"+a.id);
  out += optRow(2,"Back "+b.name,"sidebet-"+b.id);
  out += optRow(3,"Skip this one.","sidebet-skip");
  out += '</div></div>';
  out += navBar("side");
  out += '</div>';
  return out;
}
function renderSideConfirm(){
  const {pair, pendingChoice} = SCREEN_DATA;
  const [a,b] = pair;
  const picked = (pendingChoice===a.id) ? a : b;
  const other = (pendingChoice===a.id) ? b : a;
  const amount = FATE_STAKE;
  const oddsSide = (pendingChoice===a.id) ? "YES" : "NO";
  let out = '<div class="screen">';
  out += statusPanel();
  out += '<div class="panel" data-label="CONFIRM SIDE BET">';
  out += '<div class="banner-holder banner-side"><pre>'+esc(BANNER_SIDE_BETS)+'</pre></div>';
  out += '<div class="story-text">You\'re putting <b>'+amount+' Fate</b> on <b>'+esc(picked.name)+'</b> over '+esc(other.name)+'!</div>';
  out += '<div class="options">'
       + optRow(1,"Lock it in","sidebet-"+pendingChoice)
       + optRow(2,"Back out","sidebet-skip")
       + '</div>';
  out += '</div>';
  out += navBar("side");
  out += '</div>';
  return out;
}
async function resolveSideBetChoice(side){
  if(side==="skip"){ goto("side",{pair:null}); return; }
  const {pair, pendingChoice} = SCREEN_DATA;
  const target = pendingChoice && pendingChoice!==side ? null : side;
  if(SCREEN==="sideConfirm"){ /* confirm step already reached */ }
  const a = pair[0], b = pair[1];
  const picked = pair.find(p=>p.id===target) || (target===a.id?a:(target===b.id?b:null));
  if(!picked || !pair){ goto("side",{pair:null}); return; }
  if(!Fate.live){ alert("A valid wallet connection is required to place a side bet."); goto("splash"); return; }
  const marketSide = (target===a.id) ? "YES" : "NO";
  const title = a.name+" vs "+b.name;
  /* Two-stage: user must confirm on the SIDE CONFIRM screen before we stake.
     A `pendingChoice` in SCREEN_DATA means we're at the confirm step and the
     click that reached here is the explicit confirm. Add an in-flight guard
     so a double-tap can never place two escrows. */
  if(!pendingChoice){
    goto("sideConfirm",{pair, pendingChoice:target});
    return;
  }
  /* ---- CONFIRM PATH ---- */
  if(BET_IN_FLIGHT){ return; }
  BET_IN_FLIGHT = true;
  try{
    let market;
    try{
      market = await Fate.findMarket();
    }catch(err){
      alert("No available DreamDEX market: "+(err.message||"unknown reason"));
      render(); return;
    }
    if(!market){ alert("No active DreamDEX market right now. Try again shortly."); render(); return; }
    const entryOdds = (marketSide === "YES") ? ((market.odds != null) ? market.odds : 0.5) : 1 - ((market.odds != null) ? market.odds : 0.5);
    const meta = { matchTitle:title, fighter:(target===a.id)?a.name:b.name, opponent:(target===a.id)?b.name:a.name, entryOdds };
    let r;
    try{
      r = await Fate.stake("side_bet", marketSide, market.marketId, meta, new Date(market.expiryMs).toISOString());
    }catch(err){
      alert("Could not stake Fate — "+(err.message||"unknown reason")+". The bet was not placed.");
      render(); return;
    }
    if(r && r.escrowId){
      STATE.pendingMatches.push({
        escrowId:r.escrowId, marketId:market.marketId, question:market.question,
        kind:"side_bet", side:marketSide, stake:FATE_STAKE,
        title, pick:target, expiresAt:market.expiryMs, placedAt:Date.now(), _check:null,
      });
      saveNow();
      goto("sideResolve",{side:target, pair, pending:true, expiresAt:market.expiryMs});
      return;
    }
    alert("Could not stake Fate — the bet was not placed for an unknown reason. Try again.");
    render();
  } finally {
    BET_IN_FLIGHT = false;
  }
}
function renderSideResolve(){
  const {side, result, pair, pending, expiresAt} = SCREEN_DATA;
  let out = '<div class="screen">';
  out += statusPanel();
  out += '<div class="panel" data-label="SIDE BETS">';
  out += '<div class="banner-holder banner-side"><pre>'+esc(BANNER_SIDE_BETS)+'</pre></div>';
  if(pending){
    const mins = Math.max(1, Math.round((expiresAt - Date.now())/60000));
    out += '<div class="story-text">Bet is down and the card is booked. The call comes when the odds close — about '+mins+' min. Check MATCHES for the countdown.</div>';
    out += '<div class="options">'+optRow(1,"Pending Matches","pending")+optRow(2,"Back to the Pit","back-to-main")+'</div>';
  } else {
    out += '<div class="banner-holder '+(result==="WIN"?"banner-win":"banner-lose")+'"><pre>'+esc(result==="WIN"?BANNER_WIN:BANNER_LOSE)+'</pre></div>';
    out += '<div class="story-text">'+(result==="WIN"?"Your side came through.":"Didn't go your way this time.")+' No roster impact, no relationships touched — just Fate on the line.</div>';
    out += '<div class="options">'+optRow(1,"Back to the Pit","back-to-main")+'</div>';
  }
  out += '</div></div>';
  return out;
}

/* ---------------------------------------------------------------------
   PENDING MATCHES — matches waiting on their pinned DreamDEX market.
   Polls the Teller every 20s while the screen is open; the Teller reads
   the market's on-chain resolution (the client trusts nothing).
   --------------------------------------------------------------------- */
let PENDING_TIMER = null;
let CD_TIMER = null;
let BET_IN_FLIGHT = false; /* guards against double-tap double-stake */
/* Lightweight 1s ticker — updates only the visible countdown digits on the
   Pending screen. The 20s poll (PENDING_TIMER) still checks server state;
   this just keeps the countdown from looking frozen between polls. */
function tickCountdown(){
  for(const m of STATE.pendingMatches){
    const el = document.querySelector('span.cd[data-cd="'+m.escrowId+'"]');
    if(el){ el.textContent = m.expiresAt ? fmtCountdown(m.expiresAt - Date.now()) : "unknown"; }
  }
}
function fmtCountdown(ms){
  if(ms <= 0) return "any moment";
  const m = Math.floor(ms/60000), s = Math.floor((ms%60000)/1000);
  return m > 0 ? m+"m "+s+"s" : s+"s";
}
function spanC(id, text){
  return '%%RAW%%<span class="cd" data-cd="'+id+'">'+text+'</span>%%RAW%%';
}

function renderPending(){
  let out = '<div class="screen">';
  out += statusPanel();
  out += '<div class="panel" data-label="PENDING MATCHES">';
  if(!Fate.live){
    out += '<div class="story-text">No wallet connected. Live matches — where Fate is on the line and the odds decide — need a connected wallet (Home → Enter the Pit).</div>';
  } else if(STATE.pendingMatches.length===0){
    out += '<div class="story-text">No matches on the card. Book a fight or drop a side bet — the result lands here when the odds close.</div>';
  } else {
    out += '<div class="story-text">Matches waiting on the market. Results are called by the odds, not by you — when a market closes, its match settles.</div>';
    STATE.pendingMatches.forEach((m,i)=>{
      const chk = m._check;
      let status, actions = "";
      if(chk && chk.voided){
        status = "MATCH VOIDED — the market settled with no result. Your "+m.stake+" Fate is still locked.";
        actions = optRow(1,"Rematch — pin a new market","rematch-pending-"+m.escrowId)
                + optRow(2,"Cancel — refund the stake","cancel-pending-"+m.escrowId);
      } else if(chk && chk.resolved){
        status = "RESULT IN — the market has called it. Settle to see the outcome.";
        actions = optRow(1,"See the result","settle-pending-"+m.escrowId);
      } else {
        const left = m.expiresAt ? fmtCountdown(m.expiresAt - Date.now()) : "unknown";
        status = "Odds open — closes in "+spanC(m.escrowId, left)+".";
      }
      // smart-escape: %%RAW%% segments pass through, the rest is escaped
      const safeStatus = status.split('%%RAW%%').map((seg,i)=> i%2===1 ? seg : esc(seg)).join('');
      out += '<div class="story-text"><b>'+esc(m.title)+'</b> ('+(m.kind==="fight_stake"?"Fight Night":"Side Bet")+', '+m.stake+' Fate)\n'+safeStatus+'</div>';
      if(actions) out += '<div class="options">'+actions+'</div>';
    });
    out += '<div class="options">'+optRow(1,"Refresh odds","refresh-pending")+optRow(2,"Market Log","marketlog")+'</div>';
  }
  out += '</div>';
  out += navBar("pending");
  out += '</div>';
  return out;
}
function stopPendingTimer(){
  if(PENDING_TIMER){ clearInterval(PENDING_TIMER); PENDING_TIMER = null; }
  if(CD_TIMER){ clearInterval(CD_TIMER); CD_TIMER = null; }
}
function startPendingTimer(){
  stopPendingTimer();
  if(SCREEN==="pending" && Fate.live && STATE.pendingMatches.length>0){
    PENDING_TIMER = setInterval(refreshPending, 20000);
    CD_TIMER = setInterval(tickCountdown, 1000);
  }
}

/* ---------------------------------------------------------------------
   MARKET LOG — tucked-away verification screen. Every settled match with
   its pinned DreamDEX market, the side that was backed, and the outcome.
   Curious players can verify each result against the indexer directly.
   --------------------------------------------------------------------- */
const DREAMDEX_INDEXER = "https://dev.smk.somnia.host/v1/graphql";
function renderMarketLog(){
  let out = '<div class="screen">';
  out += statusPanel();
  out += '<div class="panel" data-label="MARKET LOG — VERIFY THE ODDS">';
  out += '<div class="story-text">Every Fate match is settled by a real DreamDEX prediction market — the result shown is the market\'s on-chain winningOutcome.</div>';
  if(MATCH_LOG.length===0){
    out += '<div class="story-text">No settled matches yet. Book a fight or drop a side bet — results land here once their DreamDEX market closes.</div>';
  } else {
    const rows = MATCH_LOG.slice(0,25).map(h=>{
      const outcome = h.voided ? "VOIDED — stake refunded"
        : (h.won ? "WON (paid "+h.payout+" Fate)" : "LOST");
      // resolvedAt may be unix seconds as a number or numeric string — normalize to ms.
      let resMs = null;
      const rt = h.resolvedAt;
      if(rt != null){
        const n = Number(rt);
        resMs = isNaN(n) ? new Date(rt).getTime() : (n < 1e12 ? n*1000 : n);
      }
      const when = (resMs && !isNaN(resMs)) ? new Date(resMs).toLocaleString() : new Date(h.settledAt).toLocaleString();
      const yourSide = h.side ? String(h.side).toUpperCase() : "—";
      // winningOutcome is 0 (YES) or 1 (NO) on-chain — render the side name.
      const wonSide = (h.winningOutcome===0 || h.winningOutcome==="0") ? "YES"
        : (h.winningOutcome===1 || h.winningOutcome==="1") ? "NO"
        : String(h.winningOutcome ?? "—").toUpperCase();
      const odds = h.entryOdds != null ? (Math.round(h.entryOdds*100)/100) : null;
      return h.title+"\n  "+(h.kind==="fight_stake"?"Fight Night":"Side Bet")+" · "+h.stake+" Fate on "+yourSide+(odds!=null?" @ "+odds:"")+"\n  market: "+(h.marketId||"—")+(h.asset?" ("+h.asset+")":"")+"\n  question: "+(h.question||"—")+"\n  result: "+outcome+"\n  market resolved: "+wonSide+" at "+when;
    });
    out += boxHtml("SETTLED BY THE ODDS", rows, 60);
  }
  out += '<div class="options">'+optRow(1,"Back","back-to-main")+'</div>';
  out += '</div></div>';
  return out;
}

/* ---------------------------------------------------------------------
   LEADERBOARD
   --------------------------------------------------------------------- */
async function refreshLeaderboard(){
  LB_CACHE = await Persist.fetchLeaderboard();
}
function pushLeaderboardNow(){
  Persist.pushLeaderboard(PLAYER_ID, {playerId:PLAYER_ID, totalFights:STATE.totalFights, wins:STATE.wins, losses:STATE.losses}).then(refreshLeaderboard).then(()=>{ if(SCREEN==="lb"||SCREEN==="main") render(); });
}
function renderLeaderboard(){
  let out = '<div class="screen">';
  out += statusPanel();
  out += '<div class="panel" data-label="LEADERBOARD — GLOBAL, SORTED BY WINS">';
  if(!LEADERBOARD_CONFIGURED){
    out += '<div class="story-text">Global leaderboard backend not configured.\n\n'
         + 'This screen is wired to call a real Supabase table over its REST API '
         + '(see the SUPABASE_URL / SUPABASE_ANON_KEY constants near the top of '
         + 'this file), so standings are genuinely shared across every player, '
         + 'device, and deployment — not just this browser tab. Fill those two '
         + 'values in and this table populates for real. Your run still counts '
         + 'locally; it just has nowhere shared to report to yet.</div>';
  } else if(LB_CACHE.length===0){
    out += '<div class="story-text">No runs recorded yet. Stage a Fight Night to appear here.</div>';
  } else {
    out += '<table><tr><th>#</th><th>Player</th><th>Fights</th><th>Wins</th><th>Losses</th></tr>';
    LB_CACHE.forEach((e,i)=>{
      out += '<tr class="'+(e.playerId===PLAYER_ID?'me':'')+'"><td>'+(i+1)+'</td><td>'+esc(e.playerId)+'</td><td>'+e.totalFights+'</td><td>'+e.wins+'</td><td>'+e.losses+'</td></tr>';
    });
    out += '</table>';
  }
  out += '</div>';
  out += navBar("lb");
  out += '</div>';
  return out;
}

/* ---------------------------------------------------------------------
   STORE
   --------------------------------------------------------------------- */
const FATE_PACKS = [
  {id:"p1", amount:100, price:"$1"},
  {id:"p2", amount:300, price:"$3"},
  {id:"p3", amount:800, price:"$8"}
];
function renderStore(){
  let out = '<div class="screen">';
  out += statusPanel();
  out += '<div class="panel" data-label="STORE">';
  out += '<div class="story-text">Buy Fate with tUSDC straight from your connected wallet — 100 Fate = 1 tUSDC, sent to the Teller escrow and credited after on-chain verification. Cash out converts Fate back to tUSDC, paid from the Teller reserve to your wallet. You can only cash out Fate you actually bought (winnings are house money — they play, but they don\'t leave the Pit).</div>';
  out += '<div class="options">';
  FATE_PACKS.forEach((p,i)=>{
    out += optRow(i+1, p.amount+" Fate — "+p.price, "buy-"+p.id);
  });
  out += '</div>';
  out += '<div class="panel" data-label="CASH OUT" style="margin-top:10px">';
  out += '<div class="story-text">Current balance: '+FATE_ICON_HTML+' '+STATE.fate+' Fate</div>';
  out += '<input type="number" id="cashout-amt" min="1" max="'+(Fate.live?Fate.cashable:STATE.fate)+'" placeholder="Amount to cash out'+(Fate.live?" (max "+Fate.cashable+" bought)":"")+'" style="margin:8px 0; width:100%;">';
  out += '<div class="navrow"><button class="navbtn primary" data-action="cashout">Cash Out</button></div>';
  out += '</div>';
  out += '</div>';
  out += navBar("store");
  out += '</div>';
  return out;
}

/* ---------------------------------------------------------------------
   SETTINGS / ABOUT
   --------------------------------------------------------------------- */
function renderSettings(){
  let out = '<div class="screen">';
  out += '<div class="panel" data-label="SETTINGS">';
  out += '<div class="story-text">Player ID: '+esc(PLAYER_ID)+'\n\nThis stands in for a wallet address in this build.</div>';
  out += '<div class="options">'+optRow(1,"Reset all saved data on this device","reset-all")+optRow(2,"Back","back-home")+'</div>';
  out += '</div></div>';
  return out;
}
function renderAbout(){
  let out = '<div class="screen">';
  out += '<div class="panel" data-label="ABOUT">';
  out += '<div class="story-text">FATE: INTO THE PITS\n\nSaltmark is drowning. You run an unlicensed fight den called THE PIT. Recruit fighters, manage rivals and cops and corps, and stage Fight Nights where real stakes ride on real outcomes.\n\nFate is the only currency, spent and won only at Fight Night and Side Bets. Everything else is pure story — no Rep, no Heat, no hidden meters.</div>';
  out += '<div class="options">'+optRow(1,"Back","back-home")+'</div>';
  out += '</div></div>';
  return out;
}

/* ---------------------------------------------------------------------
   EVENT BINDING
   --------------------------------------------------------------------- */
function saveNow(){ Persist.saveGame({...STATE, flags:[...STATE.flags]}); }

function bindEvents(){
  app.querySelectorAll('[data-action]').forEach(el=>{
    el.addEventListener('click', onAction);
  });
  app.querySelectorAll('[data-nav]').forEach(el=>{
    el.addEventListener('click', e=>{
      const nav = e.currentTarget.getAttribute('data-nav');
      if(nav==="main") goto("main");
      else if(nav==="book") goto("book");
      else if(nav==="side") goto("side");
      else if(nav==="pending") goto("pending");
      else if(nav==="lb"){ refreshLeaderboard().then(()=>goto("lb")); }
      else if(nav==="store") goto("store");
      else if(nav==="home") goto("home");
    });
  });
}

async function onAction(e){
  const action = e.currentTarget.getAttribute('data-action');
  if(action==="splash-enter"){ goto("walletConnect", {stage:"connecting"}); return; }
  if(action==="back-splash"){ goto("splash"); return; }
  if(action==="wallet-confirm"){
    PLAYER_ID = await Persist.getPlayerId();
    /* HARD GATE: a valid wallet connection (connect + bind + Teller state) is
       required. Any failure is shown on screen and the player cannot proceed. */
    goto("walletConnect", {stage:"connecting"});
    const setStatus = (msg) => { const el = document.getElementById("connect-status-text"); if(el) el.textContent = msg; };
    setStatus("Requesting your wallet account…");
    if(window.FateConnector && typeof window.FateConnector.setProgress === "function"){
      window.FateConnector.setProgress(setStatus);
    }
    try{
      await Fate.connect();
      if(!Fate.live || !Fate.wallet) throw new Error("Connection did not complete.");
      if(Fate.wallet){
        PLAYER_ID = "0x"+Fate.wallet.slice(2,6)+"…"+Fate.wallet.slice(-4);
      }
      goto("walletConnect", {stage:"connected"});
    }catch(err){
      Fate.live = false; Fate.wallet = null;
      goto("walletConnect", {stage:"error", error: err && err.message ? err.message : "Wallet connection failed."});
    }
    return;
  }
  if(action==="wallet-continue"){
    /* Defensive: never enter the game without a live wallet session. */
    if(!Fate.live || !Fate.wallet){
      goto("walletConnect", {stage:"error", error:"No valid wallet connection. Connect a wallet to enter the Pit."});
      return;
    }
    await refreshLeaderboard();
    goto("home");
    return;
  }
  if(action==="home-continue"){
    const saved = await Persist.loadGame();
    if(saved){ STATE = deserializeState(saved); await refreshLeaderboard(); goto("main"); }
    else { STATE = freshState(); await refreshLeaderboard(); goto("main"); }
    return;
  }
  if(action==="home-new"){ STATE = freshState(); saveNow(); await refreshLeaderboard(); goto("main"); return; }
  if(action==="home-lb"){ await refreshLeaderboard(); goto("lb"); return; }
  if(action==="home-store"){ if(!STATE) STATE = freshState(); goto("store"); return; }
  if(action==="home-marketlog"){ goto("marketlog"); return; }
  if(action==="home-settings"){ goto("settings"); return; }
  if(action==="home-about"){ goto("about"); return; }
  if(action==="back-home"){ goto("home"); return; }
  if(action==="gameover-home"){ goto("home"); return; }
  if(action==="reset-all"){
    await Persist.clearGame();
    STATE = null;
    goto("home");
    return;
  }

  if(action.startsWith("ev-opt-")){ resolveEventOption(parseInt(action.split("-")[2],10)); return; }
  if(action==="turn-end"){ endTurn(); return; }
  if(action==="back-to-main"){ goto("main"); return; }

  if(action==="go-recruit"){ startScene(STATE.pendingRecruitSceneId); return; }
  if(action==="skip-recruit"){
    const panel = app.querySelector('.panel');
    panel.innerHTML = '<div class="story-text">You let it go, for now. There will be other nights.</div><div class="options">'+optRow(1,"Continue","turn-end")+'</div>';
    bindEvents();
    return;
  }
  if(action.startsWith("scene-opt-")){ resolveSceneOption(parseInt(action.split("-")[2],10)); return; }
  if(action.startsWith("scene-advance-")){ advanceScene(action.replace("scene-advance-","")); return; }

  if(action.startsWith("book-fighter-")){ doFightNight(action.replace("book-fighter-","")); return; }
  if(action==="lock-in"){ lockInFight(); return; }
  if(action==="fight-continue"){ afterFightContinue(); return; }

  if(action.startsWith("winreward-")){ resolveWinReward(parseInt(action.split("-")[1],10)); return; }

  if(action.startsWith("sidebet-")){ resolveSideBetChoice(action.replace("sidebet-","")); return; }

  if(action==="marketlog"){ goto("marketlog"); return; }
  if(action==="pending"){ goto("pending"); return; }
  if(action==="refresh-pending"){ refreshPending(); return; }
  if(action.startsWith("settle-pending-")){ settlePending(action.replace("settle-pending-","")); return; }
  if(action.startsWith("rematch-pending-")){ rematchPending(action.replace("rematch-pending-","")); return; }
  if(action.startsWith("cancel-pending-")){ cancelPending(action.replace("cancel-pending-","")); return; }

  if(action.startsWith("buy-")){
    const pack = FATE_PACKS.find(p=>p.id===action.replace("buy-",""));
    if(pack){
      if(!Fate.live){ goto("store", {msg:"Connect a wallet first (Home → Enter the Pit)."}); return; }
      // 100 FATE = 1 tUSDC. The pack's Fate amount maps to a whole tUSDC price.
      const tusdc = Math.round(pack.amount / 100);
      const btn = e.currentTarget; btn.disabled = true; btn.textContent = "Waiting for wallet…";
      Fate.buy(tusdc)
        .then(() => { saveNow(); render(); })
        .catch(err => { alert("Buy failed: "+err.message); btn.disabled = false; btn.textContent = pack.amount+" Fate — "+pack.price; });
    }
    return;
  }
  if(action==="cashout"){
    const input = document.getElementById('cashout-amt');
    const amt = parseInt(input.value,10);
    if(!amt || amt<=0){ return; }
    if(amt>STATE.fate){ alert("Insufficient Fate balance — you have "+STATE.fate+" Fate."); return; }
    if(!Fate.live){ goto("store", {msg:"Connect a wallet first."}); return; }
    Fate.cashout(amt)
      .then(() => { alert("Cash out successful! tUSDC has been sent to your wallet."); render(); })
      .catch(err => alert("Cash out failed: "+err.message));
    return;
  }
}

/* keyboard shortcuts: number keys trigger the matching option; Enter drives
   the splash / wallet-connect prompt */
