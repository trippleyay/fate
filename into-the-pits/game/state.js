/* =========================================================================
   FATE: INTO THE PITS
   Single-file terminal-styled build per PITS_FULL_SPEC.md + PITS_BUILD_GUIDE.md
   Fate icon: public/assets/fate-icon.png (pixel "F") — favicon: public/favicon.ico/.png.
   ========================================================================= */

/* ---------------------------------------------------------------------
   ASSET: TITLE BANNER (verbatim ANSI->HTML export, from INTO-THE-PITS.html)
   --------------------------------------------------------------------- */
const TITLE_BANNER_HTML = `<pre style="font-family:'Courier New',Courier,monospace;font-size:12px;line-height:1.17;white-space:pre;background-color:#000;color:#fff;padding:8px;margin:0;"><span style="color:#FF5555;background-color:#AA0000">     </span><span style="color:#AA0000">▀</span><span style="color:#FF5555;background-color:#AA0000">  </span><span style="color:#AAAAAA">  </span><span style="color:#AA0000">▄</span><span style="color:#FF5555;background-color:#AA0000">   </span><span style="color:#AA0000">▀▄</span><span style="color:#AAAAAA">  </span><span style="color:#AA0000">██▀</span><span style="color:#FF5555;background-color:#AA0000">     </span><span style="color:#AA0000">▀</span><span style="color:#FF5555;background-color:#AA0000">  </span><span style="color:#AAAAAA"> </span><span style="color:#FF5555;background-color:#AA0000">     </span><span style="color:#AA0000">▀</span><span style="color:#FF5555;background-color:#AA0000">  </span><span style="color:#AAAAAA">      </span><span style="color:#FF5555;background-color:#AA0000">     </span><span style="color:#AAAAAA">  </span><span style="color:#AA0000">▄</span><span style="color:#FF5555;background-color:#AA0000">   </span><span style="color:#AA0000">▀▄</span><span style="color:#AAAAAA">  </span><span style="color:#AA0000">██▀</span><span style="color:#FF5555;background-color:#AA0000">     </span><span style="color:#AA0000">▀</span><span style="color:#FF5555;background-color:#AA0000">  </span><span style="color:#AAAAAA">  </span><span style="color:#AA0000">▄</span><span style="color:#FF5555;background-color:#AA0000">   </span><span style="color:#AA0000">▀▄</span><span style="color:#AAAAAA">       </span><span style="color:#AA0000">██▀</span><span style="color:#FF5555;background-color:#AA0000">     </span><span style="color:#AA0000">▀</span><span style="color:#FF5555;background-color:#AA0000">  </span><span style="color:#AAAAAA"> </span><span style="color:#AA0000">██</span><span style="color:#FF5555;background-color:#AA0000">   </span><span style="color:#AAAAAA"> </span><span style="color:#AA0000">██</span><span style="color:#AAAAAA"> </span><span style="color:#FF5555;background-color:#AA0000">     </span><span style="color:#AA0000">▀</span><span style="color:#FF5555;background-color:#AA0000">  </span><span style="color:#AAAAAA">      </span><span style="color:#FF5555;background-color:#AA0000">     </span><span style="color:#AA0000">▀▄</span><span style="color:#AAAAAA">  </span><span style="color:#FF5555;background-color:#AA0000">     </span><span style="color:#AAAAAA"> </span><span style="color:#AA0000">██▀</span><span style="color:#FF5555;background-color:#AA0000">     </span><span style="color:#AA0000">▀</span><span style="color:#FF5555;background-color:#AA0000">  </span><span style="color:#AAAAAA">  </span><span style="color:#AA0000">▄</span><span style="color:#FF5555;background-color:#AA0000">   </span><span style="color:#AA0000">▀▄</span><span style="color:#AAAAAA"> </span>
<span style="color:#FF5555;background-color:#AA0000">   ░░</span><span style="color:#AA0000">▄▄</span><span style="color:#AAAAAA">  </span><span style="color:#AA0000">▐</span><span style="color:#FF5555;background-color:#AA0000">  ░░</span><span style="color:#AA0000">▄</span><span style="color:#FF5555;background-color:#AA0000"> </span><span style="color:#AA0000">▌</span><span style="color:#AAAAAA">    </span><span style="color:#FF5555;background-color:#AA0000">   ░░</span><span style="color:#AAAAAA">    </span><span style="color:#FF5555;background-color:#AA0000">   ░░</span><span style="color:#AA0000">▄▄</span><span style="color:#AAAAAA">       </span><span style="color:#FF5555;background-color:#AA0000">   ░░</span><span style="color:#AAAAAA"> </span><span style="color:#AA0000">▐</span><span style="color:#FF5555;background-color:#AA0000">  ░░</span><span style="color:#AAAAAA"> </span><span style="color:#FF5555;background-color:#AA0000"> </span><span style="color:#AA0000">▌</span><span style="color:#AAAAAA">    </span><span style="color:#FF5555;background-color:#AA0000">   ░░</span><span style="color:#AAAAAA">    </span><span style="color:#AA0000">▐</span><span style="color:#FF5555;background-color:#AA0000">  ░░</span><span style="color:#AAAAAA"> </span><span style="color:#FF5555;background-color:#AA0000"> </span><span style="color:#AA0000">▌</span><span style="color:#AAAAAA">         </span><span style="color:#FF5555;background-color:#AA0000">   ░░</span><span style="color:#AAAAAA">    </span><span style="color:#AA0000">█</span><span style="color:#FF5555;background-color:#AA0000">  ░░</span><span style="color:#AA0000">▄</span><span style="color:#FF5555;background-color:#AA0000"> </span><span style="color:#AA0000">█</span><span style="color:#AAAAAA"> </span><span style="color:#FF5555;background-color:#AA0000">   ░░</span><span style="color:#AA0000">▄▄</span><span style="color:#AAAAAA">       </span><span style="color:#FF5555;background-color:#AA0000">   ░░</span><span style="color:#AAAAAA"> </span><span style="color:#FF5555;background-color:#AA0000"> </span><span style="color:#AA0000">▌</span><span style="color:#AAAAAA"> </span><span style="color:#FF5555;background-color:#AA0000">   ░░</span><span style="color:#AAAAAA">    </span><span style="color:#FF5555;background-color:#AA0000">   ░░</span><span style="color:#AAAAAA">    </span><span style="color:#AA0000">▐</span><span style="color:#FF5555;background-color:#AA0000">  ░░</span><span style="color:#AAAAAA"> </span><span style="color:#FF5555;background-color:#AA0000"> </span><span style="color:#AA0000">▌</span>
<span style="color:#FF5555;background-color:#AA0000"> ░░▒▒</span><span style="color:#AAAAAA">    </span><span style="color:#FF5555;background-color:#AA0000"> ░░▒▒</span><span style="color:#AAAAAA"> </span><span style="color:#FF5555;background-color:#AA0000">░▒</span><span style="color:#AAAAAA">    </span><span style="color:#FF5555;background-color:#AA0000"> ░░▒▒</span><span style="color:#AAAAAA">    </span><span style="color:#FF5555;background-color:#AA0000"> ░░▒▒</span><span style="color:#AAAAAA">         </span><span style="color:#FF5555;background-color:#AA0000"> ░░▒▒</span><span style="color:#AAAAAA"> </span><span style="color:#FF5555;background-color:#AA0000"> ░░▒▒</span><span style="color:#AAAAAA"> </span><span style="color:#FF5555;background-color:#AA0000">░▒</span><span style="color:#AAAAAA">    </span><span style="color:#FF5555;background-color:#AA0000"> ░░▒▒</span><span style="color:#AAAAAA">    </span><span style="color:#FF5555;background-color:#AA0000"> ░░▒▒</span><span style="color:#AAAAAA"> </span><span style="color:#FF5555;background-color:#AA0000">░▒</span><span style="color:#AAAAAA">         </span><span style="color:#FF5555;background-color:#AA0000"> ░░▒▒</span><span style="color:#AAAAAA">    </span><span style="color:#FF5555;background-color:#AA0000"> ░░▒▒</span><span style="color:#AAAAAA"> </span><span style="color:#FF5555;background-color:#AA0000">░▒</span><span style="color:#AAAAAA"> </span><span style="color:#FF5555;background-color:#AA0000"> ░░▒▒</span><span style="color:#AAAAAA">         </span><span style="color:#FF5555;background-color:#AA0000"> ░░▒▒</span><span style="color:#AAAAAA"> </span><span style="color:#FF5555;background-color:#AA0000">░▒</span><span style="color:#AAAAAA"> </span><span style="color:#FF5555;background-color:#AA0000"> ░░▒▒</span><span style="color:#AAAAAA">    </span><span style="color:#FF5555;background-color:#AA0000"> ░░▒▒</span><span style="color:#AAAAAA">    </span><span style="color:#AA0000">█</span><span style="color:#FF5555;background-color:#AA0000">░░▒▒</span><span style="color:#AAAAAA"> </span><span style="color:#FF5555;background-color:#AA0000">░▒</span>
<span style="color:#FF5555;background-color:#AA0000">░▒▒▓▓</span><span style="color:#AAAAAA">    </span><span style="color:#FF5555;background-color:#AA0000">░▒▒▓▓</span><span style="color:#AAAAAA"> </span><span style="color:#FF5555;background-color:#AA0000">▒▓</span><span style="color:#AAAAAA">    </span><span style="color:#FF5555;background-color:#AA0000">░▒▒▓▓</span><span style="color:#AAAAAA">    </span><span style="color:#FF5555;background-color:#AA0000">░▒▒▓▓</span><span style="color:#AAAAAA">         </span><span style="color:#FF5555;background-color:#AA0000">░▒▒▓▓</span><span style="color:#AAAAAA"> </span><span style="color:#FF5555;background-color:#AA0000">░▒▒▓▓</span><span style="color:#AAAAAA"> </span><span style="color:#FF5555;background-color:#AA0000">▒▓</span><span style="color:#AAAAAA">    </span><span style="color:#FF5555;background-color:#AA0000">░▒▒▓▓</span><span style="color:#AAAAAA">    </span><span style="color:#FF5555;background-color:#AA0000">░▒▒▓▓</span><span style="color:#AAAAAA"> </span><span style="color:#FF5555;background-color:#AA0000">▒▓</span><span style="color:#AAAAAA">         </span><span style="color:#FF5555;background-color:#AA0000">░▒▒▓▓</span><span style="color:#AAAAAA">    </span><span style="color:#FF5555;background-color:#AA0000">░▒▒▓▓</span><span style="color:#AAAAAA"> </span><span style="color:#FF5555;background-color:#AA0000">▒▓</span><span style="color:#AAAAAA"> </span><span style="color:#FF5555;background-color:#AA0000">░▒▒▓▓</span><span style="color:#AAAAAA">         </span><span style="color:#FF5555;background-color:#AA0000">░▒▒▓▓</span><span style="color:#AAAAAA"> </span><span style="color:#FF5555;background-color:#AA0000">▒▓</span><span style="color:#AAAAAA"> </span><span style="color:#FF5555;background-color:#AA0000">░▒▒▓▓</span><span style="color:#AAAAAA">    </span><span style="color:#FF5555;background-color:#AA0000">░▒▒▓▓</span><span style="color:#AAAAAA">    </span><span style="color:#FF5555;background-color:#AA0000">░▒▒▓▓</span><span style="color:#AAAAAA"> </span><span style="color:#FF5555;background-color:#AA0000">▒▓</span>
<span style="color:#FF5555;background-color:#AA0000">▒▓▓</span><span style="color:#FF5555">█▀</span><span style="color:#AAAAAA">    </span><span style="color:#FF5555;background-color:#AA0000">▒▓▓</span><span style="color:#FF5555">█▀</span><span style="color:#AAAAAA"> </span><span style="color:#FF5555;background-color:#AA0000">▓</span><span style="color:#FF5555">█</span><span style="color:#AAAAAA">    </span><span style="color:#FF5555;background-color:#AA0000">▒▓▓</span><span style="color:#FF5555">█▀</span><span style="color:#AAAAAA">    </span><span style="color:#FF5555;background-color:#AA0000">▒▓▓</span><span style="color:#FF5555">█▀</span><span style="color:#AAAAAA">         </span><span style="color:#FF5555;background-color:#AA0000">▒▓▓</span><span style="color:#FF5555">█▀</span><span style="color:#AAAAAA"> </span><span style="color:#FF5555;background-color:#AA0000">▒▓▓</span><span style="color:#FF5555">█▀</span><span style="color:#AAAAAA"> </span><span style="color:#FF5555;background-color:#AA0000">▓</span><span style="color:#FF5555">█</span><span style="color:#AAAAAA">    </span><span style="color:#FF5555;background-color:#AA0000">▒▓▓</span><span style="color:#FF5555">█▀</span><span style="color:#AAAAAA">    </span><span style="color:#FF5555;background-color:#AA0000">▒▓▓</span><span style="color:#FF5555">█▀</span><span style="color:#AAAAAA"> </span><span style="color:#FF5555;background-color:#AA0000">▓</span><span style="color:#FF5555">█</span><span style="color:#AAAAAA">         </span><span style="color:#FF5555;background-color:#AA0000">▒▓▓</span><span style="color:#FF5555">█▀</span><span style="color:#AAAAAA">    </span><span style="color:#FF5555;background-color:#AA0000">▒▓▓</span><span style="color:#FF5555">█▀</span><span style="color:#AAAAAA"> </span><span style="color:#FF5555;background-color:#AA0000">▓</span><span style="color:#FF5555">█</span><span style="color:#AAAAAA"> </span><span style="color:#FF5555;background-color:#AA0000">▒▓▓</span><span style="color:#FF5555">█▀</span><span style="color:#AAAAAA">         </span><span style="color:#FF5555;background-color:#AA0000">▒▓▓█</span><span style="color:#FF5555">▀</span><span style="color:#AA5500">▄</span><span style="color:#FF5555;background-color:#AA0000">▓</span><span style="color:#FF5555">▀</span><span style="color:#AAAAAA"> </span><span style="color:#FF5555;background-color:#AA0000">▒▓▓</span><span style="color:#FF5555">█▀</span><span style="color:#AAAAAA">    </span><span style="color:#FF5555;background-color:#AA0000">▒▓▓</span><span style="color:#FF5555">█▀</span><span style="color:#AAAAAA">    </span><span style="color:#FF5555">▐</span><span style="color:#FF5555;background-color:#AA0000">▓▓</span><span style="color:#FF5555">█▀▄</span><span style="color:#AAAAAA"> </span><span style="color:#FF5555">▀</span>
<span style="color:#FF5555;background-color:#AA0000">▓</span><span style="color:#FF5555">█▀</span><span style="color:#AA5500">▄█</span><span style="color:#AAAAAA">    </span><span style="color:#FF5555;background-color:#AA0000">▓</span><span style="color:#FF5555">█▀</span><span style="color:#AA5500">▄█</span><span style="color:#AAAAAA"> </span><span style="color:#FF5555">▀</span><span style="color:#AA5500">▄</span><span style="color:#AAAAAA">    </span><span style="color:#FF5555;background-color:#AA0000">▓</span><span style="color:#FF5555">█▀</span><span style="color:#AA5500">▄█</span><span style="color:#AAAAAA">    </span><span style="color:#FF5555;background-color:#AA0000">▓</span><span style="color:#FF5555">█▀</span><span style="color:#AA5500">▄█</span><span style="color:#AAAAAA">         </span><span style="color:#FF5555;background-color:#AA0000">▓</span><span style="color:#FF5555">█▀</span><span style="color:#AA5500">▄█</span><span style="color:#AAAAAA"> </span><span style="color:#FF5555;background-color:#AA0000">▓</span><span style="color:#FF5555">█▀</span><span style="color:#AA5500">▄█</span><span style="color:#AAAAAA"> </span><span style="color:#FF5555">▀</span><span style="color:#AA5500">▄</span><span style="color:#AAAAAA">    </span><span style="color:#FF5555;background-color:#AA0000">▓</span><span style="color:#FF5555">█▀</span><span style="color:#AA5500">▄█</span><span style="color:#AAAAAA">    </span><span style="color:#FF5555;background-color:#AA0000">▓</span><span style="color:#FF5555">█▀</span><span style="color:#AA5500">▄█</span><span style="color:#AAAAAA"> </span><span style="color:#FF5555">▀</span><span style="color:#AA5500">▄</span><span style="color:#AAAAAA">         </span><span style="color:#FF5555;background-color:#AA0000">▓</span><span style="color:#FF5555">█▀</span><span style="color:#AA5500">▄█</span><span style="color:#AAAAAA">    </span><span style="color:#FF5555;background-color:#AA0000">▓</span><span style="color:#FF5555">█▀</span><span style="color:#AA5500">▄█</span><span style="color:#AAAAAA"> </span><span style="color:#FF5555">▀</span><span style="color:#AA5500">▄</span><span style="color:#AAAAAA"> </span><span style="color:#FF5555;background-color:#AA0000">▓</span><span style="color:#FF5555">█▀</span><span style="color:#AA5500">▄█</span><span style="color:#AAAAAA">         </span><span style="color:#FF5555;background-color:#AA0000">▓█</span><span style="color:#FF5555">▀</span><span style="color:#AA5500">▄</span><span style="color:#FF5555;background-color:#AA5500">▄</span><span style="color:#FF5555">▀</span><span style="color:#AAAAAA">   </span><span style="color:#FF5555;background-color:#AA0000">▓</span><span style="color:#FF5555">█▀</span><span style="color:#AA5500">▄█</span><span style="color:#AAAAAA">    </span><span style="color:#FF5555;background-color:#AA0000">▓</span><span style="color:#FF5555">█▀</span><span style="color:#AA5500">▄█</span><span style="color:#AAAAAA">     </span><span style="color:#FF5555">▀▀</span><span style="color:#AA5500">▄</span><span style="color:#AAAAAA">  </span><span style="color:#AA5500">▀▄</span>
<span style="color:#FF5555">▀</span><span style="color:#AA5500">▄█</span><span style="color:#FFFF55;background-color:#AA5500">░░</span><span style="color:#AAAAAA">    </span><span style="color:#FF5555">▀</span><span style="color:#AA5500">▄█</span><span style="color:#FFFF55;background-color:#AA5500">░░</span><span style="color:#AAAAAA"> </span><span style="color:#AA5500">█</span><span style="color:#FFFF55;background-color:#AA5500">░</span><span style="color:#AAAAAA">    </span><span style="color:#FF5555">▀</span><span style="color:#AA5500">▄█</span><span style="color:#FFFF55;background-color:#AA5500">░░</span><span style="color:#AAAAAA">    </span><span style="color:#FF5555">▀</span><span style="color:#AA5500">▄█</span><span style="color:#FFFF55;background-color:#AA5500">░░</span><span style="color:#AAAAAA">         </span><span style="color:#FF5555">▀</span><span style="color:#AA5500">▄█</span><span style="color:#FFFF55;background-color:#AA5500">░░</span><span style="color:#AAAAAA"> </span><span style="color:#FF5555">▀</span><span style="color:#AA5500">▄█</span><span style="color:#FFFF55;background-color:#AA5500">░░</span><span style="color:#AAAAAA"> </span><span style="color:#AA5500">█</span><span style="color:#FFFF55;background-color:#AA5500">░</span><span style="color:#AAAAAA">    </span><span style="color:#FF5555">▀</span><span style="color:#AA5500">▄█</span><span style="color:#FFFF55;background-color:#AA5500">░░</span><span style="color:#AAAAAA">    </span><span style="color:#FF5555">▀</span><span style="color:#AA5500">▄█</span><span style="color:#FFFF55;background-color:#AA5500">░░</span><span style="color:#AAAAAA"> </span><span style="color:#AA5500">█</span><span style="color:#FFFF55;background-color:#AA5500">░</span><span style="color:#AAAAAA">         </span><span style="color:#FF5555">▀</span><span style="color:#AA5500">▄█</span><span style="color:#FFFF55;background-color:#AA5500">░░</span><span style="color:#AAAAAA">    </span><span style="color:#FF5555">▀</span><span style="color:#AA5500">▄█</span><span style="color:#FFFF55;background-color:#AA5500">░░</span><span style="color:#AAAAAA"> </span><span style="color:#AA5500">█</span><span style="color:#FFFF55;background-color:#AA5500">░</span><span style="color:#AAAAAA"> </span><span style="color:#FF5555">▀</span><span style="color:#AA5500">▄█</span><span style="color:#FFFF55;background-color:#AA5500">░░</span><span style="color:#AAAAAA">         </span><span style="color:#FF5555">▀</span><span style="color:#AA5500">▄█</span><span style="color:#FFFF55;background-color:#AA5500">░░</span><span style="color:#AAAAAA">    </span><span style="color:#FF5555">▀</span><span style="color:#AA5500">▄█</span><span style="color:#FFFF55;background-color:#AA5500">░░</span><span style="color:#AAAAAA">    </span><span style="color:#FF5555">▀</span><span style="color:#AA5500">▄█</span><span style="color:#FFFF55;background-color:#AA5500">░░</span><span style="color:#AAAAAA">     </span><span style="color:#AA5500">▄█</span><span style="color:#FFFF55;background-color:#AA5500">░░</span><span style="color:#AAAAAA"> </span><span style="color:#AA5500">█</span><span style="color:#FFFF55;background-color:#AA5500">░</span>
<span style="color:#AA5500">█</span><span style="color:#FFFF55;background-color:#AA5500">░░▒▒</span><span style="color:#AAAAAA">    </span><span style="color:#AA5500">█</span><span style="color:#FFFF55;background-color:#AA5500">░░▒▒</span><span style="color:#AAAAAA"> </span><span style="color:#FFFF55;background-color:#AA5500">░▒</span><span style="color:#AAAAAA">    </span><span style="color:#AA5500">█</span><span style="color:#FFFF55;background-color:#AA5500">░░▒▒</span><span style="color:#AAAAAA">    </span><span style="color:#AA5500">█</span><span style="color:#FFFF55;background-color:#AA5500">░░▒▒</span><span style="color:#AAAAAA">         </span><span style="color:#AA5500">█</span><span style="color:#FFFF55;background-color:#AA5500">░░▒▒</span><span style="color:#AAAAAA"> </span><span style="color:#AA5500">█</span><span style="color:#FFFF55;background-color:#AA5500">░░▒▒</span><span style="color:#AAAAAA"> </span><span style="color:#FFFF55;background-color:#AA5500">░▒</span><span style="color:#AAAAAA">    </span><span style="color:#AA5500">█</span><span style="color:#FFFF55;background-color:#AA5500">░░▒▒</span><span style="color:#AAAAAA">    </span><span style="color:#AA5500">█</span><span style="color:#FFFF55;background-color:#AA5500">░░▒▒</span><span style="color:#AAAAAA"> </span><span style="color:#FFFF55;background-color:#AA5500">░▒</span><span style="color:#AAAAAA">         </span><span style="color:#AA5500">█</span><span style="color:#FFFF55;background-color:#AA5500">░░▒▒</span><span style="color:#AAAAAA">    </span><span style="color:#AA5500">█</span><span style="color:#FFFF55;background-color:#AA5500">░░▒▒</span><span style="color:#AAAAAA"> </span><span style="color:#FFFF55;background-color:#AA5500">░▒</span><span style="color:#AAAAAA"> </span><span style="color:#AA5500">█</span><span style="color:#FFFF55;background-color:#AA5500">░░▒▒</span><span style="color:#AAAAAA">         </span><span style="color:#AA5500">█</span><span style="color:#FFFF55;background-color:#AA5500">░░▒▒</span><span style="color:#AAAAAA">    </span><span style="color:#AA5500">█</span><span style="color:#FFFF55;background-color:#AA5500">░░▒▒</span><span style="color:#AAAAAA">    </span><span style="color:#AA5500">█</span><span style="color:#FFFF55;background-color:#AA5500">░░▒▒</span><span style="color:#AAAAAA">    </span><span style="color:#AA5500">█</span><span style="color:#FFFF55;background-color:#AA5500">░░▒▒</span><span style="color:#AAAAAA"> </span><span style="color:#FFFF55;background-color:#AA5500">░▒</span>
<span style="color:#FFFF55;background-color:#AA5500">░▒▒▓▓</span><span style="color:#AAAAAA">    </span><span style="color:#FFFF55;background-color:#AA5500">░▒▒▓▓</span><span style="color:#AAAAAA"> </span><span style="color:#FFFF55;background-color:#AA5500">▒▓</span><span style="color:#AAAAAA">    </span><span style="color:#FFFF55;background-color:#AA5500">░▒▒▓▓</span><span style="color:#AAAAAA">    </span><span style="color:#FFFF55;background-color:#AA5500">░▒▒▓▓</span><span style="color:#AAAAAA">         </span><span style="color:#FFFF55;background-color:#AA5500">░▒▒▓▓</span><span style="color:#AAAAAA"> </span><span style="color:#FFFF55;background-color:#AA5500">░▒▒▓▓</span><span style="color:#AAAAAA"> </span><span style="color:#FFFF55;background-color:#AA5500">▒▓</span><span style="color:#AAAAAA">    </span><span style="color:#FFFF55;background-color:#AA5500">░▒▒▓▓</span><span style="color:#AAAAAA">    </span><span style="color:#FFFF55;background-color:#AA5500">░▒▒▓▓</span><span style="color:#AAAAAA"> </span><span style="color:#FFFF55;background-color:#AA5500">▒▓</span><span style="color:#AAAAAA">         </span><span style="color:#FFFF55;background-color:#AA5500">░▒▒▓▓</span><span style="color:#AAAAAA">    </span><span style="color:#FFFF55;background-color:#AA5500">░▒▒▓▓</span><span style="color:#AAAAAA"> </span><span style="color:#FFFF55;background-color:#AA5500">▒▓</span><span style="color:#AAAAAA"> </span><span style="color:#FFFF55;background-color:#AA5500">░▒▒▓▓</span><span style="color:#AAAAAA">         </span><span style="color:#FFFF55;background-color:#AA5500">░▒▒▓▓</span><span style="color:#AAAAAA">    </span><span style="color:#FFFF55;background-color:#AA5500">░▒▒▓▓</span><span style="color:#AAAAAA">    </span><span style="color:#FFFF55;background-color:#AA5500">░▒▒▓▓</span><span style="color:#AAAAAA">    </span><span style="color:#FFFF55;background-color:#AA5500">░▒▒▓▓</span><span style="color:#AAAAAA"> </span><span style="color:#FFFF55;background-color:#AA5500">▒▓</span>
<span style="color:#FFFF55;background-color:#AA5500">▒▓▓██</span><span style="color:#AAAAAA">    </span><span style="color:#FFFF55;background-color:#AA5500">▒▓▓██</span><span style="color:#AAAAAA"> </span><span style="color:#FFFF55;background-color:#AA5500">▓</span><span style="color:#FFFF55">█</span><span style="color:#AAAAAA">    </span><span style="color:#FFFF55;background-color:#AA5500">▒▓▓██</span><span style="color:#AAAAAA">    </span><span style="color:#FFFF55;background-color:#AA5500">▒▓▓██</span><span style="color:#AAAAAA">         </span><span style="color:#FFFF55;background-color:#AA5500">▒▓▓██</span><span style="color:#AAAAAA"> </span><span style="color:#FFFF55">█</span><span style="color:#FFFF55;background-color:#AA5500">▓▓██</span><span style="color:#AAAAAA"> </span><span style="color:#FFFF55;background-color:#AA5500">▓</span><span style="color:#FFFF55">█</span><span style="color:#AAAAAA">    </span><span style="color:#FFFF55;background-color:#AA5500">▒▓▓██</span><span style="color:#AAAAAA">    </span><span style="color:#FFFF55">▐</span><span style="color:#FFFF55;background-color:#AA5500">▓▓██</span><span style="color:#AAAAAA"> </span><span style="color:#FFFF55;background-color:#AA5500">▓</span><span style="color:#FFFF55">▌</span><span style="color:#AAAAAA">         </span><span style="color:#FFFF55;background-color:#AA5500">▒▓▓██</span><span style="color:#AAAAAA">    </span><span style="color:#FFFF55;background-color:#AA5500">▒▓▓██</span><span style="color:#AAAAAA"> </span><span style="color:#FFFF55;background-color:#AA5500">▓</span><span style="color:#FFFF55">█</span><span style="color:#AAAAAA"> </span><span style="color:#FFFF55;background-color:#AA5500">▒▓▓██</span><span style="color:#AAAAAA">         </span><span style="color:#FFFF55;background-color:#AA5500">▒▓▓██</span><span style="color:#AAAAAA">    </span><span style="color:#FFFF55;background-color:#AA5500">▒▓▓██</span><span style="color:#AAAAAA">    </span><span style="color:#FFFF55;background-color:#AA5500">▒▓▓██</span><span style="color:#AAAAAA">    </span><span style="color:#FFFF55">▐</span><span style="color:#FFFF55;background-color:#AA5500">▓▓██</span><span style="color:#AAAAAA"> </span><span style="color:#FFFF55;background-color:#AA5500">▓</span><span style="color:#FFFF55">▌</span>
<span style="color:#FFFF55;background-color:#AA5500">▓████</span><span style="color:#AAAAAA">    </span><span style="color:#FFFF55;background-color:#AA5500">▓████</span><span style="color:#AAAAAA"> </span><span style="color:#FFFF55">██</span><span style="color:#AAAAAA">    </span><span style="color:#FFFF55;background-color:#AA5500">▓████</span><span style="color:#AAAAAA">    </span><span style="color:#FFFF55;background-color:#AA5500">▓████</span><span style="color:#FFFF55">▄██</span><span style="color:#AAAAAA">      </span><span style="color:#FFFF55;background-color:#AA5500">▓████</span><span style="color:#AAAAAA"> </span><span style="color:#FFFF55">██</span><span style="color:#FFFF55;background-color:#AA5500">███</span><span style="color:#AAAAAA"> </span><span style="color:#FFFF55">██</span><span style="color:#AAAAAA">    </span><span style="color:#FFFF55;background-color:#AA5500">▓████</span><span style="color:#AAAAAA">     </span><span style="color:#FFFF55">▀</span><span style="color:#FFFF55;background-color:#AA5500">███</span><span style="color:#FFFF55">▄▀</span><span style="color:#AAAAAA">          </span><span style="color:#FFFF55;background-color:#AA5500">▓████</span><span style="color:#AAAAAA">    </span><span style="color:#FFFF55;background-color:#AA5500">▓████</span><span style="color:#AAAAAA"> </span><span style="color:#FFFF55">██</span><span style="color:#AAAAAA"> </span><span style="color:#FFFF55;background-color:#AA5500">▓████</span><span style="color:#FFFF55">▄██</span><span style="color:#AAAAAA">      </span><span style="color:#FFFF55;background-color:#AA5500">▓████</span><span style="color:#AAAAAA">    </span><span style="color:#FFFF55;background-color:#AA5500">▓████</span><span style="color:#AAAAAA">    </span><span style="color:#FFFF55;background-color:#AA5500">▓████</span><span style="color:#AAAAAA">     </span><span style="color:#FFFF55">▀</span><span style="color:#FFFF55;background-color:#AA5500">███</span><span style="color:#FFFF55">▄▀</span><span style="color:#AAAAAA"> </span></pre>`;

