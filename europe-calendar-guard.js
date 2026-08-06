/* Europe calendar guard v1: European fixtures may only appear in their fixed weeks. */
(function(){
  'use strict';

  const EURO_TYPES=['ucl','uel','uecl'];
  const KNOCKOUT_PHASES=new Set(['playoff','r16','qf','sf','final']);
  const GUARD_VERSION=1;
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
  function userLeagueResults(state,type){
    return (state.results||[]).filter(result=>
      Number(result?.season)===Number(state.season)&&
      result?.userMatch&&result.competition===type&&result.league==='euro-table'&&
      (result.home===state.playerTeam||result.away===state.playerTeam)
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
    const removed=[];
    state.results=(state.results||[]).filter(result=>{
      const current=Number(result?.season)===Number(state.season)&&result?.userMatch&&(result.home===state.playerTeam||result.away===state.playerTeam);
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
      let e=state.europe;
      if(e&&isEuropeType(e.type)){
        const q=state.europeQualifications;
        if(!validQualifications(q)||!q[e.type]?.includes(state.playerTeam)){
          /* A new season used to keep the previous season's valid qualification cache. */
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
