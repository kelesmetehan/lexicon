/* Lexicon League · Milli Turnuvalar (World Cup + EURO)
 * Integration rules:
 * - additive save migration only
 * - real in-game calendar year (season end year)
 * - fixed FIFA World Cup 2026 / UEFA EURO 2024 templates
 * - existing quiz + dice match engine reused for user matches
 * - club season-end UI is gated until an accepted national tournament is complete
 *
 * Format references used while implementing:
 * FIFA World Cup 2026 Regulations, Articles 12–14 + Annex C.
 * UEFA EURO 2024 Regulations, Article 21 + official tournament groups.
 */
(function(global){
'use strict';

const VERSION=4;
const OFFER_COUNT=5;
const NATIONAL_AP_MULTIPLIER=1.20;
const POSITIONS=['Kaleci','Orta Saha','Forvet'];
const WC_GROUPS={
 A:['Mexico','South Africa','South Korea','Czechia'],
 B:['Canada','Bosnia & Herzegovina','Qatar','Switzerland'],
 C:['Brazil','Morocco','Haiti','Scotland'],
 D:['United States','Paraguay','Australia','Türkiye'],
 E:['Germany','Curaçao','Ivory Coast','Ecuador'],
 F:['Netherlands','Japan','Sweden','Tunisia'],
 G:['Belgium','Egypt','Iran','New Zealand'],
 H:['Spain','Cabo Verde','Saudi Arabia','Uruguay'],
 I:['France','Senegal','Iraq','Norway'],
 J:['Argentina','Algeria','Austria','Jordan'],
 K:['Portugal','DR Congo','Uzbekistan','Colombia'],
 L:['England','Croatia','Ghana','Panama']
};
const EURO_GROUPS={
 A:['Germany','Scotland','Hungary','Switzerland'],
 B:['Spain','Croatia','Italy','Albania'],
 C:['Slovenia','Denmark','Serbia','England'],
 D:['Poland','Netherlands','Austria','France'],
 E:['Belgium','Slovakia','Romania','Ukraine'],
 F:['Türkiye','Georgia','Portugal','Czechia']
};
const TEAM_REGISTRY={
 'Spain':{stars:6,flag:'🇪🇸'},'Argentina':{stars:6,flag:'🇦🇷'},'France':{stars:6,flag:'🇫🇷'},'England':{stars:6,flag:'🏴'},'Brazil':{stars:6,flag:'🇧🇷'},'Morocco':{stars:6,flag:'🇲🇦'},'Portugal':{stars:6,flag:'🇵🇹'},'Belgium':{stars:6,flag:'🇧🇪'},
 'Netherlands':{stars:5,flag:'🇳🇱'},'Mexico':{stars:5,flag:'🇲🇽'},'Colombia':{stars:5,flag:'🇨🇴'},'Germany':{stars:5,flag:'🇩🇪'},'Croatia':{stars:5,flag:'🇭🇷'},'Switzerland':{stars:5,flag:'🇨🇭'},'Italy':{stars:5,flag:'🇮🇹'},'United States':{stars:5,flag:'🇺🇸'},'Japan':{stars:5,flag:'🇯🇵'},'Senegal':{stars:5,flag:'🇸🇳'},'Norway':{stars:5,flag:'🇳🇴'},'Uruguay':{stars:5,flag:'🇺🇾'},
 'Denmark':{stars:4,flag:'🇩🇰'},'Iran':{stars:4,flag:'🇮🇷'},'Austria':{stars:4,flag:'🇦🇹'},'Egypt':{stars:4,flag:'🇪🇬'},'Ecuador':{stars:4,flag:'🇪🇨'},'Türkiye':{stars:4,flag:'🇹🇷'},'Australia':{stars:4,flag:'🇦🇺'},'Algeria':{stars:4,flag:'🇩🇿'},'Canada':{stars:4,flag:'🇨🇦'},'Ivory Coast':{stars:4,flag:'🇨🇮'},'South Korea':{stars:4,flag:'🇰🇷'},'Ukraine':{stars:4,flag:'🇺🇦'},'Paraguay':{stars:4,flag:'🇵🇾'},
 'Poland':{stars:3,flag:'🇵🇱'},'Sweden':{stars:3,flag:'🇸🇪'},'Hungary':{stars:3,flag:'🇭🇺'},'Serbia':{stars:3,flag:'🇷🇸'},'DR Congo':{stars:3,flag:'🇨🇩'},'Scotland':{stars:3,flag:'🏴'},'Panama':{stars:3,flag:'🇵🇦'},'Slovakia':{stars:3,flag:'🇸🇰'},'Czechia':{stars:3,flag:'🇨🇿'},'Romania':{stars:3,flag:'🇷🇴'},'South Africa':{stars:3,flag:'🇿🇦'},
 'Slovenia':{stars:2,flag:'🇸🇮'},'Tunisia':{stars:2,flag:'🇹🇳'},'Saudi Arabia':{stars:2,flag:'🇸🇦'},'Qatar':{stars:2,flag:'🇶🇦'},'Uzbekistan':{stars:2,flag:'🇺🇿'},'Bosnia & Herzegovina':{stars:2,flag:'🇧🇦'},'Iraq':{stars:2,flag:'🇮🇶'},'Cabo Verde':{stars:2,flag:'🇨🇻'},'Ghana':{stars:2,flag:'🇬🇭'},'Albania':{stars:2,flag:'🇦🇱'},'Georgia':{stars:2,flag:'🇬🇪'},'Jordan':{stars:2,flag:'🇯🇴'},
 'Curaçao':{stars:1,flag:'🇨🇼'},'New Zealand':{stars:1,flag:'🇳🇿'},'Haiti':{stars:1,flag:'🇭🇹'}
};
const OBJECTIVE_SPECS={
  1:{label:'Gruptan çık',stage:'group_out'},
  2:{label:'Son 16',stage:'r16'},
  3:{label:'Çeyrek final',stage:'qf'},
  4:{label:'Yarı final',stage:'sf'},
  5:{label:'Final',stage:'final'},
  6:{label:'Şampiyonluk',stage:'champion'}
};
const NATIONAL_LOGO_BASE='https://sachawd.github.io/wc26-assets/national-team-logos/';
const NATIONAL_LOGO_FILES={
  'Albania':'Albania-national-team.png',
  'Algeria':'algeria-national-team.png',
  'Argentina':'argentina-national-team.png',
  'Australia':'australia-national-team.png',
  'Austria':'austria-national-team.png',
  'Belgium':'belgium-national-team.png',
  'Bosnia & Herzegovina':'bosnia-and-herzegovina-national-team.png',
  'Brazil':'brazil-national-team.png',
  'Cabo Verde':'cabo-verde-national-team.png',
  'Canada':'canada-national-team.png',
  'Colombia':'colombia-national-team.png',
  'Croatia':'croatia-national-team.png',
  'Curaçao':'curacao-national-team.png',
  'Czechia':'czechia-national-team.png',
  'DR Congo':'dr-congo-national-team.png',
  'Denmark':'Denmark-national-team.png',
  'Ecuador':'ecuador-national-team.png',
  'Egypt':'egypt-national-team.png',
  'England':'england-national-team.png',
  'France':'france-national-team.png',
  'Germany':'germany-national-team.png',
  'Ghana':'ghana-national-team.png',
  'Haiti':'haiti-national-team.png',
  'Iran':'iran-national-team.png',
  'Iraq':'iraq-national-team.png',
  'Italy':'italy-national-team.png',
  'Ivory Coast':'ivory-coast-national-team.png',
  'Japan':'japan-national-team.png',
  'Jordan':'jordan-national-team.png',
  'Mexico':'mexico-national-team.png',
  'Morocco':'morocco-national-team.png',
  'Netherlands':'netherlands-national-team.png',
  'New Zealand':'new-zealand-national-team.png',
  'Norway':'norway-national-team.png',
  'Panama':'panama-national-team.png',
  'Paraguay':'paraguay-national-team.png',
  'Poland':'Poland-national-team.png',
  'Portugal':'portugal-national-team.png',
  'Qatar':'qatar-national-team.png',
  'Saudi Arabia':'saudi-arabia-national-team.png',
  'Scotland':'scotland-national-team.png',
  'Senegal':'senegal-national-team.png',
  'Serbia':'Serbia-national-team.png',
  'Slovakia':'Slovakia-national-team.png',
  'South Africa':'south-africa-national-team.png',
  'South Korea':'south-korea-national-team.png',
  'Spain':'spain-national-team.png',
  'Sweden':'sweden-national-team.png',
  'Switzerland':'switzerland-national-team.png',
  'Tunisia':'tunisia-national-team.png',
  'Türkiye':'turkiye-national-team.png',
  'Ukraine':'ukraine_national-team.png',
  'United States':'usmnt-national-team.png',
  'Uruguay':'uruguay-national-team.png',
  'Uzbekistan':'uzbekistan-national-team.png'
};
const NATIONAL_LOGO_OVERRIDES={
  'Georgia':'https://commons.wikimedia.org/wiki/Special:FilePath/Georgian_Football_Federation_logo.svg',
  'Hungary':'https://commons.wikimedia.org/wiki/Special:FilePath/Hungarian_Football_Federation_logo.svg',
  'Romania':'https://commons.wikimedia.org/wiki/Special:FilePath/Romania_national_football_team_logo.svg',
  'Slovenia':'https://commons.wikimedia.org/wiki/Special:FilePath/Football_Association_of_Slovenia_logo.svg'
};
const STAGE_LABELS={group:'Grup Aşaması',r32:'Son 32',r16:'Son 16',qf:'Çeyrek Final',sf:'Yarı Final',third:'Üçüncülük Maçı',final:'Final',champion:'Şampiyon'};
const STAGE_ORDER={group:0,group_out:1,r32:2,r16:3,qf:4,sf:5,final:6,champion:7};
const WC_THIRD_MAP=[null,["3E","3J","3I","3F","3H","3G","3L","3K"],["3H","3G","3I","3D","3J","3F","3L","3K"],["3E","3J","3I","3D","3H","3G","3L","3K"],["3E","3J","3I","3D","3H","3F","3L","3K"],["3E","3G","3I","3D","3J","3F","3L","3K"],["3E","3G","3J","3D","3H","3F","3L","3K"],["3E","3G","3I","3D","3H","3F","3L","3K"],["3E","3G","3J","3D","3H","3F","3L","3I"],["3E","3G","3J","3D","3H","3F","3I","3K"],["3H","3G","3I","3C","3J","3F","3L","3K"],["3E","3J","3I","3C","3H","3G","3L","3K"],["3E","3J","3I","3C","3H","3F","3L","3K"],["3E","3G","3I","3C","3J","3F","3L","3K"],["3E","3G","3J","3C","3H","3F","3L","3K"],["3E","3G","3I","3C","3H","3F","3L","3K"],["3E","3G","3J","3C","3H","3F","3L","3I"],["3E","3G","3J","3C","3H","3F","3I","3K"],["3H","3G","3I","3C","3J","3D","3L","3K"],["3C","3J","3I","3D","3H","3F","3L","3K"],["3C","3G","3I","3D","3J","3F","3L","3K"],["3C","3G","3J","3D","3H","3F","3L","3K"],["3C","3G","3I","3D","3H","3F","3L","3K"],["3C","3G","3J","3D","3H","3F","3L","3I"],["3C","3G","3J","3D","3H","3F","3I","3K"],["3E","3J","3I","3C","3H","3D","3L","3K"],["3E","3G","3I","3C","3J","3D","3L","3K"],["3E","3G","3J","3C","3H","3D","3L","3K"],["3E","3G","3I","3C","3H","3D","3L","3K"],["3E","3G","3J","3C","3H","3D","3L","3I"],["3E","3G","3J","3C","3H","3D","3I","3K"],["3C","3J","3E","3D","3I","3F","3L","3K"],["3C","3J","3E","3D","3H","3F","3L","3K"],["3C","3E","3I","3D","3H","3F","3L","3K"],["3C","3J","3E","3D","3H","3F","3L","3I"],["3C","3J","3E","3D","3H","3F","3I","3K"],["3C","3G","3E","3D","3J","3F","3L","3K"],["3C","3G","3E","3D","3I","3F","3L","3K"],["3C","3G","3E","3D","3J","3F","3L","3I"],["3C","3G","3E","3D","3J","3F","3I","3K"],["3C","3G","3E","3D","3H","3F","3L","3K"],["3C","3G","3J","3D","3H","3F","3L","3E"],["3C","3G","3J","3D","3H","3F","3E","3K"],["3C","3G","3E","3D","3H","3F","3L","3I"],["3C","3G","3E","3D","3H","3F","3I","3K"],["3C","3G","3J","3D","3H","3F","3E","3I"],["3H","3J","3B","3F","3I","3G","3L","3K"],["3E","3J","3I","3B","3H","3G","3L","3K"],["3E","3J","3B","3F","3I","3H","3L","3K"],["3E","3J","3B","3F","3I","3G","3L","3K"],["3E","3J","3B","3F","3H","3G","3L","3K"],["3E","3G","3B","3F","3I","3H","3L","3K"],["3E","3J","3B","3F","3H","3G","3L","3I"],["3E","3J","3B","3F","3H","3G","3I","3K"],["3H","3J","3B","3D","3I","3G","3L","3K"],["3H","3J","3B","3D","3I","3F","3L","3K"],["3I","3G","3B","3D","3J","3F","3L","3K"],["3H","3G","3B","3D","3J","3F","3L","3K"],["3H","3G","3B","3D","3I","3F","3L","3K"],["3H","3G","3B","3D","3J","3F","3L","3I"],["3H","3G","3B","3D","3J","3F","3I","3K"],["3E","3J","3B","3D","3I","3H","3L","3K"],["3E","3J","3B","3D","3I","3G","3L","3K"],["3E","3J","3B","3D","3H","3G","3L","3K"],["3E","3G","3B","3D","3I","3H","3L","3K"],["3E","3J","3B","3D","3H","3G","3L","3I"],["3E","3J","3B","3D","3H","3G","3I","3K"],["3E","3J","3B","3D","3I","3F","3L","3K"],["3E","3J","3B","3D","3H","3F","3L","3K"],["3E","3I","3B","3D","3H","3F","3L","3K"],["3E","3J","3B","3D","3H","3F","3L","3I"],["3E","3J","3B","3D","3H","3F","3I","3K"],["3E","3G","3B","3D","3J","3F","3L","3K"],["3E","3G","3B","3D","3I","3F","3L","3K"],["3E","3G","3B","3D","3J","3F","3L","3I"],["3E","3G","3B","3D","3J","3F","3I","3K"],["3E","3G","3B","3D","3H","3F","3L","3K"],["3H","3G","3B","3D","3J","3F","3L","3E"],["3H","3G","3B","3D","3J","3F","3E","3K"],["3E","3G","3B","3D","3H","3F","3L","3I"],["3E","3G","3B","3D","3H","3F","3I","3K"],["3H","3G","3B","3D","3J","3F","3E","3I"],["3H","3J","3B","3C","3I","3G","3L","3K"],["3H","3J","3B","3C","3I","3F","3L","3K"],["3I","3G","3B","3C","3J","3F","3L","3K"],["3H","3G","3B","3C","3J","3F","3L","3K"],["3H","3G","3B","3C","3I","3F","3L","3K"],["3H","3G","3B","3C","3J","3F","3L","3I"],["3H","3G","3B","3C","3J","3F","3I","3K"],["3E","3J","3B","3C","3I","3H","3L","3K"],["3E","3J","3B","3C","3I","3G","3L","3K"],["3E","3J","3B","3C","3H","3G","3L","3K"],["3E","3G","3B","3C","3I","3H","3L","3K"],["3E","3J","3B","3C","3H","3G","3L","3I"],["3E","3J","3B","3C","3H","3G","3I","3K"],["3E","3J","3B","3C","3I","3F","3L","3K"],["3E","3J","3B","3C","3H","3F","3L","3K"],["3E","3I","3B","3C","3H","3F","3L","3K"],["3E","3J","3B","3C","3H","3F","3L","3I"],["3E","3J","3B","3C","3H","3F","3I","3K"],["3E","3G","3B","3C","3J","3F","3L","3K"],["3E","3G","3B","3C","3I","3F","3L","3K"],["3E","3G","3B","3C","3J","3F","3L","3I"],["3E","3G","3B","3C","3J","3F","3I","3K"],["3E","3G","3B","3C","3H","3F","3L","3K"],["3H","3G","3B","3C","3J","3F","3L","3E"],["3H","3G","3B","3C","3J","3F","3E","3K"],["3E","3G","3B","3C","3H","3F","3L","3I"],["3E","3G","3B","3C","3H","3F","3I","3K"],["3H","3G","3B","3C","3J","3F","3E","3I"],["3H","3J","3B","3C","3I","3D","3L","3K"],["3I","3G","3B","3C","3J","3D","3L","3K"],["3H","3G","3B","3C","3J","3D","3L","3K"],["3H","3G","3B","3C","3I","3D","3L","3K"],["3H","3G","3B","3C","3J","3D","3L","3I"],["3H","3G","3B","3C","3J","3D","3I","3K"],["3C","3J","3B","3D","3I","3F","3L","3K"],["3C","3J","3B","3D","3H","3F","3L","3K"],["3C","3I","3B","3D","3H","3F","3L","3K"],["3C","3J","3B","3D","3H","3F","3L","3I"],["3C","3J","3B","3D","3H","3F","3I","3K"],["3C","3G","3B","3D","3J","3F","3L","3K"],["3C","3G","3B","3D","3I","3F","3L","3K"],["3C","3G","3B","3D","3J","3F","3L","3I"],["3C","3G","3B","3D","3J","3F","3I","3K"],["3C","3G","3B","3D","3H","3F","3L","3K"],["3C","3G","3B","3D","3H","3F","3L","3J"],["3H","3G","3B","3C","3J","3F","3D","3K"],["3C","3G","3B","3D","3H","3F","3L","3I"],["3C","3G","3B","3D","3H","3F","3I","3K"],["3H","3G","3B","3C","3J","3F","3D","3I"],["3E","3J","3B","3C","3I","3D","3L","3K"],["3E","3J","3B","3C","3H","3D","3L","3K"],["3E","3I","3B","3C","3H","3D","3L","3K"],["3E","3J","3B","3C","3H","3D","3L","3I"],["3E","3J","3B","3C","3H","3D","3I","3K"],["3E","3G","3B","3C","3J","3D","3L","3K"],["3E","3G","3B","3C","3I","3D","3L","3K"],["3E","3G","3B","3C","3J","3D","3L","3I"],["3E","3G","3B","3C","3J","3D","3I","3K"],["3E","3G","3B","3C","3H","3D","3L","3K"],["3H","3G","3B","3C","3J","3D","3L","3E"],["3H","3G","3B","3C","3J","3D","3E","3K"],["3E","3G","3B","3C","3H","3D","3L","3I"],["3E","3G","3B","3C","3H","3D","3I","3K"],["3H","3G","3B","3C","3J","3D","3E","3I"],["3C","3J","3B","3D","3E","3F","3L","3K"],["3C","3E","3B","3D","3I","3F","3L","3K"],["3C","3J","3B","3D","3E","3F","3L","3I"],["3C","3J","3B","3D","3E","3F","3I","3K"],["3C","3E","3B","3D","3H","3F","3L","3K"],["3C","3J","3B","3D","3H","3F","3L","3E"],["3C","3J","3B","3D","3H","3F","3E","3K"],["3C","3E","3B","3D","3H","3F","3L","3I"],["3C","3E","3B","3D","3H","3F","3I","3K"],["3C","3J","3B","3D","3H","3F","3E","3I"],["3C","3G","3B","3D","3E","3F","3L","3K"],["3C","3G","3B","3D","3J","3F","3L","3E"],["3C","3G","3B","3D","3J","3F","3E","3K"],["3C","3G","3B","3D","3E","3F","3L","3I"],["3C","3G","3B","3D","3E","3F","3I","3K"],["3C","3G","3B","3D","3J","3F","3E","3I"],["3C","3G","3B","3D","3H","3F","3L","3E"],["3C","3G","3B","3D","3H","3F","3E","3K"],["3H","3G","3B","3C","3J","3F","3D","3E"],["3C","3G","3B","3D","3H","3F","3E","3I"],["3H","3J","3I","3F","3A","3G","3L","3K"],["3E","3J","3I","3A","3H","3G","3L","3K"],["3E","3J","3I","3F","3A","3H","3L","3K"],["3E","3J","3I","3F","3A","3G","3L","3K"],["3E","3G","3J","3F","3A","3H","3L","3K"],["3E","3G","3I","3F","3A","3H","3L","3K"],["3E","3G","3J","3F","3A","3H","3L","3I"],["3E","3G","3J","3F","3A","3H","3I","3K"],["3H","3J","3I","3D","3A","3G","3L","3K"],["3H","3J","3I","3D","3A","3F","3L","3K"],["3I","3G","3J","3D","3A","3F","3L","3K"],["3H","3G","3J","3D","3A","3F","3L","3K"],["3H","3G","3I","3D","3A","3F","3L","3K"],["3H","3G","3J","3D","3A","3F","3L","3I"],["3H","3G","3J","3D","3A","3F","3I","3K"],["3E","3J","3I","3D","3A","3H","3L","3K"],["3E","3J","3I","3D","3A","3G","3L","3K"],["3E","3G","3J","3D","3A","3H","3L","3K"],["3E","3G","3I","3D","3A","3H","3L","3K"],["3E","3G","3J","3D","3A","3H","3L","3I"],["3E","3G","3J","3D","3A","3H","3I","3K"],["3E","3J","3I","3D","3A","3F","3L","3K"],["3H","3J","3E","3D","3A","3F","3L","3K"],["3H","3E","3I","3D","3A","3F","3L","3K"],["3H","3J","3E","3D","3A","3F","3L","3I"],["3H","3J","3E","3D","3A","3F","3I","3K"],["3E","3G","3J","3D","3A","3F","3L","3K"],["3E","3G","3I","3D","3A","3F","3L","3K"],["3E","3G","3J","3D","3A","3F","3L","3I"],["3E","3G","3J","3D","3A","3F","3I","3K"],["3H","3G","3E","3D","3A","3F","3L","3K"],["3H","3G","3J","3D","3A","3F","3L","3E"],["3H","3G","3J","3D","3A","3F","3E","3K"],["3H","3G","3E","3D","3A","3F","3L","3I"],["3H","3G","3E","3D","3A","3F","3I","3K"],["3H","3G","3J","3D","3A","3F","3E","3I"],["3H","3J","3I","3C","3A","3G","3L","3K"],["3H","3J","3I","3C","3A","3F","3L","3K"],["3I","3G","3J","3C","3A","3F","3L","3K"],["3H","3G","3J","3C","3A","3F","3L","3K"],["3H","3G","3I","3C","3A","3F","3L","3K"],["3H","3G","3J","3C","3A","3F","3L","3I"],["3H","3G","3J","3C","3A","3F","3I","3K"],["3E","3J","3I","3C","3A","3H","3L","3K"],["3E","3J","3I","3C","3A","3G","3L","3K"],["3E","3G","3J","3C","3A","3H","3L","3K"],["3E","3G","3I","3C","3A","3H","3L","3K"],["3E","3G","3J","3C","3A","3H","3L","3I"],["3E","3G","3J","3C","3A","3H","3I","3K"],["3E","3J","3I","3C","3A","3F","3L","3K"],["3H","3J","3E","3C","3A","3F","3L","3K"],["3H","3E","3I","3C","3A","3F","3L","3K"],["3H","3J","3E","3C","3A","3F","3L","3I"],["3H","3J","3E","3C","3A","3F","3I","3K"],["3E","3G","3J","3C","3A","3F","3L","3K"],["3E","3G","3I","3C","3A","3F","3L","3K"],["3E","3G","3J","3C","3A","3F","3L","3I"],["3E","3G","3J","3C","3A","3F","3I","3K"],["3H","3G","3E","3C","3A","3F","3L","3K"],["3H","3G","3J","3C","3A","3F","3L","3E"],["3H","3G","3J","3C","3A","3F","3E","3K"],["3H","3G","3E","3C","3A","3F","3L","3I"],["3H","3G","3E","3C","3A","3F","3I","3K"],["3H","3G","3J","3C","3A","3F","3E","3I"],["3H","3J","3I","3C","3A","3D","3L","3K"],["3I","3G","3J","3C","3A","3D","3L","3K"],["3H","3G","3J","3C","3A","3D","3L","3K"],["3H","3G","3I","3C","3A","3D","3L","3K"],["3H","3G","3J","3C","3A","3D","3L","3I"],["3H","3G","3J","3C","3A","3D","3I","3K"],["3C","3J","3I","3D","3A","3F","3L","3K"],["3H","3J","3F","3C","3A","3D","3L","3K"],["3H","3F","3I","3C","3A","3D","3L","3K"],["3H","3J","3F","3C","3A","3D","3L","3I"],["3H","3J","3F","3C","3A","3D","3I","3K"],["3C","3G","3J","3D","3A","3F","3L","3K"],["3C","3G","3I","3D","3A","3F","3L","3K"],["3C","3G","3J","3D","3A","3F","3L","3I"],["3C","3G","3J","3D","3A","3F","3I","3K"],["3H","3G","3F","3C","3A","3D","3L","3K"],["3C","3G","3J","3D","3A","3F","3L","3H"],["3H","3G","3J","3C","3A","3F","3D","3K"],["3H","3G","3F","3C","3A","3D","3L","3I"],["3H","3G","3F","3C","3A","3D","3I","3K"],["3H","3G","3J","3C","3A","3F","3D","3I"],["3E","3J","3I","3C","3A","3D","3L","3K"],["3H","3J","3E","3C","3A","3D","3L","3K"],["3H","3E","3I","3C","3A","3D","3L","3K"],["3H","3J","3E","3C","3A","3D","3L","3I"],["3H","3J","3E","3C","3A","3D","3I","3K"],["3E","3G","3J","3C","3A","3D","3L","3K"],["3E","3G","3I","3C","3A","3D","3L","3K"],["3E","3G","3J","3C","3A","3D","3L","3I"],["3E","3G","3J","3C","3A","3D","3I","3K"],["3H","3G","3E","3C","3A","3D","3L","3K"],["3H","3G","3J","3C","3A","3D","3L","3E"],["3H","3G","3J","3C","3A","3D","3E","3K"],["3H","3G","3E","3C","3A","3D","3L","3I"],["3H","3G","3E","3C","3A","3D","3I","3K"],["3H","3G","3J","3C","3A","3D","3E","3I"],["3C","3J","3E","3D","3A","3F","3L","3K"],["3C","3E","3I","3D","3A","3F","3L","3K"],["3C","3J","3E","3D","3A","3F","3L","3I"],["3C","3J","3E","3D","3A","3F","3I","3K"],["3H","3E","3F","3C","3A","3D","3L","3K"],["3H","3J","3F","3C","3A","3D","3L","3E"],["3H","3J","3E","3C","3A","3F","3D","3K"],["3H","3E","3F","3C","3A","3D","3L","3I"],["3H","3E","3F","3C","3A","3D","3I","3K"],["3H","3J","3E","3C","3A","3F","3D","3I"],["3C","3G","3E","3D","3A","3F","3L","3K"],["3C","3G","3J","3D","3A","3F","3L","3E"],["3C","3G","3J","3D","3A","3F","3E","3K"],["3C","3G","3E","3D","3A","3F","3L","3I"],["3C","3G","3E","3D","3A","3F","3I","3K"],["3C","3G","3J","3D","3A","3F","3E","3I"],["3H","3G","3F","3C","3A","3D","3L","3E"],["3H","3G","3E","3C","3A","3F","3D","3K"],["3H","3G","3J","3C","3A","3F","3D","3E"],["3H","3G","3E","3C","3A","3F","3D","3I"],["3H","3J","3B","3A","3I","3G","3L","3K"],["3H","3J","3B","3A","3I","3F","3L","3K"],["3I","3J","3B","3F","3A","3G","3L","3K"],["3H","3J","3B","3F","3A","3G","3L","3K"],["3H","3G","3B","3A","3I","3F","3L","3K"],["3H","3J","3B","3F","3A","3G","3L","3I"],["3H","3J","3B","3F","3A","3G","3I","3K"],["3E","3J","3B","3A","3I","3H","3L","3K"],["3E","3J","3B","3A","3I","3G","3L","3K"],["3E","3J","3B","3A","3H","3G","3L","3K"],["3E","3G","3B","3A","3I","3H","3L","3K"],["3E","3J","3B","3A","3H","3G","3L","3I"],["3E","3J","3B","3A","3H","3G","3I","3K"],["3E","3J","3B","3A","3I","3F","3L","3K"],["3E","3J","3B","3F","3A","3H","3L","3K"],["3E","3I","3B","3F","3A","3H","3L","3K"],["3E","3J","3B","3F","3A","3H","3L","3I"],["3E","3J","3B","3F","3A","3H","3I","3K"],["3E","3J","3B","3F","3A","3G","3L","3K"],["3E","3G","3B","3A","3I","3F","3L","3K"],["3E","3J","3B","3F","3A","3G","3L","3I"],["3E","3J","3B","3F","3A","3G","3I","3K"],["3E","3G","3B","3F","3A","3H","3L","3K"],["3H","3J","3B","3F","3A","3G","3L","3E"],["3H","3J","3B","3F","3A","3G","3E","3K"],["3E","3G","3B","3F","3A","3H","3L","3I"],["3E","3G","3B","3F","3A","3H","3I","3K"],["3H","3J","3B","3F","3A","3G","3E","3I"],["3I","3J","3B","3D","3A","3H","3L","3K"],["3I","3J","3B","3D","3A","3G","3L","3K"],["3H","3J","3B","3D","3A","3G","3L","3K"],["3I","3G","3B","3D","3A","3H","3L","3K"],["3H","3J","3B","3D","3A","3G","3L","3I"],["3H","3J","3B","3D","3A","3G","3I","3K"],["3I","3J","3B","3D","3A","3F","3L","3K"],["3H","3J","3B","3D","3A","3F","3L","3K"],["3H","3I","3B","3D","3A","3F","3L","3K"],["3H","3J","3B","3D","3A","3F","3L","3I"],["3H","3J","3B","3D","3A","3F","3I","3K"],["3F","3J","3B","3D","3A","3G","3L","3K"],["3I","3G","3B","3D","3A","3F","3L","3K"],["3F","3J","3B","3D","3A","3G","3L","3I"],["3F","3J","3B","3D","3A","3G","3I","3K"],["3H","3G","3B","3D","3A","3F","3L","3K"],["3H","3G","3B","3D","3A","3F","3L","3J"],["3H","3G","3B","3D","3A","3F","3J","3K"],["3H","3G","3B","3D","3A","3F","3L","3I"],["3H","3G","3B","3D","3A","3F","3I","3K"],["3H","3G","3B","3D","3A","3F","3I","3J"],["3E","3J","3B","3A","3I","3D","3L","3K"],["3E","3J","3B","3D","3A","3H","3L","3K"],["3E","3I","3B","3D","3A","3H","3L","3K"],["3E","3J","3B","3D","3A","3H","3L","3I"],["3E","3J","3B","3D","3A","3H","3I","3K"],["3E","3J","3B","3D","3A","3G","3L","3K"],["3E","3G","3B","3A","3I","3D","3L","3K"],["3E","3J","3B","3D","3A","3G","3L","3I"],["3E","3J","3B","3D","3A","3G","3I","3K"],["3E","3G","3B","3D","3A","3H","3L","3K"],["3H","3J","3B","3D","3A","3G","3L","3E"],["3H","3J","3B","3D","3A","3G","3E","3K"],["3E","3G","3B","3D","3A","3H","3L","3I"],["3E","3G","3B","3D","3A","3H","3I","3K"],["3H","3J","3B","3D","3A","3G","3E","3I"],["3E","3J","3B","3D","3A","3F","3L","3K"],["3E","3I","3B","3D","3A","3F","3L","3K"],["3E","3J","3B","3D","3A","3F","3L","3I"],["3E","3J","3B","3D","3A","3F","3I","3K"],["3H","3E","3B","3D","3A","3F","3L","3K"],["3H","3J","3B","3D","3A","3F","3L","3E"],["3H","3J","3B","3D","3A","3F","3E","3K"],["3H","3E","3B","3D","3A","3F","3L","3I"],["3H","3E","3B","3D","3A","3F","3I","3K"],["3H","3J","3B","3D","3A","3F","3E","3I"],["3E","3G","3B","3D","3A","3F","3L","3K"],["3E","3G","3B","3D","3A","3F","3L","3J"],["3E","3G","3B","3D","3A","3F","3J","3K"],["3E","3G","3B","3D","3A","3F","3L","3I"],["3E","3G","3B","3D","3A","3F","3I","3K"],["3E","3G","3B","3D","3A","3F","3I","3J"],["3H","3G","3B","3D","3A","3F","3L","3E"],["3H","3G","3B","3D","3A","3F","3E","3K"],["3H","3G","3B","3D","3A","3F","3E","3J"],["3H","3G","3B","3D","3A","3F","3E","3I"],["3I","3J","3B","3C","3A","3H","3L","3K"],["3I","3J","3B","3C","3A","3G","3L","3K"],["3H","3J","3B","3C","3A","3G","3L","3K"],["3I","3G","3B","3C","3A","3H","3L","3K"],["3H","3J","3B","3C","3A","3G","3L","3I"],["3H","3J","3B","3C","3A","3G","3I","3K"],["3I","3J","3B","3C","3A","3F","3L","3K"],["3H","3J","3B","3C","3A","3F","3L","3K"],["3H","3I","3B","3C","3A","3F","3L","3K"],["3H","3J","3B","3C","3A","3F","3L","3I"],["3H","3J","3B","3C","3A","3F","3I","3K"],["3C","3J","3B","3F","3A","3G","3L","3K"],["3I","3G","3B","3C","3A","3F","3L","3K"],["3C","3J","3B","3F","3A","3G","3L","3I"],["3C","3J","3B","3F","3A","3G","3I","3K"],["3H","3G","3B","3C","3A","3F","3L","3K"],["3H","3G","3B","3C","3A","3F","3L","3J"],["3H","3G","3B","3C","3A","3F","3J","3K"],["3H","3G","3B","3C","3A","3F","3L","3I"],["3H","3G","3B","3C","3A","3F","3I","3K"],["3H","3G","3B","3C","3A","3F","3I","3J"],["3E","3J","3B","3A","3I","3C","3L","3K"],["3E","3J","3B","3C","3A","3H","3L","3K"],["3E","3I","3B","3C","3A","3H","3L","3K"],["3E","3J","3B","3C","3A","3H","3L","3I"],["3E","3J","3B","3C","3A","3H","3I","3K"],["3E","3J","3B","3C","3A","3G","3L","3K"],["3E","3G","3B","3A","3I","3C","3L","3K"],["3E","3J","3B","3C","3A","3G","3L","3I"],["3E","3J","3B","3C","3A","3G","3I","3K"],["3E","3G","3B","3C","3A","3H","3L","3K"],["3H","3J","3B","3C","3A","3G","3L","3E"],["3H","3J","3B","3C","3A","3G","3E","3K"],["3E","3G","3B","3C","3A","3H","3L","3I"],["3E","3G","3B","3C","3A","3H","3I","3K"],["3H","3J","3B","3C","3A","3G","3E","3I"],["3E","3J","3B","3C","3A","3F","3L","3K"],["3E","3I","3B","3C","3A","3F","3L","3K"],["3E","3J","3B","3C","3A","3F","3L","3I"],["3E","3J","3B","3C","3A","3F","3I","3K"],["3H","3E","3B","3C","3A","3F","3L","3K"],["3H","3J","3B","3C","3A","3F","3L","3E"],["3H","3J","3B","3C","3A","3F","3E","3K"],["3H","3E","3B","3C","3A","3F","3L","3I"],["3H","3E","3B","3C","3A","3F","3I","3K"],["3H","3J","3B","3C","3A","3F","3E","3I"],["3E","3G","3B","3C","3A","3F","3L","3K"],["3E","3G","3B","3C","3A","3F","3L","3J"],["3E","3G","3B","3C","3A","3F","3J","3K"],["3E","3G","3B","3C","3A","3F","3L","3I"],["3E","3G","3B","3C","3A","3F","3I","3K"],["3E","3G","3B","3C","3A","3F","3I","3J"],["3H","3G","3B","3C","3A","3F","3L","3E"],["3H","3G","3B","3C","3A","3F","3E","3K"],["3H","3G","3B","3C","3A","3F","3E","3J"],["3H","3G","3B","3C","3A","3F","3E","3I"],["3I","3J","3B","3C","3A","3D","3L","3K"],["3H","3J","3B","3C","3A","3D","3L","3K"],["3H","3I","3B","3C","3A","3D","3L","3K"],["3H","3J","3B","3C","3A","3D","3L","3I"],["3H","3J","3B","3C","3A","3D","3I","3K"],["3C","3J","3B","3D","3A","3G","3L","3K"],["3I","3G","3B","3C","3A","3D","3L","3K"],["3C","3J","3B","3D","3A","3G","3L","3I"],["3C","3J","3B","3D","3A","3G","3I","3K"],["3H","3G","3B","3C","3A","3D","3L","3K"],["3H","3G","3B","3C","3A","3D","3L","3J"],["3H","3G","3B","3C","3A","3D","3J","3K"],["3H","3G","3B","3C","3A","3D","3L","3I"],["3H","3G","3B","3C","3A","3D","3I","3K"],["3H","3G","3B","3C","3A","3D","3I","3J"],["3C","3J","3B","3D","3A","3F","3L","3K"],["3C","3I","3B","3D","3A","3F","3L","3K"],["3C","3J","3B","3D","3A","3F","3L","3I"],["3C","3J","3B","3D","3A","3F","3I","3K"],["3H","3F","3B","3C","3A","3D","3L","3K"],["3C","3J","3B","3D","3A","3F","3L","3H"],["3H","3J","3B","3C","3A","3F","3D","3K"],["3H","3F","3B","3C","3A","3D","3L","3I"],["3H","3F","3B","3C","3A","3D","3I","3K"],["3H","3J","3B","3C","3A","3F","3D","3I"],["3C","3G","3B","3D","3A","3F","3L","3K"],["3C","3G","3B","3D","3A","3F","3L","3J"],["3C","3G","3B","3D","3A","3F","3J","3K"],["3C","3G","3B","3D","3A","3F","3L","3I"],["3C","3G","3B","3D","3A","3F","3I","3K"],["3C","3G","3B","3D","3A","3F","3I","3J"],["3C","3G","3B","3D","3A","3F","3L","3H"],["3H","3G","3B","3C","3A","3F","3D","3K"],["3H","3G","3B","3C","3A","3F","3D","3J"],["3H","3G","3B","3C","3A","3F","3D","3I"],["3E","3J","3B","3C","3A","3D","3L","3K"],["3E","3I","3B","3C","3A","3D","3L","3K"],["3E","3J","3B","3C","3A","3D","3L","3I"],["3E","3J","3B","3C","3A","3D","3I","3K"],["3H","3E","3B","3C","3A","3D","3L","3K"],["3H","3J","3B","3C","3A","3D","3L","3E"],["3H","3J","3B","3C","3A","3D","3E","3K"],["3H","3E","3B","3C","3A","3D","3L","3I"],["3H","3E","3B","3C","3A","3D","3I","3K"],["3H","3J","3B","3C","3A","3D","3E","3I"],["3E","3G","3B","3C","3A","3D","3L","3K"],["3E","3G","3B","3C","3A","3D","3L","3J"],["3E","3G","3B","3C","3A","3D","3J","3K"],["3E","3G","3B","3C","3A","3D","3L","3I"],["3E","3G","3B","3C","3A","3D","3I","3K"],["3E","3G","3B","3C","3A","3D","3I","3J"],["3H","3G","3B","3C","3A","3D","3L","3E"],["3H","3G","3B","3C","3A","3D","3E","3K"],["3H","3G","3B","3C","3A","3D","3E","3J"],["3H","3G","3B","3C","3A","3D","3E","3I"],["3C","3E","3B","3D","3A","3F","3L","3K"],["3C","3J","3B","3D","3A","3F","3L","3E"],["3C","3J","3B","3D","3A","3F","3E","3K"],["3C","3E","3B","3D","3A","3F","3L","3I"],["3C","3E","3B","3D","3A","3F","3I","3K"],["3C","3J","3B","3D","3A","3F","3E","3I"],["3H","3F","3B","3C","3A","3D","3L","3E"],["3H","3E","3B","3C","3A","3F","3D","3K"],["3H","3J","3B","3C","3A","3F","3D","3E"],["3H","3E","3B","3C","3A","3F","3D","3I"],["3C","3G","3B","3D","3A","3F","3L","3E"],["3C","3G","3B","3D","3A","3F","3E","3K"],["3C","3G","3B","3D","3A","3F","3E","3J"],["3C","3G","3B","3D","3A","3F","3E","3I"],["3H","3G","3B","3C","3A","3F","3D","3E"]];
/* UEFA Article 21.05 combination table. Values identify the third-placed group
 * assigned to winners B, C, E and F respectively. */
const EURO_THIRD_MAP={
 ABCD:['A','D','B','C'],ABCE:['A','E','B','C'],ABCF:['A','F','B','C'],ABDE:['D','E','A','B'],ABDF:['D','F','A','B'],ABEF:['E','F','B','A'],ACDE:['E','D','C','A'],ACDF:['F','D','C','A'],ACEF:['E','F','C','A'],ADEF:['E','F','D','A'],BCDE:['E','D','B','C'],BCDF:['F','D','C','B'],BCEF:['F','E','C','B'],BDEF:['F','E','D','B'],CDEF:['F','E','D','C']
};
const ACHIEVEMENTS=[
 {id:'national_first_job',name:'İlk Milli Görev',description:'İlk milli takım turnuva görevine başla.',reward:{ap:30,lp:40}},
 {id:'national_group_out',name:'Gruptan Çık',description:'Dünya Kupası veya EURO grubundan ilk kez çık.',reward:{ap:45,lp:55}},
 {id:'national_wc_qf',name:'Dünya Kupası Çeyrek Finali',description:'Dünya Kupası çeyrek finaline ulaş.',reward:{ap:150,lp:180}},
 {id:'national_wc_final',name:'Dünya Kupası Finali',description:'Dünya Kupası finaline ulaş.',reward:{ap:300,lp:360}},
 {id:'national_wc_champion',name:'Dünya Şampiyonu',description:'FIFA Dünya Kupası’nı kazan.',reward:{ap:600,lp:750}},
 {id:'national_euro_qf',name:'EURO Çeyrek Finali',description:'Avrupa Şampiyonası çeyrek finaline ulaş.',reward:{ap:120,lp:150}},
 {id:'national_euro_final',name:'EURO Finali',description:'Avrupa Şampiyonası finaline ulaş.',reward:{ap:250,lp:300}},
 {id:'national_euro_champion',name:'Avrupa Şampiyonu',description:'UEFA Avrupa Şampiyonası’nı kazan.',reward:{ap:500,lp:600}}
];

function num(v,d=0){v=Number(v);return Number.isFinite(v)?v:d;}
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function esc(value){const s=String(value??'');return typeof global.llEscape==='function'?global.llEscape(s):s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function deep(value){return value==null?value:JSON.parse(JSON.stringify(value));}
function stateNow(){return global.lexLeague?.state||null;}
function save(){if(typeof global.llSave==='function')global.llSave();}
function applyNationalTheme(type){if(typeof global.llSetEuropeMatchTheme==='function')global.llSetEuropeMatchTheme(type==='wc'?'wc':type==='euro'?'euro':null);}
function typeLabel(type){return type==='wc'?'FIFA Dünya Kupası':'UEFA Avrupa Şampiyonası';}
function groupsFor(type){return type==='wc'?WC_GROUPS:EURO_GROUPS;}
function poolFor(type){return Object.values(groupsFor(type)).flat();}
function starsFor(team){return clamp(num(TEAM_REGISTRY[team]?.stars,1),1,6);}
function flagFor(team){return TEAM_REGISTRY[team]?.flag||'🌐';}
function nationalLogoSrc(team){
  if(NATIONAL_LOGO_OVERRIDES[team])return NATIONAL_LOGO_OVERRIDES[team];
  const file=NATIONAL_LOGO_FILES[team];
  return file?NATIONAL_LOGO_BASE+encodeURIComponent(file).replace(/%2F/g,'/'):'';
}
function nationalShort(team){return String(team||'NT').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Za-z0-9]+/g,' ').trim().split(/\s+/).filter(Boolean).map(part=>part[0]||'').join('').slice(0,3).toUpperCase()||'NT';}
function badgeFor(team,variant='table'){
  const label=esc(team||'Milli Takım'),src=nationalLogoSrc(team),short=esc(nationalShort(team)),fallbackValue=flagFor(team)||short;
  const fallback=`<span class="ll-team-logo-fallback ${variant}" aria-label="${label} arması yüklenemedi">${fallbackValue}</span>`;
  if(!src)return `<span class="ll-team-logo-wrap ${variant} logo-missing ll-national-logo-wrap" title="${label}">${fallback}</span>`;
  return `<span class="ll-team-logo-wrap ${variant} ll-national-logo-wrap" title="${label}"><img class="ll-team-logo ${variant}" src="${src}" alt="${label} milli takım arması" loading="eager" decoding="async" referrerpolicy="no-referrer" onerror="this.classList.add('is-failed');this.setAttribute('aria-hidden','true');this.parentElement.classList.add('logo-missing')">${fallback}</span>`;
}
function groupRankMap(type,edition,group){
  if(!edition?.tables?.[group])return {};
  return Object.fromEntries(rankGroup(type,edition.tables[group],edition.groupMatches?.[group]||[]).map((row,index)=>[row.team,index+1]));
}
function allGroupRankMaps(type,edition){const out={};for(const group of Object.keys(groupsFor(type)))out[group]=groupRankMap(type,edition,group);return out;}
function setGroupMovement(type,edition,group,before){
  if(!edition||!group||!before)return;
  const after=groupRankMap(type,edition,group),movement=edition.rankMovement&&typeof edition.rankMovement==='object'?edition.rankMovement:(edition.rankMovement={});
  movement[group]={};
  for(const [team,position] of Object.entries(after)){
    const previous=Number(before[team]);
    if(!Number.isFinite(previous)||previous===position)continue;
    movement[group][team]=position<previous?'up':'down';
  }
}
function setAllGroupMovement(type,edition,beforeMaps){if(!edition||!beforeMaps)return;for(const group of Object.keys(groupsFor(type)))setGroupMovement(type,edition,group,beforeMaps[group]);}
function reconstructedGroupMovement(type,edition,group){
  if(!edition?.tables?.[group])return {};
  const logs=(edition.matchLog||[]).filter(item=>item?.stage==='group'&&item.group===group&&item.played!==false).map(item=>({...item,roundIndex:groupRoundIndex(edition,group,item)})).filter(item=>Number.isInteger(item.roundIndex));
  if(!logs.length)return {};
  const latestRound=Math.max(...logs.map(item=>item.roundIndex)),beforeTable={};(groupsFor(type)[group]||[]).forEach((team,index)=>beforeTable[team]=blankRow(team,index));
  const beforeMatches=[];
  logs.filter(item=>item.roundIndex<latestRound).forEach(item=>{const m={...item,played:true};applyStanding(beforeTable,m.home,m.away,num(m.homeGoals),num(m.awayGoals));beforeMatches.push(m);});
  const before=Object.fromEntries(rankGroup(type,beforeTable,beforeMatches).map((row,index)=>[row.team,index+1]));
  const after=groupRankMap(type,edition,group),out={};
  for(const [name,position] of Object.entries(after)){const previous=Number(before[name]);if(Number.isFinite(previous)&&previous!==position)out[name]=position<previous?'up':'down';}
  return out;
}
function rankArrowHtml(edition,group,team){
  const stored=edition?.rankMovement?.[group];
  const movement=(stored&&Object.prototype.hasOwnProperty.call(stored,team)?stored[team]:null)||reconstructedGroupMovement(edition?.type,edition,group)[team];
  if(movement==='up')return '<span class="ll-national-rank-arrow up" title="Son maç sonrası sıralamada yükseldi" aria-label="Sıralamada yükseldi">▲</span>';
  if(movement==='down')return '<span class="ll-national-rank-arrow down" title="Son maç sonrası sıralamada düştü" aria-label="Sıralamada düştü">▼</span>';
  return '';
}
function objectiveSpecFor(team,type){
  const stars=clamp(starsFor(team),1,6),base=OBJECTIVE_SPECS[stars]||OBJECTIVE_SPECS[1];
  /* WC ve EURO aynı güç merdivenini kullanır. Hedef etiketi ve başarı kontrolü
   * tek kaynaktan gelir; ekrandaki hedef ile değerlendirme birbirinden kopmaz. */
  return {...base,stars,type:type==='wc'?'wc':'euro'};
}
function objectiveFor(team,type){return objectiveSpecFor(team,type).label;}
function groupZoneClass(type,index){if(index<2)return 'champion-zone';if(index===2)return 'playoff-zone';return 'relegation-zone';}
function nationalStageLabel(stage){return STAGE_LABELS[stage]||String(stage||'Turnuva');}
function nationalFixtureOpponent(rec,match){if(!rec?.selectedTeam||!match)return '';return match.home===rec.selectedTeam?match.away:match.away===rec.selectedTeam?match.home:'';}
function nationalFixtureDetail(match){if(!match)return '';const parts=[];if(match.played&&Number.isFinite(Number(match.homeGoals))&&Number.isFinite(Number(match.awayGoals)))parts.push(`${num(match.homeGoals)}-${num(match.awayGoals)}`);if(match.penalties)parts.push(`Penaltılar ${num(match.penalties.home)}-${num(match.penalties.away)}`);return parts.join(' · ');}
function queueNationalOutcomeCinematic(state,rec,outcome,stage,match=null,extraDetail=''){
  if(!state||!rec?.selectedTeam||typeof global.llQueueTrophyAnimation!=='function')return false;
  const team=rec.selectedTeam,trophy=typeLabel(rec.type),stageLabel=nationalStageLabel(stage),opponent=nationalFixtureOpponent(rec,match),score=nationalFixtureDetail(match);
  const detail=[stageLabel,score,extraDetail].filter(Boolean).join(' · '),champion=outcome==='champion';
  return global.llQueueTrophyAnimation({
    key:`national|${num(rec.year)}|${rec.type}|${champion?'champion':'elimination'}|${team}|${champion?'title':stage}`,
    season:num(state.season),kind:champion?'national-tournament-trophy':'national-tournament-elimination',country:'NAT',
    title:champion?(rec.type==='wc'?'Dünya Şampiyonu':'Avrupa Şampiyonu'):(rec.type==='wc'?"Dünya Kupası'ndan Elendi":"Avrupa Şampiyonası'ndan Elendi"),
    name:trophy,
    subtitle:champion?`${team}, ${rec.year} ${trophy} kupasını kaldırdı!`:(stage==='group'?`${team}, grup aşamasında turnuvaya veda etti.`:`${team}, ${stageLabel} aşamasında${opponent?` ${opponent} karşısında`:''} elendi.`),
    detail:detail||stageLabel,team,icon:champion?'🏆':'💔',theme:champion?'celebration':'elimination'
  });
}
function endYearForState(state){
  if(!state)return 0;
  if(typeof global.llCalendarSeasonStartYear==='function')return num(global.llCalendarSeasonStartYear(state))+1;
  const start=num(state.calendarStartYear,2026);return start+Math.max(0,num(state.season,1)-1)+1;
}
function tournamentTypeForEndYear(year){year=num(year);if(year>=2026&&(year-2026)%4===0)return 'wc';if(year>=2024&&(year-2024)%4===0)return 'euro';return null;}
function nextYear(type,fromYear){let y=Math.max(num(fromYear),type==='wc'?2026:2024);while(tournamentTypeForEndYear(y)!==type)y++;return y;}
function seasonTournament(state){const year=endYearForState(state),type=tournamentTypeForEndYear(year);return type?{type,year}:null;}
function recordKey(info){return String(info?.year||0);}
function ensureRoot(state){
  if(!state)return null;
  if(!state.nationalTournaments||typeof state.nationalTournaments!=='object'||Array.isArray(state.nationalTournaments))state.nationalTournaments={version:VERSION,seasons:{},history:[],career:[]};
  const root=state.nationalTournaments;root.version=VERSION;
  if(!root.seasons||typeof root.seasons!=='object'||Array.isArray(root.seasons))root.seasons={};
  if(!Array.isArray(root.history))root.history=[];
  if(!Array.isArray(root.career))root.career=[];
  return root;
}
function ensureRecord(state,create=false){
  const info=seasonTournament(state);if(!info)return null;const root=ensureRoot(state),key=recordKey(info);let rec=root.seasons[key];
  if(!rec&&create){rec=root.seasons[key]={version:VERSION,type:info.type,year:info.year,season:num(state.season),status:'unoffered',offers:[],selectedTeam:null,objective:null,offerGeneratedAt:null,decisionAt:null,clubTeam:null,clubCountry:null,cardSnapshot:null,edition:null,completed:false,noticeSeen:false};}
  if(rec){rec.type=info.type;rec.year=info.year;if(!Array.isArray(rec.offers))rec.offers=[];}
  return rec||null;
}
function unfinishedNationalRecord(state){
  const root=ensureRoot(state);if(!root)return null;
  return Object.values(root.seasons||{}).filter(rec=>rec&&rec.completed!==true&&['pending','accepted','active','rejected'].includes(rec.status)).sort((a,b)=>num(b.year)-num(a.year)||num(b.season)-num(a.season))[0]||null;
}
function activeNationalRecord(state){
  const root=ensureRoot(state);if(!root)return null;
  return Object.values(root.seasons||{}).filter(rec=>rec&&rec.completed!==true&&rec.status==='active'&&rec.edition).sort((a,b)=>num(b.year)-num(a.year)||num(b.season)-num(a.season))[0]||null;
}
function nationalRecordForType(state,type){
  const unfinished=unfinishedNationalRecord(state);if(unfinished?.type===type)return unfinished;
  const current=ensureRecord(state,false);return current?.type===type?current:null;
}
function postContinueNationalRoute(){
  const state=stateNow();if(!state)return false;ensureRoot(state);
  const rec=unfinishedNationalRecord(state)||ensureRecord(state,false);
  if(rec?.status==='active'&&rec.edition&&!rec.completed){renderTournamentTab(rec.type);return true;}
  if(rec?.status==='pending'){renderOffers(rec);return true;}
  if(rec?.status==='accepted'&&state.seasonEnded){initializeManagedEdition(state,rec);renderTournamentTab(rec.type);return true;}
  return false;
}
function latestNationalRecord(state){
  const root=ensureRoot(state);if(!root)return null;
  return Object.values(root.seasons||{}).filter(Boolean).sort((a,b)=>num(b.year)-num(a.year)||num(b.season)-num(a.season))[0]||null;
}
function ensureTeamState(state,name,cards=null){
  if(!state.teams||typeof state.teams!=='object')state.teams={};
  let team=state.teams[name];
  if(!team||typeof team!=='object')team=state.teams[name]={name,stars:starsFor(name),cards:{'Kaleci':null,'Orta Saha':null,'Forvet':null},usedCardFamilies:[],lastResults:[],wins:0,lockedDice:{},aiAp:0,aiLp:0,nextMatchRerolls:0,sixStreaks:{},nextMatchBonuses:{}};
  team.name=name;team.stars=starsFor(name);if(!team.cards||typeof team.cards!=='object')team.cards={'Kaleci':null,'Orta Saha':null,'Forvet':null};
  if(cards)POSITIONS.forEach(pos=>team.cards[pos]=cards[pos]||null);else POSITIONS.forEach(pos=>team.cards[pos]=null);
  team.lockedDice={};team.nextMatchRerolls=0;team.nextMatchBonuses={};team.sixStreaks={};
  team.cardContracts={};POSITIONS.forEach(pos=>{const id=team.cards[pos];if(!id)return;team.cardContracts[pos]={cardId:id,remaining:99,total:99};});
  return team;
}
function nationalCardCount(stars){return stars>=5?3:stars>=3?2:1;}
function nationalCardRarities(stars){
  if(stars<=1)return ['common'];
  if(stars===2)return ['common','rare'];
  if(stars===3)return ['common','rare'];
  if(stars===4)return ['rare','epic','common'];
  if(stars===5)return ['rare','epic','legendary','common'];
  return ['epic','legendary','rare'];
}
function nationalCardScore(card,teamName,pos){
  try{if(typeof global.llAiCardScore==='function')return num(global.llAiCardScore(card,teamName,pos),0);}catch(_){}
  const rarity={common:1,rare:2,epic:3,legendary:4}[card?.rarity]||1;return rarity*100+num(card?.minStar,1)*10;
}
function nationalAiCardsFor(state,name,rec=null){
  const stars=starsFor(name),count=nationalCardCount(stars),seed=`national-cards|${rec?.type||'all'}|${rec?.year||0}|${name}|${stars}`;
  const positions=[...POSITIONS].sort((a,b)=>stableHash(`${seed}|pos|${a}`)-stableHash(`${seed}|pos|${b}`));
  const selected={'Kaleci':null,'Orta Saha':null,'Forvet':null},usedFamilies=new Set(),allowed=new Set(nationalCardRarities(stars));
  for(const pos of positions.slice(0,count)){
    let pool=[];
    try{if(typeof global.llEligibleCards==='function')pool=global.llEligibleCards(name,pos)||[];}catch(_){}
    pool=pool.filter(card=>card&&!card.clubCard&&!card.upgradeOnly&&num(card.minStar,1)<=stars&&allowed.has(card.rarity));
    if(!pool.length){try{if(typeof global.llEligibleCards==='function')pool=(global.llEligibleCards(name,pos)||[]).filter(card=>card&&!card.clubCard&&!card.upgradeOnly&&num(card.minStar,1)<=stars);}catch(_){}}
    pool=pool.filter(card=>{let family=card.name||card.id;try{if(typeof global.llCardFamilyName==='function')family=global.llCardFamilyName(card)||family;}catch(_){}return !usedFamilies.has(family);});
    if(!pool.length)continue;
    pool.sort((a,b)=>nationalCardScore(b,name,pos)-nationalCardScore(a,name,pos)||stableHash(`${seed}|${pos}|${a.id}`)-stableHash(`${seed}|${pos}|${b.id}`)||String(a.id).localeCompare(String(b.id)));
    const strengthRatio=(stars-1)/5,topWindow=Math.max(1,Math.ceil(pool.length*(0.28+strengthRatio*0.30))),candidate=pool[stableHash(`${seed}|pick|${pos}`)%topWindow]||pool[0];
    selected[pos]=candidate.id;let family=candidate.name||candidate.id;try{if(typeof global.llCardFamilyName==='function')family=global.llCardFamilyName(candidate)||family;}catch(_){}usedFamilies.add(family);
  }
  return selected;
}
function ensureAllNationalTeams(state,rec=null){
  Object.keys(TEAM_REGISTRY).forEach(name=>{const team=ensureTeamState(state,name,null);team.usedCardFamilies=[];const cards=nationalAiCardsFor(state,name,rec);ensureTeamState(state,name,cards);team.nationalCardProfile={version:1,type:rec?.type||null,year:num(rec?.year),stars:starsFor(name),cards:{...cards}};});
}
function blankRow(team,seed){return {team,P:0,W:0,D:0,L:0,GF:0,GA:0,GD:0,Pts:0,seed};}
function createTables(type){const out={};Object.entries(groupsFor(type)).forEach(([g,teams])=>{out[g]={};teams.forEach((team,index)=>out[g][team]=blankRow(team,index));});return out;}
function applyStanding(table,home,away,hg,ag){
  const h=table[home],a=table[away];if(!h||!a)return;h.P++;a.P++;h.GF+=hg;h.GA+=ag;a.GF+=ag;a.GA+=hg;h.GD=h.GF-h.GA;a.GD=a.GF-a.GA;
  if(hg>ag){h.W++;a.L++;h.Pts+=3;}else if(hg<ag){a.W++;h.L++;a.Pts+=3;}else{h.D++;a.D++;h.Pts++;a.Pts++;}
}
function updateNationalForm(state,home,away,hg,ag){for(const [name,gf,ga] of [[home,hg,ag],[away,ag,hg]]){const team=state?.teams?.[name];if(!team)continue;team.lastResults=Array.isArray(team.lastResults)?team.lastResults:[];team.lastResults.push(gf>ga?'W':gf===ga?'D':'L');team.lastResults=team.lastResults.slice(-5);if(gf>ga)team.wins=num(team.wins)+1;}}
function nationalResultLp(pg,og,decisionWin=null){try{const r=(typeof LL_COMP_REWARDS!=='undefined'&&LL_COMP_REWARDS?.league)?LL_COMP_REWARDS.league:{win:50,draw:20,loss:5};if(decisionWin===true)return num(r.win);if(decisionWin===false)return num(r.loss);return pg>og?num(r.win):pg===og?num(r.draw):num(r.loss);}catch(_){return pg>og?50:pg===og?20:5;}}
function groupSchedule(teams){return [
 [{home:teams[0],away:teams[1]},{home:teams[2],away:teams[3]}],
 [{home:teams[0],away:teams[2]},{home:teams[3],away:teams[1]}],
 [{home:teams[3],away:teams[0]},{home:teams[1],away:teams[2]}]
];}
function miniStats(teams,matches){const rows={};teams.forEach((t,i)=>rows[t]=blankRow(t,i));matches.filter(m=>teams.includes(m.home)&&teams.includes(m.away)&&m.played).forEach(m=>applyStanding(rows,m.home,m.away,num(m.homeGoals),num(m.awayGoals)));return rows;}
function rankGroup(type,table,matches=[]){
  const rows=Object.values(table||{}).map(r=>({...r,GD:num(r.GF)-num(r.GA)}));
  rows.sort((a,b)=>num(b.Pts)-num(a.Pts));
  const result=[];
  for(let i=0;i<rows.length;){let j=i+1;while(j<rows.length&&num(rows[j].Pts)===num(rows[i].Pts))j++;const tied=rows.slice(i,j);
    if(tied.length===1){result.push(tied[0]);i=j;continue;}
    const mini=miniStats(tied.map(r=>r.team),matches);
    tied.sort((a,b)=>{
      if(type==='wc')return num(mini[b.team]?.Pts)-num(mini[a.team]?.Pts)||num(mini[b.team]?.GD)-num(mini[a.team]?.GD)||num(mini[b.team]?.GF)-num(mini[a.team]?.GF)||num(b.GD)-num(a.GD)||num(b.GF)-num(a.GF)||starsFor(b.team)-starsFor(a.team)||num(a.seed)-num(b.seed)||a.team.localeCompare(b.team,'tr');
      return num(mini[b.team]?.Pts)-num(mini[a.team]?.Pts)||num(mini[b.team]?.GD)-num(mini[a.team]?.GD)||num(mini[b.team]?.GF)-num(mini[a.team]?.GF)||num(b.GD)-num(a.GD)||num(b.GF)-num(a.GF)||num(b.W)-num(a.W)||starsFor(b.team)-starsFor(a.team)||num(a.seed)-num(b.seed)||a.team.localeCompare(b.team,'tr');
    });
    result.push(...tied);i=j;
  }
  return result;
}
function bestThirds(type,edition,count){
  const thirds=[];Object.keys(groupsFor(type)).forEach(g=>{const row=rankGroup(type,edition.tables[g],edition.groupMatches[g])[2];if(row)thirds.push({...row,group:g});});
  thirds.sort((a,b)=>num(b.Pts)-num(a.Pts)||num(b.GD)-num(a.GD)||num(b.GF)-num(a.GF)||(type==='euro'?num(b.W)-num(a.W):0)||starsFor(b.team)-starsFor(a.team)||a.group.localeCompare(b.group));
  return thirds.slice(0,count);
}
function combinations4Letters(){const letters='ABCDEFGHIJKL'.split(''),map={};let n=0;for(let a=0;a<9;a++)for(let b=a+1;b<10;b++)for(let c=b+1;c<11;c++)for(let d=c+1;d<12;d++){n++;map[[letters[a],letters[b],letters[c],letters[d]].join('')]=n;}return map;}
const WC_EXCLUDED_OPTION=combinations4Letters();
function qualifiers(type,edition){
  const slots={};Object.keys(groupsFor(type)).forEach(g=>{const rows=rankGroup(type,edition.tables[g],edition.groupMatches[g]);slots['1'+g]=rows[0]?.team;slots['2'+g]=rows[1]?.team;slots['3'+g]=rows[2]?.team;});return slots;
}
function fixture(id,home,away,stage){return {id,home,away,stage,played:false,winner:null,homeGoals:null,awayGoals:null,penalties:null};}
function buildInitialKnockout(type,edition){
  const q=qualifiers(type,edition);
  if(type==='wc'){
    const best=bestThirds('wc',edition,8),bestGroups=new Set(best.map(r=>r.group)),excluded='ABCDEFGHIJKL'.split('').filter(g=>!bestGroups.has(g)).join(''),option=WC_EXCLUDED_OPTION[excluded],mapping=WC_THIRD_MAP[option];
    if(!option||!mapping)throw new Error('World Cup third-place combination could not be resolved: '+excluded);
    const targetSlots=['1A','1B','1D','1E','1G','1I','1K','1L'],thirdFor={};targetSlots.forEach((slot,i)=>thirdFor[slot]=q[mapping[i]]);
    edition.thirdCombination={qualified:best.map(r=>r.group).join(''),excluded,option,mapping:[...mapping]};
    return [
      fixture('M73',q['2A'],q['2B'],'r32'),fixture('M74',q['1E'],thirdFor['1E'],'r32'),fixture('M75',q['1F'],q['2C'],'r32'),fixture('M76',q['1C'],q['2F'],'r32'),
      fixture('M77',q['1I'],thirdFor['1I'],'r32'),fixture('M78',q['2E'],q['2I'],'r32'),fixture('M79',q['1A'],thirdFor['1A'],'r32'),fixture('M80',q['1L'],thirdFor['1L'],'r32'),
      fixture('M81',q['1D'],thirdFor['1D'],'r32'),fixture('M82',q['1G'],thirdFor['1G'],'r32'),fixture('M83',q['2K'],q['2L'],'r32'),fixture('M84',q['1H'],q['2J'],'r32'),
      fixture('M85',q['1B'],thirdFor['1B'],'r32'),fixture('M86',q['1J'],q['2H'],'r32'),fixture('M87',q['1K'],thirdFor['1K'],'r32'),fixture('M88',q['2D'],q['2G'],'r32')
    ];
  }
  const best=bestThirds('euro',edition,4),key=best.map(r=>r.group).sort().join(''),map=EURO_THIRD_MAP[key];
  if(!map)throw new Error('EURO third-place combination could not be resolved: '+key);
  const [forWB,forWC,forWE,forWF]=map;edition.thirdCombination={qualified:key,mapping:[...map]};
  return [
    fixture('E1',q['1B'],q['3'+forWB],'r16'),fixture('E2',q['1A'],q['2C'],'r16'),fixture('E3',q['1F'],q['3'+forWF],'r16'),fixture('E4',q['2D'],q['2E'],'r16'),
    fixture('E5',q['1E'],q['3'+forWE],'r16'),fixture('E6',q['1D'],q['2F'],'r16'),fixture('E7',q['1C'],q['3'+forWC],'r16'),fixture('E8',q['2A'],q['2B'],'r16')
  ];
}
function winnersById(fixtures){const out={};(fixtures||[]).forEach(f=>out[f.id]=f.winner);return out;}
function buildNextRound(type,stage,fixtures){const w=winnersById(fixtures);
  if(type==='wc'){
    if(stage==='r32')return [fixture('M89',w.M74,w.M77,'r16'),fixture('M90',w.M73,w.M75,'r16'),fixture('M91',w.M76,w.M78,'r16'),fixture('M92',w.M79,w.M80,'r16'),fixture('M93',w.M83,w.M84,'r16'),fixture('M94',w.M81,w.M82,'r16'),fixture('M95',w.M86,w.M88,'r16'),fixture('M96',w.M85,w.M87,'r16')];
    if(stage==='r16')return [fixture('M97',w.M89,w.M90,'qf'),fixture('M98',w.M93,w.M94,'qf'),fixture('M99',w.M91,w.M92,'qf'),fixture('M100',w.M95,w.M96,'qf')];
    if(stage==='qf')return [fixture('M101',w.M97,w.M98,'sf'),fixture('M102',w.M99,w.M100,'sf')];
    if(stage==='sf')return [fixture('M104',w.M101,w.M102,'final')];
  }else{
    if(stage==='r16')return [fixture('E9',w.E1,w.E2,'qf'),fixture('E10',w.E3,w.E4,'qf'),fixture('E11',w.E5,w.E6,'qf'),fixture('E12',w.E7,w.E8,'qf')];
    if(stage==='qf')return [fixture('E13',w.E9,w.E10,'sf'),fixture('E14',w.E11,w.E12,'sf')];
    if(stage==='sf')return [fixture('E15',w.E13,w.E14,'final')];
  }
  return [];
}
function simScore(state,home,away){
  try{if(typeof global.llSimulateMatch==='function'){const r=global.llSimulateMatch(home,away,'national');return {homeGoals:num(r?.homeGoals),awayGoals:num(r?.awayGoals)};}}catch(_){}
  const roll=name=>{const stars=starsFor(name),min=stars<=1?1:stars===2?2:stars===3?3:4,max=stars>=6?7:6;let goals=0;for(let i=0;i<3;i++)goals+=Math.floor(Math.random()*(max-min+1))+min>=5?1:0;return goals;};return {homeGoals:roll(home),awayGoals:roll(away)};
}
function penalty(state,home,away){
  try{if(typeof global.llV12PenaltyShootout==='function'){const p=global.llV12PenaltyShootout(state,home,away);return {home:num(p.player),away:num(p.opponent),winner:p.winner,raw:p};}}catch(_){}
  const hs=starsFor(home),as=starsFor(away),winner=Math.random()<(hs/(hs+as))?home:away;return {home:winner===home?5:4,away:winner===away?5:4,winner};
}
function simulateKnockoutFixture(state,f){const s=simScore(state,f.home,f.away);f.homeGoals=s.homeGoals;f.awayGoals=s.awayGoals;if(s.homeGoals===s.awayGoals){const p=penalty(state,f.home,f.away);f.penalties={home:p.home,away:p.away};f.winner=p.winner;}else f.winner=s.homeGoals>s.awayGoals?f.home:f.away;updateNationalForm(state,f.home,f.away,f.homeGoals,f.awayGoals);f.played=true;return f;}
function createEdition(type,year,managedTeam=null){
  const edition={version:VERSION,type,year,managedTeam,stage:'group',groupRound:0,tables:createTables(type),groupMatches:{},bracket:{},champion:null,runnerUp:null,thirdPlace:null,completed:false,reachedStage:'group',pendingFixtureId:null,matchLog:[],rankMovement:{}};
  Object.entries(groupsFor(type)).forEach(([g,teams])=>{edition.groupMatches[g]=groupSchedule(teams).flatMap((round,roundIndex)=>round.map((m,matchIndex)=>({...m,id:`${g}${roundIndex*2+matchIndex+1}`,group:g,stage:'group',roundIndex,played:false,homeGoals:null,awayGoals:null})));});return edition;
}
function editionGroupForTeam(type,team){for(const [g,teams] of Object.entries(groupsFor(type)))if(teams.includes(team))return g;return null;}
function groupRoundIndex(edition,group,match){
  const explicit=Number(match?.roundIndex);if(Number.isInteger(explicit)&&explicit>=0&&explicit<3)return explicit;
  const matches=edition?.groupMatches?.[group]||[];let index=matches.findIndex(item=>item===match||((match?.id&&item?.id===match.id)||(item?.home===match?.home&&item?.away===match?.away)));
  return index>=0?Math.floor(index/2):null;
}
function simulateGroupMatch(state,edition,m){if(m.played)return;m.played=true;const score=simScore(state,m.home,m.away);m.homeGoals=score.homeGoals;m.awayGoals=score.awayGoals;const roundIndex=groupRoundIndex(edition,m.group,m);if(Number.isInteger(roundIndex))m.roundIndex=roundIndex;applyStanding(edition.tables[m.group],m.home,m.away,m.homeGoals,m.awayGoals);updateNationalForm(state,m.home,m.away,m.homeGoals,m.awayGoals);edition.matchLog.push({stage:'group',group:m.group,roundIndex,...deep(m)});}
function simulateAllGroups(state,edition,skipTeam=null){for(const [g,matches] of Object.entries(edition.groupMatches))for(const m of matches){if(skipTeam&&(m.home===skipTeam||m.away===skipTeam))continue;simulateGroupMatch(state,edition,m);}}
function simulateManagedGroupRoundPeers(state,rec,roundIndex){
  const ed=rec?.edition;if(!ed||!Number.isInteger(Number(roundIndex)))return;
  for(const [group,matches] of Object.entries(ed.groupMatches||{}))for(const match of matches){
    if(groupRoundIndex(ed,group,match)!==Number(roundIndex))continue;
    if(match.home===rec.selectedTeam||match.away===rec.selectedTeam)continue;
    simulateGroupMatch(state,ed,match);
  }
}
function rebuildGroupTables(type,edition){
  if(!edition)return;edition.tables=createTables(type);const nonGroupLogs=(edition.matchLog||[]).filter(item=>item?.stage!=='group'),groupLogs=[];
  for(const [group,matches] of Object.entries(edition.groupMatches||{}))for(const match of matches){if(!match?.played)continue;const roundIndex=groupRoundIndex(edition,group,match);if(Number.isInteger(roundIndex))match.roundIndex=roundIndex;applyStanding(edition.tables[group],match.home,match.away,num(match.homeGoals),num(match.awayGoals));groupLogs.push({stage:'group',group,roundIndex,...deep(match)});}
  groupLogs.sort((a,b)=>num(a.roundIndex)-num(b.roundIndex)||String(a.group).localeCompare(String(b.group))||String(a.id).localeCompare(String(b.id)));edition.matchLog=[...groupLogs,...nonGroupLogs];
}
function repairManagedGroupProgress(state,rec){
  const ed=rec?.edition;if(!state||!rec?.selectedTeam||rec.status!=='active'||!ed||ed.stage!=='group'||ed.completed)return false;
  const completedRounds=clamp(num(ed.groupRound),0,3);let changed=false;
  for(const [group,matches] of Object.entries(ed.groupMatches||{}))for(const match of matches){
    const roundIndex=groupRoundIndex(ed,group,match);if(!Number.isInteger(roundIndex))continue;if(match.roundIndex!==roundIndex){match.roundIndex=roundIndex;changed=true;}
    if(roundIndex>=completedRounds&&match.played){match.played=false;match.homeGoals=null;match.awayGoals=null;match.winner=null;match.penalties=null;changed=true;}
    if(roundIndex<completedRounds&&!match.played&&match.home!==rec.selectedTeam&&match.away!==rec.selectedTeam){simulateGroupMatch(state,ed,match);changed=true;}
  }
  if(changed){ed.rankMovement={};rebuildGroupTables(rec.type,ed);}
  return changed;
}
function stageContainsTeam(fixtures,team){return (fixtures||[]).some(f=>f.home===team||f.away===team);}
function simulateRoundExcept(state,edition,fixtures,team){for(const f of fixtures)if(!(f.home===team||f.away===team))simulateKnockoutFixture(state,f);}
function simulateEditionToEnd(state,edition){
  simulateAllGroups(state,edition,null);let stage=edition.type==='wc'?'r32':'r16',round=buildInitialKnockout(edition.type,edition);edition.bracket[stage]=round;
  while(round.length){round.forEach(f=>simulateKnockoutFixture(state,f));if(stage==='final'){edition.champion=round[0].winner;edition.runnerUp=round[0].home===edition.champion?round[0].away:round[0].home;break;}const next=buildNextRound(edition.type,stage,round);stage=next[0]?.stage||'final';edition.bracket[stage]=next;round=next;}
  if(edition.type==='wc'){
    const sf=edition.bracket.sf||[];if(sf.length===2){const losers=sf.map(f=>f.home===f.winner?f.away:f.home);const third=fixture('M103',losers[0],losers[1],'third');simulateKnockoutFixture(state,third);edition.bracket.third=[third];edition.thirdPlace=third.winner;}
  }
  edition.stage='completed';edition.completed=true;return edition;
}
function activeClubScheduleLength(state){
  try{const comp=typeof global.llMLTeamCompetition==='function'?global.llMLTeamCompetition(state.playerTeam,state):null;if(comp)return num(state.schedules?.[comp.country]?.[comp.tier]?.length); }catch(_){}
  try{const key=typeof global.llTeamLeague==='function'?global.llTeamLeague(state.playerTeam):null;return num(state.schedules?.[key]?.length);}catch(_){return 0;}
}
function remainingLeagueWeeks(state){const total=activeClubScheduleLength(state);return total?Math.max(0,total-num(state.week,1)+1):999;}
function offerTargetStars(state){
  const clubStars=clamp(num(state.teams?.[state.playerTeam]?.stars,3),1,6);let rep=50;
  try{const profile=typeof global.llManagerProfile==='function'?global.llManagerProfile(state):state.managerProfile;rep=num(typeof global.llBoardEffectiveReputation==='function'?global.llBoardEffectiveReputation(state,profile?.reputation):profile?.reputation,50);}catch(_){}
  const repStars=clamp(Math.ceil(rep/17),1,6);let vocabStars=clubStars,total=0,acc=0;
  try{const stats=typeof global.llGetSeasonVocabularyStats==='function'?global.llGetSeasonVocabularyStats():state.seasonVocabularyStats;total=num(stats?.total);acc=total?Math.round(num(stats.correct)/total*100):0;if(total>=10)vocabStars=acc>=85?6:acc>=75?5:acc>=65?4:acc>=55?3:acc>=45?2:1;}catch(_){}
  let careerStars=clubStars;try{const agg=typeof global.llManagerCareerAggregate==='function'?global.llManagerCareerAggregate(state):null;const trophies=Array.isArray(agg?.allTrophies)?agg.allTrophies.length:0;if(trophies>=5)careerStars=Math.min(6,clubStars+1);else if(trophies===0&&rep<40)careerStars=Math.max(1,clubStars-1);}catch(_){}
  return clamp(Math.round((clubStars*2+repStars+vocabStars+careerStars)/5),1,6);
}
function stableHash(text){if(typeof global.llManagerHash==='function')return global.llManagerHash(text);let h=2166136261;for(const ch of String(text)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
function buildOffers(state,rec){
  const target=offerTargetStars(state),seed=`national|${rec.type}|${rec.year}|${state.playerTeam}|${target}`,pool=poolFor(rec.type).map(team=>({team,stars:starsFor(team)})),chosen=[],used=new Set();
  const byStars=level=>pool.filter(item=>item.stars===level&&!used.has(item.team)).sort((a,b)=>stableHash(`${seed}|${level}|${a.team}`)-stableHash(`${seed}|${level}|${b.team}`)||a.team.localeCompare(b.team,'tr'));
  const addLevel=level=>{const item=byStars(clamp(level,1,6))[0];if(!item)return false;used.add(item.team);chosen.push({team:item.team,stars:item.stars,flag:flagFor(item.team),objective:objectiveFor(item.team,rec.type),type:rec.type,year:rec.year});return true;};
  /* Beş teklif tek yıldız bandına yığılmaz. TD seviyesinin altında en az iki farklı güç
   * seviyesi mümkünse özellikle dahil edilir; bir üst seviye ise yalnızca tek slotta denenir. */
  const preferred=target>=6?[6,5,4,3,6]:target<=1?[1,2,1,3,2]:[target,target-1,target-2,target,target+1,target-3,target+2,1,2,3,4,5,6];preferred.forEach(level=>{if(chosen.length<OFFER_COUNT)addLevel(level);});
  if(chosen.length<OFFER_COUNT){
    const rest=pool.filter(item=>!used.has(item.team)).sort((a,b)=>Math.abs(a.stars-target)-Math.abs(b.stars-target)||stableHash(`${seed}|fill|${a.team}`)-stableHash(`${seed}|fill|${b.team}`)||a.team.localeCompare(b.team,'tr'));
    for(const item of rest){if(chosen.length>=OFFER_COUNT)break;used.add(item.team);chosen.push({team:item.team,stars:item.stars,flag:flagFor(item.team),objective:objectiveFor(item.team,rec.type),type:rec.type,year:rec.year});}
  }
  return chosen.slice(0,OFFER_COUNT);
}
function rebalancePendingOffers(state,rec){
  if(!rec||rec.status!=='pending'||rec.offerBalanceVersion===2)return rec;
  rec.offers=buildOffers(state,rec);rec.offerTargetStars=offerTargetStars(state);rec.offerBalanceVersion=2;return rec;
}
function generateOffers(state,rec){if(!rec||rec.status!=='unoffered')return rec;rec.offers=buildOffers(state,rec);if(rec.offers.length!==OFFER_COUNT)throw new Error('Milli takım teklif sayısı 5 olamadı.');rec.status='pending';rec.offerGeneratedAt=new Date().toISOString();rec.offerTargetStars=offerTargetStars(state);rec.offerBalanceVersion=2;save();return rec;}
function shouldTriggerOffer(state){const rec=ensureRecord(state,false);if(rec&&rec.status!=='unoffered')return false;const info=seasonTournament(state);if(!info||state.seasonEnded)return false;const remaining=remainingLeagueWeeks(state);return remaining>0&&remaining<=5;}
function activeCardsSnapshot(state,clubTeam){const team=state.teams?.[clubTeam]||{},out={};POSITIONS.forEach(pos=>{const id=team.cards?.[pos]||null;let active=!!id;try{if(id&&typeof global.llCardContractSlotActive==='function')active=!!global.llCardContractSlotActive(team,pos);}catch(_){}out[pos]=active?id:null;});return out;}
function unlockAchievement(state,id,team){
  const def=ACHIEVEMENTS.find(a=>a.id===id);if(!def)return null;if(!state.achievements||typeof state.achievements!=='object')state.achievements={version:2,unlocked:{}};if(!state.achievements.unlocked||typeof state.achievements.unlocked!=='object')state.achievements.unlocked={};if(state.achievements.unlocked[id])return null;
  const entry={season:num(state.season),team:team||state.playerTeam,at:new Date().toISOString(),source:'national-tournament',reward:{...def.reward}};state.achievements.unlocked[id]=entry;state.ap=num(state.ap)+num(def.reward.ap);state.lp=num(state.lp)+num(def.reward.lp);
  try{if(typeof global.llAchievementCinematic==='function'){const show=()=>global.llAchievementCinematic([{...def,entry}]),nationalTrophyPending=Array.isArray(state.achievementCinematics?.queue)&&state.achievementCinematics.queue.some(item=>String(item?.kind||'').startsWith('national-tournament-'));if(nationalTrophyPending&&typeof global.setTimeout==='function')global.setTimeout(show,220);else show();}}catch(_){}return def;
}
function registerAchievements(){const list=global.LL_ACHIEVEMENTS;if(!Array.isArray(list))return;ACHIEVEMENTS.forEach(def=>{if(!list.some(x=>x?.id===def.id))list.push({...def,check:()=>false,progress:()=> 'Milli turnuvada canlı olarak açılır'});});}
function markReached(state,rec,stage){
  const ed=rec.edition;if(!ed)return;const current=STAGE_ORDER[ed.reachedStage]??0,next=STAGE_ORDER[stage]??0;if(next>current)ed.reachedStage=stage;
  const team=rec.selectedTeam;if(stage==='r32'||stage==='r16')unlockAchievement(state,'national_group_out',team);
  if(stage==='qf')unlockAchievement(state,rec.type==='wc'?'national_wc_qf':'national_euro_qf',team);
  if(stage==='final')unlockAchievement(state,rec.type==='wc'?'national_wc_final':'national_euro_final',team);
  if(stage==='champion')unlockAchievement(state,rec.type==='wc'?'national_wc_champion':'national_euro_champion',team);
}
function stageObjectiveMet(rec){const reached=rec.edition?.reachedStage||'group',needed=objectiveSpecFor(rec.selectedTeam,rec.type).stage;return (STAGE_ORDER[reached]??0)>=(STAGE_ORDER[needed]??99);}
function managerReputationReward(state,rec){
  try{if(typeof global.llManagerProfile!=='function')return;const p=global.llManagerProfile(state);let delta=stageObjectiveMet(rec)?5:0;const reached=rec.edition?.reachedStage;if(reached==='final')delta+=10;if(reached==='champion')delta+=15;p.reputation=clamp(num(p.reputation,50)+delta,0,100);p.reputationEvents=Array.isArray(p.reputationEvents)?p.reputationEvents:[];if(delta)p.reputationEvents.push({season:state.season,delta,reason:`${typeLabel(rec.type)} · ${rec.selectedTeam} · ${STAGE_LABELS[reached]||reached}`});}catch(_){}
}
function restoreClub(state,rec){if(!rec?.clubTeam)return;state.playerTeam=rec.clubTeam;if(rec.clubCountry)state.playerCountry=rec.clubCountry;try{if(typeof global.llMLAttachLegacyAliases==='function')global.llMLAttachLegacyAliases(state);}catch(_){}state.pendingFixture=null;}
function archiveEdition(state,rec){
  const root=ensureRoot(state),ed=rec.edition,historyItem={year:rec.year,type:rec.type,champion:ed?.champion||null,runnerUp:ed?.runnerUp||null,thirdPlace:ed?.thirdPlace||null,managedTeam:rec.selectedTeam||null,objective:rec.objective||null,reachedStage:ed?.reachedStage||null,objectiveMet:rec.selectedTeam?stageObjectiveMet(rec):null,season:num(state.season)};
  const idx=root.history.findIndex(x=>num(x.year)===num(rec.year)&&x.type===rec.type);if(idx>=0)root.history[idx]=historyItem;else root.history.push(historyItem);
  if(rec.selectedTeam){const cidx=root.career.findIndex(x=>num(x.year)===num(rec.year)&&x.type===rec.type);if(cidx>=0)root.career[cidx]=historyItem;else root.career.push(historyItem);}
  return historyItem;
}
function finishEdition(state,rec){
  if(!rec||rec.completed)return;const ed=rec.edition;if(ed?.champion===rec.selectedTeam)markReached(state,rec,'champion');
  managerReputationReward(state,rec);archiveEdition(state,rec);restoreClub(state,rec);/* Kulüp teklifleri milli turnuva bitmeden görünmez; mevcut finalizer bunları önceden hazırlamışsa güncel milli kariyer/itibar ile yeniden üretilebilsin. */state.managerMarket=null;rec.completed=true;rec.status='completed';rec.completedAt=new Date().toISOString();rec.noticeSeen=false;save();
}
function initializeManagedEdition(state,rec){
  rec.clubTeam=state.playerTeam;rec.clubCountry=state.playerCountry||null;rec.cardSnapshot=activeCardsSnapshot(state,rec.clubTeam);ensureAllNationalTeams(state,rec);ensureTeamState(state,rec.selectedTeam,rec.cardSnapshot);state.playerTeam=rec.selectedTeam;rec.status='active';rec.edition=createEdition(rec.type,rec.year,rec.selectedTeam);rec.edition.clubTeam=rec.clubTeam;rec.edition.cardSnapshot=deep(rec.cardSnapshot);unlockAchievement(state,'national_first_job',rec.selectedTeam);
  prepareNextManagedGroupMatch(state,rec);save();
}
function userGroupRoundMatches(rec,roundIndex){const ed=rec.edition,g=editionGroupForTeam(rec.type,rec.selectedTeam),teams=groupsFor(rec.type)[g],round=groupSchedule(teams)[roundIndex]||[];return {g,round};}
function prepareNextManagedGroupMatch(state,rec){
  const ed=rec.edition;if(ed.groupRound>=3){completeManagedGroup(state,rec);return;}
  const {g,round}=userGroupRoundMatches(rec,ed.groupRound);for(const pair of round){const m=ed.groupMatches[g].find(x=>x.home===pair.home&&x.away===pair.away);if(!m||!(m.home===rec.selectedTeam||m.away===rec.selectedTeam))continue;ed.pendingFixtureId=m.id;state.pendingFixture={home:m.home,away:m.away,competition:'national',league:'national',roundLabel:`${typeLabel(rec.type)} ${rec.year} · Grup ${g} · ${ed.groupRound+1}. Maç`,nationalTournament:true,nationalType:rec.type,nationalStage:'group',nationalFixtureId:m.id};break;}
}
function completeManagedGroup(state,rec){
  const ed=rec.edition,g=editionGroupForTeam(rec.type,rec.selectedTeam),ranked=rankGroup(rec.type,ed.tables[g],ed.groupMatches[g]),place=ranked.findIndex(r=>r.team===rec.selectedTeam)+1,best=bestThirds(rec.type,ed,rec.type==='wc'?8:4),qualified=place<=2||(place===3&&best.some(r=>r.team===rec.selectedTeam));
  if(!qualified){queueNationalOutcomeCinematic(state,rec,'elimination','group',null,`Grup ${g} · ${place}. sıra`);ed.reachedStage='group';simulateRemainingAfterElimination(state,rec);return;}
  const first=buildInitialKnockout(rec.type,ed),stage=rec.type==='wc'?'r32':'r16';ed.bracket[stage]=first;ed.stage=stage;markReached(state,rec,stage);prepareManagedKnockoutRound(state,rec,stage);
}
function prepareManagedKnockoutRound(state,rec,stage){
  const ed=rec.edition,round=ed.bracket[stage]||[];simulateRoundExcept(state,ed,round,rec.selectedTeam);const userFixture=round.find(f=>!f.played&&(f.home===rec.selectedTeam||f.away===rec.selectedTeam));
  if(userFixture){ed.pendingFixtureId=userFixture.id;state.pendingFixture={home:userFixture.home,away:userFixture.away,competition:'national',league:'national',roundLabel:`${typeLabel(rec.type)} ${rec.year} · ${STAGE_LABELS[stage]}`,nationalTournament:true,nationalType:rec.type,nationalStage:stage,nationalFixtureId:userFixture.id};return;}
  if(!stageContainsTeam(round,rec.selectedTeam)){simulateRemainingAfterElimination(state,rec);return;}
}
function repairManagedKnockoutPending(state,rec){
  const ed=rec?.edition,stage=ed?.stage;
  if(!state||!rec?.selectedTeam||rec.status!=='active'||!ed||ed.completed||!['r32','r16','qf','sf','third','final'].includes(stage))return false;
  const round=Array.isArray(ed.bracket?.[stage])?ed.bracket[stage]:[];
  const userFixture=round.find(f=>!f?.played&&(f?.home===rec.selectedTeam||f?.away===rec.selectedTeam));
  if(!userFixture)return false;
  const pending=state.pendingFixture||null;
  const alreadyCorrect=!!(pending?.nationalTournament&&pending?.nationalFixtureId===userFixture.id&&pending?.home===userFixture.home&&pending?.away===userFixture.away&&pending?.nationalStage===stage);
  ed.pendingFixtureId=userFixture.id;
  if(alreadyCorrect)return false;
  /* Eleme ağacı doğru olduğu halde pendingFixture; ekran geçişi, eski save veya başka bir
   * modül tarafından temizlenmiş olabilir. Bracket'taki oynanmamış kullanıcı maçını tek
   * kaynak kabul edip maça başlama kartını güvenli biçimde yeniden kur. */
  state.pendingFixture={home:userFixture.home,away:userFixture.away,competition:'national',league:'national',roundLabel:`${typeLabel(rec.type)} ${rec.year} · ${STAGE_LABELS[stage]}`,nationalTournament:true,nationalType:rec.type,nationalStage:stage,nationalFixtureId:userFixture.id};
  return true;
}
function advanceAfterKnockoutRound(state,rec,stage){
  const ed=rec.edition,round=ed.bracket[stage]||[];if(round.some(f=>!f.played))return;const userStill=round.some(f=>f.winner===rec.selectedTeam),userFixture=round.find(f=>f.home===rec.selectedTeam||f.away===rec.selectedTeam)||null;
  if(stage==='third'){ed.thirdPlace=round[0]?.winner||null;const final=ed.bracket.final||[];if(final.length&&!final[0].played)simulateKnockoutFixture(state,final[0]);ed.champion=final[0]?.winner||ed.champion;ed.runnerUp=final[0]?(final[0].home===ed.champion?final[0].away:final[0].home):ed.runnerUp;ed.completed=true;ed.stage='completed';finishEdition(state,rec);return;}
  if(stage==='final'){
    ed.champion=round[0].winner;ed.runnerUp=round[0].home===ed.champion?round[0].away:round[0].home;if(userStill){queueNationalOutcomeCinematic(state,rec,'champion','final',userFixture);markReached(state,rec,'champion');}else queueNationalOutcomeCinematic(state,rec,'elimination','final',userFixture);
    if(rec.type==='wc'&&!ed.bracket.third){const sf=ed.bracket.sf||[],losers=sf.map(f=>f.home===f.winner?f.away:f.home),third=fixture('M103',losers[0],losers[1],'third');simulateKnockoutFixture(state,third);ed.bracket.third=[third];ed.thirdPlace=third.winner;}
    ed.completed=true;ed.stage='completed';finishEdition(state,rec);return;
  }
  if(!userStill){
    queueNationalOutcomeCinematic(state,rec,'elimination',stage,userFixture);
    if(rec.type==='wc'&&stage==='sf'){const final=buildNextRound('wc','sf',round);ed.bracket.final=final;final.forEach(f=>simulateKnockoutFixture(state,f));const losers=round.map(f=>f.home===f.winner?f.away:f.home),third=fixture('M103',losers[0],losers[1],'third');ed.bracket.third=[third];ed.stage='third';if(third.home===rec.selectedTeam||third.away===rec.selectedTeam){ed.pendingFixtureId=third.id;state.pendingFixture={home:third.home,away:third.away,competition:'national',league:'national',roundLabel:`${typeLabel(rec.type)} ${rec.year} · ${STAGE_LABELS.third}`,nationalTournament:true,nationalType:rec.type,nationalStage:'third',nationalFixtureId:third.id};return;}}
    simulateRemainingAfterElimination(state,rec);return;}
  const next=buildNextRound(rec.type,stage,round),nextStage=next[0]?.stage;if(!nextStage){simulateRemainingAfterElimination(state,rec);return;}ed.bracket[nextStage]=next;ed.stage=nextStage;markReached(state,rec,nextStage);prepareManagedKnockoutRound(state,rec,nextStage);
}
function simulateRemainingAfterElimination(state,rec){
  const ed=rec.edition;let stage=ed.stage;
  if(stage==='group'){const first=buildInitialKnockout(rec.type,ed);stage=rec.type==='wc'?'r32':'r16';ed.bracket[stage]=first;}
  let round=ed.bracket[stage]||[];
  while(round.length){round.forEach(f=>{if(!f.played)simulateKnockoutFixture(state,f);});if(stage==='final'){ed.champion=round[0].winner;ed.runnerUp=round[0].home===ed.champion?round[0].away:round[0].home;break;}const next=buildNextRound(rec.type,stage,round);stage=next[0]?.stage||'final';ed.bracket[stage]=next;round=next;}
  if(rec.type==='wc'&&!ed.bracket.third){const sf=ed.bracket.sf||[],losers=sf.map(f=>f.home===f.winner?f.away:f.home);if(losers.length===2){const third=fixture('M103',losers[0],losers[1],'third');simulateKnockoutFixture(state,third);ed.bracket.third=[third];ed.thirdPlace=third.winner;}}
  ed.completed=true;ed.stage='completed';finishEdition(state,rec);
}
function findNationalFixture(rec,id){const ed=rec?.edition;if(!ed)return null;for(const matches of Object.values(ed.groupMatches||{})){const m=matches.find(x=>x.id===id);if(m)return m;}for(const round of Object.values(ed.bracket||{})){const f=(round||[]).find(x=>x.id===id);if(f)return f;}return null;}
function findNationalFixtureForMatch(rec,fx,match){
  const byId=findNationalFixture(rec,fx?.nationalFixtureId);if(byId)return byId;
  const home=fx?.home||match?.fixture?.home,away=fx?.away||match?.fixture?.away,stage=fx?.nationalStage||null,ed=rec?.edition;
  if(!ed||!home||!away)return null;
  const same=f=>f&&!f.played&&f.home===home&&f.away===away&&(!stage||f.stage===stage);
  for(const matches of Object.values(ed.groupMatches||{})){const found=(matches||[]).find(same);if(found)return found;}
  for(const round of Object.values(ed.bracket||{})){const found=(round||[]).find(same);if(found)return found;}
  return null;
}
function manualGrammarCounterAdvance(state){if(Number.isFinite(state.relativeClauseOfficialMatches))state.relativeClauseOfficialMatches++;if(Number.isFinite(state.gerundInfinitiveOfficialMatches))state.gerundInfinitiveOfficialMatches++;}
function commitNationalMatch(){
  const state=stateNow(),m=global.lexLeague?.match,rec=activeNationalRecord(state)||ensureRecord(state,false);if(!state||!m||!rec||rec.status!=='active'||!m.resolution||m.committed)return false;const fx=m.fixture||{};
  const target=findNationalFixtureForMatch(rec,fx,m);if(!target){m.committed=false;console.error('[National Tournament] Milli maç kaydı bulunamadı.',{fixture:fx,year:rec.year,type:rec.type,player:m.player,opponent:m.opponent});if(typeof global.alert==='function')global.alert('Milli turnuva maç kaydı eşleşmedi. Maç kaydedilmedi; kariyer kaydın korunuyor.');return false;}
  const explicitNational=!!(fx.nationalTournament||fx.league==='national'||fx.nationalFixtureId||fx.competition==='national');
  const legacyNational=!!(rec.selectedTeam&&m.player===rec.selectedTeam&&target&&!target.played);
  if(!explicitNational&&!legacyNational)return false;
  const stage=fx.nationalStage||target.stage||(target.group?'group':null)||rec.edition?.stage||'group';
  m.committed=true;
  const r=m.resolution,pg=num(r.scoreA),og=num(r.scoreB),homeGoals=m.playerHome?pg:og,awayGoals=m.playerHome?og:pg;
  /* Mevcut kart motorunun maç-sonu zincir etkilerini koru; ancak milli turnuva snapshot kartlarının sözleşme hakkını tüketme. */
  try{if(typeof global.llApplyLocks==='function'){const pt=state.teams?.[m.player],ot=state.teams?.[m.opponent],pc=deep(pt?.cardContracts||{}),oc=deep(ot?.cardContracts||{});global.llApplyLocks(r,m.player,m.opponent);if(pt)pt.cardContracts=pc;if(ot)ot.cardContracts=oc;}}catch(_){}
  target.homeGoals=homeGoals;target.awayGoals=awayGoals;target.played=true;let winner=null,pen=null;
  let groupBeforeMaps=null;
  if(stage==='group'){groupBeforeMaps=allGroupRankMaps(rec.type,rec.edition);const roundIndex=groupRoundIndex(rec.edition,target.group,target);if(Number.isInteger(roundIndex))target.roundIndex=roundIndex;applyStanding(rec.edition.tables[target.group],target.home,target.away,homeGoals,awayGoals);rec.edition.matchLog.push({stage:'group',group:target.group,roundIndex,...deep(target)});simulateManagedGroupRoundPeers(state,rec,Number.isInteger(roundIndex)?roundIndex:num(rec.edition.groupRound));setAllGroupMovement(rec.type,rec.edition,groupBeforeMaps);}
  else{if(homeGoals===awayGoals){const p=penalty(state,target.home,target.away);pen={home:p.home,away:p.away};winner=p.winner;}else winner=homeGoals>awayGoals?target.home:target.away;target.winner=winner;target.penalties=pen;rec.edition.matchLog.push({stage,...deep(target)});}
  updateNationalForm(state,target.home,target.away,homeGoals,awayGoals);
  const userWon=stage==='group'?pg>og:winner===rec.selectedTeam,decisionWin=stage==='group'?null:userWon,lpAward=nationalResultLp(pg,og,decisionWin);state.lp=num(state.lp)+lpAward;
  state.nationalTournaments.matchHistory=Array.isArray(state.nationalTournaments.matchHistory)?state.nationalTournaments.matchHistory:[];state.nationalTournaments.matchHistory.push({season:state.season,year:rec.year,type:rec.type,team:rec.selectedTeam,home:target.home,away:target.away,homeGoals,awayGoals,penalties:pen,stage,userMatch:true,lpAwarded:lpAward});
  manualGrammarCounterAdvance(state);state.pendingFixture=null;
  if(stage==='group'){rec.edition.groupRound++;if(rec.edition.groupRound>=3)completeManagedGroup(state,rec);else prepareNextManagedGroupMatch(state,rec);}else advanceAfterKnockoutRound(state,rec,stage);
  save();renderNationalMatchResult(rec,target,userWon,pen);if(typeof global.llScheduleTrophyAnimation==='function')global.llScheduleTrophyAnimation(90);return true;
}

function simulateRejected(state,rec){ensureAllNationalTeams(state,rec);rec.edition=createEdition(rec.type,rec.year,null);simulateEditionToEnd(state,rec.edition);rec.status='completed';rec.completed=true;rec.completedAt=new Date().toISOString();rec.noticeSeen=false;archiveEdition(state,rec);save();}
function currentOfferRecord(state,create=false){return ensureRecord(state,create);}
function nationalSnapshotCardHtml(pos,id){
  const card=id&&typeof global.llCard==='function'?global.llCard(id):null;
  if(!card)return `<div class="ll-slot ll-national-snapshot-card"><div class="ll-slot-head"><span class="ll-position">${typeof LL_POSITION_ICONS!=='undefined'?LL_POSITION_ICONS[pos]||'': ''} ${esc(pos)}</span><span class="ll-stars">Sabit</span></div><b>Kart yok</b><div class="ll-muted">Turnuva boyunca bu pozisyonda kart bulunmuyor.</div></div>`;
  const readable=typeof global.llCardReadableText==='function'?global.llCardReadableText(card):{trigger:card.trigger||'—',effect:card.effect||'—'};
  const upgrade=typeof global.llCardUpgradeBadgeHtml==='function'?global.llCardUpgradeBadgeHtml(card):'';
  return `<div class="ll-slot ll-national-snapshot-card"><div class="ll-slot-head"><span class="ll-position">${typeof LL_POSITION_ICONS!=='undefined'?LL_POSITION_ICONS[pos]||'': ''} ${esc(pos)}</span><span class="ll-stars">Sabit</span></div><b class="ll-national-card-name">${esc(card.name||'Kart')}</b>${upgrade}<div class="ll-national-card-copy"><span><b>Şart:</b> ${esc(readable?.trigger||card.trigger||'—')}</span><span><b>Etki:</b> ${esc(readable?.effect||card.effect||'—')}</span></div><div class="ll-muted ll-national-card-lock">Turnuva boyunca değişmez · kullanım hakkı tüketmez</div></div>`;
}

function renderOffers(rec){
  const state=stateNow();if(!state||!rec)return;rebalancePendingOffers(state,rec);save();if(typeof global.llSetWide==='function')global.llSetWide(true);applyNationalTheme(rec.type);
  const cards=rec.offers.map(o=>`<button type="button" class="ll-national-offer" onclick="llAcceptNationalOffer('${esc(o.team).replace(/'/g,"\\'")}')">${badgeFor(o.team,'match')}<span><b>${esc(o.team)}</b><small>${o.stars}★ · ${esc(typeLabel(rec.type))} ${rec.year}</small><em>Hedef: ${esc(o.objective)}</em></span></button>`).join('');
  global.llArea().innerHTML=`<div class="ll-shell" data-ll-national-theme="${rec.type}"><div class="ll-panel"><div class="ll-topbar"><div><div class="ll-title">Milli Takım <em>Teklifleri</em></div><div class="ll-muted">${esc(typeLabel(rec.type))} ${rec.year} · Kariyer seviyene göre farklı güç bantlarından 5 teklif</div></div></div><div class="ll-notice"><b>Görev turnuva için geçerlidir.</b> Kabul etsen de kulüp sezonun normal şekilde devam eder. Milli görev, tüm kulüp organizasyonları bittikten sonra başlar.</div><div class="ll-national-offer-grid">${cards}</div><button class="ll-btn danger" style="width:100%;margin-top:14px" onclick="llRejectNationalOffers()">5 Teklifin Tamamını Reddet</button></div></div>`;
}
function renderWinnerNotice(rec){const ed=rec.edition;if(typeof global.llSetWide==='function')global.llSetWide(true);applyNationalTheme(rec.type);global.llArea().innerHTML=`<div class="ll-shell" data-ll-national-theme="${rec.type}"><div class="ll-panel" style="text-align:center"><div style="font-size:60px">🏆</div><div class="quiz-start-title">${esc(typeLabel(rec.type))} ${rec.year}</div><div class="ll-notice" style="margin-top:14px"><b>Şampiyon: ${badgeFor(ed.champion,'table')} ${esc(ed.champion||'—')}</b><br>Milli takım tekliflerini reddettiğin için turnuva yapay zekâ tarafından simüle edildi.</div><button class="ll-btn primary" style="margin-top:16px" onclick="llNationalContinueSeasonEnd()">Sezon Sonuna Devam Et</button></div></div>`;}
function renderManagedCompletionNotice(rec){const ed=rec.edition;if(typeof global.llSetWide==='function')global.llSetWide(true);applyNationalTheme(rec.type);const won=ed?.champion===rec.selectedTeam,objective=stageObjectiveMet(rec);global.llArea().innerHTML=`<div class="ll-shell" data-ll-national-theme="${rec.type}"><div class="ll-panel" style="text-align:center"><div style="font-size:60px">${won?'🏆':'🌍'}</div><div class="quiz-start-title">${esc(typeLabel(rec.type))} ${rec.year} <em>Tamamlandı</em></div><div class="ll-metrics" style="max-width:760px;margin:18px auto"><div class="ll-metric"><strong>${badgeFor(rec.selectedTeam,'table')} ${esc(rec.selectedTeam)}</strong><span>Milli Takım</span></div><div class="ll-metric"><strong>${esc(STAGE_LABELS[ed?.reachedStage]||ed?.reachedStage||'—')}</strong><span>Ulaşılan Aşama</span></div><div class="ll-metric"><strong>${objective?'✓ Başarılı':'✗ Ulaşılamadı'}</strong><span>Hedef: ${esc(rec.objective||'—')}</span></div><div class="ll-metric"><strong>${badgeFor(ed?.champion,'table')} ${esc(ed?.champion||'—')}</strong><span>Şampiyon</span></div></div><div class="ll-notice"><b>Milli takım sözleşmen sona erdi.</b><br>Şimdi mevcut kulüp kariyerinin normal sezon sonu ve teklif akışına dönülecek.</div><button class="ll-btn primary" style="margin-top:16px" onclick="llNationalContinueSeasonEnd()">Sezon Sonuna Geç</button></div></div>`;}
function renderNationalMatchResult(rec,target,userWon,pen){const state=stateNow(),ed=rec.edition;if(typeof global.llSetWide==='function')global.llSetWide(true);applyNationalTheme(rec.type);const ptxt=pen?` · Penaltılar ${pen.home}-${pen.away}`:'';const completed=rec.completed;global.llArea().innerHTML=`<div class="ll-shell" data-ll-national-theme="${rec.type}"><div class="ll-panel" style="text-align:center"><div class="quiz-start-title">${userWon?'Maç Tamamlandı':'Maç Sonucu'}</div><div class="ll-next-match" style="margin:16px auto;max-width:760px"><div class="ll-club"><div>${badgeFor(target.home,'match')}</div><b>${esc(target.home)}</b></div><div class="ll-vs">${target.homeGoals} - ${target.awayGoals}${esc(ptxt)}</div><div class="ll-club"><div>${badgeFor(target.away,'match')}</div><b>${esc(target.away)}</b></div></div>${completed?`<div class="ll-notice"><b>${esc(typeLabel(rec.type))} tamamlandı.</b><br>Şampiyon: ${badgeFor(ed.champion,'table')} ${esc(ed.champion||'—')}</div><button class="ll-btn primary" onclick="llNationalContinueSeasonEnd()">Sezon Sonuna Geç</button>`:`<button class="ll-btn primary" onclick="llRenderNationalTournaments('${rec.type}')">Turnuvaya Dön</button>`}</div></div>`;}
function tableHtml(rec,g){const ed=rec.edition,rows=ed?rankGroup(rec.type,ed.tables[g],ed.groupMatches[g]):(groupsFor(rec.type)[g]||[]).map((team,i)=>blankRow(team,i)),qualCount=2;return `<div class="ll-card"><div class="ll-card-title">Grup ${g}</div><div class="ll-table-wrap"><table class="ll-table ll-national-table"><thead><tr><th>#</th><th>Takım</th><th>O</th><th>G</th><th>B</th><th>M</th><th>AG</th><th>YG</th><th>AV</th><th>P</th></tr></thead><tbody>${rows.map((r,i)=>`<tr class="${r.team===rec.selectedTeam?'player ':''}${groupZoneClass(rec.type,i)}"><td>${i+1}</td><td><span class="ll-standing-team">${badgeFor(r.team,'table')}<span class="ll-standing-team-name" title="${esc(r.team)}">${esc(r.team)}</span>${rankArrowHtml(ed,g,r.team)}<span class="ll-standing-stars">${starsFor(r.team)}★</span></span></td><td>${r.P}</td><td>${r.W}</td><td>${r.D}</td><td>${r.L}</td><td>${r.GF}</td><td>${r.GA}</td><td>${r.GD}</td><td><b>${r.Pts}</b></td></tr>`).join('')}</tbody></table></div></div>`;}
function scoreText(f){if(!f?.played)return 'VS';return `${num(f.homeGoals)}-${num(f.awayGoals)}${f.penalties?` (P ${num(f.penalties.home)}-${num(f.penalties.away)})`:''}`;}
function bracketHtml(rec){const ed=rec.edition;if(!ed)return '';const order=rec.type==='wc'?['r32','r16','qf','sf','third','final']:['r16','qf','sf','final'];return `<div class="ll-national-bracket">${order.filter(stage=>ed.bracket[stage]?.length).map(stage=>`<div class="ll-national-round"><h4>${STAGE_LABELS[stage]}</h4>${ed.bracket[stage].map(f=>`<div class="ll-national-bracket-match ${f.home===rec.selectedTeam||f.away===rec.selectedTeam?'player':''}"><span>${badgeFor(f.home,'table')} ${esc(f.home||'—')}</span><b>${esc(scoreText(f))}</b><span>${badgeFor(f.away,'table')} ${esc(f.away||'—')}</span></div>`).join('')}</div>`).join('')}</div>`;}
function historyHtml(root,type){const rows=(root.history||[]).filter(x=>x.type===type).sort((a,b)=>num(b.year)-num(a.year));return rows.length?`<div class="ll-table-wrap"><table class="ll-table"><thead><tr><th>Yıl</th><th>Şampiyon</th><th>Finalist</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${r.year}</td><td>${badgeFor(r.champion,'table')} <b>${esc(r.champion||'—')}</b></td><td>${badgeFor(r.runnerUp,'table')} ${esc(r.runnerUp||'—')}</td></tr>`).join('')}</tbody></table></div>`:'<div class="ll-muted">Henüz tamamlanmış turnuva yok.</div>';}
function renderTournamentTab(type){
  const state=stateNow();if(!state)return;const root=ensureRoot(state),rec=nationalRecordForType(state,type);let repaired=false;if(rec?.status==='active'&&rec?.edition?.stage==='group')repaired=repairManagedGroupProgress(state,rec)||repaired;if(rec?.status==='active'&&rec?.edition?.stage!=='group')repaired=repairManagedKnockoutPending(state,rec)||repaired;if(repaired)save();const active=rec&&rec.type===type&&['active','completed'].includes(rec.status)?rec:null,accepted=rec&&rec.type===type&&rec.status==='accepted'?rec:null,year=endYearForState(state),currentType=tournamentTypeForEndYear(year),currentSeasonRec=ensureRecord(state,false),currentRec=currentSeasonRec&&currentSeasonRec.type===type&&num(currentSeasonRec.year)===num(year)?currentSeasonRec:null,next=(active&&!active.completed)?num(active.year):(currentType===type&&currentRec?.status!=='completed')?year:nextYear(type,year+(currentType===type?1:0));if(typeof global.llSetWide==='function')global.llSetWide(true);applyNationalTheme(type);
  const tabs=`<div class="ll-subtabs"><button class="ll-btn ${type==='wc'?'primary':''}" onclick="llRenderNationalTournaments('wc')">Dünya Kupası</button><button class="ll-btn ${type==='euro'?'primary':''}" onclick="llRenderNationalTournaments('euro')">Avrupa Şampiyonası</button></div>`;
  let content='';
  if(active?.edition){const ed=active.edition,groupCards=Object.keys(groupsFor(type)).map(g=>tableHtml(active,g)).join(''),team=active.selectedTeam;content=`<div class="ll-cup-status"><div class="ll-metric"><strong>${ed.completed?'Tamamlandı':STAGE_LABELS[ed.stage]||ed.stage}</strong><span>Durum</span></div><div class="ll-metric"><strong>${team?`${badgeFor(team,'table')} ${esc(team)}`:'AI'}</strong><span>Yönetilen Takım</span></div><div class="ll-metric"><strong>${team?objectiveFor(team,type):'—'}</strong><span>Hedef</span></div><div class="ll-metric"><strong>${ed.champion?`${badgeFor(ed.champion,'table')} ${esc(ed.champion)}`:'—'}</strong><span>Şampiyon</span></div></div>${team&&active.cardSnapshot?`<div class="ll-card" style="margin-top:14px"><div class="ll-card-title">Turnuva Kart Snapshot'ı</div><div class="ll-squad">${POSITIONS.map(pos=>nationalSnapshotCardHtml(pos,active.cardSnapshot?.[pos])).join('')}</div></div>`:''}${team&&!ed.completed&&state.pendingFixture?.nationalTournament?`<div class="ll-card ll-national-next"><div class="ll-card-title">Sıradaki Milli Maç</div><div class="ll-next-match"><div class="ll-club">${badgeFor(state.pendingFixture.home,'match')}<b>${esc(state.pendingFixture.home)}</b></div><div class="ll-vs">VS</div><div class="ll-club">${badgeFor(state.pendingFixture.away,'match')}<b>${esc(state.pendingFixture.away)}</b></div></div><button class="ll-btn primary" style="width:100%;margin-top:12px" onclick="llStartMatchPreparation()">10 Kelimelik Milli Maça Başla</button><div class="ll-muted" style="margin-top:8px">Milli maçlarda normal lig kelime AP’si +%20. Turnuva başında alınan üç aktif kart sabittir ve kullanım hakkı tüketmez.</div></div>`:''}<div class="ll-card" style="margin-top:14px"><div class="ll-card-title">Gruplar</div><div class="ll-national-groups">${groupCards}</div></div>${bracketHtml(active)?`<div class="ll-card" style="margin-top:14px"><div class="ll-card-title">Eleme Ağacı</div>${bracketHtml(active)}</div>`:''}`;}
  else{const last=(root.history||[]).filter(x=>x.type===type).sort((a,b)=>num(b.year)-num(a.year))[0],acceptedHtml=accepted?`<div class="ll-notice" style="margin-top:14px"><b>${badgeFor(accepted.selectedTeam,'table')} ${esc(accepted.selectedTeam)} görevi kabul edildi.</b><br>${esc(typeLabel(type))} ${accepted.year} görevi, mevcut kulüp sezonundaki tüm resmi organizasyonlar tamamlandıktan sonra başlayacak. Hedef: <b>${esc(accepted.objective||objectiveFor(accepted.selectedTeam,type))}</b>.</div>`:'';content=`<div class="ll-cup-status"><div class="ll-metric"><strong>${last?`${badgeFor(last.champion,'table')} ${esc(last.champion)}`:'—'}</strong><span>Son Şampiyon</span></div><div class="ll-metric"><strong>${last?.year||'—'}</strong><span>Son Turnuva</span></div><div class="ll-metric"><strong>${next}</strong><span>${currentType===type&&currentRec?.status!=='completed'?'Bu Sezon':'Sonraki Turnuva'}</span></div></div>${acceptedHtml}<div class="ll-card" style="margin-top:14px"><div class="ll-card-title">Sabit Turnuva Şablonu</div><div class="ll-sub">${type==='wc'?'2026 FIFA Dünya Kupası · 48 takım · 12 grup · ilk 2 + en iyi 8 üçüncü':'EURO 2024 · 24 takım · 6 grup · ilk 2 + en iyi 4 üçüncü'}</div><div class="ll-national-groups" style="margin-top:12px">${Object.keys(groupsFor(type)).map(g=>tableHtml({type,selectedTeam:null,edition:null},g)).join('')}</div></div>`;}
  global.llArea().innerHTML=`<div class="ll-shell" data-ll-national-theme="${type}"><div class="ll-panel"><div class="ll-topbar"><div><div class="ll-title">Milli <em>Turnuvalar</em></div><div class="ll-muted">Gerçek sezon takvimine bağlı Dünya Kupası ve Avrupa Şampiyonası</div></div><button class="ll-btn" onclick="llNationalGoDashboard()">← Dashboard</button></div>${tabs}${content}<div class="ll-card" style="margin-top:14px"><div class="ll-card-title">Geçmiş Şampiyonlar</div>${historyHtml(root,type)}</div></div></div>`;
}
function renderNationalHome(){const state=stateNow(),root=ensureRoot(state),year=endYearForState(state),nextWC=nextYear('wc',year),nextEuro=nextYear('euro',year);if(typeof global.llSetWide==='function')global.llSetWide(true);applyNationalTheme(null);const lastWC=root.history.filter(x=>x.type==='wc').sort((a,b)=>b.year-a.year)[0],lastEuro=root.history.filter(x=>x.type==='euro').sort((a,b)=>b.year-a.year)[0];global.llArea().innerHTML=`<div class="ll-shell"><div class="ll-panel"><div class="ll-topbar"><div><div class="ll-title">Milli <em>Turnuvalar</em></div><div class="ll-muted">Dünya Kupası ve Avrupa Şampiyonası kariyer merkezi</div></div><button class="ll-btn" onclick="llNationalGoDashboard()">← Dashboard</button></div><div class="ll-subtabs"><button class="ll-btn primary" onclick="llRenderNationalTournaments('wc')">Dünya Kupası</button><button class="ll-btn" onclick="llRenderNationalTournaments('euro')">Avrupa Şampiyonası</button></div><div class="ll-cup-status"><div class="ll-metric"><strong>${lastWC?`${badgeFor(lastWC.champion,'table')} ${esc(lastWC.champion)}`:'—'}</strong><span>Son Dünya Şampiyonu</span></div><div class="ll-metric"><strong>${nextWC}</strong><span>Sonraki Dünya Kupası</span></div><div class="ll-metric"><strong>${lastEuro?`${badgeFor(lastEuro.champion,'table')} ${esc(lastEuro.champion)}`:'—'}</strong><span>Son Avrupa Şampiyonu</span></div><div class="ll-metric"><strong>${nextEuro}</strong><span>Sonraki EURO</span></div></div></div></div>`;}
function renderCareerSection(){const state=stateNow(),career=ensureRoot(state)?.career||[];if(!career.length||typeof document==='undefined')return;const panel=global.llArea?.()?.querySelector('.ll-shell .ll-panel');if(!panel||panel.querySelector('[data-national-career]'))return;panel.insertAdjacentHTML('beforeend',`<div class="ll-card" data-national-career style="margin-top:14px"><div class="ll-card-title">🌍 Milli Takım Kariyeri</div><div class="ll-table-wrap"><table class="ll-table"><thead><tr><th>Yıl</th><th>Turnuva</th><th>Takım</th><th>Hedef</th><th>Sonuç</th></tr></thead><tbody>${career.slice().sort((a,b)=>b.year-a.year).map(x=>`<tr><td>${x.year}</td><td>${esc(typeLabel(x.type))}</td><td>${badgeFor(x.managedTeam,'table')} ${esc(x.managedTeam)}</td><td>${esc(x.objective||'—')}</td><td><b>${x.champion===x.managedTeam?'Şampiyon':STAGE_LABELS[x.reachedStage]||x.reachedStage||'—'}</b></td></tr>`).join('')}</tbody></table></div></div>`);}
function injectDashboardButton(){const area=global.llArea?.();if(!area||area.querySelector('[data-national-nav]'))return;const actions=area.querySelector('.ll-topbar .ll-actions');if(actions)actions.insertAdjacentHTML('beforeend','<button class="ll-btn" data-national-nav onclick="llRenderNationalTournaments()">🌍 Milli Turnuvalar</button>');}
function injectStyles(){if(typeof document==='undefined'||document.getElementById('ll-national-tournaments-css'))return;const style=document.createElement('style');style.id='ll-national-tournaments-css';style.textContent=`.ll-national-logo-wrap{display:inline-grid;place-items:center;vertical-align:middle;background:transparent!important}.ll-national-logo-wrap .ll-team-logo{position:relative;z-index:2;object-fit:contain}.ll-national-logo-wrap .ll-team-logo-fallback{z-index:1}.ll-national-logo-wrap.logo-missing .ll-team-logo-fallback{border:0!important;border-radius:0!important;clip-path:none!important;background:transparent!important;box-shadow:none!important;text-shadow:none!important;color:inherit!important;font-family:"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif!important;font-size:16px!important;letter-spacing:0!important}.ll-national-logo-wrap.logo-missing.match .ll-team-logo-fallback{font-size:28px!important}.ll-national-rank-arrow{display:inline-flex;align-items:center;justify-content:center;width:13px;min-width:13px;font-size:10px;font-weight:900;line-height:1;margin-left:1px}.ll-national-rank-arrow.up{color:#22c55e;text-shadow:0 0 8px rgba(34,197,94,.34)}.ll-national-rank-arrow.down{color:#ef4444;text-shadow:0 0 8px rgba(239,68,68,.28)}.ll-national-offer-grid{display:grid;grid-template-columns:repeat(5,minmax(150px,1fr));gap:10px;margin-top:16px}.ll-national-offer{appearance:none;text-align:left;color:inherit;background:rgba(15,23,42,.58);border:1px solid rgba(45,212,191,.26);border-radius:14px;padding:15px;display:flex;gap:12px;align-items:center;cursor:pointer}.ll-national-offer:hover{border-color:rgba(45,212,191,.72);transform:translateY(-1px)}.ll-national-offer > span:last-child{display:flex;flex-direction:column;gap:4px}.ll-national-offer small,.ll-national-offer em{font-size:12px;color:#94a3b8;font-style:normal}.ll-national-groups{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.ll-national-groups .ll-table-wrap{overflow-x:hidden}.ll-national-table{width:100%;min-width:0!important;table-layout:fixed;font-size:11px}.ll-national-table th,.ll-national-table td{padding:9px 4px}.ll-national-table th:first-child,.ll-national-table td:first-child{width:7%}.ll-national-table th:nth-child(2),.ll-national-table td:nth-child(2){width:31%}.ll-national-table th:nth-child(n+3),.ll-national-table td:nth-child(n+3){width:7.75%}.ll-national-table .ll-standing-team{gap:4px;min-width:0}.ll-national-table .ll-standing-team-name{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ll-national-table .ll-standing-stars{flex:0 0 auto}.ll-national-bracket{display:flex;gap:12px;overflow:auto;padding:8px 2px}.ll-national-round{min-width:230px;flex:1}.ll-national-round h4{margin:0 0 8px;color:#67e8f9}.ll-national-bracket-match{display:grid;grid-template-columns:1fr auto 1fr;gap:6px;align-items:center;padding:9px;border:1px solid rgba(148,163,184,.18);border-radius:9px;margin-bottom:7px;background:rgba(2,6,23,.3);font-size:12px}.ll-national-bracket-match span:last-child{text-align:right}.ll-national-bracket-match.player{border-color:rgba(250,204,21,.58);background:rgba(113,63,18,.15)}.ll-national-next{border-color:rgba(45,212,191,.48)}.ll-national-snapshot-card{display:flex;flex-direction:column;gap:8px;min-height:178px}.ll-national-card-name{font-size:15px;color:#f8fafc}.ll-national-card-copy{display:flex;flex-direction:column;gap:7px;padding:10px 11px;border:1px solid rgba(45,212,191,.22);border-radius:10px;background:rgba(2,6,23,.32);font-size:12px;line-height:1.5;color:#dbeafe}.ll-national-card-copy b{color:#67e8f9}.ll-national-card-lock{margin-top:auto;padding-top:3px}@media(max-width:1050px){.ll-national-offer-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.ll-national-groups{grid-template-columns:1fr}}@media(max-width:650px){.ll-national-offer-grid{grid-template-columns:1fr}.ll-national-bracket{display:block}.ll-national-round{min-width:0}.ll-national-table{min-width:0!important;font-size:9px}.ll-national-table th,.ll-national-table td{padding:7px 2px}.ll-national-table th:nth-child(2),.ll-national-table td:nth-child(2){width:34%}.ll-national-table th:nth-child(n+3),.ll-national-table td:nth-child(n+3){width:7.375%}.ll-national-table .ll-standing-stars{font-size:9px}}`;document.head.appendChild(style);}

/* Public UI/actions */
global.llRenderNationalTournaments=function(type){const state=stateNow();if(!state)return;if(type==='wc'||type==='euro'){renderTournamentTab(type);return;}const rec=unfinishedNationalRecord(state)||ensureRecord(state,false);if(rec?.status==='pending'){renderOffers(rec);return;}if(rec?.status==='active'&&rec.edition){renderTournamentTab(rec.type);return;}renderNationalHome();};
global.llAcceptNationalOffer=function(team){const state=stateNow(),rec=ensureRecord(state,false);if(!rec||rec.status!=='pending'||!rec.offers.some(o=>o.team===team))return;rec.selectedTeam=team;rec.objective=objectiveFor(team,rec.type);rec.status='accepted';rec.decisionAt=new Date().toISOString();save();global.llRenderDashboard();};
global.llRejectNationalOffers=function(){const state=stateNow(),rec=ensureRecord(state,false);if(!rec||rec.status!=='pending')return;rec.status='rejected';rec.selectedTeam=null;rec.objective=null;rec.decisionAt=new Date().toISOString();save();global.llRenderDashboard();};
global.llNationalContinueSeasonEnd=function(){const state=stateNow(),rec=latestNationalRecord(state);if(rec)rec.noticeSeen=true;save();applyNationalTheme(null);if(rec&&num(state?.season)>num(rec.season)&&!state?.seasonEnded){if(typeof global.llRenderDashboard==='function')global.llRenderDashboard();return;}if(typeof BASE_RENDER_SEASON_END==='function')BASE_RENDER_SEASON_END();};

/* Integrations are installed after all existing gameplay modules, making these wrappers
 * the outermost guards. */
const BASE_TEAM_DEF=global.llTeamDef;
if(typeof BASE_TEAM_DEF==='function')global.llTeamDef=function(name){if(typeof name==='string'&&TEAM_REGISTRY[name])return {name,short:name,stars:starsFor(name),icon:flagFor(name),logo:nationalLogoSrc(name),national:true};return BASE_TEAM_DEF.apply(this,arguments);};
const BASE_TEAM_LOGO=global.llTeamLogo;
if(typeof BASE_TEAM_LOGO==='function')global.llTeamLogo=function(teamOrName,variant=''){const name=typeof teamOrName==='string'?teamOrName:teamOrName?.name;if(name&&TEAM_REGISTRY[name])return badgeFor(name,variant||'table');return BASE_TEAM_LOGO.apply(this,arguments);};

const BASE_REPAIR=global.llV2RepairState;
if(typeof BASE_REPAIR==='function')global.llV2RepairState=function(state){state=BASE_REPAIR.apply(this,arguments);ensureRoot(state);return state;};

const BASE_FINISH_QUIZ=global.llFinishLeagueQuiz;
if(typeof BASE_FINISH_QUIZ==='function')global.llFinishLeagueQuiz=function(){const q=global.lexLeague?.quiz;if(!q?.fixture?.nationalTournament||q.relativeClause||q.gerundInfinitive)return BASE_FINISH_QUIZ.apply(this,arguments);if(q.committed)return;q.committed=true;const leagueAp=(typeof LL_COMP_REWARDS!=='undefined'&&LL_COMP_REWARDS?.league?.ap)?num(LL_COMP_REWARDS.league.ap,5):5,perWord=Math.round(leagueAp*NATIONAL_AP_MULTIPLIER),baseAp=num(q.correct)*perWord,recoveryAp=num(q.recoveryBonus),ap=baseAp+recoveryAp;global.lexLeague.state.ap=num(global.lexLeague.state.ap)+ap;const completed=!q.skipped&&q.index>=q.queue.length;let bonus='none';if(completed&&q.correct===10){bonus='perfect';global.lexLeague.state.lp=num(global.lexLeague.state.lp)+10;}else if(completed&&q.correct===9)bonus='reroll';q.baseApEarned=baseAp;q.recoveryApEarned=recoveryAp;q.apEarned=ap;q.reward=bonus;q.totalAnswered=Number.isFinite(q.totalAnswered)?q.totalAnswered:q.index;save();global.llRenderQuizReward();};

const BASE_COMMIT_MATCH=global.llCommitCurrentMatch;
if(typeof BASE_COMMIT_MATCH==='function')global.llCommitCurrentMatch=function(){
  const state=stateNow(),m=global.lexLeague?.match,fx=m?.fixture||{};
  if(fx.nationalTournament||fx.league==='national'||fx.nationalFixtureId||fx.competition==='national')return commitNationalMatch();
  /* Eski PC/IndexedDB save'lerinde milli fixture competition:'cup' olarak kalmış olabilir.
   * Yalnız aktif milli görev + seçili milli takım + edition içindeki tam eşleşme varsa milli yola al. */
  const rec=activeNationalRecord(state);if(rec&&m?.player===rec.selectedTeam)return commitNationalMatch();
  return BASE_COMMIT_MATCH.apply(this,arguments);
};

const BASE_RENDER_DASHBOARD=global.llRenderDashboard;
global.llNationalGoDashboard=function(){
  const state=stateNow();
  if(!state)return;
  applyNationalTheme(null);
  if(typeof BASE_RENDER_DASHBOARD==='function'){
    const result=BASE_RENDER_DASHBOARD();
    injectDashboardButton();
    return result;
  }
};
if(typeof BASE_RENDER_DASHBOARD==='function')global.llRenderDashboard=function(){const state=stateNow();if(!state)return BASE_RENDER_DASHBOARD.apply(this,arguments);ensureRoot(state);const unfinished=unfinishedNationalRecord(state),rec=unfinished||ensureRecord(state,false);if(rec?.status==='active'&&rec.edition&&!rec.completed){renderTournamentTab(rec.type);return;}if(rec?.status==='accepted'&&state.seasonEnded){initializeManagedEdition(state,rec);renderTournamentTab(rec.type);return;}if(shouldTriggerOffer(state)){generateOffers(state,ensureRecord(state,true));renderOffers(ensureRecord(state,false));return;}if(rec?.status==='pending'){renderOffers(rec);return;}const result=BASE_RENDER_DASHBOARD.apply(this,arguments);injectDashboardButton();return result;};

const BASE_RENDER_SEASON_END=global.llRenderSeasonEnd;
if(typeof BASE_RENDER_SEASON_END==='function')global.llRenderSeasonEnd=function(){const state=stateNow();if(!state)return BASE_RENDER_SEASON_END.apply(this,arguments);let rec=unfinishedNationalRecord(state);const info=seasonTournament(state);if(!rec&&!info)return BASE_RENDER_SEASON_END.apply(this,arguments);if(!rec)rec=ensureRecord(state,true);if(rec.status==='unoffered')generateOffers(state,rec);if(rec.status==='pending'){renderOffers(rec);return;}if(rec.status==='accepted'){initializeManagedEdition(state,rec);renderTournamentTab(rec.type);return;}if(rec.status==='active'){renderTournamentTab(rec.type);return;}if(rec.status==='rejected'){simulateRejected(state,rec);renderWinnerNotice(rec);return;}if(rec.status==='completed'&&!rec.noticeSeen){if(rec.selectedTeam)renderManagedCompletionNotice(rec);else renderWinnerNotice(rec);return;}return BASE_RENDER_SEASON_END.apply(this,arguments);};

const BASE_START_NEXT_SEASON=global.llStartNextSeason;
if(typeof BASE_START_NEXT_SEASON==='function')global.llStartNextSeason=function(){const state=stateNow();if(!state)return BASE_START_NEXT_SEASON.apply(this,arguments);const rec=unfinishedNationalRecord(state);if(rec){if(rec.status==='pending'){renderOffers(rec);return;}if(rec.status==='accepted'){initializeManagedEdition(state,rec);renderTournamentTab(rec.type);return;}if(rec.status==='active'){renderTournamentTab(rec.type);return;}if(rec.status==='rejected'){simulateRejected(state,rec);renderWinnerNotice(rec);return;}}return BASE_START_NEXT_SEASON.apply(this,arguments);};

const BASE_CALENDAR_MATCH_TEXT=global.llCalendarMatchText;
if(typeof BASE_CALENDAR_MATCH_TEXT==='function')global.llCalendarMatchText=function(state,fixture,week){if(fixture?.nationalTournament||fixture?.league==='national'||fixture?.nationalFixtureId){const rec=activeNationalRecord(state)||unfinishedNationalRecord(state),label=fixture?.roundLabel||`${typeLabel(rec?.type)} ${rec?.year||''}`.trim();return `${label} · Milli turnuva`;}return BASE_CALENDAR_MATCH_TEXT.apply(this,arguments);};

const BASE_CONTINUE=global.llContinueGame;
if(typeof BASE_CONTINUE==='function')global.llContinueGame=function(){
  const args=arguments,isGated=BASE_CONTINUE.__llIdbGated===true,statusBefore=typeof global.llStorageBootStatus==='function'?global.llStorageBootStatus():null;
  const result=BASE_CONTINUE.apply(this,args);
  /* Desktop IndexedDB ilk açılışta llContinueGame'i asenkron kuyruğa alır. O anda state'e bakmak
   * eski/boş state'i yönlendirebilir. Storage hazırsa senkron yönlendir; değilse yüklenen state'i bekle. */
  if(!isGated||statusBefore?.ready||statusBefore?.unavailable){postContinueNationalRoute();return result;}
  let tries=0;const waitForLoadedCareer=()=>{tries++;const status=typeof global.llStorageBootStatus==='function'?global.llStorageBootStatus():null;if((status?.ready||status?.unavailable)&&stateNow()){postContinueNationalRoute();return;}if(tries<80)setTimeout(waitForLoadedCareer,50);};setTimeout(waitForLoadedCareer,0);return result;
};

const BASE_MANAGER_PROFILE_RENDER=global.llRenderManagerProfile;
if(typeof BASE_MANAGER_PROFILE_RENDER==='function')global.llRenderManagerProfile=function(){const result=BASE_MANAGER_PROFILE_RENDER.apply(this,arguments);try{renderCareerSection();}catch(_){}return result;};
const BASE_ACH_RENDER=global.llRenderAchievements;
if(typeof BASE_ACH_RENDER==='function')global.llRenderAchievements=function(){const result=BASE_ACH_RENDER.apply(this,arguments);registerAchievements();return result;};

registerAchievements();injectStyles();try{ensureRoot(stateNow());injectDashboardButton();}catch(_){}

/* Test/debug API: pure-enough helpers are exposed intentionally so automated regression
 * tests can verify calendar, pools, offer cardinality and official third-place mappings. */
global.llNationalTournamentTestApi={
 version:VERSION,teamRegistry:TEAM_REGISTRY,wcGroups:WC_GROUPS,euroGroups:EURO_GROUPS,euroThirdMap:EURO_THIRD_MAP,wcThirdMapCount:WC_THIRD_MAP.length-1,
 tournamentTypeForEndYear,seasonTournament,endYearForState,nextYear,createEdition,rankGroup,bestThirds,buildInitialKnockout,buildNextRound,buildOffers,offerTargetStars,objectiveSpecFor,nationalAiCardsFor,nationalCardCount,ensureAllNationalTeams,remainingLeagueWeeks,shouldTriggerOffer,simulateEditionToEnd,objectiveFor,stageObjectiveMet,nationalLogoSrc,groupRankMap,reconstructedGroupMovement,rankArrowHtml,groupRoundIndex,simulateManagedGroupRoundPeers,rebuildGroupTables,repairManagedGroupProgress,
 wcOptionForExcluded:key=>WC_EXCLUDED_OPTION[key]||null,activeCardsSnapshot,ensureTeamState,unfinishedNationalRecord,activeNationalRecord,nationalRecordForType,postContinueNationalRoute,findNationalFixtureForMatch,initializeManagedEdition,commitNationalMatch,completeManagedGroup,advanceAfterKnockoutRound,repairManagedKnockoutPending,queueNationalOutcomeCinematic,ensureRoot,ensureRecord,generateOffers,finishEdition
};
})(globalThis);