/* ---------------------------------------------------------------------
   ASSETS: mood banners (verbatim from ASCII-TEXTs.txt)
   Block order in source file = FIGHT NIGHT, SIDE BETS, GAME OVER, WIN, LOSE
   --------------------------------------------------------------------- */
const BANNER_FIGHT_NIGHT =
"   ▄████████  ▄█     ▄██████▄     ▄█    █▄        ███          ███▄▄▄▄    ▄█     ▄██████▄     ▄█    █▄        ███     \n"+
"  ███    ███ ███    ███    ███   ███    ███   ▀█████████▄      ███▀▀▀██▄ ███    ███    ███   ███    ███   ▀█████████▄ \n"+
"  ███    █▀  ███▌   ███    █▀    ███    ███      ▀███▀▀██      ███   ███ ███▌   ███    █▀    ███    ███      ▀███▀▀██ \n"+
" ▄███▄▄▄     ███▌  ▄███         ▄███▄▄▄▄███▄▄     ███   ▀      ███   ███ ███▌  ▄███         ▄███▄▄▄▄███▄▄     ███   ▀ \n"+
"▀▀███▀▀▀     ███▌ ▀▀███ ████▄  ▀▀███▀▀▀▀███▀      ███          ███   ███ ███▌ ▀▀███ ████▄  ▀▀███▀▀▀▀███▀      ███     \n"+
"  ███        ███    ███    ███   ███    ███       ███          ███   ███ ███    ███    ███   ███    ███       ███     \n"+
"  ███        ███    ███    ███   ███    ███       ███          ███   ███ ███    ███    ███   ███    ███       ███     \n"+
"  ███        █▀     ████████▀    ███    █▀       ▄████▀         ▀█   █▀  █▀     ████████▀    ███    █▀       ▄████▀   ";

