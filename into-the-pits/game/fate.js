const Fate = {
  live: false,
  wallet: null,
  cashable: 0,

  async connect(){
    const fc = window.FateConnector;
    if(!fc){
      throw new Error(!window.ethereum
        ? "No wallet found in this browser. Install/enable MetaMask and reload."
        : "Connector module did not finish loading. Hard-refresh the page (Ctrl+Shift+R) and try again.");
    }
    fc.configure({ tellerUrl: TELLER_URL, supabaseAnonKey: window.FATE_CONFIG.supabaseAnonKey });
    /* The Teller calls need an anonymous Supabase session for auth. On a fresh
       browser there is none yet — ensure one exists BEFORE any teller() call. */
    await Persist.ensureAuth();
    const { address } = await fc.connect();
    await fc.bind();                       // prove wallet ownership (personal_sign)
    const st = await fc.state();
    Fate.live = true; Fate.wallet = address;
    Fate.cashable = st.cashable || 0;
    if(typeof st.fate === "number") STATE.fate = st.fate;  // server wins
    return true;
  },

  async sync(){
    if(!Fate.live) return;
    try{ const st = await window.FateConnector.state();
      STATE.fate = st.fate; Fate.cashable = st.cashable || 0; saveNow();
      render();
    }catch(e){}
  },

  /* Lock a stake in the Teller escrow, pinned to a real DreamDEX market.
     Returns {escrowId, market} on success, null offline/failed. */
  async stake(kind, side, marketId, meta, marketExpiresAt){
    if(!Fate.live) throw new Error("Wallet not connected — enter the Pit first.");
    const r = await window.FateConnector.stakeFate(FATE_STAKE, kind, side, marketId, meta, marketExpiresAt);
    STATE.fate = r.fate; saveNow();
    return r;
  },

  /* Settle an escrow. The Teller reads the pinned market's real resolution —
     the client never declares a winner. Returns the settle payload or null. */
  async settle(escrowId){
    if(!Fate.live || !escrowId) return null;
    try{
      const r = await window.FateConnector.settleStake(escrowId);
      if(typeof r.fate === "number"){ STATE.fate = r.fate; saveNow(); }
      return r;
    }catch(e){ console.warn("settle failed:", e.message); return null; }
  },

  /* Poll a locked escrow's pinned market for resolution / void. */
  async check(escrowId){
    if(!Fate.live) return null;
    try{ return await window.FateConnector.checkResolution(escrowId); }
    catch(e){ console.warn("checkResolution failed:", e.message); return null; }
  },

  /* Cancel a VOIDED escrow — Teller re-verifies and refunds the stake. */
  async cancel(escrowId){
    if(!Fate.live) return null;
    try{
      const r = await window.FateConnector.cancelEscrow(escrowId);
      if(typeof r.fate === "number"){ STATE.fate = r.fate; saveNow(); }
      return r;
    }catch(e){ console.warn("cancelEscrow failed:", e.message); return null; }
  },

  /* Soonest-to-resolve active DreamDEX binary market (the fight engine). */
  async findMarket(){
    if(!Fate.live) return null;
    try{ return await window.FateConnector.findActiveMarket(); }
    catch(e){ console.warn("findActiveMarket failed:", e.message); throw e; }  // surface the real reason, never disguise
  },

  async buy(tusdcWhole){
    const r = await window.FateConnector.buyFate(tusdcWhole);
    STATE.fate = r.balance ?? r.fate; saveNow();
    return r;
  },

  async cashout(fateAmount){
    const r = await window.FateConnector.cashOutFate(fateAmount);
    STATE.fate = r.fate; saveNow();
    return r;
  }
};

const TRAITS = ["Reliable","Reckless","Loyal","Bitter","Showboat","Quiet","Augment-heavy","Old-school","In debt","Superstitious"];

const OPPONENTS = [
  {id:"ghost", name:"Ghost", line:"Nobody's beaten Ghost in eleven fights. Confidence or denial, hard to say which."},
  {id:"rattler", name:"Rattler", line:"Rattler doesn't care whose banner they're under tonight. Just the purse."},
  {id:"marrow", name:"Marrow", line:"Marrow's hardware has failed mid-fight before. Nobody's stopped betting on them anyway."},
  {id:"widow", name:"The Widow", line:"Nobody in the Trench knows who's actually backing The Widow. That's starting to bother people."},
  {id:"bishop", name:"Bishop", line:"Bishop's used to referees and contracts. Tonight there's neither."}
];

const TRAIT_WIN_LINES = {
  "Reckless":"They shouldn't have won that clean. They did anyway, barely.",
  "Reliable":"No drama, no flourish. They did the job, like always.",
  "Loyal":"They fought like they had something to prove to you specifically.",
  "Bitter":"Whoever they were picturing across the mat, it worked in their favor tonight.",
  "Showboat":"They played to the crowd the whole way through and still ended it clean.",
  "Quiet":"They didn't say a word before, during, or after. The scoreboard said enough.",
  "Augment-heavy":"The hardware held tonight. That's not nothing.",
  "Old-school":"No augments, no shortcuts. Just outlasted the other one.",
  "In debt":"They fought like the purse mattered more than usual. It showed.",
  "Superstitious":"They did their little ritual before stepping up. Can't argue with results.",
  "default":"They came out on top."
};
const TRAIT_LOSS_LINES = {
  "Reckless":"Went for broke, lost big. No in-between with this one.",
  "Reliable":"Even the steady ones lose sometimes. They'll be back next card.",
  "Loyal":"They fought hard for you. It just wasn't enough tonight.",
  "Bitter":"Something got in their head before the bell even rang.",
  "Showboat":"Too much time on the crowd, not enough on the fight.",
  "Quiet":"They didn't say anything walking out either. Same as always.",
  "Augment-heavy":"The hardware glitched at the worst possible moment.",
  "Old-school":"Age and mileage caught up tonight.",
  "In debt":"Whatever was weighing on them, it followed them into the ring.",
  "Superstitious":"They'll blame an omen. Maybe they're not wrong.",
  "default":"It wasn't their night."
};

