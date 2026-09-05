/* Europe calendar guard v1: European fixtures may only appear in their fixed weeks. */
(function(){
  'use strict';

  const EURO_TYPES=['ucl','uel','uecl'];
  const KNOCKOUT_PHASES=new Set(['playoff','r16','qf','sf','final']);
  const GUARD_VERSION=2;
  let repairing=false;

  function isEuropeType(type){return EURO_TYPES.includes(String(type||''));}
  function weeksFor(type){
    try{return Array.isArray(LL_EURO_LEAGUE_WEEKS?.[type])?[...LL_EURO_LEAGUE_WEEKS[type]]:[];}
    catch(error){return [];}
  }
  function validQualifications(q){
    const all=EURO_TYPES.flatMap(type=>Array.isArray(q?.[type])?q[type]:[]);
    return EURO_TYPES.every(type=>Array.isArray(q?.[type])&&q[type].length===2)&&all.length===6&&new Set(all).size===6;
  }
  function activeNationalClubContext(state){
    const seasons=state?.nationalTournaments?.seasons;if(!seasons||typeof seasons!=='object')return null;
    const rec=Object.values(seasons).filter(item=>item&&item.completed!==true&&item.status==='active'&&item.clubTeam).sort((a,b)=>Number(b.year||0)-Number(a.year||0)||Number(b.season||0)-Number(a.season||0))[0]||null;
    return rec?{team:rec.clubTeam,country:rec.clubCountry||null,record:rec}:null;
  }
  function europeOwnerTeam(state){return activeNationalClubContext(state)?.team||state?.playerTeam||null;}
  function playerIsCurrentParticipant(state,type){
    const clubTeam=europeOwnerTeam(state);if(!state||!isEuropeType(type)||!clubTeam)return false;
    /* The current 36-team table is the strongest evidence for an in-progress save. */
    if(Array.isArray(state.europeStandings?.[type]?.teams)&&state.europeStandings[type].teams.includes(clubTeam))return true;
    /* New multi-league seasons resolve all playable countries at once. */
    if(typeof globalThis.llMLResolveEuropeParticipants==='function'){
      try{
        const participants=globalThis.llMLResolveEuropeParticipants(state);
        if(Array.isArray(participants?.[type])&&participants[type].includes(clubTeam))return true;
      }catch(error){console.warn('Europe participant lookup failed',error);}
    }
    /* Legacy saves still use the player's domestic 2+2+2 qualification cache. */
    return validQualifications(state.europeQualifications)&&state.europeQualifications[type]?.includes(clubTeam);
  }
  function userLeagueResults(state,type){
    const clubTeam=europeOwnerTeam(state);
    return (state.results||[]).filter(result=>
      Number(result?.season)===Number(state.season)&&
      result?.userMatch&&result.competition===type&&result.league==='euro-table'&&
      (result.home===clubTeam||result.away===clubTeam)
    ).length;
  }
  function clearPending(state,e){
    state.pendingFixture=null;
    if(e)e.pending=null;
  }
  function refundPrematureMatchUsage(state,teamName){
    const team=state.teams?.[teamName];
    if(!team)return;
    const contracts=team.cardContracts&&typeof team.cardContracts==='object'?team.cardContracts:{};
    Object.values(contracts).forEach(contract=>{
      const total=Math.max(0,Number(contract?.total)||0),remaining=Math.max(0,Number(contract?.remaining)||0);
      if(total&&remaining<total)contract.remaining=Math.min(total,remaining+1);
    });
    /* A voided match must not carry a generated lock into the real league fixture. */
    team.lockedDice={};
  }
  function removePrematureResults(state,e){
    const removed=[],clubTeam=europeOwnerTeam(state);
    state.results=(state.results||[]).filter(result=>{
      const current=Number(result?.season)===Number(state.season)&&result?.userMatch&&(result.home===clubTeam||result.away===clubTeam);
      const premature=current&&(
        (result.competition===e.type&&result.league==='euro-knockout')||
        result.league==='euro-format-void'
      );
      if(premature)removed.push({...result,voidedByEuropeCalendarGuard:true,voidedAt:new Date().toISOString()});
      return !premature;
    });
    if(removed.length){
      removed.forEach(result=>{refundPrematureMatchUsage(state,result.home);refundPrematureMatchUsage(state,result.away);});
      state.voidedResults=Array.isArray(state.voidedResults)?state.voidedResults:[];
      state.voidedResults.push(...removed);
    }
    return removed.length;
  }
  function resetToLeaguePhase(state,e,count,played){
    const voided=removePrematureResults(state,e);
    if(state.europeKnockouts?.competitions?.[e.type])delete state.europeKnockouts.competitions[e.type];
    e.phase='league';
    e.round=Math.min(count,Math.max(0,Number(played)||0));
    e.alive=true;
    e.pending=null;
    e.tie=null;
    e.winner=null;
    e.usedOpponents=Array.isArray(e.usedOpponents)?e.usedOpponents:[];
    delete e.seedRank;
    delete e.nextMatchWeek;
    e.status=voided
      ?`Avrupa takvimi onarıldı · ${voided} erken eleme maçı geçersiz sayıldı.`
      :(e.round?`Lig aşaması ${e.round}/${count} tamamlandı`:'Lig aşaması başlamadı');
    clearPending(state,e);
    return voided;
  }

  function repairEuropeCalendar(state){
    if(!state||repairing)return false;
    repairing=true;
    let changed=false;
    try{
      /* Milli takım görevi aktifken state.playerTeam milli takımdır. Kulüp Avrupa
         verisine bu pencere boyunca hiçbir repair/cleanup uygulanmaz. Kulüp geri
         yüklendikten sonra normal guard mevcut save onarımını güvenle çalıştırır. */
      const nationalContext=activeNationalClubContext(state);
      if(nationalContext){state.europeNationalDutyProtectionVersion=1;state.europeCalendarGuardVersion=GUARD_VERSION;return false;}
      let e=state.europe;
      if(e&&isEuropeType(e.type)){
        const q=state.europeQualifications;
        if(!playerIsCurrentParticipant(state,e.type)){
          /* Only invalidate when neither the live 36-team table nor the multi-league
             qualification source contains the player.  This prevents a valid
             multi-country UCL entry from being erased by the legacy 2+2+2 cache check. */
          state.europeQualifications=null;
          state.europeStandings=null;
          changed=true;
        }
        if(typeof llV2EnsureEuropeStandings==='function'){
          try{llV2EnsureEuropeStandings(state);}catch(error){console.warn('Europe standings repair failed',error);}
        }
      }

      e=state.europe;
      if(!e||!isEuropeType(e.type)){
        const pending=state.pendingFixture;
        if(isEuropeType(pending?.competition)){
          clearPending(state,e);
          changed=true;
        }
        state.europeCalendarGuardVersion=GUARD_VERSION;
        return changed;
      }

      const weeks=weeksFor(e.type),count=weeks.length,played=userLeagueResults(state,e.type);
      if(count&&played<count){
        const removed=removePrematureResults(state,e);
        if(removed){e.status=`Avrupa takvimi onarıldı · ${removed} erken maç kaydı silindi.`;changed=true;}
      }
      if(count&&played<count&&e.phase!=='league'){
        resetToLeaguePhase(state,e,count,played);
        changed=true;
      }

      const pending=state.pendingFixture;
      if(isEuropeType(pending?.competition)){
        let invalid=false;
        if(pending.competition!==e.type)invalid=true;
        else if(pending.league==='euro-table'){
          const round=Math.max(0,Number(e.round)||0),dueWeek=weeks[round];
          invalid=e.phase!=='league'||!Number.isFinite(Number(dueWeek))||Number(state.week)<Number(dueWeek);
        }else if(pending.league==='euro-knockout'){
          invalid=played<count||!KNOCKOUT_PHASES.has(e.phase)||Number(state.week)<Number(e.nextMatchWeek||Infinity);
        }else invalid=true;
        if(invalid){
          if(played<count&&e.phase!=='league')resetToLeaguePhase(state,e,count,played);
          else clearPending(state,e);
          changed=true;
        }
      }

      state.europeCalendarGuardVersion=GUARD_VERSION;
      return changed;
    }finally{
      repairing=false;
    }
  }

  function repairAndSave(state){
    const changed=repairEuropeCalendar(state);
    if(changed&&typeof llSave==='function'){
      try{llSave();}catch(error){console.warn('Europe calendar repair could not be saved',error);}
    }
    return changed;
  }

  if(typeof globalThis.llV2RepairState==='function'){
    const base=globalThis.llV2RepairState;
    globalThis.llV2RepairState=function(state){
      const repaired=base.apply(this,arguments);
      repairEuropeCalendar(repaired);
      return repaired;
    };
  }

  if(typeof globalThis.llV2EnsureSpecial==='function'){
    const base=globalThis.llV2EnsureSpecial;
    globalThis.llV2EnsureSpecial=function(){
      repairAndSave(globalThis.lexLeague?.state);
      return base.apply(this,arguments);
    };
  }

  if(typeof globalThis.llPlayerFixture==='function'){
    const base=globalThis.llPlayerFixture;
    globalThis.llPlayerFixture=function(){
      repairAndSave(globalThis.lexLeague?.state);
      return base.apply(this,arguments);
    };
  }

  if(typeof globalThis.llRenderDashboard==='function'){
    const base=globalThis.llRenderDashboard;
    globalThis.llRenderDashboard=function(){
      repairAndSave(globalThis.lexLeague?.state);
      return base.apply(this,arguments);
    };
  }

  if(typeof globalThis.llStartNextSeason==='function'){
    const base=globalThis.llStartNextSeason;
    globalThis.llStartNextSeason=function(){
      const result=base.apply(this,arguments);
      repairAndSave(globalThis.lexLeague?.state);
      return result;
    };
  }

  globalThis.llRepairEuropeCalendar=repairEuropeCalendar;
  if(globalThis.lexLeague?.state)repairAndSave(globalThis.lexLeague.state);
})();