const BANNER_SIDE_BETS =
"   ▄████████  ▄█  ████████▄     ▄████████      ▀█████████▄     ▄████████     ███        ▄████████ \n"+
"  ███    ███ ███  ███   ▀███   ███    ███        ███    ███   ███    ███ ▀█████████▄   ███    ███ \n"+
"  ███    █▀  ███▌ ███    ███   ███    █▀         ███    ███   ███    █▀     ▀███▀▀██   ███    █▀  \n"+
"  ███        ███▌ ███    ███  ▄███▄▄▄           ▄███▄▄▄██▀   ▄███▄▄▄         ███   ▀   ███        \n"+
"▀███████████ ███▌ ███    ███ ▀▀███▀▀▀          ▀▀███▀▀▀██▄  ▀▀███▀▀▀         ███     ▀███████████ \n"+
"         ███ ███  ███    ███   ███    █▄         ███    ██▄   ███    █▄      ███              ███ \n"+
"   ▄█    ███ ███  ███   ▄███   ███    ███        ███    ███   ███    ███     ███        ▄█    ███ \n"+
" ▄████████▀  █▀   ████████▀    ██████████      ▄█████████▀    ██████████    ▄████▀    ▄████████▀  ";

const BANNER_GAME_OVER =
"  ▄████  ▄▄▄       ███▄ ▄███▓▓█████     ▒█████   ██▒   █▓▓█████  ██▀███  \n"+
" ██▒ ▀█▒▒████▄    ▓██▒▀█▀ ██▒▓█   ▀    ▒██▒  ██▒▓██░   █▒▓█   ▀ ▓██ ▒ ██▒\n"+
"▒██░▄▄▄░▒██  ▀█▄  ▓██    ▓██░▒███      ▒██░  ██▒ ▓██  █▒░▒███   ▓██ ░▄█ ▒\n"+
"░▓█  ██▓░██▄▄▄▄██ ▒██    ▒██ ▒▓█  ▄    ▒██   ██░  ▒██ █░░▒▓█  ▄ ▒██▀▀█▄  \n"+
"░▒▓███▀▒ ▓█   ▓██▒▒██▒   ░██▒░▒████▒   ░ ████▓▒░   ▒▀█░  ░▒████▒░██▓ ▒██▒\n"+
" ░▒   ▒  ▒▒   ▓▒█░░ ▒░   ░  ░░░ ▒░ ░   ░ ▒░▒░▒░    ░ ▐░  ░░ ▒░ ░░ ▒▓ ░▒▓░\n"+
"  ░   ░   ▒   ▒▒ ░░  ░      ░ ░ ░  ░     ░ ▒ ▒░    ░ ░░   ░ ░  ░  ░▒ ░ ▒░\n"+
"░ ░   ░   ░   ▒   ░      ░      ░      ░ ░ ░ ▒       ░░     ░     ░░   ░ ";

