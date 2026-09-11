/* ---------------------------------------------------------------------
   Audio manager — BGM + SFX.
   BGM autoloops continuously (loop = true). Three tracks bundled with the
   game in /public/assets/audio, driven by the persisted SETTINGS.
   Sound effects (bell) mix on top when soundOn is true.
   --------------------------------------------------------------------- */
const AudioMgr = {
  assets: {
    wardrums:   "./public/assets/audio/wardrums.mp3",
    synthwave:  "./public/assets/audio/synthwave.mp3",
    lofi:       "./public/assets/audio/lofi.mp3",
    bell:       "./public/assets/audio/bell.mp3",
  },
  /* Ensure SETTINGS (declared in state.js) is applied to any existing player.
     SETTINGS is a plain global created before this file runs (state.js loads
     first), so we can rely on it directly. */
  bgm: null,
  bell: null,

  ensureAudio(){
    try{
      if(!this.bgm)  this.bgm  = new Audio();
      if(!this.bell) this.bell = new Audio();
    }catch(e){ /* Audio may be unavailable in some contexts; degrade silently */ }
  },

  /* Start looping the selected BGM track. Always autoloop. */
  async playBGM(track){
    this.ensureAudio();
    if(!track || track==="none"){ this.stopBGM(); return; }
    const src = this.assets[track];
    if(!src){ this.stopBGM(); return; }
    // Stop current BGM before switching track.
    this.stopBGM();
    try{
      this.bgm.src = src;
      this.bgm.loop = true;
      this.bgm.volume = SETTINGS.volume;
      this.bgm.play().catch(()=>{});
    }catch(e){ /* degrade silently */ }
  },

  stopBGM(){
    if(this.bgm){
      try{ this.bgm.pause(); this.bgm.currentTime = 0; }catch(e){}
    }
  },

  /* Ring the bell once — 0.05s cap so it can't overlap into a mess. */
  playBell(){
    if(!SETTINGS.soundOn) return;
    this.ensureAudio();
    try{
      this.bell.src = this.assets.bell;
      this.bell.volume = Math.max(SETTINGS.volume * 1.4, 0.9);
      this.bell.loop = false;
      this.bell.currentTime = 0;
      this.bell.play().catch(()=>{});
    }catch(e){ /* degrade silently */ }
  },
};