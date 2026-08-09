/*
 * Verifies that every current playable domestic-tier and European-pool club
 * resolves to an existing image shipped with the GitHub Pages build.  A
 * missing mapping would otherwise silently become the teal abbreviation tile.
 *
 * Usage: node tests/verify-local-team-logo-coverage.js
 */
const fs=require('fs');
const path=require('path');
const vm=require('vm');

const root=path.resolve(__dirname,'..');
const out=path.join(root,'outputs');
const read=file=>fs.readFileSync(path.join(out,file),'utf8');
const context={window:null,globalThis:null,LL_TEAMS:[],LL_FIRST_TEAMS:[],console};
context.window=context;context.globalThis=context;
const run=(source,name)=>vm.runInNewContext(source,context,{filename:name});

function imageType(file){
  const bytes=fs.readFileSync(file);
  if(bytes.length<200)return '';
  if(bytes[0]===0x89&&bytes[1]===0x50&&bytes[2]===0x4e&&bytes[3]===0x47)return 'png';
  if(bytes[0]===0xff&&bytes[1]===0xd8)return 'jpg';
  if(bytes.subarray(0,4).toString('ascii')==='RIFF'&&bytes.subarray(8,12).toString('ascii')==='WEBP')return 'webp';
  return '';
}
function arrayLiteral(source,identifier){
  const marker=`const ${identifier}`;
  const from=source.indexOf(marker);
  if(from<0)throw new Error(`${identifier} bulunamadı`);
  const start=source.indexOf('[',from);
  let depth=0,quote='',escaped=false;
  for(let i=start;i<source.length;i++){
    const char=source[i];
    if(quote){
      if(escaped)escaped=false;
      else if(char==='\\')escaped=true;
      else if(char===quote)quote='';
      continue;
    }
    if(char==='"'||char==="'"||char==='`'){quote=char;continue;}
    if(char==='[')depth++;
    if(char===']'&&!--depth)return source.slice(start,i+1);
  }
  throw new Error(`${identifier} dizisi tamamlanmadı`);
}
function collectPools(pools,label){
  return Object.entries(pools||{}).flatMap(([country,teams])=>teams.map(team=>({...team,source:`${label}:${country}`})));
}

run(read('team-logo-manifest.js'),'team-logo-manifest.js');
run(read('team-logo-domestic-complete.js'),'team-logo-domestic-complete.js');
const euro=read('europe-team-pools.js');
run(euro.slice(0,euro.indexOf('function llV14EuroPool'))+'\nglobalThis.__EURO_POOLS=LL_V14_EURO_POOLS;','europe-team-pools.js setup');
run(read('european-leagues-pools.js')+'\nglobalThis.__TIER1=LL_TIER1_POOLS;globalThis.__TIER2=LL_TIER2_POOLS;','european-leagues-pools.js');

const html=read('lexicon-fixed.html');
const turkishMain=arrayLiteral(html,'LL_TEAMS');
run(`globalThis.__TURKISH_MAIN=${turkishMain};`,'lexicon-fixed.html LL_TEAMS');
const firstTeams=arrayLiteral(read('league-v2.js'),'LL_FIRST_TEAMS');
run(`globalThis.__TURKISH_FIRST=${firstTeams};`,'league-v2.js LL_FIRST_TEAMS');

const records=[
  ...collectPools(context.__EURO_POOLS,'Europe'),
  ...collectPools(context.__TIER1,'Tier1'),
  ...collectPools(context.__TIER2,'Tier2'),
  ...(context.__TURKISH_MAIN||[]).map(team=>({...team,source:'Türkiye:ana'})),
  ...(context.__TURKISH_FIRST||[]).map(team=>({...team,source:'Türkiye:alt'}))
];
const unique=[...new Map(records.map(team=>[`${team.source}:${team.name}`,team])).values()];
const registry=context.LL_LOCAL_TEAM_LOGOS||{};
const domesticIds=context.LL_DOMESTIC_COMPLETE_LOGO_IDS||new Set();
const rows=unique.map(team=>{
  const savedId=String(team.logo||'').match(/\/head\/(\d+)\.(?:png|jpg|webp)(?:\?|$)/i)?.[1];
  const id=Number(team.logoId||savedId||0);
  const relative=registry[team.name]||context.LL_DOMESTIC_COMPLETE_LOGO_FILES?.[id]||(domesticIds.has(id)?`assets/team-logos/domestic-complete/${id}.png`:'');
  const absolute=relative?path.join(out,...relative.split('/')):'';
  const type=absolute&&fs.existsSync(absolute)?imageType(absolute):'';
  return {source:team.source,name:team.name,logoId:id,path:relative,exists:Boolean(type),type};
});
const missing=rows.filter(row=>!row.exists);
const report={generatedAt:new Date().toISOString(),teamsChecked:rows.length,localAssetsResolved:rows.length-missing.length,missing};
fs.writeFileSync(path.join(__dirname,'team-logo-coverage.report.json'),JSON.stringify(report,null,2));
console.log(`Logo coverage: ${report.localAssetsResolved}/${report.teamsChecked} local real crest`);
if(missing.length){
  console.error(JSON.stringify(missing,null,2));
  process.exitCode=1;
}