const BANNER_WIN =
"▗▖ ▗▖▗▄▄▄▖▗▖  ▗▖\n"+
"▐▌ ▐▌  █  ▐▛▚▖▐▌\n"+
"▐▌ ▐▌  █  ▐▌ ▝▜▌\n"+
"▐▙█▟▌▗▄█▄▖▐▌  ▐▌";

const BANNER_LOSE =
"▗▖    ▗▄▖  ▗▄▄▖▗▄▄▄▖\n"+
"▐▌   ▐▌ ▐▌▐▌   ▐▌   \n"+
"▐▌   ▐▌ ▐▌ ▝▀▚▖▐▛▀▀▘\n"+
"▐▙▄▄▖▝▚▄▞▘▗▄▄▞▘▐▙▄▄▖";

/* ---------------------------------------------------------------------
   ASSET: character head portraits (verbatim from CHARACTER_HEADS.md)
   --------------------------------------------------------------------- */
const HEADS = {
  wren:    "   .------.\n  /  .  .  \\\n |     -    |\n  \\  ----  /\n   '------'",
  calloway:"   .------.\n  /  o  o  \\\n |    __   ,)\n  \\_[===]_/\n   '------'",
  sable:   "   .------.\n  / [-][-] \\\n |     .    |\n  \\  ~~~~  /\n   '------'",
  marsh:   "   .------.\n  /; .  . ;\\\n |    ---   |\n  \\  .  .  /\n   '------'",
  juno:    "   .------.\n  /  *  o  \\\n |    \\_/   |\n  \\  ----  /\n   '------'",
  fighter: "   .------.\n  /  o  o  \\\n |     -    |\n  \\  ====  /\n   '------'"
};
const SPEAKER_NAMES = {wren:"WREN", calloway:"CALLOWAY", sable:"SABLE", marsh:"DETECTIVE MARSH", juno:"JUNO", fighter:""};

