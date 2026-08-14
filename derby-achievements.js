/* Lexicon League: historical derbies, analysis coupons and career achievements. */
(function(){
'use strict';
const BET_LIMIT=8, STAKES=[20,40,60], BET_LP=10, DERBY_WIN={ap:15,lp:10};
const DERBIES=[
['TUR','Fenerbahçe','Galatasaray','Kıtalararası Derbi'],['TUR','Beşiktaş','Fenerbahçe','Büyük Derbi'],['TUR','Beşiktaş','Galatasaray','Büyük Derbi'],['TUR','Trabzonspor','Fenerbahçe','Karadeniz - İstanbul Rekabeti'],['TUR','Alanyaspor','Antalyaspor','Akdeniz Derbisi'],['TUR','Kasımpaşa','Fatih Karagümrük','İstanbul Derbisi'],['TUR','Gençlerbirliği','Ankaragücü','Ankara Derbisi'],['TUR','Beşiktaş','Bursaspor','Tarihî Rekabet'],
['ENG','Manchester City','Manchester United','Manchester Derbisi'],['ENG','Liverpool FC','Everton FC','Merseyside Derbisi'],['ENG','Liverpool FC','Manchester United','Kuzeybatı Derbisi'],['ENG','Arsenal FC','Tottenham Hotspur','Kuzey Londra Derbisi'],['ENG','Newcastle United','Sunderland AFC','Tyne-Wear Derbisi'],['ENG','Leeds United','Manchester United','Güller Rekabeti'],['ENG','Brighton & Hove Albion','Crystal Palace','M23 Derbisi'],['ENG','Aston Villa','Birmingham City','Second City Derbisi'],['ENG','Ipswich Town','Norwich City','Doğu Anglia Derbisi'],['ENG','Nottingham Forest','Derby County','East Midlands Derbisi'],
['GER','Borussia Dortmund','FC Schalke 04','Revierderby'],['GER','Bayern Munich','Borussia Dortmund','Der Klassiker'],['GER','Hamburger SV','FC St. Pauli','Hamburg Derbisi'],['GER','1.FC Köln','Borussia Mönchengladbach','Rheinland Derbisi'],['GER','1.FC Köln','Bayer 04 Leverkusen','Rheinland Rekabeti'],['GER','SV Werder Bremen','Hamburger SV','Kuzey Derbisi'],['GER','Hertha BSC','1.FC Union Berlin','Berlin Derbisi'],
['ESP','Real Madrid','FC Barcelona','El Clásico'],['ESP','Real Madrid','Atlético de Madrid','Madrid Derbisi'],['ESP','FC Barcelona','RCD Espanyol Barcelona','Barcelona Derbisi'],['ESP','Sevilla FC','Real Betis Balompié','Sevilla Derbisi'],['ESP','Valencia CF','Levante UD','Valencia Derbisi'],['ESP','Athletic Bilbao','Real Sociedad','Bask Derbisi'],['ESP','Celta de Vigo','Deportivo de La Coruña','Galiçya Derbisi'],['ESP','Real Oviedo','Sporting Gijón','Asturias Derbisi'],
['FRA','Paris Saint-Germain','Olympique Marseille','Le Classique'],['FRA','Paris Saint-Germain','Paris FC','Paris Derbisi'],['FRA','Olympique Lyon','AS Saint-Étienne','Derby Rhône-Alpes'],['FRA','LOSC Lille','RC Lens','Derby du Nord'],['FRA','AS Monaco','OGC Nice','Côte d’Azur Derbisi'],['FRA','Stade Rennais FC','FC Nantes','Derby Breton'],['FRA','Stade Brestois 29','FC Lorient','Breton Rekabeti'],['FRA','FC Metz','AS Nancy-Lorraine','Derby Lorrain'],
['ITA','Inter Milan','AC Milan','Derby della Madonnina'],['ITA','AS Roma','SS Lazio','Derby della Capitale'],['ITA','Juventus FC','Torino FC','Derby della Mole'],['ITA','Genoa CFC','UC Sampdoria','Derby della Lanterna'],['ITA','Inter Milan','Juventus FC','Derby d’Italia'],['ITA','SSC Napoli','AS Roma','Güney Rekabeti'],['ITA','Bologna FC 1909','ACF Fiorentina','Apennine Derbisi'],['ITA','Parma Calcio 1913','AC Reggiana 1919','Emilia Derbisi'],
['NED','Ajax Amsterdam','Feyenoord Rotterdam','De Klassieker'],['NED','Ajax Amsterdam','PSV Eindhoven','De Topper'],['NED','PSV Eindhoven','Feyenoord Rotterdam','De Topper'],['NED','Feyenoord Rotterdam','Sparta Rotterdam','Rotterdam Derbisi'],['NED','FC Twente Enschede','Heracles Almelo','Twente Derbisi'],['NED','FC Groningen','SC Heerenveen','Kuzey Derbisi'],['NED','SC Heerenveen','SC Cambuur Leeuwarden','Friesland Derbisi'],['NED','NEC Nijmegen','Vitesse Arnhem','Gelderland Derbisi'],['NED','Willem II Tilburg','NAC Breda','Brabant Derbisi'],['NED','PEC Zwolle','Go Ahead Eagles','IJssel Derbisi']
].map(([country,home,away,label])=>({country,home,away,label}));
function n(v,d=0){v=Number(v);return Number.isFinite(v)?v:d;}function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function pair(a,b){return [String(a||''),String(b||'')].sort((x,y)=>x.localeCompare(y,'tr')).join('|');}
function fixture(){try{return llPlayerFixture();}catch{return null;}}
function fixtureKey(f,s=lexLeague.state){return [s?.season||0,s?.week||0,f?.competition||'league',f?.roundLabel||'',f?.home||'',f?.away||''].join('~');}
function derby(f=fixture(),s=lexLeague.state){if(!f||!s)return null;const country=s.playerCountry||'TUR',found=DERBIES.find(d=>d.country===country&&pair(d.home,d.away)===pair(f.home,f.away));return found&&s.teams?.[found.home]&&s.teams?.[found.away]?found:null;}
globalThis.llHistoricalDerby=derby;
function rank(name){try{const rows=llSortTable(llTeamLeague(name));const i=rows.findIndex(r=>r.team===name);return i>=0?i+1:10;}catch{return 10;}}
function form(name,s){return (s.teams?.[name]?.lastResults||[]).slice(-5).reduce((x,v)=>x+(v==='W'||v==='G'?3:v==='D'||v==='B'?1:0),0);}
function power(name,s){return Object.values(s.teams?.[name]?.cards||{}).reduce((sum,id)=>{const c=llCard?.(id),r=LL_CARD_RARITY_RANK?.[c?.rarity]||({common:1,rare:2,epic:3,legendary:4}[c?.rarity]||0);return sum+r+(c?.upgradeLevel?.5:0);},0);}
function odds(f=fixture(),s=lexLeague.state){const p=s?.playerTeam,o=f?.home===p?f?.away:f?.home,pt=s?.teams?.[p]||{},ot=s?.teams?.[o]||{},home=f?.home===p;let rows=[];try{rows=llSortTable(llTeamLeague(p));}catch{}const total=rows.length||20;
const a=n(pt.stars,3)*.78+form(p,s)*.055+power(p,s)*.06+(total-rank(p))/total*.34+(home?.26:-.18),b=n(ot.stars,3)*.78+form(o,s)*.055+power(o,s)*.06+(total-rank(o))/total*.34+(home?-.18:.26),d=clamp(a-b,-2.25,2.25);let w=clamp(.42+d*.095,.18,.65),x=clamp(.27-Math.min(.075,Math.abs(d)*.022),.18,.34),l=clamp(1-w-x,.18,.65),sum=w+x+l;w/=sum;x/=sum;l/=sum;const make=q=>clamp(Math.round(.93/q*20)/20,1.5,4);return {win:make(w),draw:make(x),loss:make(l)};}
globalThis.llDerbyOddsForFixture=odds;
function betStore(s){if(!s.derbyBets||typeof s.derbyBets!=='object')s.derbyBets={};if(!s.derbyBetSeason||n(s.derbyBetSeason.season)!==n(s.season))s.derbyBetSeason={season:s.season,used:0};return s.derbyBets;}
function outcomeLabel(v){return v==='win'?'Sen kazanır':v==='draw'?'Beraberlik':'Rakip kazanır';}
function betHtml(f,s){const d=derby(f,s);if(!d)return '';const key=fixtureKey(f,s),saved=betStore(s)[key],used=n(s.derbyBetSeason.used),o=odds(f,s);if(saved)return `<div class="ll-derby-bet locked"><div><b>🎟 Analiz Kuponu kilitlendi</b><span>${llEscape(d.label)} · ${llEscape(outcomeLabel(saved.outcome))} · ${saved.stake} AP @ ${saved.odds.toFixed(2)}</span></div><b>Olası dönüş: ${saved.returnAmount} AP</b></div>`;
const list=['win','draw','loss'].map(x=>`<span class="ll-derby-odd"><b>${llEscape(outcomeLabel(x))}</b><em>${o[x].toFixed(2)}</em></span>`).join('');const active=used<BET_LIMIT&&s.ap>=20;return `<div class="ll-derby-bet"><div><b>🔥 ${llEscape(d.label)} · Analiz Kuponu</b><span>Resmî derbi tahmini · Sezon ${used}/${BET_LIMIT} kupon</span><div class="ll-derby-odds">${list}</div></div><button class="ll-btn gold" ${active?'':'disabled'} onclick="llOpenDerbyBet()">${used>=BET_LIMIT?'Sezon limiti doldu':s.ap<20?'En az 20 AP gerekli':'Bahis Yap'}</button></div>`;}
function renderBetModal(){const s=lexLeague.state,f=fixture(),d=derby(f,s),draft=lexLeague.derbyBetDraft;if(!d||!draft)return;const o=draft.odds||odds(f,s),stake=n(draft.stake,20),choice=draft.outcome||'win',returns=Math.round(stake*o[choice]),net=returns-stake;
const outcomes=['win','draw','loss'].map(x=>`<button class="ll-btn ${x===choice?'primary':''}" onclick="llSetDerbyBetDraft('${x}',${stake})">${llEscape(outcomeLabel(x))}<br><b>${o[x].toFixed(2)}</b></button>`).join(''),stakes=STAKES.map(x=>`<button class="ll-btn ${x===stake?'gold':''}" ${s.ap<x?'disabled':''} onclick="llSetDerbyBetDraft('${choice}',${x})">${x} AP</button>`).join('');llShowModal(`<div class="ll-rarity">TARİHÎ DERBİ · ANALİZ KUPONU</div><div class="quiz-start-title" style="font-size:28px;margin:8px 0">${llEscape(d.label)}</div><div class="ll-sub">Kupon onaylanınca AP kasadan düşer; maçın kesin kartlı sonucu ile otomatik çözülür.</div><div class="ll-derby-modal-grid"><div><b>Sonuç tahmini</b><div class="ll-actions" style="margin-top:8px">${outcomes}</div></div><div><b>AP miktarı</b><div class="ll-actions" style="margin-top:8px">${stakes}</div></div></div><div class="ll-notice" style="margin-top:14px"><b>${stake} AP × ${o[choice].toFixed(2)} oran</b><br>Doğru tahminde toplam <b>${returns} AP</b> geri döner · net kazanç <b>${net} AP</b> · ayrıca <b>+${BET_LP} LP</b>.<br>Yanlış tahminde yatırılan ${stake} AP geri dönmez.</div><div style="display:flex;justify-content:flex-end;gap:9px;margin-top:16px"><button class="ll-btn" onclick="llCloseModal()">Vazgeç</button><button class="ll-btn gold" ${s.ap<stake?'disabled':''} onclick="llConfirmDerbyBet()">${stake} AP ile Kuponu Kilitle</button></div>`);}
globalThis.llOpenDerbyBet=function(){const s=lexLeague.state,f=fixture();if(!s||!derby(f,s)||betStore(s)[fixtureKey(f,s)])return;lexLeague.derbyBetDraft={outcome:'win',stake:20,odds:odds(f,s)};renderBetModal();};
globalThis.llSetDerbyBetDraft=function(outcome,stake){if(!lexLeague.derbyBetDraft)return;lexLeague.derbyBetDraft.outcome=['win','draw','loss'].includes(outcome)?outcome:'win';lexLeague.derbyBetDraft.stake=STAKES.includes(n(stake))?n(stake):20;renderBetModal();};
globalThis.llConfirmDerbyBet=function(){const s=lexLeague.state,f=fixture(),draft=lexLeague.derbyBetDraft,store=betStore(s),key=fixtureKey(f,s),stake=n(draft?.stake);if(!draft||!derby(f,s)||store[key]||n(s.derbyBetSeason.used)>=BET_LIMIT||!STAKES.includes(stake)||s.ap<stake){alert('Bu kupon artık oluşturulamaz.');return;}const o=odds(f,s),choice=draft.outcome,odd=o[choice],returnAmount=Math.round(stake*odd);s.ap-=stake;store[key]={season:s.season,week:s.week,fixture:{home:f.home,away:f.away,competition:f.competition||'league'},derby:derby(f,s).label,outcome:choice,stake,odds:odd,returnAmount,net:returnAmount-stake,settled:false,createdAt:new Date().toISOString()};s.derbyBetSeason.used++;delete lexLeague.derbyBetDraft;llSave();llCloseModal();llRenderDashboard();};

const ACH=[
['first_official_win','İlk Düdük','İlk resmî maç galibiyetini al.',15,15,s=>s.wins>=1,s=>`${n(s.wins)}/1 galibiyet`],['wins_10','Onlu Seri','Kariyerde 10 resmî maç kazan.',30,25,s=>s.wins>=10,s=>`${n(s.wins)}/10 galibiyet`],['wins_50','Kazanan Teknik Adam','Kariyerde 50 resmî maç kazan.',75,75,s=>s.wins>=50,s=>`${n(s.wins)}/50 galibiyet`],['first_team_change','Yeni Meydan Okuma','Başka bir kulübün teklifini kabul et.',25,25,s=>s.teamChanges>=1,s=>`${n(s.teamChanges)}/1 takım değişimi`],['three_active_cards','Tam Kadro','Üç aktif rol kartına aynı anda sahip ol.',35,0,s=>n(s.fullSquad)>=1,s=>`${n(s.fullSquad)}/1 tam kadro`],['first_card_upgrade','Usta Dokunuş','İlk kart geliştirmesini yap.',25,40,s=>s.cardUpgrades>=1,s=>`${n(s.cardUpgrades)}/1 kart geliştirme`],['first_die_upgrade','Antrenman Karşılığını Verdi','İlk mevki zarını geliştir.',25,40,s=>s.dieUpgrades>=1,s=>`${n(s.dieUpgrades)}/1 zar geliştirme`],['three_dice_upgrades_season','Üçlü Gelişim','Bir sezonda üç mevki zarını geliştir.',75,100,(s,state)=>n(s.seasons?.[state.season]?.die)>=3,(s,state)=>`${n(s.seasons?.[state.season]?.die)}/3 bu sezon`],['star_4','Dört Yıldız','4 yıldızlı takıma ulaş.',75,100,s=>s.starMilestones?.[4]===true,()=>`Yeni yıldız yükselişi bekleniyor`],['star_5','Beş Yıldız','5 yıldızlı takıma ulaş.',125,175,s=>s.starMilestones?.[5]===true,()=>`Yeni yıldız yükselişi bekleniyor`],['star_6','Altın Çağ','6 yıldızlı takıma ulaş.',200,250,s=>s.starMilestones?.[6]===true,()=>`Yeni yıldız yükselişi bekleniyor`],['survive_relegation','Ayakta Kaldık','Sezonu düşme hattının üstünde bitir.',50,75,s=>s.survived>=1,s=>`${n(s.survived)}/1`],['playoff_qualification','Play-Off Bileti','Alt ligde Play-Off hattına gir.',75,100,s=>s.playoff>=1,s=>`${n(s.playoff)}/1`],['promotion','Terfi','Üst lige yüksel.',150,200,s=>s.promotions>=1,s=>`${n(s.promotions)}/1`],['european_qualification','Avrupa Bileti','Avrupa kupalarına katılım hakkı kazan.',100,125,s=>s.euroQualified>=1,s=>`${n(s.euroQualified)}/1`],['league_title','Lig Şampiyonu','Lig şampiyonluğunu kazan.',250,300,s=>s.leagueTitles>=1,s=>`${n(s.leagueTitles)}/1`],['domestic_qf','Kupa Yolu','Yerel kupada çeyrek finale ulaş.',50,50,s=>s.cupQf>=1,s=>`${n(s.cupQf)}/1`],['domestic_final','Final Gecesi','Yerel kupa finaline ulaş.',100,125,s=>s.cupFinal>=1,s=>`${n(s.cupFinal)}/1`],['domestic_cup_title','Kupa Evde','Yerel kupayı kazan.',200,225,s=>s.cupTitles>=1,s=>`${n(s.cupTitles)}/1`],['first_european_win','Avrupa’da İlk Zafer','Avrupa kupalarında ilk galibiyetini al.',50,60,s=>s.euroWins>=1,s=>`${n(s.euroWins)}/1`],['europe_knockout','Avrupa Turu','Avrupa eleme aşamasına ulaş.',100,125,s=>s.euroKo>=1,s=>`${n(s.euroKo)}/1`],['europe_qf','Avrupa Çeyreği','Avrupa kupasında çeyrek finale ulaş.',150,175,s=>s.euroQf>=1,s=>`${n(s.euroQf)}/1`],['europe_final','Avrupa Finali','Avrupa kupasında finale ulaş.',250,250,s=>s.euroFinal>=1,s=>`${n(s.euroFinal)}/1`],['europe_title','Avrupa Şampiyonu','Avrupa kupasını kazan.',400,400,s=>s.euroTitles>=1,s=>`${n(s.euroTitles)}/1`],['first_derby_win','Derbi Ateşi','Tarihî bir derbiyi kazan.',25,20,s=>s.derbyWins>=1,s=>`${n(s.derbyWins)}/1 derbi galibiyeti`],['two_derby_wins_season','Şehrin Sahibi','Bir sezonda iki tarihî derbi kazan.',60,50,(s,state)=>n(s.seasons?.[state.season]?.derby)>=2,(s,state)=>`${n(s.seasons?.[state.season]?.derby)}/2 bu sezon`],['unbeaten_10','Yenilmez','Art arda 10 resmî maç yenilme.',0,75,s=>s.peak>=10,s=>`${n(s.peak)}/10 maç`],['season_20_wins','Yirmilik Sezon','Bir sezonda 20 resmî maç kazan.',100,100,(s,state)=>n(s.seasons?.[state.season]?.wins)>=20,(s,state)=>`${n(s.seasons?.[state.season]?.wins)}/20 bu sezon`],['vocab_100_correct','Kelime Ustası','Kariyerde 100 maç öncesi kelimeyi doğru bil.',75,0,s=>s.words>=100,s=>`${n(s.words)}/100 doğru`],['mistake_corrections_25','Geri Dönüş','Daha önce yanlış bildiğin 25 kelimeyi düzelt.',100,0,s=>s.corrections>=25,s=>`${n(s.corrections)}/25 düzeltme`]
].map(([id,name,description,ap,lp,check,progress])=>({id,name,description,reward:{ap,lp},check,progress}));globalThis.LL_ACHIEVEMENTS=ACH;
// Yeni kariyer odakli basarimlar. Bunlar eski kayitlari tarayip odul vermez;
// sadece canli olay kaydi bundan sonra ilerledikce acilir.
ACH.push(
  {id:'flying_start_5',name:'Vliegende Start \u00b7 Flying Start',description:'Kariyerde toplam 5 resmi mac kazan.',reward:{ap:20,lp:20},check:s=>n(s.expansion?.wins)>=5,progress:s=>`${n(s.expansion?.wins)}/5 galibiyet`},
  {id:'first_season_complete',name:'Ontgroening',description:'Ilk sezonunu tamamla.',reward:{ap:25,lp:30},check:s=>n(s.expansion?.completedSeasons)>=1,progress:s=>`${n(s.expansion?.completedSeasons)}/1 sezon`},
  {id:'first_club_target',name:'Eerste Succes \u00b7 First Success',description:'Ilk kez ana kulup hedefini tamamla.',reward:{ap:50,lp:50},check:s=>n(s.expansion?.clubTargets)>=1,progress:s=>`${n(s.expansion?.clubTargets)}/1 hedef`},
  {id:'cup_debut_win',name:'Bekerdebuut \u00b7 Cup Debut',description:'Yerel kupada ilk mac galibiyetini al.',reward:{ap:25,lp:25},check:s=>n(s.expansion?.cupWins)>=1,progress:s=>`${n(s.expansion?.cupWins)}/1 kupa galibiyeti`},
  {id:'clean_sheet_first',name:'Schone Lei \u00b7 Clean Sheet',description:'Bir resmi macta gol yeme.',reward:{ap:15,lp:15},check:s=>n(s.expansion?.cleanSheets)>=1,progress:s=>`${n(s.expansion?.cleanSheets)}/1 gol yemeden mac`},
  {id:'clean_sheet_10',name:'Chinese Muur \u00b7 Chinese Wall',description:'Toplam 10 resmi macta gol yeme.',reward:{ap:80,lp:80},check:s=>n(s.expansion?.cleanSheets)>=10,progress:s=>`${n(s.expansion?.cleanSheets)}/10 gol yemeden mac`},
  {id:'one_on_one_3',name:'Een tegen Een \u00b7 One on One',description:'Yapay zeka teknik direktorlerine karsi 3 resmi mac oyna.',reward:{ap:15,lp:15},check:s=>n(s.expansion?.matches)>=3,progress:s=>`${n(s.expansion?.matches)}/3 resmi mac`},
  {id:'unbeaten_20',name:'Onverslaanbaar \u00b7 Unbeatable',description:'Art arda 20 resmi macta yenilme.',reward:{ap:100,lp:125},check:s=>n(s.expansion?.unbeatenPeak)>=20,progress:s=>`${n(s.expansion?.unbeatenPeak)}/20 mac`},
  {id:'challenger_100',name:'Uitdager \u00b7 Challenger',description:'Yapay zeka teknik direktorlerine karsi 100 resmi mac oyna.',reward:{ap:100,lp:100},check:s=>n(s.expansion?.matches)>=100,progress:s=>`${n(s.expansion?.matches)}/100 resmi mac`},
  {id:'provocateur_1000',name:'Provocateur',description:'Yapay zeka teknik direktorlerine karsi 1.000 resmi mac oyna.',reward:{ap:500,lp:500},check:s=>n(s.expansion?.matches)>=1000,progress:s=>`${n(s.expansion?.matches)}/1000 resmi mac`},
  {id:'season_invincible',name:'Superman',description:'Bir sezon boyunca oynadigin resmi maclarin hicbirini kaybetme.',reward:{ap:250,lp:300},check:s=>n(s.expansion?.invincibleSeasons)>=1,progress:s=>`${n(s.expansion?.invincibleSeasons)}/1 yenilgisiz sezon`},
  {id:'win_streak_25',name:'Onoverwinnelijk \u00b7 Invincible',description:'Art arda 25 resmi mac kazan.',reward:{ap:300,lp:350},check:s=>n(s.expansion?.winPeak)>=25,progress:s=>`${n(s.expansion?.winPeak)}/25 galibiyet serisi`},
  {id:'domestic_cup_titles_3',name:'Kupa Ustaligi',description:'Yerel kupayi 3 kez kazan.',reward:{ap:250,lp:300},check:s=>n(s.expansion?.cupTitles)>=3,progress:s=>`${n(s.expansion?.cupTitles)}/3 kupa`},
  {id:'domestic_cup_titles_10',name:'Kupa Hanedani',description:'Yerel kupayi 10 kez kazan.',reward:{ap:600,lp:750},check:s=>n(s.expansion?.cupTitles)>=10,progress:s=>`${n(s.expansion?.cupTitles)}/10 kupa`},
  {id:'league_loyalty_10',name:'Trouwe Hond · Loyal Dog',description:'Ayni ulkede ayni lig seviyesinde art arda 10 sezon tamamla.',reward:{ap:150,lp:200},check:s=>n(s.expansion?.leagueTenure?.best)>=10,progress:s=>`${n(s.expansion?.leagueTenure?.best)}/10 sezon`}
);

/* Teknik Direktör Gelişimi: yalnızca bu sürümden sonra yapılan gerçek
   yükseltmeler kayda girer; mevcut tesis seviyesi geçmişe dönük ödül vermez. */
ACH.push(
  {id:'manager_development_first',name:'İlk Taktik Adım',description:'Teknik Direktör Gelişimini ilk kez yükselt.',reward:{ap:30,lp:40},check:s=>n(s.managerDevelopment?.upgrades)>=1,progress:s=>`${n(s.managerDevelopment?.upgrades)}/1 gelişim`},
  {id:'manager_development_three',name:'Taktik Ustalığı',description:'Teknik Direktör Gelişimini üç kez yükselt.',reward:{ap:75,lp:100},check:s=>n(s.managerDevelopment?.upgrades)>=3,progress:s=>`${n(s.managerDevelopment?.upgrades)}/3 gelişim`},
  {id:'manager_development_level_6',name:'Teknik Direktör Efsanesi',description:'Teknik Direktör Gelişiminde Seviye 6’ya kendi yükseltmenle ulaş.',reward:{ap:200,lp:250},check:s=>n(s.managerDevelopment?.highest)>=6,progress:s=>`En yüksek seviye: ${n(s.managerDevelopment?.highest)}/6`}
);
// Basarim ekraninda yabanci baslik veya aciklama kalmasin: mevcut kariyerlerde
// ID ayni kaldigi icin daha once acilmis rozetlerin gecmisi de korunur.
const TURKISH_ACHIEVEMENT_COPY={
  flying_start_5:{name:'H\u0131zl\u0131 Ba\u015flang\u0131\u00e7',description:'Kariyerde toplam 5 resm\u00ee ma\u00e7 kazan.'},
  first_season_complete:{name:'\u0130lk Sezon',description:'\u0130lk sezonunu tamamla.'},
  first_club_target:{name:'\u0130lk Ba\u015far\u0131',description:'\u0130lk kez ana kul\u00fcp hedefini tamamla.'},
  cup_debut_win:{name:'Kupa Ba\u015flang\u0131c\u0131',description:'Yerel kupada ilk ma\u00e7 galibiyetini al.'},
  clean_sheet_first:{name:'Gol Yemeden',description:'Bir resm\u00ee ma\u00e7ta gol yeme.'},
  clean_sheet_10:{name:'\u00c7in Seddi',description:'Toplam 10 resm\u00ee ma\u00e7ta gol yeme.'},
  one_on_one_3:{name:'Bire Bir',description:'Yapay zek\u00e2 teknik direkt\u00f6rlerine kar\u015f\u0131 3 resm\u00ee ma\u00e7 oyna.'},
  unbeaten_20:{name:'Yenilmez Seri',description:'Art arda 20 resm\u00ee ma\u00e7ta yenilme.'},
  challenger_100:{name:'Meydan Okuyan',description:'Yapay zek\u00e2 teknik direkt\u00f6rlerine kar\u015f\u0131 100 resm\u00ee ma\u00e7 oyna.'},
  provocateur_1000:{name:'K\u0131\u015fk\u0131rt\u0131c\u0131',description:'Yapay zek\u00e2 teknik direkt\u00f6rlerine kar\u015f\u0131 1.000 resm\u00ee ma\u00e7 oyna.'},
  season_invincible:{name:'Yenilgisiz Sezon',description:'Bir sezon boyunca oynad\u0131\u011f\u0131n resm\u00ee ma\u00e7lar\u0131n hi\u00e7birini kaybetme.'},
  win_streak_25:{name:'Sars\u0131lmaz',description:'Art arda 25 resm\u00ee ma\u00e7 kazan.'},
  domestic_cup_titles_3:{name:'Kupa Ustal\u0131\u011f\u0131',description:'Yerel kupay\u0131 3 kez kazan.'},
  domestic_cup_titles_10:{name:'Kupa Hanedan\u0131',description:'Yerel kupay\u0131 10 kez kazan.'},
  league_loyalty_10:{name:'Sad\u0131k Teknik Direkt\u00f6r',description:'Ayn\u0131 \u00fclkede, ayn\u0131 lig seviyesinde art arda 10 sezon tamamla.'}
};
ACH.forEach(item=>{const copy=TURKISH_ACHIEVEMENT_COPY[item?.id];if(copy)Object.assign(item,copy);});
function ensure(s){
  if(!s)return null;
  if(!s.achievements||typeof s.achievements!=='object')s.achievements={version:2,unlocked:{},migrationNote:null};
  if(!s.achievements.unlocked||typeof s.achievements.unlocked!=='object')s.achievements.unlocked={};
  if(!s.achievementStats||typeof s.achievementStats!=='object')s.achievementStats={version:2,wins:0,draws:0,losses:0,unbeaten:0,peak:0,derbyWins:0,words:0,corrections:0,cardUpgrades:0,dieUpgrades:0,teamChanges:0,fullSquad:0,starMilestones:{},trophyBaseline:0,seasons:{}};
  const x=s.achievementStats;
  if(!x.seasons||typeof x.seasons!=='object')x.seasons={};
  if(!x.starMilestones||typeof x.starMilestones!=='object')x.starMilestones={};
  if(!x.recordedMatches||typeof x.recordedMatches!=='object')x.recordedMatches={};
  if(!x.managerDevelopment||typeof x.managerDevelopment!=='object')x.managerDevelopment={version:1,upgrades:0,highest:0,levels:[]};
  const managerDevelopment=x.managerDevelopment;
  if(!Array.isArray(managerDevelopment.levels))managerDevelopment.levels=[];
  ['upgrades','highest'].forEach(key=>{if(!Number.isFinite(Number(managerDevelopment[key])))managerDevelopment[key]=0;});
  ['wins','draws','losses','matches','unbeaten','peak','winStreak','winPeak','derbyWins','words','corrections','cardUpgrades','dieUpgrades','teamChanges','fullSquad','survived','playoff','promotions','euroQualified','leagueTitles','cupQf','cupFinal','cupTitles','cupWins','cleanSheets','completedSeasons','clubTargets','invincibleSeasons','euroWins','euroKo','euroQf','euroFinal','euroTitles'].forEach(key=>{if(!Number.isFinite(Number(x[key])))x[key]=0;});
  if(!Number.isFinite(Number(x.trophyBaseline)))x.trophyBaseline=0;
  if(!x.expansion||typeof x.expansion!=='object')x.expansion={version:1,wins:0,matches:0,cupWins:0,cleanSheets:0,unbeaten:0,unbeatenPeak:0,winStreak:0,winPeak:0,completedSeasons:0,clubTargets:0,invincibleSeasons:0,cupTitles:0,completedSeasonIds:[],cupTitleSeasonIds:[],seasons:{},leagueTenure:{key:null,run:0,best:0}};
  const ex=x.expansion;
  ['wins','matches','cupWins','cleanSheets','unbeaten','unbeatenPeak','winStreak','winPeak','completedSeasons','clubTargets','invincibleSeasons','cupTitles'].forEach(key=>{if(!Number.isFinite(Number(ex[key])))ex[key]=0;});
  if(!Array.isArray(ex.completedSeasonIds))ex.completedSeasonIds=[];
  if(!Array.isArray(ex.cupTitleSeasonIds))ex.cupTitleSeasonIds=[];
  if(!ex.seasons||typeof ex.seasons!=='object')ex.seasons={};
  if(!ex.leagueTenure||typeof ex.leagueTenure!=='object')ex.leagueTenure={key:null,run:0,best:0};
  ['run','best'].forEach(key=>{if(!Number.isFinite(Number(ex.leagueTenure[key])))ex.leagueTenure[key]=0;});
  if(!x.seasons[s.season])x.seasons[s.season]={wins:0,derby:0,die:0,matches:0,losses:0,cleanSheets:0};
  else ['wins','derby','die','matches','losses','cleanSheets'].forEach(key=>{if(!Number.isFinite(Number(x.seasons[s.season][key])))x.seasons[s.season][key]=0;});
  return s.achievements;
}
function unlock(s,a,source='live'){const p=ensure(s);if(p.unlocked[a.id])return null;p.unlocked[a.id]={season:s.season,team:s.playerTeam,at:new Date().toISOString(),source,reward:{...a.reward}};s.ap+=a.reward.ap;s.lp+=a.reward.lp;return a;}
function evaluate(s,source='live'){if(!s)return[];ensure(s);const x=s.achievementStats;return ACH.map(a=>a.check(x,s)?unlock(s,a,source):null).filter(Boolean);}
const ACHIEVEMENT_TRACKING_VERSION=2;
const ACHIEVEMENT_RULES_VERSION=3;
const EURO_STAGE_ORDER={playoff:1,r16:2,qf:3,sf:4,final:5,winner:6};
const EURO_STAGE_IDS=['europe_knockout','europe_qf','europe_final'];
function isEuropeCompetition(comp){return ['ucl','uel','uecl'].includes(String(comp||''));}
function userSeasonResults(s,season=s?.season){return (s?.results||[]).filter(r=>r?.userMatch&&n(r.season)===n(season));}
function resultOutcomeForPlayer(s,r){if(!s||!r)return null;const home=r.home===s.playerTeam,away=r.away===s.playerTeam;if(!home&&!away)return null;const pg=home?n(r.homeGoals):n(r.awayGoals),og=home?n(r.awayGoals):n(r.homeGoals);return pg>og?'win':pg===og?'draw':'loss';}
function inferEuropeStage(result){
  const explicit=String(result?.euroStage||'').trim();if(EURO_STAGE_ORDER[explicit])return explicit;
  if(result?.league!=='euro-knockout')return null;
  const label=String(result?.roundLabel||'');
  if(/final/i.test(label)&&!/yar[ıi]\s*final/i.test(label))return 'final';
  if(/yar[ıi]\s*final/i.test(label))return 'sf';
  if(/[çc]eyrek\s*final/i.test(label))return 'qf';
  if(/son\s*16/i.test(label))return 'r16';
  if(/play[- ]?off|eleme\s*turu/i.test(label))return 'playoff';
  return null;
}
function stageReached(s,minimum){
  const min=EURO_STAGE_ORDER[minimum]||0,e=s?.europe,phase=String(e?.phase||'');
  if(EURO_STAGE_ORDER[phase]>=min)return true;
  return userSeasonResults(s).some(r=>isEuropeCompetition(r.competition)&&r.league==='euro-knockout'&&(EURO_STAGE_ORDER[inferEuropeStage(r)]||0)>=min);
}
function domesticRoundReached(s,minimum){
  const results=userSeasonResults(s).filter(r=>r.competition==='cup');
  if(results.some(r=>Number.isInteger(Number(r.cupRound))&&Number(r.cupRound)>=minimum))return true;
  const cup=s?.cup;if(!cup)return false;
  return (cup.alive||cup.winner===s.playerTeam)&&Number(cup.round)>=minimum;
}
function achievementHasCurrentEvidence(s,id){
  if(!s)return false;
  if(id==='europe_knockout')return stageReached(s,'playoff');
  if(id==='europe_qf')return stageReached(s,'qf');
  if(id==='europe_final')return stageReached(s,'final');
  if(id==='domestic_final')return domesticRoundReached(s,5);
  return true;
}
function revokeCurrentFalseUnlock(s,id,statKey){
  const data=s?.achievements?.unlocked?.[id];if(!data||n(data.season)!==n(s.season)||data.source!=='live'||achievementHasCurrentEvidence(s,id))return null;
  const item=ACH.find(a=>a.id===id),reward=data.reward||item?.reward||{};
  s.ap=Math.max(0,n(s.ap)-n(reward.ap));s.lp=Math.max(0,n(s.lp)-n(reward.lp));
  delete s.achievements.unlocked[id];if(statKey)s.achievementStats[statKey]=0;
  return {id,name:item?.name||id,ap:n(reward.ap),lp:n(reward.lp)};
}
function repairAchievementRules(s){
  if(!s)return null;ensure(s);if(n(s.achievementRulesVersion)>=ACHIEVEMENT_RULES_VERSION)return null;
  const revoked=[
    revokeCurrentFalseUnlock(s,'europe_knockout','euroKo'),
    revokeCurrentFalseUnlock(s,'europe_qf','euroQf'),
    revokeCurrentFalseUnlock(s,'europe_final','euroFinal'),
    revokeCurrentFalseUnlock(s,'domestic_final','cupFinal')
  ].filter(Boolean);
  s.achievementRulesVersion=ACHIEVEMENT_RULES_VERSION;
  if(revoked.length){
    const ap=revoked.reduce((sum,item)=>sum+item.ap,0),lp=revoked.reduce((sum,item)=>sum+item.lp,0),names=revoked.map(item=>item.name).join(', ');
    const note=`Hatalı tur algılaması düzeltildi: ${names} geri alındı; yanlış verilen ${ap} AP · ${lp} LP geri çevrildi.`;
    s.achievements.migrationNote=s.achievements.migrationNote?`${s.achievements.migrationNote} ${note}`:note;
  }
  return {revoked};
}
function startLiveTracking(s){if(!s)return null;ensure(s);if(n(s.achievementTrackingVersion)>=ACHIEVEMENT_TRACKING_VERSION){repairAchievementRules(s);return null;}const prior=Object.values(s.achievements?.unlocked||{}),reversed=prior.reduce((sum,item)=>({ap:sum.ap+n(item?.reward?.ap),lp:sum.lp+n(item?.reward?.lp)}),{ap:0,lp:0});s.ap=Math.max(0,n(s.ap)-reversed.ap);s.lp=Math.max(0,n(s.lp)-reversed.lp);s.achievements={version:ACHIEVEMENT_TRACKING_VERSION,unlocked:{},migrationNote:`Başarımlar bu sürümden itibaren yalnızca yeni olaylarda ilerler. Geçmişten otomatik açılmış ${prior.length} başarım ve ${reversed.ap} AP · ${reversed.lp} LP geri alındı.`};s.achievementStats={version:ACHIEVEMENT_TRACKING_VERSION,wins:0,draws:0,losses:0,unbeaten:0,peak:0,derbyWins:0,words:0,corrections:0,cardUpgrades:0,dieUpgrades:0,teamChanges:0,fullSquad:0,starMilestones:{},trophyBaseline:Array.isArray(s.trophies)?s.trophies.length:0,seasons:{}};s.achievementTrackingVersion=ACHIEVEMENT_TRACKING_VERSION;ensure(s);repairAchievementRules(s);return {cleared:prior.length,reversed};}
function celebrate(items){if(!items?.length||typeof document==='undefined')return;if(typeof globalThis.llAchievementCinematic==='function'){globalThis.llAchievementCinematic(items);return;}const show=()=>{const a=items.shift();if(!a)return;llShowModal(`<div class="ll-achievement-unlock"><div class="ll-achievement-icon">🏆</div><div><div class="ll-rarity">BAŞARIM KİLİDİ AÇILDI</div><div class="quiz-start-title" style="font-size:28px;margin:6px 0">${llEscape(a.name)}</div><div class="ll-sub">${llEscape(a.description)}</div><div class="ll-notice" style="margin-top:12px"><b>${a.reward.ap?`+${a.reward.ap} AP`:''}${a.reward.ap&&a.reward.lp?' · ':''}${a.reward.lp?`+${a.reward.lp} LP`:''}</b> kariyer hanene işlendi.</div></div></div><div style="display:flex;justify-content:flex-end;margin-top:16px"><button class="ll-btn gold" onclick="llCloseModal()">Harika</button></div>`);};setTimeout(show,330);}
function settle(s,f,outcome){const b=betStore(s)[fixtureKey(f,s)];if(!b||b.settled)return null;b.settled=true;b.actualOutcome=outcome;b.won=b.outcome===outcome;b.settledAt=new Date().toISOString();if(b.won){s.ap+=n(b.returnAmount);s.lp+=BET_LP;b.lpAwarded=BET_LP;}return b;}
function syncCompetitionMilestones(s,r,comp,outcome){
  const x=s.achievementStats;
  if(isEuropeCompetition(comp)){
    if(outcome==='win')x.euroWins++;
    const stage=r?.league==='euro-knockout'?inferEuropeStage(r):null,order=EURO_STAGE_ORDER[stage]||0;
    if(order>=EURO_STAGE_ORDER.playoff)x.euroKo=1;
    if(order>=EURO_STAGE_ORDER.qf)x.euroQf=1;
    if(order>=EURO_STAGE_ORDER.final)x.euroFinal=1;
    if(stageReached(s,'playoff'))x.euroKo=1;
    if(stageReached(s,'qf'))x.euroQf=1;
    if(stageReached(s,'final'))x.euroFinal=1;
    if(s.europe?.type===comp&&s.europe?.phase==='winner')x.euroTitles=1;
  }
   if(comp==='cup'){
    if(outcome==='win')x.expansion.cupWins++;
    if(domesticRoundReached(s,3))x.cupQf=1;
    if(domesticRoundReached(s,5))x.cupFinal=1;
    if(s.cup?.winner===s.playerTeam)x.cupTitles=1;
  }
}
function recordTeamChange(s,fromTeam,toTeam){
  if(!s||!fromTeam||!toTeam||fromTeam===toTeam)return [];
  ensure(s);s.achievementStats.teamChanges++;const got=evaluate(s);if(typeof globalThis.llSave==='function')llSave();celebrate(got);return got;
}
globalThis.llAchievementRecordTeamChange=function(fromTeam,toTeam,state=globalThis.lexLeague?.state){return recordTeamChange(state,fromTeam,toTeam);};
function recordManagerDevelopmentUpgrade(s,level){
  if(!s)return[];
  ensure(s);
  const manager=s.achievementStats.managerDevelopment;
  const next=Math.max(0,Math.min(6,n(level)));
  if(!next)return[];
  if(!manager.levels.includes(next)){
    manager.levels.push(next);
    manager.levels.sort((a,b)=>a-b);
    manager.upgrades=manager.levels.length;
  }
  manager.highest=Math.max(n(manager.highest),next);
  const got=evaluate(s,'live');
  if(typeof globalThis.llSave==='function')llSave();
  celebrate(got);
  return got;
}
globalThis.llAchievementRecordManagerDevelopmentUpgrade=function(level,state=globalThis.lexLeague?.state){return recordManagerDevelopmentUpgrade(state,level);};
globalThis.llAchievementAudit={inferEuropeStage,stageReached,domesticRoundReached,achievementHasCurrentEvidence,repairAchievementRules,syncCompetitionMilestones};
function achievementMatchKey(s,r,f){
  if(r.achievementRecordKey)return r.achievementRecordKey;
  const key=['v1',n(r.season),n(r.week),r.competition||f?.competition||'league',r.league||f?.league||'',r.home||'',r.away||'',n(r.homeGoals),n(r.awayGoals),Math.max(0,(s.results||[]).indexOf(r))].join('|');
  r.achievementRecordKey=key;
  return key;
}
function matchCommitted(s,f){
  const r=[...(s.results||[])].reverse().find(v=>v.userMatch&&v.home===f.home&&v.away===f.away&&n(v.season)===n(s.season));if(!r)return{unlocked:[]};
  const x=s.achievementStats,key=achievementMatchKey(s,r,f);if(x.recordedMatches[key])return{unlocked:[],duplicate:true};x.recordedMatches[key]=new Date().toISOString();
  const season=x.seasons[s.season]||(x.seasons[s.season]={wins:0,derby:0,die:0,matches:0,losses:0,cleanSheets:0}),home=r.home===s.playerTeam,pg=home?n(r.homeGoals):n(r.awayGoals),og=home?n(r.awayGoals):n(r.homeGoals),outcome=pg>og?'win':pg===og?'draw':'loss';
   x.matches++;season.matches++;const ex=x.expansion,exSeason=ex.seasons[s.season]||(ex.seasons[s.season]={matches:0,losses:0});ex.matches++;exSeason.matches++;
   if(og===0){x.cleanSheets++;season.cleanSheets++;ex.cleanSheets++;}
   if(outcome==='win'){x.wins++;season.wins++;x.unbeaten++;x.winStreak++;ex.wins++;ex.unbeaten++;ex.winStreak++;}else if(outcome==='draw'){x.draws++;x.unbeaten++;x.winStreak=0;ex.unbeaten++;ex.winStreak=0;}else{x.losses++;season.losses++;exSeason.losses++;x.unbeaten=0;x.winStreak=0;ex.unbeaten=0;ex.winStreak=0;}x.peak=Math.max(n(x.peak),x.unbeaten);x.winPeak=Math.max(n(x.winPeak),x.winStreak);ex.unbeatenPeak=Math.max(n(ex.unbeatenPeak),ex.unbeaten);ex.winPeak=Math.max(n(ex.winPeak),ex.winStreak);
  const d=derby(f,s);let derbyReward=null;if(d&&outcome==='win'){x.derbyWins++;season.derby++;s.ap+=DERBY_WIN.ap;s.lp+=DERBY_WIN.lp;derbyReward=d;}
  const comp=r.competition||f.competition||'league';syncCompetitionMilestones(s,r,comp,outcome);
  const b=settle(s,f,outcome);return{unlocked:evaluate(s),bet:b,derbyReward,outcome};
}
globalThis.llAchievementRecordCommittedMatch=function(state,fixture){if(!state||!fixture)return{unlocked:[]};ensure(state);return matchCommitted(state,fixture);};
function activeRoleCardCount(s){const team=s?.teams?.[s?.playerTeam];if(!team)return 0;return LL_POSITIONS.filter(pos=>typeof globalThis.llCardContractSlotActive==='function'?globalThis.llCardContractSlotActive(team,pos):!!team.cards?.[pos]).length;}
function reconcileCurrentStateAchievement(s){if(!s)return[];ensure(s);const x=s.achievementStats;if(n(x.fullSquad)>=1||activeRoleCardCount(s)<3)return[];x.fullSquad=1;return evaluate(s,'current-state');}
globalThis.llAchievementAudit.currentStatus=function(state=globalThis.lexLeague?.state){
  if(!state)return null;
  ensure(state);
  const x=state.achievementStats,ex=x.expansion||{};
  return {trackingVersion:n(state.achievementTrackingVersion),recordedMatches:Object.keys(x.recordedMatches||{}).length,liveMatches:n(ex.matches),liveWins:n(ex.wins),completedSeasons:n(ex.completedSeasons),completedPrimaryTargets:n(ex.clubTargets),activeRoleCards:activeRoleCardCount(state),fullSquad:n(x.fullSquad)};
};
function settlement(r){const parts=[];if(r.bet)parts.push(r.bet.won?`<b>🎟 Analiz Kuponu tuttu:</b> ${r.bet.stake} AP × ${r.bet.odds.toFixed(2)} = <b>${r.bet.returnAmount} AP</b> · net +${r.bet.net} AP · +${BET_LP} LP.`:`<b>🎟 Analiz Kuponu tutmadı:</b> ${r.bet.stake} AP yatırımı geri dönmedi.`);if(r.derbyReward)parts.push(`<b>🔥 ${llEscape(r.derbyReward.label)} galibiyeti:</b> +${DERBY_WIN.ap} AP · +${DERBY_WIN.lp} LP.`);return parts.length?`<div class="ll-derby-settlement">${parts.join('<br>')}</div>`:'';}
globalThis.llRenderAchievements=function(){const s=lexLeague.state;if(!s)return;ensure(s);const p=s.achievements,x=s.achievementStats,unlocked=p.unlocked||{},groups=[['Kariyer ve Gelişim',['first_official_win','flying_start_5','wins_10','wins_50','one_on_one_3','challenger_100','provocateur_1000','first_season_complete','first_club_target','first_team_change','three_active_cards','first_card_upgrade','first_die_upgrade','three_dice_upgrades_season','manager_development_first','manager_development_three','manager_development_level_6','star_4','star_5','star_6']],['Lig ve Kupalar',['survive_relegation','playoff_qualification','promotion','european_qualification','league_title','cup_debut_win','domestic_qf','domestic_final','domestic_cup_title','domestic_cup_titles_3','domestic_cup_titles_10']],['Avrupa',['first_european_win','europe_knockout','europe_qf','europe_final','europe_title']],['Derbi ve Çalışma',['first_derby_win','two_derby_wins_season','clean_sheet_first','clean_sheet_10','unbeaten_10','unbeaten_20','win_streak_25','season_20_wins','season_invincible','vocab_100_correct','mistake_corrections_25']],['Sadakat ve Teknik Direktörlük',['club_loyalty_3','club_legend_5','club_dynasty_8','league_loyalty_10','club_three_trophies','same_season_double','rebuild_master','continental_legacy','three_countries_manager']]];const card=a=>{const done=unlocked[a.id],reward=`${a.reward.ap?`+${a.reward.ap} AP`:''}${a.reward.ap&&a.reward.lp?' · ':''}${a.reward.lp?`+${a.reward.lp} LP`:''}`;return `<div class="ll-achievement-card ${done?'done':''}"><div class="ll-achievement-card-head"><span>${done?'🏆':'🔒'}</span><b>${llEscape(a.name)}</b></div><div class="ll-sub">${llEscape(a.description)}</div><div class="ll-achievement-progress">${done?`Açıldı · S${done.season}${done.team?` · ${llEscape(done.team)}`:''}`:llEscape(a.progress(x,s))}</div><div class="ll-achievement-reward">${reward||'Rozet'}</div></div>`;};llSetWide(true);llArea().innerHTML=`<div class="ll-shell"><div class="ll-panel"><div class="ll-topbar"><div><div class="ll-title">Başarımlar <em>ve Kupalar</em></div><div class="ll-muted">Kariyer geneli · Takım değiştirsen de bir kez açılır ve tekrar ödül vermez.</div></div><button class="ll-btn" onclick="llRenderDashboard()">← Dashboard</button></div><div class="ll-metrics"><div class="ll-metric"><strong>${Object.keys(unlocked).length}</strong><span>Açılan</span></div><div class="ll-metric"><strong>${ACH.length}</strong><span>Toplam</span></div><div class="ll-metric"><strong>${x.wins||0}</strong><span>Kariyer Galibiyeti</span></div><div class="ll-metric"><strong>${x.derbyWins||0}</strong><span>Derbi Galibiyeti</span></div></div>${p.migrationNote?`<div class="ll-notice" style="margin-top:14px"><b>Mevcut kariyer geçişi:</b> ${llEscape(p.migrationNote)}</div>`:''}${groups.map(([title,ids])=>`<div class="ll-card" style="margin-top:14px"><div class="ll-card-title">${llEscape(title)}</div><div class="ll-achievement-grid">${ids.map(id=>card(ACH.find(a=>a.id===id))).join('')}</div></div>`).join('')}</div></div>`;};
function injectDashboard(){const s=lexLeague.state,f=fixture();if(!s||!f||typeof document==='undefined')return;const actions=document.querySelector('.ll-topbar .ll-actions');if(actions&&!actions.querySelector('[data-achievements]'))actions.insertAdjacentHTML('beforeend','<button class="ll-btn" data-achievements onclick="llRenderAchievements()">Başarımlar</button>');const button=[...document.querySelectorAll('button')].find(b=>String(b.getAttribute('onclick')||'').includes('llStartMatchPreparation'));if(button&&!button.parentElement?.querySelector('.ll-derby-bet')){const html=betHtml(f,s);if(html)button.insertAdjacentHTML('afterend',html);}}
function style(){if(typeof document==='undefined'||document.getElementById('ll-derby-achievement-styles'))return;const e=document.createElement('style');e.id='ll-derby-achievement-styles';e.textContent=`.ll-derby-bet{margin-top:12px;padding:12px 14px;border:1px solid rgba(234,179,8,.58);border-radius:12px;background:linear-gradient(125deg,rgba(234,179,8,.14),rgba(30,41,59,.52));display:flex;justify-content:space-between;align-items:center;gap:12px}.ll-derby-bet b{color:#fde68a;display:block}.ll-derby-bet span{font-size:12px;color:#cbd5e1}.ll-derby-bet.locked{border-color:rgba(45,212,191,.48);background:rgba(20,184,166,.09)}.ll-derby-odds{display:flex;gap:7px;flex-wrap:wrap;margin-top:7px}.ll-derby-odd{display:flex;gap:5px;align-items:center;padding:4px 7px;border-radius:7px;background:rgba(2,6,23,.46)}.ll-derby-odd b{font-size:10px;color:#dbeafe}.ll-derby-odd em{font-style:normal;color:#fbbf24;font-weight:800}.ll-derby-modal-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:15px}.ll-derby-settlement{margin:14px auto 0;max-width:720px;padding:12px;border:1px solid rgba(234,179,8,.5);border-radius:10px;background:rgba(234,179,8,.1);text-align:left}.ll-achievement-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;margin-top:12px}.ll-achievement-card{border:1px solid rgba(148,163,184,.22);border-radius:10px;background:rgba(15,23,42,.55);padding:12px}.ll-achievement-card.done{border-color:rgba(250,204,21,.65);background:linear-gradient(135deg,rgba(250,204,21,.13),rgba(20,184,166,.08))}.ll-achievement-card-head{display:flex;gap:8px;align-items:center;font-size:14px}.ll-achievement-progress{font-size:11px;color:#94a3b8;margin-top:8px}.ll-achievement-reward{color:#5eead4;font-weight:800;font-size:12px;margin-top:7px}.ll-achievement-unlock{display:flex;gap:16px;align-items:center}.ll-achievement-icon{font-size:56px;filter:drop-shadow(0 0 16px rgba(250,204,21,.65));animation:ll-achievement-pop .65s ease both}@keyframes ll-achievement-pop{0%{transform:scale(.45) rotate(-18deg);opacity:0}70%{transform:scale(1.14) rotate(6deg);opacity:1}100%{transform:scale(1) rotate(0)}}@media(max-width:650px){.ll-derby-bet{align-items:stretch;flex-direction:column}.ll-derby-bet .ll-btn{width:100%}.ll-derby-modal-grid{grid-template-columns:1fr}.ll-achievement-grid{grid-template-columns:1fr}}`;document.head.appendChild(e);}
function wrap(name,fn){const base=globalThis[name];if(typeof base!=='function'||base.__da)return;const result=fn(base);result.__da=true;globalThis[name]=result;}
function install(){style();wrap('llV2RepairState',base=>function(s){const r=base.apply(this,arguments);if(r){ensure(r);startLiveTracking(r);repairAchievementRules(r);}return r;});wrap('llRenderDashboard',base=>function(){const r=base.apply(this,arguments);injectDashboard();return r;});wrap('llV2MatchImportance',base=>function(f,key){return base.apply(this,arguments)||(derby(f,lexLeague.state)?'🔥 TARİHÎ DERBİ':'');});wrap('llFinishLeagueQuiz',base=>function(){const q=lexLeague.quiz,r=base.apply(this,arguments),s=lexLeague.state;if(s&&q&&!q.__da){ensure(s);s.achievementStats.words+=n(q.correct);s.achievementStats.corrections+=n(q.recoveredWords);q.__da=true;const got=evaluate(s);llSave();celebrate(got);}return r;});wrap('llCommitCurrentMatch',base=>function(){const s=lexLeague.state,m=lexLeague.match,f=m?.fixture;if(!s||!f)return base.apply(this,arguments);const r=base.apply(this,arguments);if(m&&!m.__da){m.__da=true;ensure(s);const record=matchCommitted(s,f);llSave();if(record.bet||record.derbyReward){const panel=document.querySelector('.ll-panel');if(panel&&!panel.querySelector('.ll-derby-settlement'))panel.insertAdjacentHTML('beforeend',settlement(record));}celebrate(record.unlocked);}return r;});wrap('llChooseManagerOffer',base=>function(){const s=lexLeague.state,before=s?.playerTeam,r=base.apply(this,arguments);if(s&&before&&s.playerTeam!==before)recordTeamChange(s,before,s.playerTeam);return r;});wrap('llUpgradeCard',base=>function(){const s=lexLeague.state,t=s?.teams?.[s.playerTeam],before=JSON.stringify(t?.cards||{}),r=base.apply(this,arguments);if(s&&t&&JSON.stringify(t.cards||{})!==before){ensure(s);s.achievementStats.cardUpgrades++;const got=evaluate(s);llSave();celebrate(got);}return r;});
wrap('llChooseShopCard',base=>function(){const s=lexLeague.state,t=s?.teams?.[s.playerTeam],before=Object.values(t?.cards||{}).filter(Boolean).length,r=base.apply(this,arguments),after=Object.values(t?.cards||{}).filter(Boolean).length;if(s&&before<3&&after>=3){ensure(s);s.achievementStats.fullSquad++;const got=evaluate(s);llSave();celebrate(got);}return r;});wrap('llUpgradePositionDie',base=>function(){const s=lexLeague.state,t=s?.teams?.[s.playerTeam],before=JSON.stringify(t?.dieProgression||{}),beforeStars=n(t?.stars),r=base.apply(this,arguments);if(s&&t&&JSON.stringify(t.dieProgression||{})!==before){ensure(s);const x=s.achievementStats;x.dieUpgrades++;x.seasons[s.season].die++;[4,5,6].forEach(star=>{if(beforeStars<star&&n(t.stars)>=star)x.starMilestones[star]=true;});const got=evaluate(s);llSave();celebrate(got);}return r;});wrap('llV2FinalizeSeason',base=>function(){const s=lexLeague.state,r=base.apply(this,arguments);if(!s)return r;ensure(s);const x=s.achievementStats,summary=s.lastSeasonSummary||{},country=s.playerCountry||'TUR',league=summary.playerLeague||llTeamLeague(s.playerTeam),countrySummary=summary.countrySummaries?.[country]||{},rows=league==='first'?(countrySummary.tier2Rows||summary.firstRows||[]):(countrySummary.tier1Rows||summary.superRows||[]),row=rows.find(v=>v.team===s.playerTeam),position=row?.position||rows.findIndex(v=>v.team===s.playerTeam)+1;if(position>0){const drop=league==='super'?Math.max(0,n(countrySummary.rules?.relegateCount,3)):4;if(position<=Math.max(1,rows.length-drop))x.survived=1;if(league==='first'&&position>=3&&position<=7)x.playoff=1;}if((summary.promoted||[]).includes(s.playerTeam))x.promotions=1;if(['ucl','uel','uecl'].some(k=>(summary.qualifications?.[k]||[]).includes(s.playerTeam)))x.euroQualified=1;if(position===1)x.leagueTitles=1;const freshTrophies=(s.trophies||[]).slice(n(x.trophyBaseline));x.trophyBaseline=(s.trophies||[]).length;if(freshTrophies.some(v=>/Kupa/i.test(v?.name||'')))x.cupTitles=1;if(freshTrophies.some(v=>/Şampiyonlar|Avrupa Ligi|Konferans/.test(v?.name||'')))x.euroTitles=1;if(typeof globalThis.llManagerProfileCaptureSeason==='function')globalThis.llManagerProfileCaptureSeason(s,summary);const got=evaluate(s);llSave();celebrate(got);return r;});}
install();
// Sezon sonu sayaclari, mevcut finalizer calistiktan sonra tek sefer islenir.
// Bu isaret, sezon sonu ekrani tekrar render edilse bile ikinci kez odul/sayac yazilmasini engeller.
(function installSeasonAchievementExtension(){
  const base=globalThis.llV2FinalizeSeason;
  if(typeof base!=='function'||base.__daSeasonExtension)return;
  const extended=function(){
    const result=base.apply(this,arguments),s=globalThis.lexLeague?.state;
    if(!s)return result;
    ensure(s);
    const x=s.achievementStats,ex=x.expansion,summary=s.lastSeasonSummary||{},seasonId=n(summary.season||s.season),season=x.seasons[seasonId]||(x.seasons[seasonId]={wins:0,derby:0,die:0,matches:0,losses:0,cleanSheets:0}),exSeason=ex.seasons[seasonId]||(ex.seasons[seasonId]={matches:0,losses:0});
    if(!ex.completedSeasonIds.includes(seasonId)){
      ex.completedSeasonIds.push(seasonId);
      ex.completedSeasons++;
      if(n(exSeason.matches)>0&&s.seasonGoals?.season===seasonId&&s.seasonGoals.items?.some(goal=>goal?.id==='club_primary'&&goal.achieved))ex.clubTargets++;
      if(n(exSeason.matches)>0&&n(exSeason.losses)===0)ex.invincibleSeasons++;
      if(s.cup?.winner===s.playerTeam&&!ex.cupTitleSeasonIds.includes(seasonId)){ex.cupTitleSeasonIds.push(seasonId);ex.cupTitles=ex.cupTitleSeasonIds.length;}
      const leagueKey=`${summary.playerCountry||s.playerCountry||'TUR'}|${summary.playerLeague||llTeamLeague(s.playerTeam)||'super'}`;
      ex.leagueTenure.run=ex.leagueTenure.key===leagueKey?n(ex.leagueTenure.run)+1:1;
      ex.leagueTenure.key=leagueKey;
      ex.leagueTenure.best=Math.max(n(ex.leagueTenure.best),n(ex.leagueTenure.run));
      const got=evaluate(s);
      if(typeof globalThis.llSave==='function')llSave();
      celebrate(got);
    }
    return result;
  };
  extended.__daSeasonExtension=true;
  globalThis.llV2FinalizeSeason=extended;
})();
const initialState=globalThis.lexLeague?.state;if(initialState){const beforeRules=n(initialState.achievementRulesVersion);const reset=startLiveTracking(initialState);const repaired=beforeRules<ACHIEVEMENT_RULES_VERSION&&n(initialState.achievementRulesVersion)>=ACHIEVEMENT_RULES_VERSION;const reconciled=reconcileCurrentStateAchievement(initialState);if((reset||repaired||reconciled.length)&&typeof llSave==='function')llSave();}
})();
