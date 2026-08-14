/*
 * Avrupa kupası havuzunda yer alan, yerel ligde takip edilmeyen kulüplerin
 * gerçek arma dosyaları. Ana logo manifestinde adıyla eşleşmeyen takımlar
 * burada Transfermarkt logoId üzerinden bulunur.
 */
(function () {
  const directory = 'assets/team-logos/europe/official';
  const files = {
    1025:'jpg',1035:'png',1041:'png',10470:'png',1050:'png',10625:'png',1075:'png',1082:'png',1090:'png',1091:'png',1093:'png',11:'jpg',110:'png',1184:'png',119:'png',12:'png',122:'png',1230:'png',1234:'png',124:'png',12430:'png',1288:'png',13:'png',131:'png',141:'png',1435:'png',144:'png',146:'png',148:'png',15:'png',150:'png',159:'png',16:'png',162:'png',170:'png',1747:'png',1859:'png',1873:'png',1899:'png',190:'png',1957:'png',1966:'png',1971:'png',200:'png',201:'png',20401:'png',2158:'png',2159:'png',2181:'png',2282:'png',
    2287:'png',2288:'png',234:'png',236:'png',238:'png',24:'png',2425:'png',244:'png',2441:'png',255:'png',26:'png',2619:'png',265:'png',26730:'png',27:'png',2728:'webp',279:'png',28095:'png',281:'png',294:'png',301:'png',3057:'png',31:'png',31059:'png',3120:'png',31614:'webp',3258:'webp',336:'png',338:'png',3446:'png',36:'png',3644:'png',367:'png',370:'png',3700:'webp',371:'png',379:'png',383:'png',38594:'png',39:'png',3948:'png',405:'png',40812:'png',409:'png',417:'png',418:'png',419:'png',43:'png',430:'png',449:'png',
    452:'png',46:'png',4669:'png',48320:'png',496:'png',504:'png',506:'png',518:'png',527:'png',540:'png',564:'png',565:'png',58:'png',583:'png',60:'png',6020:'png',610:'png',6195:'png',62:'png',621:'png',631:'png',660:'png',667:'png',669:'png',678:'png',683:'png',687:'png',703:'png',720:'png',7395:'png',762:'png',766:'png',79:'png',800:'png',865:'png',873:'png',903:'png',940:'png',941:'png'
  };
  globalThis.LL_EUROPE_OFFICIAL_LOGO_FILES = Object.fromEntries(
    Object.entries(files).map(([id, extension]) => [Number(id), `${directory}/${id}.${extension}`])
  );
})();