/* ---------------------------------------------------------------------
   Helpers
   --------------------------------------------------------------------- */
function esc(s){
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}
/* Strip the writer's outline artifacts from scene text. The scripts were kept
   with two kinds of scaffolding that are NOT meant to be shown:
     1. A leading node number ("9.", "10.") on every node.
     2. A leading transition bridge ("Whatever was said,", "Whichever path got
        you here,") at the start of some nodes. ONLY that bridge clause goes —
        the emotional/character detail that follows it is player-facing, since
        this text-only game has no character visuals. */
function cleanSceneText(s){
  if(s==null) return "";
  let out = String(s).replace(/^\d+\.\s+/, "");
  out = out.replace(/^(?:Whatever|Whichever)\b[^,]*,/, "");
  return out;
}
function rand(n){return Math.floor(Math.random()*n);}
function pick(arr){return arr[rand(arr.length)];}
function uid(){return Math.random().toString(36).slice(2,9);}

/* Box-drawing renderer for structural panels (status readout, menus, tables) */
function drawBox(title, lines, minWidth){
  minWidth = minWidth || 34;
  const clean = lines.map(l=>l===null||l===undefined ? "" : String(l));
  let width = minWidth;
  if(title) width = Math.max(width, title.length+4);
  clean.forEach(l=>{ width = Math.max(width, l.length+4); });
  const pad = s => " " + s + " ".repeat(Math.max(0,width-3-s.length)) ;
  const top = "┌" + "─".repeat(width-2) + "┐";
  const bottom = "└" + "─".repeat(width-2) + "┘";
  const sep = "├" + "─".repeat(width-2) + "┤";
  let out = [];
  out.push(top);
  if(title){
    out.push("│"+pad(title)+"│");
    out.push(sep);
  }
  clean.forEach(l=> out.push("│"+pad(l)+"│"));
  out.push(bottom);
  return out.join("\n");
}
function boxHtml(title, lines, minWidth){
  // %%RAW%% segments (pair-wrapped) pass through unescaped, everything between is escaped.
  const smartEsc = (l) => {
    if(!l.includes('%%RAW%%')) return esc(l);
    return l.split('%%RAW%%').map((seg,i)=> i%2===1 ? seg : esc(seg)).join('');
  };
  const raw = drawBox(title, lines.map(smartEsc), minWidth);
  // colorize title line + borders lightly
  const rows = raw.split("\n").map((r,i)=>{
    if(i===0 || i===raw.split("\n").length-1 || (title && i===2)) return '<span class="b-line">'+r+'</span>';
    if(title && i===1) return '<span class="b-title">'+r+'</span>';
    return r;
  });
  return '<pre class="boxpre">'+rows.join("\n")+'</pre>';
}