/* --- Standard event bank (short-form, pure story state, no Fate) --- */
const EVENTS = [
  {id:"mat_cut", category:"rival", speaker:"wren",
   text:"Wren finds you before you're even through the door. \"Someone got into the Pit overnight. Nothing stolen. The mat's cut through in three places. Deliberate. Precise.\"",
   options:[
     {label:"Fix it quietly. Don't give them the reaction they wanted.", reaction:"You have it patched by evening and say nothing about it to anyone.", effect:(s)=>{s.flags.add("mat_cut_quiet");}},
     {label:"Find out who did it. Ask around.", reaction:"Wren doesn't love it, but starts making calls anyway.", effect:(s)=>{s.flags.add("investigating_mat_cut"); shiftRel(s,"calloway",-1);}},
     {label:"Assume it's Calloway and respond in kind.", reaction:"Wren's jaw tightens. \"That's a decision, not a reaction.\" You make it anyway.", effect:(s)=>{shiftRel(s,"calloway",-2);}}
   ]},
  {id:"calloway_truce", category:"rival", speaker:"calloway",
   text:"For once, Calloway's message isn't a threat. He wants to split the Trench fight calendar so your cards and his don't compete for the same nights. Reasonable. That's what makes you suspicious.",
   options:[
     {label:"Agree. A reasonable rival beats a reckless one.", reaction:"Calloway's reply comes back almost too fast, like he expected this.", effect:(s)=>{shiftRel(s,"calloway",1); s.flags.add("calloway_truce");}},
     {label:"Counter with different terms.", reaction:"He haggles, but not unkindly. You land somewhere in the middle.", effect:(s)=>{shiftRel(s,"calloway",1);}},
     {label:"Refuse on principle.", reaction:"\"Your call,\" comes the reply. Nothing more.", effect:(s)=>{shiftRel(s,"calloway",-1);}}
   ]},
  {id:"rumor_spread", category:"rival", speaker:"wren",
   text:"People are saying your last card was fixed. You know it wasn't. Doesn't matter. Wren traces the rumor back toward Calloway's circle, though nothing's proven.",
   options:[
     {label:"Confront Calloway directly about it.", reaction:"He denies it with a straight face. You believe about half of that.", effect:(s)=>{shiftRel(s,"calloway",-1);}},
     {label:"Let your fighters' results speak for themselves.", reaction:"Wren nods. \"Slower. But it sticks better.\"", effect:(s)=>{}},
     {label:"Spread something back.", reaction:"Wren doesn't approve, but doesn't stop you either.", effect:(s)=>{shiftRel(s,"calloway",-2); s.flags.add("started_rumor_war");}}
   ]},
  {id:"rook_debt", category:"drama", speaker:null,
   text:"One of your roster owes money outside the den, and the people they're owed to just found out where they work now. They haven't asked for help. Too proud. But you can see it sitting on them.",
   options:[
     {label:"Cover the debt yourself.", reaction:"They don't say much, just nods once, like it means more than the words would.", effect:(s)=>{s.flags.add("covered_a_debt");}},
     {label:"Offer to help them work it off instead.", reaction:"That lands better than money would have. They take the deal.", effect:(s)=>{s.flags.add("debt_worked_off");}},
     {label:"Stay out of it.", reaction:"Nothing changes on the surface. You're not sure that's a relief or a mistake.", effect:(s)=>{}}
   ]},
  {id:"two_fighters_fight", category:"drama", speaker:"wren",
   text:"Two of your roster got into it after last night's card, something personal, something old. Wren says it's about to become a real problem if you don't step in.",
   options:[
     {label:"Sit them both down. Make them talk it out.", reaction:"It's ugly for ten minutes, then it isn't. Wren looks relieved.", effect:(s)=>{}},
     {label:"Side with whoever's right, publicly.", reaction:"One of them looks vindicated. The other looks like they're filing this away.", effect:(s)=>{}},
     {label:"Let them settle it themselves.", reaction:"Wren isn't thrilled, but you're not always wrong about people needing space.", effect:(s)=>{}}
   ]},
  {id:"loyalty_tested", category:"drama", speaker:"sable",
   text:"Kestrel approaches one of your fighters directly, bypassing you, offering a legal-circuit contract that would set them up for life. The fighter comes to you before deciding, but you can tell they want you to talk them out of it.",
   options:[
     {label:"Tell them to take it. Their future matters more.", reaction:"They look surprised you meant it. Then grateful. Then gone, eventually.", effect:(s)=>{s.flags.add("let_a_fighter_go_to_kestrel"); shiftRel(s,"kestrel",1);}},
     {label:"Make your case for staying, honestly.", reaction:"You don't oversell it. They stay, at least for now.", effect:(s)=>{}},
     {label:"Say nothing. Let them choose.", reaction:"It's the hardest silence you've held in a while. They choose to stay.", effect:(s)=>{}}
   ]},
  {id:"preacher", category:"color", speaker:null,
   text:"There's a man outside the Pit again, same as every week, telling anyone who'll listen that fighting for money is a sin against something he's never quite named. Tonight he's brought a sign. The spelling is not good.",
   options:[
     {label:"Let him preach. Good for foot traffic, honestly.", reaction:"He seems almost disappointed nobody's arguing with him tonight.", effect:(s)=>{}},
     {label:"Offer him a coffee and ask him to move down the block.", reaction:"He takes the coffee. He does not move.", effect:(s)=>{s.flags.add("preacher_softened");}},
     {label:"Ignore him entirely.", reaction:"He's still there when you look up an hour later.", effect:(s)=>{}}
   ]},
  {id:"juno_stock", category:"color", speaker:"juno",
   text:"Juno's got something new on the table, a patch that supposedly sharpens reflexes for about an hour, no augment surgery required. She swears it's not the same thing that put three guys in the clinic last month. Swears.",
   options:[
     {label:"Buy some, see if it's worth anything.", reaction:"\"Don't blame me,\" she says, already counting your creds.", effect:(s)=>{s.flags.add("bought_junos_patch");}},
     {label:"Ask her, very directly, about those three guys.", reaction:"\"Bad batch,\" she says. \"This isn't that batch.\" You choose to believe her.", effect:(s)=>{}},
     {label:"Pass. Some risks aren't worth the discount.", reaction:"\"Your loss,\" she says, already turning to the next person.", effect:(s)=>{}}
   ]},
  {id:"drunk_challenger", category:"color", speaker:null,
   text:"A man who is very drunk and very confident has wandered into the Pit and challenged whoever's in charge to a fight, right now, no stakes, just pride. He can barely stand.",
   options:[
     {label:"Let one of your fighters humor him gently.", reaction:"Nobody gets hurt. Everybody's laughing by the end, including him.", effect:(s)=>{}},
     {label:"Buy him a drink and send him home instead.", reaction:"He accepts the drink like it was the whole point of the challenge.", effect:(s)=>{}},
     {label:"Throw him out. This isn't a sideshow.", reaction:"He goes quietly, already forgetting why he came in.", effect:(s)=>{}}
   ]},
  {id:"betting_pool", category:"color", speaker:null,
   text:"Turns out half the Trench has an unofficial betting pool running on your fighters' records, completely separate from anything official. You find out because someone's furious they lost creds on a fight they thought was rigged.",
   options:[
     {label:"Let it keep running. Good for interest in your cards.", reaction:"Word spreads faster than usual about your next Fight Night.", effect:(s)=>{}},
     {label:"Shut it down before it causes real trouble.", reaction:"It mostly moves underground instead. At least it's quieter.", effect:(s)=>{}},
     {label:"Find the person running it and cut yourself in.", reaction:"They're annoyed, then pragmatic. A deal gets made.", effect:(s)=>{s.flags.add("cut_into_betting_pool");}}
   ]},
  {id:"landlord", category:"money", speaker:"wren",
   text:"Whoever actually owns the building the Pit sits in wants back rent, and they want it this week, not next month like usual. Wren's already run the numbers twice hoping they'd change.",
   options:[
     {label:"Pay it in full. Eat the hit.", reaction:"Wren exhales like they'd been holding their breath since the letter arrived.", effect:(s)=>{}},
     {label:"Negotiate. Buy more time, even if it costs you later.", reaction:"You get two more weeks. The later cost is still unnamed.", effect:(s)=>{s.flags.add("delayed_rent");}},
     {label:"Skip it. Deal with the consequences when they come.", reaction:"Wren doesn't say anything. Wren's silence says plenty.", effect:(s)=>{s.flags.add("skipped_rent");}}
   ]},
  {id:"insurance_pitch", category:"money", speaker:null,
   text:"Someone's going around the Trench selling protection, insurance against your den getting hit by exactly the kind of trouble that tends to happen to dens who don't buy it.",
   options:[
     {label:"Pay up. Cheaper than finding out what happens otherwise.", reaction:"You feel a little sick paying it. That's probably the point.", effect:(s)=>{s.flags.add("paying_protection");}},
     {label:"Refuse and reinforce your own security instead.", reaction:"It costs effort, not money. You'll see if it holds.", effect:(s)=>{}},
     {label:"Report it to Marsh, for whatever that's worth.", reaction:"Marsh writes it down. You're not sure that means anything.", effect:(s)=>{shiftRel(s,"marsh",1);}}
   ]},
  {id:"equipment_fails", category:"money", speaker:null,
   text:"Half the gear in the Pit is old, patched together, held up by habit more than maintenance. Something finally breaks mid-training, badly enough it can't be ignored.",
   options:[
     {label:"Find a way to replace it properly.", reaction:"It takes the whole week, but it's done right.", effect:(s)=>{}},
     {label:"Patch it again. It'll hold a while longer.", reaction:"It holds. For now.", effect:(s)=>{s.flags.add("patched_equipment_again");}},
     {label:"Ask if anyone on the roster can fix it themselves.", reaction:"Turns out one of them used to do exactly this for a living.", effect:(s)=>{}}
   ]},
  {id:"sable_offer", category:"corp", speaker:"sable",
   text:"Sable's back, same unbothered smile as always. Kestrel wants to sponsor your next card. Money, exposure, legitimacy you don't currently have. All it costs is letting them put their logo on everything and their people in your business.",
   options:[
     {label:"Take the deal. See what it actually costs later.", reaction:"She smiles like she already knew you'd say that.", effect:(s)=>{shiftRel(s,"kestrel",1); s.flags.add("took_kestrel_sponsorship");}},
     {label:"Negotiate the terms first.", reaction:"She's patient about it, which somehow makes it worse.", effect:(s)=>{shiftRel(s,"kestrel",1);}},
     {label:"Turn it down. You didn't build this to answer to a corp.", reaction:"\"Noted,\" she says, unbothered as ever, and leaves.", effect:(s)=>{shiftRel(s,"kestrel",-1); s.flags.add("refused_kestrel_twice_maybe");}}
   ]},
  {id:"marsh_favor", category:"corp", speaker:"marsh",
   text:"Detective Marsh drops by, not for his usual cut. This time he wants a favor. Someone he's looking into might show up at your next card. He wants you to look the other way when it happens.",
   options:[
     {label:"Agree. Keeping Marsh happy keeps the heat down.", reaction:"\"Appreciated,\" he says, already halfway out the door.", effect:(s)=>{shiftRel(s,"marsh",1); s.flags.add("owes_marsh_a_favor_back");}},
     {label:"Ask what this is really about first.", reaction:"He gives you half an answer. It's more than he usually gives.", effect:(s)=>{shiftRel(s,"marsh",1);}},
     {label:"Refuse. You don't do the cops' work for them.", reaction:"He doesn't argue. He just remembers.", effect:(s)=>{shiftRel(s,"marsh",-1);}}
   ]},
  {id:"kestrel_warning", category:"corp", speaker:"sable",
   text:"A Kestrel representative you've never met stops by, not Sable this time, someone colder. Says the corp's noticed you turning down their offers lately. Says that's fine. Says it in a tone that makes clear it is not fine.",
   options:[
     {label:"Stand your ground. Don't let them see it landed.", reaction:"They leave without another word. That's somehow worse than a threat.", effect:(s)=>{shiftRel(s,"kestrel",-1);}},
     {label:"Try to smooth things over.", reaction:"It works, a little. You're not proud of how much that relieves you.", effect:(s)=>{shiftRel(s,"kestrel",1);}},
     {label:"Push back harder.", reaction:"Their expression doesn't change at all. Filed away, probably.", effect:(s)=>{shiftRel(s,"kestrel",-2);}}
   ]},
  {id:"fighter_defects", category:"rival", speaker:null,
   text:"Word comes back that one of Calloway's fighters wants out, quietly, and wants to know if you'd take them. Calloway doesn't know yet. If he finds out you were involved before it happens, that's a problem.",
   options:[
     {label:"Meet them. Discreetly.", reaction:"You keep it quiet. For now, anyway.", effect:(s)=>{s.flags.add("met_calloway_defector");}},
     {label:"Tell them to handle their own exit first.", reaction:"They understand, even if they look disappointed.", effect:(s)=>{}},
     {label:"Stay out of it entirely.", reaction:"You never hear how it turned out for them.", effect:(s)=>{}}
   ]},
  {id:"street_performer", category:"color", speaker:null,
   text:"Someone's set up outside the Pit playing something that might be a love song or might be a threat, hard to tell with the accent, and insists on performing directly at you every time you walk past.",
   options:[
     {label:"Watch the whole performance, whatever it is.", reaction:"It was, in fact, a threat. A very melodic one.", effect:(s)=>{}},
     {label:"Toss a compliment and keep walking.", reaction:"They seem satisfied with that. You're not entirely sure why.", effect:(s)=>{}},
     {label:"Ask them to move somewhere else.", reaction:"They go, muttering something in time with the departure.", effect:(s)=>{}}
   ]},
  {id:"reporter", category:"color", speaker:null,
   text:"Someone from an uptown paper wants to do a piece on \"the real Trench fight scene,\" camera and all. Says it'll be sympathetic. Says that a lot, actually, like she's said it to a lot of people who didn't believe her either.",
   options:[
     {label:"Let her in. Publicity's publicity.", reaction:"The piece runs two weeks later. It's fine. Mostly.", effect:(s)=>{s.flags.add("let_reporter_in");}},
     {label:"Agree, but control exactly what she sees.", reaction:"She grumbles about access but takes what she can get.", effect:(s)=>{}},
     {label:"Turn her away.", reaction:"She doesn't push. You get the feeling she'll be back.", effect:(s)=>{}}
   ]},
  {id:"marsh_bigger", category:"corp", speaker:"marsh",
   text:"Marsh's usual small favors have escalated into something with real weight this time, something that would genuinely put you at risk if it went wrong.",
   options:[
     {label:"Agree, this once, and hope it's worth it.", reaction:"He looks almost apologetic asking. Almost.", effect:(s)=>{shiftRel(s,"marsh",1); s.flags.add("took_marsh_big_risk");}},
     {label:"Refuse. This is further than the arrangement should go.", reaction:"He nods slowly, like he expected that answer more than the other one.", effect:(s)=>{shiftRel(s,"marsh",-1);}},
     {label:"Ask what's actually driving him to ask for this.", reaction:"The answer is more honest than you expected from him.", effect:(s)=>{shiftRel(s,"marsh",1);}}
   ]}
];

