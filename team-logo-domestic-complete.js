/*
 * Local crest coverage for the second tiers in Germany, Spain, France,
 * Italy and the Netherlands.  These assets are intentionally stored in the
 * repository so mobile browsers never need a third-party image request.
 */
(function(){
  const directory='assets/team-logos/domestic-complete';
  const crestIds={
    'Antalyaspor':589,'Bursaspor':20,'Bodrum FK':44006,'Kayserispor':3205,'Sivasspor':2381,'Fatih Karagümrük':6646,'Manisa FK':48913,'Iğdır FK':74664,'İstanbulspor':924,'Bandırmaspor':20760,'Batman Petrolspor':3211,'Pendikspor':3209,'Van Spor FK':3173,'Ankara Keçiörengücü':12388,'Sarıyerspor':518,'Esenler Erokspor':45269,'Ümraniyespor':24245,'Mardin 1969 Spor':68377,'Muğlaspor':2378,'Boluspor':3207,
    'Hertha BSC':44,'Hannover 96':42,'1.FC Nuremberg':4,'VfL Bochum':80,'Karlsruher SC':48,'Holstein Kiel':269,'1.FC Kaiserslautern':2,'SV Darmstadt 98':105,'SpVgg Greuther Furth':65,'Fortuna Dusseldorf':38,'1.FC Magdeburg':187,'SG Dynamo Dresden':129,'Eintracht Braunschweig':23,'Preussen Munster':91,'VfL Wolfsburg':82,'1.FC Heidenheim 1846':2036,'FC St. Pauli':35,
    'UD Almeria':3302,'UD Las Palmas':472,'Real Valladolid':366,'Sporting Gijon':2448,'Granada CF':16795,'Real Sociedad B':9899,'FC Andorra':10718,'Real Zaragoza':142,'SD Eibar':1533,'Albacete Balompie':1532,'SD Huesca':5358,'Girona FC':12321,'RCD Mallorca':237,'Real Oviedo':2497,
    'Stade Reims':1421,'AS Saint-Etienne':618,'USL Dunkerque':9202,'Montpellier HSC':969,'Pau FC':3166,'Rodez AF':11273,'Red Star FC':1154,'EA Guingamp':855,'AS Nancy Lorraine':1159,'SC Bastia':595,'Grenoble Foot 38':1290,'FC Annecy':30204,'Stade Lavallois':1080,'US Boulogne':7042,'FC Nantes':995,'FC Metz':347,
    'UC Sampdoria':1038,'US Catanzaro':4097,'Palermo FC':458,'Modena FC':1385,'FC Empoli':749,'Mantova 1911':2581,'Spezia Calcio':3522,'SS Juve Stabia':5587,'Carrarese Calcio 1908':4159,'SSC Bari':332,'US Avellino 1912':2331,'FC Sudtirol':4554,'Delfino Pescara 1936':2921,'Virtus Entella':20519,'Pisa Sporting Club':4172,'Hellas Verona':276,'US Cremonese':2239,
    'AZ Alkmaar U21':11368,'PSV Eindhoven U21':9715,'Ajax Amsterdam U21':8817,'FC Dordrecht':1455,'RKC Waalwijk':235,'FC Emmen':1283,'Roda JC Kerkrade':192,'FC Utrecht U21':17596,'De Graafschap':642,'FC Den Bosch':404,'FC Eindhoven':3892,'MVV Maastricht':384,'Helmond Sport':500,'VVV Venlo':1426,'Vitesse Arnhem':499,'TOP Oss':1228,'FC Volendam':724,'NAC Breda':132,'Heracles Almelo':1304
  };
  // A few upstream crest files are WebP.  Their extension is kept honest so
  // GitHub Pages serves the right MIME type instead of relying on sniffing.
  const crestExtensions={1283:'webp',20519:'webp',3522:'webp',44006:'webp',7042:'webp',82:'webp',8817:'webp',9202:'webp',9715:'webp'};
  const registry=globalThis.LL_LOCAL_TEAM_LOGOS=globalThis.LL_LOCAL_TEAM_LOGOS||{};
  // These Turkish top-tier crests were already checked into the original
  // asset folder; they only lacked the exact saved-team name aliases.
  Object.assign(registry,{
    'Beşiktaş':'assets/team-logos/besiktas.png',
    'Başakşehir':'assets/team-logos/basaksehir.png',
    'Kasımpaşa':'assets/team-logos/kasimpasa.png',
    'Ç. Rizespor':'assets/team-logos/rizespor.png',
    'Çorum FK':'assets/team-logos/corum.png',
    'Gençlerbirliği':'assets/team-logos/genclerbirligi.png'
  });
  const crestPath=id=>`${directory}/${id}.${crestExtensions[id]||'png'}`;
  Object.entries(crestIds).forEach(([name,id])=>{registry[name]=crestPath(id);});
  // Team names can contain accents or have changed since an older save was
  // made.  Source `logoId` is stable, so the renderer can resolve those teams
  // without relying on a brittle spelling match.
  globalThis.LL_DOMESTIC_COMPLETE_LOGO_IDS=new Set(Object.values(crestIds));
  globalThis.LL_DOMESTIC_COMPLETE_LOGO_FILES=Object.fromEntries(Object.values(crestIds).map(id=>[id,crestPath(id)]));
})();