/* ---------------------------------------------------------------------
   GLOBAL LEADERBOARD BACKEND — Supabase, production-grade (Auth + RLS)
   --------------------------------------------------------------------- */
const SUPABASE_URL = "https://ieplmortssxjiecsaafh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllcGxtb3J0c3N4amllY3NhYWZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3MjcwMTAsImV4cCI6MjEwNDMwMzAxMH0.eyArKBIcA_sMCr7dbfbz-SfW3jzoV7OuueeFLykeqwk";
const SUPABASE_TABLE = "leaderboard";

/* supabase-js client (CDN <script> is loaded just above the main script).
   It only carries the PUBLIC anon key — never the service-role key. RLS is
   enforced by the database on every request, so merely possessing this key
   grants no power beyond a player's OWN row. */
const sb = (typeof supabase!=="undefined" && SUPABASE_URL && SUPABASE_ANON_KEY)
  ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
    })
  : null;
/* The fate-connector module reads the authed client from window.sb
   (window.supabase is only the CDN library namespace — it has no .auth). */
window.sb = sb;
const LEADERBOARD_CONFIGURED = !!sb;

/* HOW CHEATING IS BLOCKED (the production hardening vs. the old wide-open
   "public read / public upsert / public update" build):
   - Each visitor signs in anonymously via Supabase Auth (signInAnonymously)
     and gets a real uid from auth.users. There is no shared secret someone
     can lift from the page to impersonate another player.
   - leaderboard's PRIMARY KEY is auth_id = that uid. RLS policies require
     auth.uid() = auth_id on insert/update, so a client can only ever create
     or edit ITS OWN row. It cannot write arbitrary rows, spoof/overwrite
     someone else's entry, or inject a row claiming a foreign identity.
   - No DELETE policy exists, so clients cannot remove rows either.
   - The service-role key never ships to the browser, so RLS cannot be
     bypassed from the client.

   UNCHANGEABLE LIMIT (be honest about this if you ship it): the fight/side
   OUTCOMES are still decided in this page (Math.random, or the market's
   winningOutcome when one is live). What the Teller now owns is the MONEY:
   every stake is escrowed and every payout is credited server-side, buys are
   verified on-chain and cash-outs are paid by the Teller's own key. A
   cheater can tilt their own win-rate; they cannot mint, move or steal
   real value. Full oracle settlement (the server decides the outcome too)
   is the remaining step for the fight narratives.

   SETUP — run ONCE in the Supabase SQL editor for this project:

     create table leaderboard (
       auth_id      uuid primary key references auth.users(id) on delete cascade,
       player_name  text not null,
       total_fights integer not null default 0,
       wins         integer not null default 0,
       losses       integer not null default 0,
       updated_at   timestamptz not null default now()
     );

     alter table leaderboard enable row level security;

     create policy "lb_public_read" on leaderboard
       for select using (true);

     create policy "lb_owner_insert" on leaderboard
       for insert with check (auth.uid() = auth_id);

     create policy "lb_owner_update" on leaderboard
       for update using (auth.uid() = auth_id);

   (service_role automatically bypasses RLS — use it only in your Edge
    Functions / admin tooling, never in the shipped client.)
--------------------------------------------------------------------- */