/* --- Recruitment scenes (MVP set of three, per spec Section 6) --- */
/* Each scene is a node graph: nodes keyed by id, options carry a short
   reaction line before advancing (branch reactivity), per the build guide. */

function shiftRel(state, who, delta){
  // relationship stored as numeric internally, described in UI
  state.rel[who] = (state.rel[who]||0) + delta;
}
function relLabel(who, v){
  const maps = {
    calloway: [[-99,"open hostility"],[-1,"hostile"],[0,"wary tension"],[1,"wary respect"],[99,"uneasy alliance"]],
    kestrel:  [[-99,"hostile"],[-1,"rebuffed, watching"],[0,"pursuing you"],[1,"cultivating you"],[99,"deeply entangled"]],
    marsh:    [[-99,"burned"],[-1,"cold"],[0,"clean"],[1,"owed a favor"],[99,"in your pocket"]],
    juno:     [[-99,"distant"],[-1,"cool"],[0,"friendly"],[1,"warm"],[99,"like family"]]
  };
  const table = maps[who]||[[-99,"unknown"],[99,"unknown"]];
  let label = table[0][1];
  for(const [th,lb] of table){ if(v>=th) label = lb; }
  return label;
}

function addFighter(state, name, trait, flag){
  state.roster.push({id:uid(), name, trait, status:"active", wins:0, losses:0, streak:0, streakType:null});
  if(flag) state.flags.add(flag);
}

