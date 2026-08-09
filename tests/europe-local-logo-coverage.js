const fs=require('fs');
const path=require('path');
const source=fs.readFileSync('outputs/europe-team-pools.js','utf8');
const clubs=[...source.matchAll(/llV14Club\(\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']\s*,\s*(\d+)\s*,\s*(\d+)/g)]
  .map(([,name,country,stars,logoId])=>({name,country,stars:Number(stars),logoId:Number(logoId)}));
const unique=[...new Map(clubs.map(club=>[club.logoId,club])).values()];
const extensions={11:'jpg',1025:'jpg',2728:'webp',31614:'webp',3258:'webp',3700:'webp'};
const missing=unique.filter(club=>{
  const file=path.join('outputs','assets','team-logos','europe','official',`${club.logoId}.${extensions[club.logoId]||'png'}`);
  return !fs.existsSync(file)||fs.statSync(file).size<100;
});
const mappingOkay=source.includes("const LL_V14_LOCAL_LOGO_DIRECTORY='assets/team-logos/europe/official'")&&source.includes('const LL_V14_LOCAL_LOGO_EXTENSIONS=')&&source.includes('globalThis.LL_LOCAL_TEAM_LOGOS[team.name]');
if(missing.length||!mappingOkay){
  console.error(JSON.stringify({missing,mappingOkay},null,2));
  process.exit(1);
}
console.log(`EUROPE_LOCAL_LOGOS_PASS clubs=${clubs.length} uniqueLogoIds=${unique.length} localFiles=${unique.length}`);