/* ---------------------------------------------------------------------
   PERSISTENCE
   Personal save + player id: window.storage when running inside a
   Claude artifact, localStorage everywhere else (Vercel, any browser),
   so the same file works standalone outside Claude too.
   Global leaderboard: always the real Supabase REST backend above,
   never window.storage or localStorage — those are per-device/per-
   sandbox and cannot be "global" by definition.
   --------------------------------------------------------------------- */
const Persist = {
  hasArtifactStorage: typeof window!=="undefined" && !!window.storage,
  async getPlayerId(){
    if(this.hasArtifactStorage){
      try{ const r = await window.storage.get('player-id', false); if(r && r.value) return r.value; }catch(e){}
    } else {
      try{ const v = localStorage.getItem('pits-player-id'); if(v) return v; }catch(e){}
    }
    const id = "PLAYER-"+uid().toUpperCase();
    if(this.hasArtifactStorage){ try{ await window.storage.set('player-id', id, false); }catch(e){} }
    else { try{ localStorage.setItem('pits-player-id', id); }catch(e){} }
    return id;
  },
  async saveGame(state){
    const json = JSON.stringify(state);
    if(this.hasArtifactStorage){ try{ await window.storage.set('save-game', json, false); }catch(e){} }
    else { try{ localStorage.setItem('pits-save-game', json); }catch(e){} }
  },
  async loadGame(){
    if(this.hasArtifactStorage){
      try{ const r = await window.storage.get('save-game', false); if(r && r.value) return JSON.parse(r.value); }catch(e){}
    } else {
      try{ const v = localStorage.getItem('pits-save-game'); if(v) return JSON.parse(v); }catch(e){}
    }
    return null;
  },
  async clearGame(){
    if(this.hasArtifactStorage){ try{ await window.storage.delete('save-game', false); }catch(e){} }
    else { try{ localStorage.removeItem('pits-save-game'); }catch(e){} }
  },
  /* Match log persists ACROSS games and even "Reset All" — it is the literal
     verifiable history of every settled DreamDEX market result. Stored in its
     own key, decoupled from the per-game save object. */
  async getMatchLog(){
    if(this.hasArtifactStorage){
      try{ const r = await window.storage.get('pits-match-log', false); if(r && r.value) return JSON.parse(r.value); }catch(e){}
    } else {
      try{ const v = localStorage.getItem('pits-match-log'); if(v) return JSON.parse(v); }catch(e){}
    }
    return [];
  },
  async saveMatchLog(entries){
    const json = JSON.stringify(entries);
    if(this.hasArtifactStorage){ try{ await window.storage.set('pits-match-log', json, false); }catch(e){} }
    else { try{ localStorage.setItem('pits-match-log', json); }catch(e){} }
  },
  /* Audio/sound preferences — persist across sessions so the mix carries. */
  async getSettings(){
    try{ const v = localStorage.getItem('pits-settings'); if(v) return JSON.parse(v); }catch(e){}
    return null;
  },
  async saveSettings(settings){
    const json = JSON.stringify(settings);
    if(this.hasArtifactStorage){ try{ await window.storage.set('pits-settings', json, false); }catch(e){} }
    else { try{ localStorage.setItem('pits-settings', json); }catch(e){} }
  },
  /* One-time anonymous sign-in so RLS recognizes this player. supabase-js
     persists the refresh token, so this is cheap on repeat visits. */
  async ensureAuth(){
    if(!sb) return null;
    try{
      const { data, error } = await sb.auth.getUser();
      if(!error && data && data.user) return data.user;
      const r = await sb.auth.signInAnonymously();
      if(r.error) return null;
      return r.data.user;
    }catch(e){ return null; }
  },
  async pushLeaderboard(playerId, entry){
    if(!sb) return;
    const user = await this.ensureAuth();
    if(!user) return;
    try{
      await sb.from(SUPABASE_TABLE).upsert({
        auth_id: user.id,
        player_name: playerId,
        total_fights: entry.totalFights,
        wins: entry.wins,
        losses: entry.losses,
        updated_at: new Date().toISOString()
      }, { onConflict: "auth_id" });
    }catch(e){ /* non-fatal: gameplay continues even if the backend call fails */ }
  },
  async fetchLeaderboard(){
    if(!sb) return [];
    const user = await this.ensureAuth();
    if(!user) return [];
    try{
      const { data, error } = await sb.from(SUPABASE_TABLE)
        .select("player_name,total_fights,wins,losses")
        .order("wins", { ascending:false })
        .limit(100);
      if(error) return [];
      return data.map(r=>({ playerId: r.player_name, totalFights: r.total_fights, wins: r.wins, losses: r.losses }));
    }catch(e){ return []; }
  }
};