const SCENES = {
  bram: {
    label:"BRAM", location:"The shipping yards",
    intro:"1.\nBram's easy to find. He's standing on top of a shipping container, shirtless despite the cold, shouting down at a crowd of maybe six people that he'll take on anyone in the Trench for free, right now, no purse, just to prove a point nobody asked him to prove.\n\nNobody's taken him up on it yet.",
    start:"n1",
    nodes:{
      n1:{text:null, options:[
        {label:"Climb up and talk to him directly.", reaction:"You climb up. He notices before you get a word out.", next:"n2"},
        {label:"Wait until he comes down on his own.", reaction:"He hops down eventually, still grinning at the crowd.", next:"n2"},
        {label:"Ask the crowd what his deal is first.", reaction:"\"That's just Bram,\" someone says, like that explains everything. It mostly does.", next:"n2"}
      ]},

      n2:{text:"2.\nHe notices you before you say anything. \"You're not here to fight me,\" he says, grinning. \"You've got the look of someone here to recruit, not brawl.\"", options:[
        {label:"Confirm it. Tell him you run the Pit.", reaction:"\"Knew it,\" he says, pleased with himself, hopping down immediately.", next:"n3"},
        {label:"Ask how he knew, just from a look.", reaction:"He taps his own temple. \"Recruiters walk slower. Like they're pricing everyone they pass.\"", next:"n3"},
        {label:"Neither confirm nor deny yet.", reaction:"He laughs outright. \"Fine, keep it mysterious. Doesn't change what I'm about to say next.\"", next:"n3"}
      ]},

      n3:{text:"3.\n\"Everyone down here knows everyone eventually,\" he says, hopping down off the container with more confidence than the landing deserved. \"So. You want to see what I've got.\"", options:[
        {label:"Yes. Show me something.", reaction:"\"Knew you'd say that,\" he says, already looking around for something to prove it with.", next:"n4"},
        {label:"Tell him first, no theatrics, just talk.", reaction:"He actually looks a little disappointed, like the talk-first types are rarer than he'd like. \"Fine. I'll still end up showing you something anyway.\"", next:"n4"},
        {label:"Ask what he thinks he's got, exactly.", reaction:"He grins wider. \"That's the wrong question. Ask what I'd do to prove it instead.\"", next:"n4"}
      ]},

      n4:{text:"4.\n\"Theatrics,\" he repeats, delighted, like you'd handed him a gift. \"Alright. Watch this.\"\n\nHe grabs a loose pipe off the ground, easily twice his forearm's width, and bends it most of the way around his own arm before you can tell him not to. It clearly hurts. He doesn't show it.", options:[
        {label:"Tell him that was reckless, not impressive.", reaction:"\"Reckless and impressive aren't opposites,\" he says, rubbing his arm, still grinning through it.", next:"n5"},
        {label:"Admit it was, at least, impressive.", reaction:"He lights up completely. \"Told you.\"", next:"n5"},
        {label:"Ask if he's always this eager to hurt himself for an audience.", reaction:"That actually stops him for half a second. \"Huh. Nobody's put it like that before.\"", next:"n5"}
      ]},

      n5:{text:"5.\n\"Ask me to do something harder. I mean it. Go on.\"", options:[
        {label:"Tell him to fight the next person who walks by.", reaction:"A stranger walking by gets genuinely alarmed, and Bram has to talk his way out of an actual fight starting for the wrong reasons.", next:"n6"},
        {label:"Tell him to jump from the container he was just standing on, into the water below.", reaction:"He does it without hesitation, and comes up soaked and laughing.", next:"n6"},
        {label:"Decide this is enough proof already and skip ahead.", reaction:"He shrugs, a little disappointed you didn't take the bait, but doesn't push it.", next:"n6"}
      ]},

      n6:{text:"6.\nHe's still catching his breath, whichever stunt just happened, and there's something almost childlike in how pleased he looks with himself.\n\n\"See,\" he says. \"I don't back down from things. That's what you want, right? Someone who doesn't back down.\"", options:[
        {label:"Tell him that's exactly what worries you.", reaction:"The grin falters slightly, like the concern actually landed somewhere real. \"Noted,\" he says, quieter than before.", next:"n7"},
        {label:"Agree, that's exactly what you're looking for.", reaction:"He lights up completely, delighted to hear it out loud. \"Then we're already halfway to a deal.\"", next:"n7"},
        {label:"Ask if there's anything he actually would say no to.", reaction:"That question stops him entirely, which none of your other reactions did.", next:"n7"}
      ]},

      n7:{text:"7.\nThat last question actually stops him for a second. \"Huh,\" he says. \"Nobody's asked me that before.\"\n\nHe thinks about it longer than anything else so far.", options:[
        {label:"Wait him out. Let him actually answer.", reaction:"You give him the silence. He uses all of it.", next:"n8"},
        {label:"Move on, it was a rhetorical question anyway.", reaction:"\"No,\" he says anyway, like he needs to answer it even unasked. \"It wasn't rhetorical to me.\"", next:"n8"},
        {label:"Push. Tell him everyone has a limit somewhere.", reaction:"\"Everyone,\" he agrees, and for once there's no performance in his voice at all.", next:"n8"}
      ]},

      n8:{text:"8.\n\"I wouldn't hurt someone who couldn't fight back,\" he finally says, and for a moment the performance drops entirely. \"That's the line. Everything else is negotiable.\"", options:[
        {label:"Tell him that's a better answer than you expected.", reaction:"\"Don't sound so surprised,\" he says, but he's pleased.", next:"n9"},
        {label:"Ask if that line's ever actually been tested.", reaction:"He goes quiet for a second before answering.", next:"n9"},
        {label:"Say nothing, just nod.", reaction:"He seems to appreciate that more than a reply would have landed.", next:"n9"}
      ]},

      n9:{text:"9.\n\"It's been tested,\" he says, quieter now. \"Once. I walked away from a fight I could've won, because the other guy was already done and his own corner wasn't stopping it. Cost me a purse. Worth it.\"", options:[
        {label:"Ask what happened to the fighter he walked away from.", reaction:"\"He's fine, far as I know,\" Bram says. \"Fights for someone uptown now. Legal circuit. Sends me a drink sometimes when we're at the same bar, which is funny, considering.\"", next:"n10"},
        {label:"Tell him that's the kind of story that actually matters to you.", reaction:"He doesn't quite know what to do with that, so he just nods once, like he's filing it away.", next:"n10"},
        {label:"Redirect, ask about his training instead.", reaction:"He answers, but you can tell the redirect didn't land the way you meant it to.", next:"n10"}
      ]},

      n10:{text:"10.\nThe showman's mostly back by the time he finishes the sentence, like the quiet moment embarrassed him slightly.", options:[
        {label:"Tell him to show you something else, something genuinely dangerous this time.", reaction:"He grins, delighted, and immediately starts looking for something worse than the pipe.", next:"n11"},
        {label:"Say you've seen enough for now.", reaction:"He seems almost relieved, like he was running low on stunts anyway.", next:"n11"},
        {label:"Ask him to spar, right here, against you.", reaction:"He laughs, delighted, and actually goes easy on you in a way that somehow says more about him than any words would.", next:"n11"}
      ]},

      n11:{text:"11.\nA small crowd's gathered again, drawn by whatever just happened. Bram plays to them without even trying, waving like he's already won something.", options:[
        {label:"Ask him, seriously this time, why he wants to fight for the Pit specifically.", reaction:"He drops the crowd-facing grin for a second to actually answer.", next:"n12"},
        {label:"Ask if he's fought for Calloway before.", reaction:"\"Once,\" he says, wrinkling his nose. \"Didn't take.\"", next:"n12"},
        {label:"Ask if he's ever lost, and how he handled it.", reaction:"\"Plenty,\" he says, shrugging easily. \"Ask me how I handled it after you've decided about the Pit, not before. Wouldn't want to scare you off early.\"", next:"n12"}
      ]},

      n12:{text:"12.\n\"Calloway's circuit is all rules and referees,\" Bram says, wrinkling his nose like the words taste bad. \"I want it real. Your den's got a reputation for that. Real stakes. Real crowd. No pretending it's a sport when it's actually survival.\"", options:[
        {label:"Tell him the Pit is real, but it's not reckless for the sake of it.", reaction:"He nods, more seriously than his reputation suggests he's capable of.", next:"n13"},
        {label:"Tell him that's exactly the reputation you intend to keep.", reaction:"That seems to be exactly what he wanted to hear.", next:"n13"},
        {label:"Warn him you don't reward recklessness that gets other people hurt.", reaction:"\"Understood,\" he says, and for once, no grin attached to it.", next:"n13"}
      ]},

      n13:{text:"13.\nHe takes the warning seriously, more seriously than you expected. \"Understood,\" he says.", options:[
        {label:"Test him one more time. Tell him to do something with real stakes, not just a stunt.", reaction:"His grin comes back, slower this time, more deliberate, like he already knows what you're about to ask.", next:"n14"},
        {label:"Decide you've tested him enough already.", reaction:"He doesn't push for another test. Whatever's underneath the performance, it's already shown itself once or twice tonight.", next:"n17"},
        {label:"Ask what he'd want from the arrangement, beyond fighting.", reaction:"He thinks about that one more carefully than any stunt-based question. \"Somewhere that doesn't ask me to be smaller than I am. That's most of it.\"", next:"n17"}
      ]},

      n14:{text:"14.\n\"Real stakes,\" you say. \"Go find someone from Calloway's crew and tell them, to their face, that you're joining the Pit.\"\n\nBram's grin comes back, slower this time, more deliberate. \"That's not a stunt. That's a declaration.\"", options:[
        {label:"Tell him that's exactly the point.", reaction:"He nods once, like he was hoping you'd say that.", next:"n15"},
        {label:"Walk it back. That's too much to ask right now.", reaction:"He shakes his head slightly. \"A little late for that.\"", next:"n15"}
      ]},

      n15:{text:"15.\nHe does it anyway, whether you walked it back or not, because backing down isn't something Bram seems capable of once a line's been drawn. You watch from a distance as he says something short to one of Calloway's people loitering near the market.\n\nWhatever he said, the other man's face goes hard, then he just walks away.", options:[
        {label:"Ask Bram what exactly he told him.", reaction:"He's happy to recount it, word for word, like he's proud of the phrasing.", next:"n16", effect:(s)=>{shiftRel(s,"calloway",-1); s.flags.add("bram_confronted_calloway_crew");}},
        {label:"Tell him that took real nerve.", reaction:"\"Didn't feel like nerve,\" he says. \"Felt like the obvious thing to do.\"", next:"n16", effect:(s)=>{shiftRel(s,"calloway",-1); s.flags.add("bram_confronted_calloway_crew");}},
        {label:"Ask if he's worried about what happens next.", reaction:"\"Didn't think that far ahead,\" he admits, which might be the most honest thing he's said all night.", next:"n16", effect:(s)=>{shiftRel(s,"calloway",-1); s.flags.add("bram_confronted_calloway_crew");}}
      ]},

      n16:{text:"16.\n\"Told him exactly what you'd expect,\" Bram says. \"That the Pit's got better fighters and better people running it. He didn't like it. Wasn't supposed to.\"", options:[
        {label:"Warn him that Calloway might remember this.", reaction:"\"Hope he does,\" Bram says, not even a little worried.", next:"n17"},
        {label:"Tell him you respect it, whatever comes of it.", reaction:"That lands somewhere real. He doesn't have a joke ready for once.", next:"n17"},
        {label:"Ask if he regrets it already.", reaction:"\"Not even a little,\" he says, and for the first time this whole conversation, he sounds completely sincere instead of performing for anyone.", next:"n17"}
      ]},

      n17:{text:"17.\nWhatever led here, something's shifted in how he's carrying himself, less performance, more plain fact.", options:[
        {label:"Ask him, one last time, if he's ready to actually commit to this.", reaction:"He waits. Doesn't fill the silence with anything this time, which might be the most telling thing he's done all day.", next:"n18"},
        {label:"Tell him you need a moment to think it over.", reaction:"\"Take your time,\" he says, and actually means it.", next:"n18"},
        {label:"Just watch him for a moment before answering.", reaction:"He lets you. Doesn't fill it with a joke, doesn't rush you.", next:"n18"}
      ]},

      n18:{text:"18.\nHe waits. Doesn't fill the silence with anything this time, which might be the most telling thing he's done all day.", options:[
        {label:"Offer him the spot.", reaction:"He doesn't whoop or grin the way you'd expect. He just nods, like something's finally landed.", next:"decision"},
        {label:"Tell him you need to see one more thing first.", reaction:"He doesn't argue. \"One more thing, then,\" he says, and waits to see what you'll ask.", next:"n18b"},
        {label:"Turn him down. Too much risk, even with everything you've seen.", reaction:"He takes it without the performance dropping this time, like he half expected it.", next:"decision"}
      ]},

      n18b:{text:"You ask for one last thing, and pick something with no audience at all: an exhausted vendor down the block needs help dragging a flooded cart out of the water before the tide takes what's left of her stock.\n\nBram does it without a single glance to see if anyone's watching. Nobody claps. He doesn't seem to notice that either.", options:[
        {label:"That settles it. Offer him the spot.", reaction:"He nods, like something's finally landed, same as before, just quieter.", next:"decision"},
        {label:"Turn him down anyway. Too much risk.", reaction:"He takes it in stride, the way he's taken everything else tonight.", next:"decision"}
      ]},

      decision:{text:"19.\nWhatever you decide, Bram takes it the way he takes everything, loudly, honestly, without pretense.\n\nRECRUIT DECISION", isDecision:true, options:[
        {label:"Bring him into the Pit.", recruit:true, effect:(s)=>{addFighter(s,"Bram","Reckless","bram_confronted_calloway_crew");}, resultText:"20.\nBram joins the roster. Trait: Reckless. Flag set: \"confronted Calloway's crew publicly on the Pit's behalf.\" Relationship shift: Calloway becomes more openly hostile."},
        {label:"Tell him no, but wish him well.", recruit:false, effect:(s)=>{s.flags.add("declined_bram");}, resultText:"20.\nBram nods, takes it in stride, says he'll prove you wrong eventually. Flag set: \"turned down Bram,\" which may resurface if he ends up fighting for a rival den later."}
      ]}
    }
  },

  corvin: {
    label:"CORVIN", location:"A near-empty gym",
    intro:"1.\nCorvin trains alone, every morning, in a gym that's more concrete than equipment. He doesn't stop when you walk in. Doesn't acknowledge you at all, in fact, until he's finished his set.",
    start:"n1",
    nodes:{
      n1:{text:null, options:[
        {label:"Wait for him to finish before speaking.", reaction:"He finally turns, unbothered, like he expected patience from whoever came to see him.", next:"n2"},
        {label:"Speak up anyway.", reaction:"He doesn't stop his set, doesn't even look over, just says \"Finish your sentence after I finish mine.\"", next:"n2"},
        {label:"Watch his form quietly, see how he reacts to being observed.", reaction:"He doesn't react at all, which is its own kind of answer.", next:"n2"}
      ]},

      n2:{text:"2.\nEither way, you end up here: \"You're the one running the Pit,\" he says. Not a question.", options:[
        {label:"Confirm it.", reaction:"He nods once, like confirmation was never really in question.", next:"n3"},
        {label:"Ask how he already knew.", reaction:"\"People talk,\" he says, not unkindly, \"especially about anyone new running something down here.\"", next:"n3"},
        {label:"Ask if that's a problem for him.", reaction:"He actually pauses before answering, which is new.", next:"n3"}
      ]},

      n3:{text:"3.\n\"Not a problem,\" he says. \"Just information. People talk about you differently than they talk about Calloway. That's worth something, at least as a starting point.\"", options:[
        {label:"Ask what people actually say.", reaction:"He gives you the short version, no embellishment either way.", next:"n4"},
        {label:"Ask what would make it worth more than a starting point.", reaction:"\"Fair,\" he says, something like the beginning of respect in it.", next:"n4"},
        {label:"Tell him you didn't come here for a character reference.", reaction:"\"Fair,\" he says, at the third answer, something like the beginning of respect in it.", next:"n4"}
      ]},

      n4:{text:"4.\n\"Then ask what you actually came to ask.\"", options:[
        {label:"Ask him to show you what he can do.", reaction:"\"No,\" he says, immediately, flat. \"I don't perform. If you want to see what I can do, you'll see it in an actual match, for an actual reason. Not for you, alone, in an empty gym.\"", next:"n5"},
        {label:"Ask him why he fights at all.", reaction:"\"Because it's the only place I've found where the rules are actually honest,\" he says. \"You win or you don't. Nobody's lying about which.\"", next:"n7"},
        {label:"Ask about the augments he clearly doesn't have.", reaction:"\"Never saw the point,\" he says. \"Everything I've got, I built myself. Slower. Mine.\"", next:"n7"}
      ]},

      n5:{text:"5.\n\"No,\" he says, immediately, flat. \"I don't perform. If you want to see it, you'll see it in an actual match, for an actual reason. Not for you, alone, in an empty gym.\"", options:[
        {label:"Respect that. Move to a different question.", reaction:"Something in his posture eases slightly.", next:"n7"},
        {label:"Push. Tell him you need to know before committing anything.", reaction:"He doesn't escalate, just repeats himself, flatter this time. \"I said no.\"", next:"n7"},
        {label:"Test the line further. Ask him to do something small anyway, just to see if he holds firm.", reaction:"He stops entirely. Looks at you for a long uncomfortable moment. \"I said no,\" he says again, slower this time, like he's deciding whether the conversation is over. \"If you push again, it is over.\"", next:"n6"}
      ]},

      n6:{text:"6.\nHe stops entirely. Looks at you for a long uncomfortable moment. \"I said no,\" he says again, slower this time, like he's deciding whether the conversation is over. \"If you push again, it is over.\"", options:[
        {label:"Back off immediately. That was a mistake.", reaction:"He goes back to his set without another word for a while, visibly colder for the next several exchanges.", next:"n7"},
        {label:"Apologize directly.", reaction:"He doesn't say it's fine. He also doesn't leave, though he stays visibly colder for a while.", next:"n7"},
        {label:"Push one more time anyway, to see what happens.", reaction:"He sets the weight down entirely. Whatever this could have been, it isn't happening tonight.", next:"fail"}
      ]},

      n7:{text:"7.\nHe goes back to his set without another word for a while. When he finally speaks again, it's without looking at you.\n\n\"I fight because it's the only place I've found where the rules are actually honest. You win or you don't. Nobody's lying to you about which.\"", options:[
        {label:"Ask what made honesty matter so much to him.", reaction:"He's quiet for a moment before answering, like the question costs him something to sit with, but he lets it go for now.", next:"n9"},
        {label:"Tell him the Pit tries to run on the same principle.", reaction:"He doesn't answer that directly, just files it away.", next:"n9"},
        {label:"Ask if he's ever been lied to somewhere that mattered more than a fight.", reaction:"He sets the weight down entirely this time.", next:"n8"}
      ]},

      n8:{text:"8.\nHe sets the weight down entirely this time. \"Yes,\" he says. \"I'm not discussing it further. Ask something else.\"", options:[
        {label:"Respect the boundary immediately.", reaction:"He seems to file that away, quietly.", next:"n9"},
        {label:"Apologize for pushing into it.", reaction:"\"Nothing to apologize for,\" he says, though he sounds like he means the opposite a little.", next:"n9"}
      ]},

      n9:{text:"9.\nWhichever path got you here, the conversation settles into something steadier, less guarded than it started.\n\n\"You haven't tried to impress me,\" Corvin says, unprompted. \"Most people running a den do. You mostly just asked questions and backed off when told to. That's rarer than you'd think.\"", options:[
        {label:"Tell him that's just how you operate.", reaction:"\"We'll see if that holds,\" he says, not quite a challenge, not quite a compliment either.", next:"n10"},
        {label:"Ask if that's what actually matters to him, in the people he works for.", reaction:"He considers the question longer than you expect.", next:"n10"},
        {label:"Say nothing, let the observation sit.", reaction:"The silence stretches long enough that he's the one who breaks it first, which seems to surprise him more than it surprises you.", next:"n10"}
      ]},

      n10:{text:"10.\n\"It's most of what matters,\" he says. \"Skill I can build myself. Trusting the person signing my matches, that's not something I can train.\"", options:[
        {label:"Ask what would actually earn that trust from him.", reaction:"He thinks about it for a real moment before answering.", next:"n11"},
        {label:"Tell him you understand, and mean it.", reaction:"\"We'll see,\" he says again, but softer this time.", next:"n11"},
        {label:"Ask if anyone's ever actually earned it before.", reaction:"His expression changes, just slightly, before he answers.", next:"n11"}
      ]},

      n11:{text:"11.\n\"One person,\" he says. \"Ran a den two seasons back. Fair with money, fair with matches, never once asked me to take a fight I said no to.\"", options:[
        {label:"Ask what happened to that den.", reaction:"His jaw tightens slightly before he answers.", next:"n12"},
        {label:"Ask what happened to the person.", reaction:"\"Kestrel happened,\" he says, and something in his voice goes flat and hard in a way it hasn't been all conversation.", next:"n12"}
      ]},

      n12:{text:"12.\n\"Kestrel happened,\" he says, and something in his voice goes flat and hard in a way it hasn't been all conversation. \"Bought the building out from under her. She's gone. I don't know where.\"", options:[
        {label:"Tell him that's exactly the kind of thing Kestrel does.", reaction:"\"Kestrel,\" he confirms, without hesitation. \"Never her. She did everything right. It didn't matter.\"", next:"n13"},
        {label:"Ask if he blames her for losing the den, or just Kestrel for taking it.", reaction:"\"Never her,\" he says immediately. \"She did everything right. It didn't matter.\"", next:"n13"},
        {label:"Say nothing, let him finish in his own time.", reaction:"He takes his time, and finishes anyway.", next:"n13"}
      ]},

      n13:{text:"13.\n\"Kestrel,\" he confirms. \"Never her. She did everything right.\"", options:[
        {label:"Tell him the Pit's had its own trouble with Kestrel, and it isn't over.", reaction:"Something in him goes very still, like the words matter more than you meant them to.", next:"n14", effect:(s)=>{s.flags.add("corvin_knows_kestrel_history");}},
        {label:"Ask if that history makes him hesitant to trust any den again.", reaction:"\"It should,\" he admits. \"Somehow it hasn't, yet.\"", next:"n14", effect:(s)=>{s.flags.add("corvin_knows_kestrel_history");}},
        {label:"Just acknowledge it, nothing more.", reaction:"He seems to appreciate that you didn't try to make it bigger than it was.", next:"n14", effect:(s)=>{s.flags.add("corvin_knows_kestrel_history");}}
      ]},

      n14:{text:"14.\n\"It should make me hesitant,\" he admits. \"Somehow it hasn't, yet. I'm still standing here talking to you instead of walking away, which is either a good sign about you or a bad sign about my judgment.\"", options:[
        {label:"Tell him you intend it to be the former.", reaction:"\"We'll see,\" he says, but there's less edge in it now.", next:"n16"},
        {label:"Ask him directly what he needs from you, if he's going to commit.", reaction:"He tells you plainly, without embellishment.", next:"n16"},
        {label:"Offer a small, concrete promise, something you can actually keep.", reaction:"He considers whatever specific promise you offer longer than anything else in the conversation.", next:"n15"}
      ]},

      n15:{text:"15.\n\"Alright,\" he finally says. \"That's something I can hold you to. Say it again, plainly, so there's no confusion later.\"", options:[
        {label:"Repeat it, plainly, and mean it.", reaction:"He nods once, like the words are now on the record between you.", next:"n16"},
        {label:"Soften it slightly, hedge a little.", reaction:"He notices the hedge immediately, and something in his manner cools by a degree, though the conversation continues.", next:"n16"}
      ]},

      n16:{text:"16.\nWhatever was said, something settles in him, visibly, like a decision's already been made even before either of you says it out loud.", options:[
        {label:"Ask if he's ready to actually join the roster.", reaction:"He doesn't answer right away, just considers you a moment longer.", next:"n17"},
        {label:"Tell him to take his time deciding.", reaction:"He actually looks at you a little differently, like the offer of patience meant something. \"Most people don't say that,\" he says.", next:"n17"},
        {label:"Ask one final question before he answers.", reaction:"He waits, unbothered, for whatever you're about to ask.", next:"n17"}
      ]},

      n17:{text:"17.\n\"I don't need time,\" he says. \"I've been watching how you handled this whole conversation more than I've been listening to the words in it. That told me enough.\"", options:[
        {label:"Ask what exactly it told him.", reaction:"He tells you, plainly, without embellishment, what your patience and restraint communicated to him about how you'd likely run things when it actually mattered.", next:"decision"},
        {label:"Just accept that and move to the decision.", reaction:"He seems to appreciate that you didn't need it spelled out.", next:"decision"}
      ]},

      decision:{text:"18.\nHe tells you, plainly, without embellishment, what your patience and restraint communicated to him about how you'd likely run things when it actually mattered, not just in conversation.\n\nRECRUIT DECISION", isDecision:true, options:[
        {label:"Offer him the spot at the Pit.", recruit:true, effect:(s)=>{addFighter(s,"Corvin","Old-school","corvin_knows_kestrel_history");}, resultText:"19.\nCorvin joins the roster. Trait: Old-school. Flag set: \"knows about the den Kestrel took from someone Corvin trusted.\" This flag should color future Kestrel and Sable events if Corvin is on the roster during them."},
        {label:"Tell him you need to think it over first.", recruit:false, effect:(s)=>{s.flags.add("corvin_left_pending");}, resultText:"19.\nHe takes it without visible reaction, simply returns to his training set, as though the conversation cost him nothing either way. He remains independent for now, but the door isn't closed."},
        {label:"Decide, even now, this isn't the right fit.", recruit:false, effect:(s)=>{s.flags.add("declined_corvin");}, resultText:"19.\nHe takes it without visible reaction, simply returns to his training set, as though the conversation cost him nothing either way. Flag set: \"Corvin remains independent,\" which may allow a second recruitment attempt later if circumstances change."}
      ]},

      fail:{text:"He's already told you the conversation is over, and he means it. Whatever this could have been, it isn't happening tonight. He sets the weight down and walks out without another word.", isDecision:true, options:[
        {label:"Leave.", recruit:false, effect:(s)=>{s.flags.add("corvin_walked_away");}, resultText:"Corvin remains independent. Pushing past his line cost you this one, at least for now."}
      ]}
    }
  },

  nkiru: {
    label:"NKIRU", location:"A corner stall near Juno's",
    intro:"1.\nNkiru reads cards for creds on the corner near Juno's stall when she's not fighting, and she's fighting more often lately than she's reading. You find her mid reading for a nervous looking customer, flipping a card over with real theatrical flourish.",
    start:"n1",
    nodes:{
      n1:{text:null, options:[
        {label:"Wait for the reading to finish.", reaction:"She finishes with a flourish, sends the customer off looking strangely reassured, then turns to you like she already knew you were there the whole time.", next:"n2"},
        {label:"Interrupt, you don't have time for theater.", reaction:"She holds up one finger without looking at you, finishes anyway, then turns to you like she already knew you were there the whole time.", next:"n2"},
        {label:"Ask the customer, quietly, if the readings are any good.", reaction:"The customer just shrugs, unsettled, and hurries off once Nkiru finishes.", next:"n2"}
      ]},

      n2:{text:"2.\n\"You didn't come for a reading,\" she says. \"Though I could do one anyway. Might be useful.\"", options:[
        {label:"Take the reading. Why not.", reaction:"She flips three cards, slow, deliberate, clearly enjoying every second of your patience being tested.", next:"n3"},
        {label:"Decline, get to the actual point.", reaction:"She shrugs, unbothered, and sets the cards aside without another word about it.", next:"n4"},
        {label:"Ask what she'd even read for someone like you.", reaction:"\"Only one way to find out,\" she says, already reaching for the deck.", next:"n3"}
      ]},

      n3:{text:"3.\n\"Interesting,\" she says, of the third card. \"You're either about to make a very good decision or a very bad one. The cards are rarely more specific than that, unfortunately.\"", options:[
        {label:"Ask if that's a real reading or just a performance.", reaction:"\"Does it matter, if it's still true?\" she says, which isn't really an answer.", next:"n4"},
        {label:"Laugh it off and move on to the actual conversation.", reaction:"She laughs too, easily, and sets the cards aside.", next:"n4"},
        {label:"Ask her to be more specific anyway.", reaction:"\"The cards are rarely more specific than that,\" she repeats, amused you tried.", next:"n4"}
      ]},

      n4:{text:"4.\nShe eventually sets the cards aside. \"Alright. You're here about the Pit. Everyone eventually is.\"", options:[
        {label:"Confirm it. Ask if she'd consider fighting for you.", reaction:"She raises an eyebrow, amused. \"Bold opener.\"", next:"n5"},
        {label:"Ask why she reads cards at all if she's clearly skilled enough to fight full time.", reaction:"Something in her expression softens slightly, like it's a better question than she expected.", next:"n5"}
      ]},

      n5:{text:"5.\n\"The cards keep me honest,\" she says. \"Fighting alone makes you forget there's anything bigger than winning. The cards remind me there's a whole universe that doesn't care who wins.\"", options:[
        {label:"Ask if she actually believes that, or if it's just a good line.", reaction:"\"Both, probably,\" she says, entirely unbothered by the question.", next:"n8"},
        {label:"Tell her that's a strange way to think about fighting.", reaction:"\"Most true things sound strange out loud,\" she says.", next:"n8"},
        {label:"Ask her to prove her skill, not her philosophy.", reaction:"She grins, delighted by the challenge, but doesn't immediately comply. \"Prove it how? Be specific. I don't perform for free, and I definitely don't perform for vague requests.\"", next:"n6"}
      ]},

      n6:{text:"6.\n\"Prove it how? Be specific. I don't perform for free, and I definitely don't perform for vague requests.\"", options:[
        {label:"Tell her to walk across the flooded street on the narrowest ledge she can find.", reaction:"She actually does it, arms out, completely unbothered by the drop, humming something under her breath the entire way across like it's a ritual and not a stunt.", next:"n7"},
        {label:"Tell her to pick a fight with the loudest person in the market, just talk, no violence.", reaction:"She does it without hesitation, and somehow talks the man into apologizing to a stranger within a minute.", next:"n7"},
        {label:"Ask her to read your cards instead, and tell you something true about yourself.", reaction:"She turns the tables entirely, flips three cards for you specifically this time, slower, more serious than the earlier reading.", next:"n7alt"}
      ]},

      n7:{text:"7.\n\"Balance is mostly superstition anyway,\" she says, landing safely. \"You just have to believe the ledge wants you to make it.\"", options:[
        {label:"Tell her that was genuinely impressive.", reaction:"\"Most things are, once you stop expecting them to fail,\" she says.", next:"n8"},
        {label:"Ask if she's ever actually fallen doing that.", reaction:"\"Once,\" she admits. \"Landed fine. Pride took longer to heal.\"", next:"n8"},
        {label:"Move the conversation forward.", reaction:"She lets you, easily, like she wasn't attached to lingering on it either.", next:"n8"}
      ]},

      n7alt:{text:"7.\n\"You're carrying something heavier than this den,\" she says. \"Something personal. The cards don't say what. I'm not sure I'd tell you even if they did.\"", options:[
        {label:"Ask what she means by that, directly.", reaction:"\"I mean exactly what I said,\" she says, unhelpfully, but not unkindly.", next:"n8"},
        {label:"Let it go, unsettled but moving on.", reaction:"She doesn't push it either, which somehow makes it worse.", next:"n8"},
        {label:"Tell her the cards are wrong this time.", reaction:"\"Maybe,\" she says, in a tone that suggests she doesn't think so.", next:"n8"}
      ]},

      n8:{text:"8.\n\"You want to know if I'll actually fight for someone else's den,\" she says. \"Fair question. Most of what I do is on my own terms.\"", options:[
        {label:"Ask what terms would actually convince her.", reaction:"She actually thinks about that one instead of deflecting it.", next:"n9"},
        {label:"Ask if she's fought for anyone before and why it ended.", reaction:"\"I fought for a small operation once, out past the old rail yards,\" she says.", next:"n9"},
        {label:"Ask what she'd want out of it, beyond creds.", reaction:"\"Not to be lied to,\" she says, simply. \"That's most of it.\"", next:"n9"}
      ]},

      n9:{text:"9.\n\"I fought for a small operation once, out past the old rail yards,\" she says. \"Ended because the person running it started asking me to throw matches for money on the side. I don't do that. Ever. Not for any price.\"", options:[
        {label:"Promise, plainly, the Pit would never ask that.", reaction:"She studies you a beat, weighing whether that's a promise or just a line. \"We'll find out.\"", next:"n10"},
        {label:"Ask how she found out, and what happened after she refused.", reaction:"\"I found out because I overheard him planning it without me,\" she says. \"Refused before he even asked me directly. Left that same night.\"", next:"n10"},
        {label:"Tell her you respect that line completely.", reaction:"\"Everyone says that,\" she says, but there's less edge in it than the words suggest.", next:"n10"}
      ]},

      n10:{text:"10.\n\"I found out because I overheard him planning it without me,\" she says. \"Refused before he even asked me directly. Left that same night.\"", options:[
        {label:"Ask if she's worried the same thing could happen again anywhere else.", reaction:"\"Always,\" she admits, no theatrics in it at all for once.", next:"n11"},
        {label:"Tell her the Pit runs everything straight, no fixed matches, ever.", reaction:"She studies you for a beat, like weighing whether that's a promise or just a line. \"We'll find out.\"", next:"n11"},
        {label:"Ask what finally made her trust anyone again enough to fight for them.", reaction:"\"Nothing has, fully, yet,\" she says. \"Ask me again after tonight.\"", next:"n11"}
      ]},

      n11:{text:"11.\n\"I don't fully trust anyone yet,\" she admits. \"I'm here talking to you because the cards said something worth paying attention to about this conversation specifically. That's not nothing, but it's not a guarantee either.\"", options:[
        {label:"Ask her to explain what the cards actually said.", reaction:"\"They don't work like that,\" she says, half-smiling. \"You don't get the transcript, just the feeling.\"", next:"n13"},
        {label:"Tell her you don't need magic to prove you're trustworthy, just time.", reaction:"She nods slowly, like that's the most honest answer she's gotten all conversation.", next:"n13"},
        {label:"Offer to let her walk away right now, no hard feelings, if that's easier.", reaction:"She actually pauses at that, like the offer itself told her something. \"That's a strange thing to say to someone you're trying to recruit.\"", next:"n12"}
      ]},

      n12:{text:"12.\nShe actually pauses at that, like the offer itself told her something. \"That's a strange thing to say to someone you're trying to recruit.\"", options:[
        {label:"Tell her you meant it. Pressure doesn't build trust.", reaction:"Something shifts in how she's looking at you, less like a stranger, more like someone worth actually considering.", next:"n13"},
        {label:"Backtrack slightly, say you just want her to feel comfortable either way.", reaction:"She accepts the backtrack easily enough, though something about the first version of the offer clearly landed harder.", next:"n13"}
      ]},

      n13:{text:"13.\nWhatever you said, something shifts in how she's looking at you, less like a stranger, more like someone worth actually considering.", options:[
        {label:"Ask her, now, to do one more real test, your choice this time.", reaction:"She raises an eyebrow, curious what you'll actually ask for.", next:"n15"},
        {label:"Skip further testing, ask directly if she's in.", reaction:"\"Not quite yet,\" she says, \"but close.\"", next:"n15"},
        {label:"Ask what she'd want to test about you, in return, before deciding.", reaction:"She likes that question more than any other you've asked.", next:"n14"}
      ]},

      n14:{text:"14.\n\"Fine. Tell me, honestly, the worst decision you've made running the Pit so far. Not the safest answer. The real one.\"", options:[
        {label:"Tell her something honest, even if it's not flattering.", reaction:"She nods slowly, turning it over like another card in a reading only she can see. \"That's the kind of honesty I was hoping the cards weren't wrong about.\"", next:"n15", effect:(s)=>{s.flags.add("nkiru_honest_confession");}},
        {label:"Deflect, give her a safer answer instead.", reaction:"She notices the deflection immediately, and something in her expression closes off, just slightly, though the conversation continues.", next:"n15"}
      ]},

      n15:{text:"15.\nWhatever the path here, she nods slowly, turning something over like another card only she can see.\n\n\"Alright,\" she says. \"That's the kind of honesty I was hoping the cards weren't wrong about.\"", options:[
        {label:"Ask if that means she's decided.", reaction:"\"Mostly,\" she says, which is more than she's given you all conversation.", next:"n16"},
        {label:"Ask what specifically convinced her.", reaction:"She considers the question seriously instead of deflecting with theater.", next:"n16"},
        {label:"Wait for her to say it in her own time.", reaction:"She takes her time, and eventually does.", next:"n16"}
      ]},

      n16:{text:"16.\n\"Mostly decided,\" she says. \"One more thing. Not a test, exactly. Just curiosity. Why fighters, specifically. Why not run something safer.\"", options:[
        {label:"Answer honestly about why you chose this life.", reaction:"She listens all the way through, satisfied more by the honesty of it than the content.", next:"n17"},
        {label:"Turn the question back on her instead.", reaction:"She laughs, delighted, and actually answers her own question honestly before you can stop her. \"Fair enough, I'll go first then.\"", next:"n17"},
        {label:"Admit you're not entirely sure yourself.", reaction:"She nods slowly, like the uncertainty itself told her something true.", next:"n17"}
      ]},

      n17:{text:"17.\nWhatever the answer, she seems satisfied by the honesty of it more than the content, same pattern as everything else in this whole conversation.", options:[
        {label:"Ask, plainly, if she's ready to commit.", reaction:"She holds your gaze a moment before answering.", next:"decision"},
        {label:"Offer her a final moment to consult her cards if she wants.", reaction:"She actually laughs at the offer. \"You're learning.\"", next:"n18"}
      ]},

      n18:{text:"18.\nShe flips one last card anyway, just for herself this time, not for show.\n\n\"Good enough,\" she says, whatever the card showed. \"I'm in.\"", options:[
        {label:"Take that as your answer and move to the decision.", reaction:"Neither of you needs to say anything else about it.", next:"decision"}
      ]},

      decision:{text:"19.\nWhichever path got here, the moment settles into something quieter than the theatrical opening suggested it would.\n\nRECRUIT DECISION", isDecision:true, options:[
        {label:"Bring her into the Pit.", recruit:true, effect:(s)=>{addFighter(s,"Nkiru","Superstitious","nkiru_warned_by_cards");}, resultText:"20.\nNkiru joins the roster. Trait: Superstitious. Flag set: \"warned the player about something the cards saw,\" which can be referenced later if a genuinely bad outcome eventually happens to the player, treated as a quiet callback rather than literal prophecy."},
        {label:"Thank her for her honesty, but pass.", recruit:false, effect:(s)=>{s.flags.add("declined_nkiru");}, resultText:"20.\nShe shrugs, unbothered, says the cards probably already knew this would happen anyway. Flag set: \"declined Nkiru,\" leaving her independent and possibly recruitable again later."}
      ]}
    }
  }
};

