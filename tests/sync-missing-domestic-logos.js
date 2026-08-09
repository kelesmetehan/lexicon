/*
 * One-off asset synchronizer for the real club crests that were missing from
 * the second-tier pools.  Assets are saved by the stable source logoId so the
 * game can address them without depending on a third-party CDN at runtime.
 *
 * Usage: node tests/sync-missing-domestic-logos.js
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const output = path.resolve(__dirname, '..', 'outputs', 'assets', 'team-logos', 'domestic-complete');
const clubs = [
  // Türkiye'nin ikinci kademesi de aktif kariyer başlangıcı olarak oynanır;
  // bu yüzden bu armalar da uzak Transfermarkt adresinden okunmamalıdır.
  ['TUR','Antalyaspor',589],['TUR','Bursaspor',20],['TUR','Bodrum FK',44006],['TUR','Kayserispor',3205],['TUR','Sivasspor',2381],['TUR','Fatih Karagümrük',6646],['TUR','Manisa FK',48913],['TUR','Iğdır FK',74664],['TUR','İstanbulspor',924],['TUR','Bandırmaspor',20760],['TUR','Batman Petrolspor',3211],['TUR','Pendikspor',3209],['TUR','Van Spor FK',3173],['TUR','Ankara Keçiörengücü',12388],['TUR','Sarıyerspor',518],['TUR','Esenler Erokspor',45269],['TUR','Ümraniyespor',24245],['TUR','Mardin 1969 Spor',68377],['TUR','Muğlaspor',2378],['TUR','Boluspor',3207],
  ['GER','Hertha BSC',44],['GER','Hannover 96',42],['GER','1.FC Nuremberg',4],['GER','VfL Bochum',80],['GER','Karlsruher SC',48],['GER','Holstein Kiel',269],['GER','1.FC Kaiserslautern',2],['GER','SV Darmstadt 98',105],['GER','SpVgg Greuther Furth',65],['GER','Fortuna Dusseldorf',38],['GER','1.FC Magdeburg',187],['GER','SG Dynamo Dresden',129],['GER','Eintracht Braunschweig',23],['GER','Preussen Munster',91],['GER','VfL Wolfsburg',82],['GER','1.FC Heidenheim 1846',2036],['GER','FC St. Pauli',35],
  ['ESP','UD Almeria',3302],['ESP','UD Las Palmas',472],['ESP','Real Valladolid',366],['ESP','Sporting Gijon',2448],['ESP','Granada CF',16795],['ESP','Real Sociedad B',9899],['ESP','FC Andorra',10718],['ESP','Real Zaragoza',142],['ESP','SD Eibar',1533],['ESP','Albacete Balompie',1532],['ESP','SD Huesca',5358],['ESP','Girona FC',12321],['ESP','RCD Mallorca',237],['ESP','Real Oviedo',2497],
  ['FRA','Stade Reims',1421],['FRA','AS Saint-Etienne',618],['FRA','USL Dunkerque',9202],['FRA','Montpellier HSC',969],['FRA','Pau FC',3166],['FRA','Rodez AF',11273],['FRA','Red Star FC',1154],['FRA','EA Guingamp',855],['FRA','AS Nancy Lorraine',1159],['FRA','SC Bastia',595],['FRA','Grenoble Foot 38',1290],['FRA','FC Annecy',30204],['FRA','Stade Lavallois',1080],['FRA','US Boulogne',7042],['FRA','FC Nantes',995],['FRA','FC Metz',347],
  ['ITA','UC Sampdoria',1038],['ITA','US Catanzaro',4097],['ITA','Palermo FC',458],['ITA','Modena FC',1385],['ITA','FC Empoli',749],['ITA','Mantova 1911',2581],['ITA','Spezia Calcio',3522],['ITA','SS Juve Stabia',5587],['ITA','Carrarese Calcio 1908',4159],['ITA','SSC Bari',332],['ITA','US Avellino 1912',2331],['ITA','FC Sudtirol',4554],['ITA','Delfino Pescara 1936',2921],['ITA','Virtus Entella',20519],['ITA','Pisa Sporting Club',4172],['ITA','Hellas Verona',276],['ITA','US Cremonese',2239],
  ['NED','AZ Alkmaar U21',11368],['NED','PSV Eindhoven U21',9715],['NED','Ajax Amsterdam U21',8817],['NED','FC Dordrecht',1455],['NED','RKC Waalwijk',235],['NED','FC Emmen',1283],['NED','Roda JC Kerkrade',192],['NED','FC Utrecht U21',17596],['NED','De Graafschap',642],['NED','FC Den Bosch',404],['NED','FC Eindhoven',3892],['NED','MVV Maastricht',384],['NED','Helmond Sport',500],['NED','VVV Venlo',1426],['NED','Vitesse Arnhem',499],['NED','TOP Oss',1228],['NED','FC Volendam',724],['NED','NAC Breda',132],['NED','Heracles Almelo',1304]
];
const alpha2 = {TUR:'TR',GER:'DE',ESP:'ES',FRA:'FR',ITA:'IT',NED:'NL'};
// Search names with reserve sides can rank a youth team above the senior crest.
// These verified SofaScore ids deliberately pin the parent/first-team crest.
const verifiedTeamIds = {
  'Sarıyerspor':4952,
  'SV Darmstadt 98':2576,'SD Huesca':24265,'AS Saint-Etienne':1678,
  'Spezia Calcio':2735,'Pisa Sporting Club':2737,
  'AZ Alkmaar U21':2950,'PSV Eindhoven U21':2941,'Ajax Amsterdam U21':2953,
  'FC Utrecht U21':2948
};
const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
function get(url, binary = false) {
  return new Promise((resolve, reject) => https.get(url, {headers:{'User-Agent':'LexiconLeague/1.0'}}, res => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) return resolve(get(res.headers.location, binary));
    if (res.statusCode !== 200) return reject(new Error(`${res.statusCode}: ${url}`));
    const chunks=[]; res.on('data', chunk => chunks.push(chunk));
    res.on('end', () => resolve(binary ? Buffer.concat(chunks) : Buffer.concat(chunks).toString('utf8')));
  }).on('error', reject));
}
function scoreCandidate(target, candidate) {
  const a=normalize(target), b=normalize(candidate.name);
  const sourceIsReserve=/\b(?:u\d+|ii|b)\b/i.test(target);
  const candidateIsReserve=/\b(?:u\d+|ii|b|reserve|reserves)\b/i.test(candidate.name);
  if (a===b) return 10000;
  const stop=new Set(['fc','cf','sc','ac','as','us','uc','ss','sd','cd','ud','sv','vfl','vfb','spvgg','club','calcio','foot','sporting']);
  const tokens=value=>String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().split(/[^a-z0-9]+/).filter(x=>x.length>1&&!stop.has(x));
  const left=tokens(target), right=tokens(candidate.name);
  const shared=left.filter(token=>right.includes(token)).length;
  const contains=(a.includes(b)||b.includes(a)) ? 120 : 0;
  const trigrams=[...new Set(a.match(/[a-z0-9]{3}/g)||[])].filter(x=>b.includes(x)).length;
  return shared*250 + contains + trigrams*10 - Math.abs(a.length-b.length) - (!sourceIsReserve&&candidateIsReserve?10000:0);
}
async function main(){
  fs.mkdirSync(output,{recursive:true});
  const unresolved=[];
  for(const [country,name,logoId] of clubs){
    const file=path.join(output,`${logoId}.png`);
    if(!process.env.LL_FORCE_LOGO_SYNC && fs.existsSync(file) && fs.statSync(file).size>200){console.log(`EXISTS ${name}`);continue;}
    try{
      let best={id:verifiedTeamIds[name],name:name};
      if(!best.id){
        const data=JSON.parse(await get(`https://www.sofascore.com/api/v1/search/all?q=${encodeURIComponent(name)}`));
        let candidates=(data.results||[])
          .filter(result=>result?.type==='team')
          .map(result=>result.entity)
          .filter(x=>x && (!x.country?.alpha2 || x.country.alpha2===alpha2[country]));
        if(!candidates.length){
          candidates=(data.results||[]).filter(result=>result?.type==='team').map(result=>result.entity).filter(Boolean);
        }
        candidates.sort((a,b)=>scoreCandidate(name,b)-scoreCandidate(name,a));
        best=candidates[0];
        if(!best?.id || scoreCandidate(name,best)<20) throw new Error(`no reliable match (${best?.name||'none'})`);
      }
      const image=await get(`https://www.sofascore.com/api/v1/team/${best.id}/image`,true);
      const isPng=image[0]===137&&image[1]===80;
      const isJpeg=image[0]===255&&image[1]===216;
      const isWebp=image.subarray(0,4).toString('ascii')==='RIFF'&&image.subarray(8,12).toString('ascii')==='WEBP';
      if(image.length<200 || (!isPng&&!isJpeg&&!isWebp)) throw new Error(`invalid image (${image.length} bytes)`);
      fs.writeFileSync(file,image);
      console.log(`OK ${name} -> ${best.name} (#${best.id})`);
    }catch(error){unresolved.push({country,name,logoId,error:error.message});console.error(`FAIL ${name}: ${error.message}`);}
  }
  fs.writeFileSync(path.join(output,'coverage-report.json'),JSON.stringify({generatedAt:new Date().toISOString(),requested:clubs.length,unresolved},null,2));
  if(unresolved.length){process.exitCode=1;}
}
main();