/* ---------------------------------------------------------------------
   SETTINGS — persisted audio preferences. soundOn controls the bell/mixer,
   bgm is one of: "wardrums" | "synthwave" | "lofi" | "none".
   --------------------------------------------------------------------- */
const DEFAULT_SETTINGS = { soundOn: true, bgm: "wardrums", volume: 0.7 };
let SETTINGS = Object.assign({}, DEFAULT_SETTINGS);
try{ SETTINGS = Object.assign({}, DEFAULT_SETTINGS, Persist.getSettings() || {}); }catch(e){}

/* ---------------------------------------------------------------------
   GAME DATA
   --------------------------------------------------------------------- */
/* ---------------------------------------------------------------------
   FATE MONEY BRIDGE — real DreamDEX wallet + server-authoritative ledger
   --------------------------------------------------------------------- */
const TELLER_URL = window.FATE_CONFIG.tellerUrl;
const FATE_STAKE = 100; // fixed stake per Fight Night call / Side Bet

/* window.FateConnector (dist/fate-connector.mjs) talks to:
   - window.ethereum (player's wallet; keys never leave it)
   - the DreamDEX Somnia testnet SDK (live binary markets)
   - the Teller edge function (server-authoritative Fate ledger)
   NO OFFLINE MODE: connect() throws on any failure and callers must surface
   the error — the game cannot be played without a valid wallet connection. */