/* ---------------------------------------------------------------------
   STATE
   --------------------------------------------------------------------- */
let STATE = freshState(); // initialized at boot — connect() overwrites fate with the server value ("server wins")

let LB_CACHE = [];
let PLAYER_ID = null;
let MATCH_LOG = []; // settled-market history — persists across games (Market Log)

// Load the persistent match log once at boot (independent of the game save).
try{ Persist.getMatchLog().then(log => { if(Array.isArray(log)) MATCH_LOG = log; }); }catch(e){}

function freshState(){
  return {
    fate: 250,
    roster: [],
    rel: {calloway:0, kestrel:0, marsh:0, juno:0},
    flags: new Set(),
    lastEvents: [],
    scenesResolved: {bram:false, corvin:false, nkiru:false},
    sceneNode: null, // {sceneId, nodeId}
    pendingEventId: null,
    pendingRecruitSceneId: null,
    winStreak: 0,
    lossStreak: 0,
    totalFights: 0, wins: 0, losses: 0,
    /* Market-decided matches: pending waits on the pinned DreamDEX market;
       history is the verifiable market log (Market Log screen). */
    pendingMatches: [],
    matchHistory: [],
    turn: 1,
    started:true
  };
}
function serializeState(s){
  return JSON.stringify({...s, flags:[...s.flags]});
}
function deserializeState(obj){
  obj.flags = new Set(obj.flags||[]);
  return obj;
}

/* ---------------------------------------------------------------------
   RENDER ROOT
   --------------------------------------------------------------------- */
