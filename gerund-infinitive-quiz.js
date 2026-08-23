/* Gerund & Infinitive match quiz. Mirrors the Relative Clause quiz and stays separate from vocabulary statistics. */
(function (global) {
  'use strict';

  var QUESTION_COUNT = 8;
  var DUE_EVERY = 7;
  var OFFICIAL = { league: true, cup: true, playoff: true, ucl: true, uel: true, uecl: true };

  var BANK_ROWS = [["GI001","I enjoy ______ football after work.","playing","\u0130\u015ften sonra futbol oynamaktan keyif al\u0131r\u0131m.","This verb is followed by a gerund (-ing).","Bu fiilden sonra gerund (-ing) kullan\u0131l\u0131r."],["GI002","She avoided ______ at the score during the penalty shootout.","looking","Penalt\u0131 at\u0131\u015flar\u0131 s\u0131ras\u0131nda skora bakmaktan ka\u00e7\u0131nd\u0131.","This verb is followed by a gerund (-ing).","Bu fiilden sonra gerund (-ing) kullan\u0131l\u0131r."],["GI003","We finished ______ the new feature before lunch.","testing","Yeni \u00f6zelli\u011fi \u00f6\u011fle yeme\u011finden \u00f6nce test etmeyi bitirdik.","This verb is followed by a gerund (-ing).","Bu fiilden sonra gerund (-ing) kullan\u0131l\u0131r."],["GI004","Do you mind ______ the window before the meeting starts?","closing","Toplant\u0131 ba\u015flamadan \u00f6nce pencereyi kapatman\u0131n sak\u0131ncas\u0131 var m\u0131?","This verb is followed by a gerund (-ing).","Bu fiilden sonra gerund (-ing) kullan\u0131l\u0131r."],["GI005","The coach suggested ______ with two defensive midfielders.","playing","Teknik direkt\u00f6r iki defansif orta sahayla oynamay\u0131 \u00f6nerdi.","This verb is followed by a gerund (-ing).","Bu fiilden sonra gerund (-ing) kullan\u0131l\u0131r."],["GI006","I am considering ______ CrossFit twice a week.","doing","Haftada iki kez CrossFit yapmay\u0131 d\u00fc\u015f\u00fcn\u00fcyorum.","This verb is followed by a gerund (-ing).","Bu fiilden sonra gerund (-ing) kullan\u0131l\u0131r."],["GI007","He kept ______ even after the final whistle.","running","Son d\u00fcd\u00fckten sonra bile ko\u015fmaya devam etti.","This verb is followed by a gerund (-ing).","Bu fiilden sonra gerund (-ing) kullan\u0131l\u0131r."],["GI008","You should practice ______ before you receive the ball.","scanning","Topu almadan \u00f6nce \u00e7evre kontrol\u00fc yapmay\u0131 \u00e7al\u0131\u015fmal\u0131s\u0131n.","This verb is followed by a gerund (-ing).","Bu fiilden sonra gerund (-ing) kullan\u0131l\u0131r."],["GI009","The defender admitted ______ the striker inside the box.","pushing","Savunma oyuncusu ceza sahas\u0131nda forveti itti\u011fini kabul etti.","This verb is followed by a gerund (-ing).","Bu fiilden sonra gerund (-ing) kullan\u0131l\u0131r."],["GI010","The player denied ______ the referee.","insulting","Oyuncu hakeme hakaret etti\u011fini reddetti.","This verb is followed by a gerund (-ing).","Bu fiilden sonra gerund (-ing) kullan\u0131l\u0131r."],["GI011","We risk ______ the release if we change the code today.","delaying","Kodu bug\u00fcn de\u011fi\u015ftirirsek s\u00fcr\u00fcm\u00fc geciktirme riski ta\u015f\u0131yoruz.","This verb is followed by a gerund (-ing).","Bu fiilden sonra gerund (-ing) kullan\u0131l\u0131r."],["GI012","I miss ______ with my old teammates.","playing","Eski tak\u0131m arkada\u015flar\u0131mla oynamay\u0131 \u00f6zl\u00fcyorum.","This verb is followed by a gerund (-ing).","Bu fiilden sonra gerund (-ing) kullan\u0131l\u0131r."],["GI013","They postponed ______ the transfer until Monday.","discussing","Transferi konu\u015fmay\u0131 pazartesiye ertelediler.","This verb is followed by a gerund (-ing).","Bu fiilden sonra gerund (-ing) kullan\u0131l\u0131r."],["GI014","Can you imagine ______ a final in front of 70,000 fans?","playing","70.000 taraftar\u0131n \u00f6n\u00fcnde final oynad\u0131\u011f\u0131n\u0131 hayal edebiliyor musun?","This verb is followed by a gerund (-ing).","Bu fiilden sonra gerund (-ing) kullan\u0131l\u0131r."],["GI015","The doctor recommended ______ for a few days.","resting","Doktor birka\u00e7 g\u00fcn dinlenmeyi \u00f6nerdi.","This verb is followed by a gerund (-ing).","Bu fiilden sonra gerund (-ing) kullan\u0131l\u0131r."],["GI016","He quit ______ energy drinks during the season.","drinking","Sezon boyunca enerji i\u00e7ece\u011fi i\u00e7meyi b\u0131rakt\u0131.","This verb is followed by a gerund (-ing).","Bu fiilden sonra gerund (-ing) kullan\u0131l\u0131r."],["GI017","She mentioned ______ the same bug last week.","seeing","Ge\u00e7en hafta ayn\u0131 hatay\u0131 g\u00f6rd\u00fc\u011f\u00fcnden bahsetti.","This verb is followed by a gerund (-ing).","Bu fiilden sonra gerund (-ing) kullan\u0131l\u0131r."],["GI018","I appreciate ______ clear feedback after each lesson.","getting","Her dersten sonra net geri bildirim almay\u0131 takdir ediyorum.","This verb is followed by a gerund (-ing).","Bu fiilden sonra gerund (-ing) kullan\u0131l\u0131r."],["GI019","He cannot stand ______ on a crowded bus.","standing","Kalabal\u0131k bir otob\u00fcste ayakta durmaya tahamm\u00fcl edemiyor.","This verb is followed by a gerund (-ing).","Bu fiilden sonra gerund (-ing) kullan\u0131l\u0131r."],["GI020","I feel like ______ a short walk after dinner.","taking","Ak\u015fam yeme\u011finden sonra k\u0131sa bir y\u00fcr\u00fcy\u00fc\u015f yapmak istiyorum.","This verb is followed by a gerund (-ing).","Bu fiilden sonra gerund (-ing) kullan\u0131l\u0131r."],["GI021","The team discussed ______ the formation before kickoff.","changing","Tak\u0131m ma\u00e7 ba\u015flamadan \u00f6nce dizili\u015fi de\u011fi\u015ftirmeyi konu\u015ftu.","This verb is followed by a gerund (-ing).","Bu fiilden sonra gerund (-ing) kullan\u0131l\u0131r."],["GI022","She delayed ______ the email until she had all the test results.","sending","T\u00fcm test sonu\u00e7lar\u0131n\u0131 alana kadar e-postay\u0131 g\u00f6ndermeyi geciktirdi.","This verb is followed by a gerund (-ing).","Bu fiilden sonra gerund (-ing) kullan\u0131l\u0131r."],["GI023","He recalled ______ against that goalkeeper years ago.","playing","Y\u0131llar \u00f6nce o kaleciye kar\u015f\u0131 oynad\u0131\u011f\u0131n\u0131 hat\u0131rlad\u0131.","This verb is followed by a gerund (-ing).","Bu fiilden sonra gerund (-ing) kullan\u0131l\u0131r."],["GI024","The manager resisted ______ the young player too early.","selling","Teknik direkt\u00f6r gen\u00e7 oyuncuyu \u00e7ok erken satmaya direndi.","This verb is followed by a gerund (-ing).","Bu fiilden sonra gerund (-ing) kullan\u0131l\u0131r."],["GI025","We cannot justify ______ this test on every build.","running","Bu testi her build'de \u00e7al\u0131\u015ft\u0131rmay\u0131 hakl\u0131 g\u00f6steremeyiz.","This verb is followed by a gerund (-ing).","Bu fiilden sonra gerund (-ing) kullan\u0131l\u0131r."],["GI026","The goalkeeper escaped ______ sent off after the challenge.","being","Kaleci m\u00fcdahaleden sonra oyundan at\u0131lmaktan kurtuldu.","This verb is followed by a gerund (-ing).","Bu fiilden sonra gerund (-ing) kullan\u0131l\u0131r."],["GI027","I dislike ______ late for meetings.","being","Toplant\u0131lara ge\u00e7 kalmaktan ho\u015flanm\u0131yorum.","This verb is followed by a gerund (-ing).","Bu fiilden sonra gerund (-ing) kullan\u0131l\u0131r."],["GI028","She enjoys ______ new English words in real conversations.","using","Yeni \u0130ngilizce kelimeleri ger\u00e7ek konu\u015fmalarda kullanmaktan keyif al\u0131yor.","This verb is followed by a gerund (-ing).","Bu fiilden sonra gerund (-ing) kullan\u0131l\u0131r."],["GI029","The striker avoided ______ offside by timing his run well.","being","Forvet ko\u015fusunu iyi zamanlayarak ofsaytta kalmaktan ka\u00e7\u0131nd\u0131.","This verb is followed by a gerund (-ing).","Bu fiilden sonra gerund (-ing) kullan\u0131l\u0131r."],["GI030","We finished ______ the regression tests at 4 p.m.","running","Regresyon testlerini saat 16.00'da \u00e7al\u0131\u015ft\u0131rmay\u0131 bitirdik.","This verb is followed by a gerund (-ing).","Bu fiilden sonra gerund (-ing) kullan\u0131l\u0131r."],["GI031","He suggested ______ the device before opening a bug.","restarting","Bug a\u00e7madan \u00f6nce cihaz\u0131 yeniden ba\u015flatmay\u0131 \u00f6nerdi.","This verb is followed by a gerund (-ing).","Bu fiilden sonra gerund (-ing) kullan\u0131l\u0131r."],["GI032","I considered ______ the lesson, but I decided to join.","skipping","Dersi atlamay\u0131 d\u00fc\u015f\u00fcnd\u00fcm ama kat\u0131lmaya karar verdim.","This verb is followed by a gerund (-ing).","Bu fiilden sonra gerund (-ing) kullan\u0131l\u0131r."],["GI033","She kept ______ the same sentence until it sounded natural.","repeating","C\u00fcmle do\u011fal gelene kadar ayn\u0131 c\u00fcmleyi tekrar etmeye devam etti.","This verb is followed by a gerund (-ing).","Bu fiilden sonra gerund (-ing) kullan\u0131l\u0131r."],["GI034","The referee admitted ______ the wrong decision.","making","Hakem yanl\u0131\u015f karar verdi\u011fini kabul etti.","This verb is followed by a gerund (-ing).","Bu fiilden sonra gerund (-ing) kullan\u0131l\u0131r."],["GI035","They denied ______ any confidential data.","sharing","Herhangi bir gizli veri payla\u015ft\u0131klar\u0131n\u0131 reddettiler.","This verb is followed by a gerund (-ing).","Bu fiilden sonra gerund (-ing) kullan\u0131l\u0131r."],["GI036","He left the room without ______ goodbye.","saying","Ho\u015f\u00e7a kal demeden odadan \u00e7\u0131kt\u0131.","After a preposition, use a gerund (-ing).","Edatlardan sonra gerund (-ing) kullan\u0131l\u0131r."],["GI037","Before ______ the match, I always check my boots.","starting","Ma\u00e7a ba\u015flamadan \u00f6nce her zaman kramponlar\u0131m\u0131 kontrol ederim.","After a preposition, use a gerund (-ing).","Edatlardan sonra gerund (-ing) kullan\u0131l\u0131r."],["GI038","After ______ the update, we ran the sanity tests.","installing","G\u00fcncellemeyi kurduktan sonra sanity testlerini \u00e7al\u0131\u015ft\u0131rd\u0131k.","After a preposition, use a gerund (-ing).","Edatlardan sonra gerund (-ing) kullan\u0131l\u0131r."],["GI039","She improved her listening by ______ to short podcasts every day.","listening","Her g\u00fcn k\u0131sa podcastler dinleyerek dinleme becerisini geli\u015ftirdi.","After a preposition, use a gerund (-ing).","Edatlardan sonra gerund (-ing) kullan\u0131l\u0131r."],["GI040","He is good at ______ under pressure.","passing","Bask\u0131 alt\u0131nda pas vermekte iyidir.","After a preposition, use a gerund (-ing).","Edatlardan sonra gerund (-ing) kullan\u0131l\u0131r."],["GI041","I am interested in ______ how the new algorithm works.","learning","Yeni algoritman\u0131n nas\u0131l \u00e7al\u0131\u015ft\u0131\u011f\u0131n\u0131 \u00f6\u011frenmekle ilgileniyorum.","After a preposition, use a gerund (-ing).","Edatlardan sonra gerund (-ing) kullan\u0131l\u0131r."],["GI042","They apologized for ______ the meeting at the last minute.","canceling","Toplant\u0131y\u0131 son anda iptal ettikleri i\u00e7in \u00f6z\u00fcr dilediler.","After a preposition, use a gerund (-ing).","Edatlardan sonra gerund (-ing) kullan\u0131l\u0131r."],["GI043","The team succeeded in ______ the lead until the final whistle.","protecting","Tak\u0131m son d\u00fcd\u00fc\u011fe kadar \u00fcst\u00fcnl\u00fc\u011f\u00fc korumay\u0131 ba\u015fard\u0131.","After a preposition, use a gerund (-ing).","Edatlardan sonra gerund (-ing) kullan\u0131l\u0131r."],["GI044","He insisted on ______ the test one more time.","running","Testi bir kez daha \u00e7al\u0131\u015ft\u0131rmakta \u0131srar etti.","After a preposition, use a gerund (-ing).","Edatlardan sonra gerund (-ing) kullan\u0131l\u0131r."],["GI045","I am tired of ______ the same mistake.","making","Ayn\u0131 hatay\u0131 yapmaktan yoruldum.","After a preposition, use a gerund (-ing).","Edatlardan sonra gerund (-ing) kullan\u0131l\u0131r."],["GI046","She is worried about ______ the deadline.","missing","Son teslim tarihini ka\u00e7\u0131rmaktan endi\u015feleniyor.","After a preposition, use a gerund (-ing).","Edatlardan sonra gerund (-ing) kullan\u0131l\u0131r."],["GI047","The defender was punished for ______ the striker's shirt.","pulling","Savunma oyuncusu forvetin formas\u0131n\u0131 \u00e7ekti\u011fi i\u00e7in cezaland\u0131r\u0131ld\u0131.","After a preposition, use a gerund (-ing).","Edatlardan sonra gerund (-ing) kullan\u0131l\u0131r."],["GI048","We talked about ______ the test environment.","simplifying","Test ortam\u0131n\u0131 sadele\u015ftirmek hakk\u0131nda konu\u015ftuk.","After a preposition, use a gerund (-ing).","Edatlardan sonra gerund (-ing) kullan\u0131l\u0131r."],["GI049","He thanked me for ______ him with the report.","helping","Raporda ona yard\u0131m etti\u011fim i\u00e7in bana te\u015fekk\u00fcr etti.","After a preposition, use a gerund (-ing).","Edatlardan sonra gerund (-ing) kullan\u0131l\u0131r."],["GI050","You can improve your first touch by ______ against a wall.","practicing","Duvara kar\u015f\u0131 \u00e7al\u0131\u015farak ilk dokunu\u015funu geli\u015ftirebilirsin.","After a preposition, use a gerund (-ing).","Edatlardan sonra gerund (-ing) kullan\u0131l\u0131r."],["GI051","She left the office after ______ the final check.","completing","Son kontrol\u00fc tamamlad\u0131ktan sonra ofisten ayr\u0131ld\u0131.","After a preposition, use a gerund (-ing).","Edatlardan sonra gerund (-ing) kullan\u0131l\u0131r."],["GI052","Instead of ______ the ball long, try a short pass.","kicking","Topu uzun vurmak yerine k\u0131sa pas dene.","After a preposition, use a gerund (-ing).","Edatlardan sonra gerund (-ing) kullan\u0131l\u0131r."],["GI053","He is afraid of ______ his place in the starting eleven.","losing","\u0130lk on birdeki yerini kaybetmekten korkuyor.","After a preposition, use a gerund (-ing).","Edatlardan sonra gerund (-ing) kullan\u0131l\u0131r."],["GI054","The firewall prevents unknown devices from ______ the network.","accessing","G\u00fcvenlik duvar\u0131 bilinmeyen cihazlar\u0131n a\u011fa eri\u015fmesini engeller.","After a preposition, use a gerund (-ing).","Edatlardan sonra gerund (-ing) kullan\u0131l\u0131r."],["GI055","We are thinking about ______ a new test case for this scenario.","adding","Bu senaryo i\u00e7in yeni bir test case eklemeyi d\u00fc\u015f\u00fcn\u00fcyoruz.","After a preposition, use a gerund (-ing).","Edatlardan sonra gerund (-ing) kullan\u0131l\u0131r."],["GI056","I look forward to ______ you at the match on Friday.","seeing","Cuma g\u00fcnk\u00fc ma\u00e7ta seni g\u00f6rmeyi d\u00f6rt g\u00f6zle bekliyorum.","This expression ends with a preposition, so use a gerund (-ing).","Bu kal\u0131p bir edatla biter; bu y\u00fczden gerund (-ing) kullan\u0131l\u0131r."],["GI057","He is used to ______ early for training.","waking","Antrenman i\u00e7in erken uyanmaya al\u0131\u015fk\u0131n.","This expression ends with a preposition, so use a gerund (-ing).","Bu kal\u0131p bir edatla biter; bu y\u00fczden gerund (-ing) kullan\u0131l\u0131r."],["GI058","She objected to ______ the release without enough testing.","shipping","Yeterli test olmadan s\u00fcr\u00fcm\u00fc yay\u0131nlamaya kar\u015f\u0131 \u00e7\u0131kt\u0131.","This expression ends with a preposition, so use a gerund (-ing).","Bu kal\u0131p bir edatla biter; bu y\u00fczden gerund (-ing) kullan\u0131l\u0131r."],["GI059","We are committed to ______ the issue before release.","fixing","Sorunu s\u00fcr\u00fcmden \u00f6nce \u00e7\u00f6zmeye kararl\u0131y\u0131z.","This expression ends with a preposition, so use a gerund (-ing).","Bu kal\u0131p bir edatla biter; bu y\u00fczden gerund (-ing) kullan\u0131l\u0131r."],["GI060","The player is focused on ______ his fitness.","improving","Oyuncu kondisyonunu geli\u015ftirmeye odaklanm\u0131\u015f durumda.","After a preposition, use a gerund (-ing).","Edatlardan sonra gerund (-ing) kullan\u0131l\u0131r."],["GI061","______ every day helps me remember new vocabulary.","Reviewing","Her g\u00fcn tekrar yapmak yeni kelimeleri hat\u0131rlamama yard\u0131mc\u0131 olur.","Use a gerund when an activity is the subject of the sentence.","Bir eylem c\u00fcmlenin \u00f6znesiyse gerund (-ing) kullan\u0131labilir."],["GI062","______ before receiving the ball gives you more time.","Scanning","Topu almadan \u00f6nce \u00e7evre kontrol\u00fc yapmak sana daha fazla zaman kazand\u0131r\u0131r.","Use a gerund when an activity is the subject of the sentence.","Bir eylem c\u00fcmlenin \u00f6znesiyse gerund (-ing) kullan\u0131labilir."],["GI063","______ enough sleep is important before a match.","Getting","Ma\u00e7tan \u00f6nce yeterince uyumak \u00f6nemlidir.","Use a gerund when an activity is the subject of the sentence.","Bir eylem c\u00fcmlenin \u00f6znesiyse gerund (-ing) kullan\u0131labilir."],["GI064","I spent an hour ______ the failed test logs.","checking","Ba\u015far\u0131s\u0131z test loglar\u0131n\u0131 kontrol etmek i\u00e7in bir saat harcad\u0131m.","Use spend + time + gerund (-ing).","spend + zaman + gerund (-ing) yap\u0131s\u0131 kullan\u0131l\u0131r."],["GI065","We spent the evening ______ highlights from old matches.","watching","Ak\u015fam\u0131 eski ma\u00e7lar\u0131n \u00f6zetlerini izleyerek ge\u00e7irdik.","Use spend + time + gerund (-ing).","spend + zaman + gerund (-ing) yap\u0131s\u0131 kullan\u0131l\u0131r."],["GI066","This documentary is worth ______.","watching","Bu belgesel izlemeye de\u011fer.","Worth is followed by a gerund (-ing).","worth kelimesinden sonra gerund (-ing) kullan\u0131l\u0131r."],["GI067","I can't help ______ when I remember that own goal.","laughing","O kendi kalesine at\u0131lan gol\u00fc hat\u0131rlay\u0131nca g\u00fclmeden edemiyorum.","Can't help is followed by a gerund (-ing).","can't help kal\u0131b\u0131ndan sonra gerund (-ing) kullan\u0131l\u0131r."],["GI068","He stopped ______ energy drinks because they affected his sleep.","drinking","Uykusunu etkiledi\u011fi i\u00e7in enerji i\u00e7ece\u011fi i\u00e7meyi b\u0131rakt\u0131.","Stop + gerund means to end an activity.","stop + gerund, yap\u0131lan bir eylemi b\u0131rakmak anlam\u0131na gelir."],["GI069","I remember ______ my first big-pitch match.","playing","\u0130lk b\u00fcy\u00fck saha ma\u00e7\u0131m\u0131 oynad\u0131\u011f\u0131m\u0131 hat\u0131rl\u0131yorum.","Remember + gerund refers to a memory of a past action.","remember + gerund, ge\u00e7mi\u015fte yap\u0131lm\u0131\u015f bir eylemi hat\u0131rlamak i\u00e7in kullan\u0131l\u0131r."],["GI070","I will never forget ______ the winning goal in front of our fans.","scoring","Taraftarlar\u0131m\u0131z\u0131n \u00f6n\u00fcnde galibiyet gol\u00fcn\u00fc att\u0131\u011f\u0131m\u0131 asla unutmayaca\u011f\u0131m.","Forget + gerund refers to a past experience you will not forget.","forget + gerund, ge\u00e7mi\u015fte ya\u015fanm\u0131\u015f bir deneyimi unutmak/unutmamak anlam\u0131nda kullan\u0131l\u0131r."],["GI071","If the page is frozen, try ______ the browser.","refreshing","Sayfa donduysa taray\u0131c\u0131y\u0131 yenilemeyi dene.","Try + gerund means to test a possible solution.","try + gerund, bir \u00e7\u00f6z\u00fcm yolunu denemek anlam\u0131na gelir."],["GI072","He regrets ______ that comment after the match.","making","Ma\u00e7tan sonra o yorumu yapt\u0131\u011f\u0131 i\u00e7in pi\u015fman.","Regret + gerund means feeling sorry about a past action.","regret + gerund, ge\u00e7mi\u015fte yap\u0131lan bir \u015feyden pi\u015fman olmak anlam\u0131na gelir."],["GI073","Playing twice this week means ______ less time to recover.","having","Bu hafta iki kez oynamak, toparlanmak i\u00e7in daha az zamana sahip olmak demektir.","Mean + gerund means 'involve' or 'require'.","mean + gerund, 'gerektirmek / i\u00e7ermek' anlam\u0131na gelir."],["GI074","The coach went on ______ even after the players understood the drill.","explaining","Oyuncular \u00e7al\u0131\u015fmay\u0131 anlad\u0131ktan sonra bile teknik direkt\u00f6r a\u00e7\u0131klamaya devam etti.","Go on + gerund means to continue the same activity.","go on + gerund, ayn\u0131 eyleme devam etmek anlam\u0131na gelir."],["GI075","I want ______ more naturally in English.","to speak","\u0130ngilizceyi daha do\u011fal konu\u015fmak istiyorum.","This verb is followed by to + infinitive.","Bu fiilden sonra to + fiilin yal\u0131n h\u00e2li kullan\u0131l\u0131r."],["GI076","We need ______ the device before the test starts.","to restart","Test ba\u015flamadan \u00f6nce cihaz\u0131 yeniden ba\u015flatmam\u0131z gerekiyor.","This verb is followed by to + infinitive.","Bu fiilden sonra to + fiilin yal\u0131n h\u00e2li kullan\u0131l\u0131r."],["GI077","The manager decided ______ the formation after halftime.","to change","Teknik direkt\u00f6r devre aras\u0131nda dizili\u015fi de\u011fi\u015ftirmeye karar verdi.","This verb is followed by to + infinitive.","Bu fiilden sonra to + fiilin yal\u0131n h\u00e2li kullan\u0131l\u0131r."],["GI078","I hope ______ the new words in tomorrow's lesson.","to remember","Yar\u0131nki derste yeni kelimeleri hat\u0131rlamay\u0131 umuyorum.","This verb is followed by to + infinitive.","Bu fiilden sonra to + fiilin yal\u0131n h\u00e2li kullan\u0131l\u0131r."],["GI079","They plan ______ the update on Monday morning.","to install","G\u00fcncellemeyi pazartesi sabah\u0131 kurmay\u0131 planl\u0131yorlar.","This verb is followed by to + infinitive.","Bu fiilden sonra to + fiilin yal\u0131n h\u00e2li kullan\u0131l\u0131r."],["GI080","The club agreed ______ the player for one more season.","to keep","Kul\u00fcp oyuncuyu bir sezon daha tutmay\u0131 kabul etti.","This verb is followed by to + infinitive.","Bu fiilden sonra to + fiilin yal\u0131n h\u00e2li kullan\u0131l\u0131r."],["GI081","He promised ______ me after the meeting.","to call","Toplant\u0131dan sonra beni arayaca\u011f\u0131na s\u00f6z verdi.","This verb is followed by to + infinitive.","Bu fiilden sonra to + fiilin yal\u0131n h\u00e2li kullan\u0131l\u0131r."],["GI082","The goalkeeper refused ______ after the collision.","to continue","Kaleci \u00e7arp\u0131\u015fmadan sonra devam etmeyi reddetti.","This verb is followed by to + infinitive.","Bu fiilden sonra to + fiilin yal\u0131n h\u00e2li kullan\u0131l\u0131r."],["GI083","She offered ______ the report before the deadline.","to review","Raporu son teslim tarihinden \u00f6nce incelemeyi teklif etti.","This verb is followed by to + infinitive.","Bu fiilden sonra to + fiilin yal\u0131n h\u00e2li kullan\u0131l\u0131r."],["GI084","I learned ______ this tool during my first year at work.","to use","Bu arac\u0131 i\u015fteki ilk y\u0131l\u0131mda kullanmay\u0131 \u00f6\u011frendim.","This verb is followed by to + infinitive.","Bu fiilden sonra to + fiilin yal\u0131n h\u00e2li kullan\u0131l\u0131r."],["GI085","We managed ______ the bug before the release.","to fix","Bug'\u0131 s\u00fcr\u00fcmden \u00f6nce \u00e7\u00f6zmeyi ba\u015fard\u0131k.","This verb is followed by to + infinitive.","Bu fiilden sonra to + fiilin yal\u0131n h\u00e2li kullan\u0131l\u0131r."],["GI086","The team expects ______ a difficult away match.","to have","Tak\u0131m zorlu bir deplasman ma\u00e7\u0131 ya\u015famay\u0131 bekliyor.","This verb is followed by to + infinitive.","Bu fiilden sonra to + fiilin yal\u0131n h\u00e2li kullan\u0131l\u0131r."],["GI087","He chose ______ in midfield instead of on the wing.","to play","Kanat yerine orta sahada oynamay\u0131 se\u00e7ti.","This verb is followed by to + infinitive.","Bu fiilden sonra to + fiilin yal\u0131n h\u00e2li kullan\u0131l\u0131r."],["GI088","I cannot afford ______ another training session this week.","to miss","Bu hafta ba\u015fka bir antrenman\u0131 ka\u00e7\u0131rmay\u0131 g\u00f6ze alamam.","This verb is followed by to + infinitive.","Bu fiilden sonra to + fiilin yal\u0131n h\u00e2li kullan\u0131l\u0131r."],["GI089","They attempted ______ the service, but the error returned.","to restart","Servisi yeniden ba\u015flatmay\u0131 denediler ama hata geri d\u00f6nd\u00fc.","This verb is followed by to + infinitive.","Bu fiilden sonra to + fiilin yal\u0131n h\u00e2li kullan\u0131l\u0131r."],["GI090","We are preparing ______ the full regression suite tonight.","to run","Bu gece t\u00fcm regresyon paketini \u00e7al\u0131\u015ft\u0131rmaya haz\u0131rlan\u0131yoruz.","This verb is followed by to + infinitive.","Bu fiilden sonra to + fiilin yal\u0131n h\u00e2li kullan\u0131l\u0131r."],["GI091","The new player seems ______ very calm under pressure.","to be","Yeni oyuncu bask\u0131 alt\u0131nda \u00e7ok sakin g\u00f6r\u00fcn\u00fcyor.","This verb is followed by to + infinitive.","Bu fiilden sonra to + fiilin yal\u0131n h\u00e2li kullan\u0131l\u0131r."],["GI092","The issue appears ______ related to the network.","to be","Sorun a\u011f ile ilgili g\u00f6r\u00fcn\u00fcyor.","This verb is followed by to + infinitive.","Bu fiilden sonra to + fiilin yal\u0131n h\u00e2li kullan\u0131l\u0131r."],["GI093","Young players tend ______ quickly when they play regularly.","to improve","Gen\u00e7 oyuncular d\u00fczenli oynad\u0131klar\u0131nda h\u0131zl\u0131 geli\u015fme e\u011filimindedir.","This verb is followed by to + infinitive.","Bu fiilden sonra to + fiilin yal\u0131n h\u00e2li kullan\u0131l\u0131r."],["GI094","The striker failed ______ the target from close range.","to hit","Forvet yak\u0131n mesafeden hedefi bulamad\u0131.","This verb is followed by to + infinitive.","Bu fiilden sonra to + fiilin yal\u0131n h\u00e2li kullan\u0131l\u0131r."],["GI095","He pretended ______ the question, but he was confused.","to understand","Soruyu anlam\u0131\u015f gibi yapt\u0131 ama kafas\u0131 kar\u0131\u015f\u0131kt\u0131.","This verb is followed by to + infinitive.","Bu fiilden sonra to + fiilin yal\u0131n h\u00e2li kullan\u0131l\u0131r."],["GI096","We arranged ______ at the office before the match.","to meet","Ma\u00e7tan \u00f6nce ofiste bulu\u015fmay\u0131 ayarlad\u0131k.","This verb is followed by to + infinitive.","Bu fiilden sonra to + fiilin yal\u0131n h\u00e2li kullan\u0131l\u0131r."],["GI097","She deserves ______ more minutes after that performance.","to get","O performanstan sonra daha fazla s\u00fcre almay\u0131 hak ediyor.","This verb is followed by to + infinitive.","Bu fiilden sonra to + fiilin yal\u0131n h\u00e2li kullan\u0131l\u0131r."],["GI098","The club hopes ______ a new striker before the window closes.","to sign","Kul\u00fcp transfer d\u00f6nemi kapanmadan yeni bir forvet almay\u0131 umuyor.","This verb is followed by to + infinitive.","Bu fiilden sonra to + fiilin yal\u0131n h\u00e2li kullan\u0131l\u0131r."],["GI099","I decided ______ notes while listening to the podcast.","to take","Podcasti dinlerken not almaya karar verdim.","This verb is followed by to + infinitive.","Bu fiilden sonra to + fiilin yal\u0131n h\u00e2li kullan\u0131l\u0131r."],["GI100","He refused ______ responsibility for the mistake.","to accept","Hatan\u0131n sorumlulu\u011funu kabul etmeyi reddetti.","This verb is followed by to + infinitive.","Bu fiilden sonra to + fiilin yal\u0131n h\u00e2li kullan\u0131l\u0131r."],["GI101","We managed ______ the test environment without losing data.","to restore","Veri kaybetmeden test ortam\u0131n\u0131 geri y\u00fcklemeyi ba\u015fard\u0131k.","This verb is followed by to + infinitive.","Bu fiilden sonra to + fiilin yal\u0131n h\u00e2li kullan\u0131l\u0131r."],["GI102","She promised ______ late again.","not to be","Bir daha ge\u00e7 kalmayaca\u011f\u0131na s\u00f6z verdi.","This verb is followed by to + infinitive.","Bu fiilden sonra to + fiilin yal\u0131n h\u00e2li kullan\u0131l\u0131r."],["GI103","The player hopes ______ fit before Friday's match.","to be","Oyuncu cuma g\u00fcnk\u00fc ma\u00e7tan \u00f6nce haz\u0131r olmay\u0131 umuyor.","This verb is followed by to + infinitive.","Bu fiilden sonra to + fiilin yal\u0131n h\u00e2li kullan\u0131l\u0131r."],["GI104","They agreed ______ the decision until the final test result.","to delay","Karar\u0131 son test sonucuna kadar ertelemeyi kabul ettiler.","This verb is followed by to + infinitive.","Bu fiilden sonra to + fiilin yal\u0131n h\u00e2li kullan\u0131l\u0131r."],["GI105","I would like ______ this sentence one more time.","to repeat","Bu c\u00fcmleyi bir kez daha tekrar etmek istiyorum.","This verb is followed by to + infinitive.","Bu fiilden sonra to + fiilin yal\u0131n h\u00e2li kullan\u0131l\u0131r."],["GI106","The coach expects the defenders ______ closer together.","to stay","Teknik direkt\u00f6r savunmac\u0131lar\u0131n birbirine daha yak\u0131n kalmas\u0131n\u0131 bekliyor.","Use object + to + infinitive after this verb.","Bu yap\u0131da fiilden sonra nesne + to + fiilin yal\u0131n h\u00e2li kullan\u0131l\u0131r."],["GI107","My teacher encouraged me ______ more slowly.","to speak","\u00d6\u011fretmenim beni daha yava\u015f konu\u015fmaya te\u015fvik etti.","Use object + to + infinitive after this verb.","Bu yap\u0131da fiilden sonra nesne + to + fiilin yal\u0131n h\u00e2li kullan\u0131l\u0131r."],["GI108","The manager asked us ______ the report before noon.","to finish","Y\u00f6netici raporu \u00f6\u011fleden \u00f6nce bitirmemizi istedi.","Use object + to + infinitive after this verb.","Bu yap\u0131da fiilden sonra nesne + to + fiilin yal\u0131n h\u00e2li kullan\u0131l\u0131r."],["GI109","The doctor advised him ______ for a few days.","to rest","Doktor ona birka\u00e7 g\u00fcn dinlenmesini tavsiye etti.","Use object + to + infinitive after this verb.","Bu yap\u0131da fiilden sonra nesne + to + fiilin yal\u0131n h\u00e2li kullan\u0131l\u0131r."],["GI110","The referee told the captain ______ down.","to calm","Hakem kaptana sakinle\u015fmesini s\u00f6yledi.","Use object + to + infinitive after this verb.","Bu yap\u0131da fiilden sonra nesne + to + fiilin yal\u0131n h\u00e2li kullan\u0131l\u0131r."],["GI111","The security policy requires users ______ their passwords regularly.","to change","G\u00fcvenlik politikas\u0131 kullan\u0131c\u0131lar\u0131n parolalar\u0131n\u0131 d\u00fczenli de\u011fi\u015ftirmesini gerektiriyor.","Use object + to + infinitive after this verb.","Bu yap\u0131da fiilden sonra nesne + to + fiilin yal\u0131n h\u00e2li kullan\u0131l\u0131r."],["GI112","The club allowed the young player ______ with the first team.","to train","Kul\u00fcp gen\u00e7 oyuncunun A tak\u0131mla antrenman yapmas\u0131na izin verdi.","Use object + to + infinitive after this verb.","Bu yap\u0131da fiilden sonra nesne + to + fiilin yal\u0131n h\u00e2li kullan\u0131l\u0131r."],["GI113","The test result caused us ______ the release plan.","to reconsider","Test sonucu s\u00fcr\u00fcm plan\u0131n\u0131 yeniden de\u011ferlendirmemize neden oldu.","Use object + to + infinitive after this verb.","Bu yap\u0131da fiilden sonra nesne + to + fiilin yal\u0131n h\u00e2li kullan\u0131l\u0131r."],["GI114","I am happy ______ that the test passed.","to see","Testin ge\u00e7ti\u011fini g\u00f6rmekten mutluyum.","Use to + infinitive after this adjective.","Bu s\u0131fattan sonra to + fiilin yal\u0131n h\u00e2li kullan\u0131l\u0131r."],["GI115","This command is easy ______.","to remember","Bu komutu hat\u0131rlamak kolayd\u0131r.","Use to + infinitive after this adjective.","Bu s\u0131fattan sonra to + fiilin yal\u0131n h\u00e2li kullan\u0131l\u0131r."],["GI116","The team is ready ______ the second half.","to start","Tak\u0131m ikinci yar\u0131ya ba\u015flamaya haz\u0131r.","Use to + infinitive after this adjective.","Bu s\u0131fattan sonra to + fiilin yal\u0131n h\u00e2li kullan\u0131l\u0131r."],["GI117","I was surprised ______ him in the starting eleven.","to see","Onu ilk on birde g\u00f6r\u00fcnce \u015fa\u015f\u0131rd\u0131m.","Use to + infinitive after this adjective.","Bu s\u0131fattan sonra to + fiilin yal\u0131n h\u00e2li kullan\u0131l\u0131r."],["GI118","We were relieved ______ that the server was still running.","to hear","Sunucunun h\u00e2l\u00e2 \u00e7al\u0131\u015ft\u0131\u011f\u0131n\u0131 duyunca rahatlad\u0131k.","Use to + infinitive after this adjective.","Bu s\u0131fattan sonra to + fiilin yal\u0131n h\u00e2li kullan\u0131l\u0131r."],["GI119","I opened the dashboard ______ the latest test results.","to check","En son test sonu\u00e7lar\u0131n\u0131 kontrol etmek i\u00e7in dashboard'u a\u00e7t\u0131m.","Use to + infinitive to express purpose.","Ama\u00e7 belirtmek i\u00e7in to + fiilin yal\u0131n h\u00e2li kullan\u0131l\u0131r."],["GI120","He went to the gym ______ his fitness.","to improve","Kondisyonunu geli\u015ftirmek i\u00e7in spor salonuna gitti.","Use to + infinitive to express purpose.","Ama\u00e7 belirtmek i\u00e7in to + fiilin yal\u0131n h\u00e2li kullan\u0131l\u0131r."],["GI121","We stopped at a cafe ______ some water.","to buy","Biraz su almak i\u00e7in bir kafede durduk.","Use to + infinitive to express purpose.","Ama\u00e7 belirtmek i\u00e7in to + fiilin yal\u0131n h\u00e2li kullan\u0131l\u0131r."],["GI122","The winger moved inside ______ space for the full-back.","to create","Kanat oyuncusu beke alan a\u00e7mak i\u00e7in i\u00e7eri kat etti.","Use to + infinitive to express purpose.","Ama\u00e7 belirtmek i\u00e7in to + fiilin yal\u0131n h\u00e2li kullan\u0131l\u0131r."],["GI123","The box is too heavy ______ alone.","to carry","Kutu tek ba\u015f\u0131na ta\u015f\u0131mak i\u00e7in fazla a\u011f\u0131r.","Use to + infinitive after too/enough in this structure.","Bu yap\u0131da too/enough sonras\u0131nda to + fiilin yal\u0131n h\u00e2li kullan\u0131l\u0131r."],["GI124","He was calm enough ______ the penalty.","to take","Penalt\u0131y\u0131 kullanacak kadar sakindi.","Use to + infinitive after too/enough in this structure.","Bu yap\u0131da too/enough sonras\u0131nda to + fiilin yal\u0131n h\u00e2li kullan\u0131l\u0131r."],["GI125","I stopped ______ some water after the sprint.","to drink","Sprintten sonra biraz su i\u00e7mek i\u00e7in durdum.","Stop + to + infinitive means to pause one activity in order to do another.","stop + to + infinitive, ba\u015fka bir eylemi yapmak i\u00e7in mevcut eyleme ara vermek anlam\u0131na gelir."],["GI126","Remember ______ the test evidence before closing the bug.","to attach","Bug'\u0131 kapatmadan \u00f6nce test kan\u0131t\u0131n\u0131 eklemeyi unutma.","Remember + to + infinitive means not forgetting a task.","remember + to + infinitive, yap\u0131lmas\u0131 gereken bir i\u015fi unutmamak anlam\u0131na gelir."],["GI127","I forgot ______ the alarm, so I woke up late.","to set","Alarm\u0131 kurmay\u0131 unuttum, bu y\u00fczden ge\u00e7 uyand\u0131m.","Forget + to + infinitive means failing to do a task.","forget + to + infinitive, yap\u0131lmas\u0131 gereken bir i\u015fi yapmay\u0131 unutmak anlam\u0131na gelir."],["GI128","I tried ______ the report before the meeting, but I ran out of time.","to finish","Toplant\u0131dan \u00f6nce raporu bitirmeye \u00e7al\u0131\u015ft\u0131m ama zaman\u0131m kalmad\u0131.","Try + to + infinitive means making an effort to do something.","try + to + infinitive, bir \u015feyi yapmaya \u00e7abalamak anlam\u0131na gelir."],["GI129","We regret ______ you that today's match has been canceled.","to inform","Bug\u00fcnk\u00fc ma\u00e7\u0131n iptal edildi\u011fini size bildirmekten \u00fczg\u00fcn\u00fcz.","Regret + to + infinitive is used for bad news you are about to give.","regret + to + infinitive, \u015fimdi verilecek k\u00f6t\u00fc bir haberi nazik\u00e7e belirtmek i\u00e7in kullan\u0131l\u0131r."],["GI130","I meant ______ you yesterday, but I got busy.","to call","D\u00fcn seni aramaya niyet etmi\u015ftim ama yo\u011funla\u015ft\u0131m.","Mean + to + infinitive means 'intend'.","mean + to + infinitive, 'niyet etmek' anlam\u0131na gelir."],["GI131","After explaining the bug, she went on ______ the proposed fix.","to describe","Bug'\u0131 a\u00e7\u0131klad\u0131ktan sonra \u00f6nerilen \u00e7\u00f6z\u00fcm\u00fc anlatmaya ge\u00e7ti.","Go on + to + infinitive means to move to a new activity.","go on + to + infinitive, bir eylemden sonra ba\u015fka bir eyleme ge\u00e7mek anlam\u0131na gelir."]];
  var BANK = BANK_ROWS.map(function (row) {
    var answer = row[2];
    return {
      id: row[0],
      sentence: row[1],
      answer: answer,
      full: row[1].replace('______', answer),
      fullTr: row[3],
      explanation: row[4],
      explanationTr: row[5],
      form: /^(?:not\s+)?to\s+/i.test(answer) ? 'infinitive' : 'gerund'
    };
  });

  function stateNow() { return global.lexLeague && global.lexLeague.state; }
  function fixtureNow() { return typeof global.llPlayerFixture === 'function' ? global.llPlayerFixture() : null; }
  function save() { if (typeof global.llSave === 'function') global.llSave(); }
  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char];
    });
  }
  function officialResults(state) {
    return (state && Array.isArray(state.results) ? state.results : []).filter(function (result) {
      return result && result.userMatch !== false && OFFICIAL[String(result.competition || 'league').toLowerCase()];
    });
  }
  function isOfficial(fixture) {
    return !!fixture && OFFICIAL[String(fixture.competition || 'league').toLowerCase()];
  }
  function ensure(state) {
    if (!state) return;
    if (!Array.isArray(state.results)) state.results = [];
    if (!Number.isFinite(state.gerundInfinitiveOfficialMatches)) state.gerundInfinitiveOfficialMatches = officialResults(state).length;
    if (!Number.isFinite(state.gerundInfinitiveCursor)) state.gerundInfinitiveCursor = 0;
    if (!Array.isArray(state.gerundInfinitiveDeck)) state.gerundInfinitiveDeck = [];
    if (!state.gerundInfinitiveHistory || typeof state.gerundInfinitiveHistory !== 'object') state.gerundInfinitiveHistory = {};
    if (!state.gerundInfinitiveStats || typeof state.gerundInfinitiveStats !== 'object') {
      state.gerundInfinitiveStats = { shown: 0, correct: 0, wrong: 0, recovered: 0, completed: 0 };
    }
  }
  function isDue(state, fixture) {
    ensure(state);
    return !!(state && isOfficial(fixture) && (state.gerundInfinitivePending || ((state.gerundInfinitiveOfficialMatches + 1) % DUE_EVERY === 0)));
  }
  function relativeClauseIsDue() {
    try {
      return !!(global.llRelativeClauseQuiz && typeof global.llRelativeClauseQuiz.isDue === 'function' && global.llRelativeClauseQuiz.isDue());
    } catch (error) {
      return false;
    }
  }
  function setDashboardButton() {
    var state = stateNow();
    var fixture = fixtureNow();
    if (!state || !fixture || !isDue(state, fixture) || !global.document) return;
    if (relativeClauseIsDue()) return;
    Array.prototype.forEach.call(global.document.querySelectorAll('button[onclick*="llStartMatchPreparation"]'), function (button) {
      button.textContent = '8 Gerund & Infinitive - Ma\u00e7a Ba\u015fla';
      button.setAttribute('aria-label', '8 Gerund & Infinitive - Ma\u00e7a Ba\u015fla');
    });
  }

  function randomIndex(length) { return Math.floor(Math.random() * length); }
  function questionById(id) {
    for (var index = 0; index < BANK.length; index += 1) if (BANK[index].id === id) return BANK[index];
    return null;
  }
  function balancedShuffle(questions, previousForm) {
    var groups = { gerund: [], infinitive: [] };
    var totals = { gerund: 0, infinitive: 0 };
    var used = { gerund: 0, infinitive: 0 };
    questions.forEach(function (question) {
      groups[question.form].push(question);
      totals[question.form] += 1;
    });
    Object.keys(groups).forEach(function (form) {
      for (var index = groups[form].length - 1; index > 0; index -= 1) {
        var swapIndex = randomIndex(index + 1);
        var temporary = groups[form][index];
        groups[form][index] = groups[form][swapIndex];
        groups[form][swapIndex] = temporary;
      }
    });
    var output = [];
    var batchCounts = { gerund: 0, infinitive: 0 };
    var totalQuestions = questions.length;
    while (output.length < totalQuestions) {
      if (output.length % QUESTION_COUNT === 0) batchCounts = { gerund: 0, infinitive: 0 };
      var position = output.length;
      var forms = Object.keys(groups).filter(function (form) { return groups[form].length; });
      var bestForm = null;
      var bestScore = -Infinity;
      forms.forEach(function (form) {
        var expectedByNow = ((position + 1) * totals[form]) / totalQuestions;
        var deficit = expectedByNow - used[form];
        var score = deficit + (Math.random() * 0.35);
        if (form === previousForm && forms.length > 1) score -= 1.4;
        if (batchCounts[form] >= 5 && forms.length > 1) score -= 2.5;
        if (score > bestScore) {
          bestScore = score;
          bestForm = form;
        }
      });
      var chosen = groups[bestForm].pop();
      output.push(chosen);
      used[bestForm] += 1;
      batchCounts[bestForm] += 1;
      previousForm = bestForm;
    }
    return output;
  }
  function refillDeck(state) {
    var validIds = {};
    BANK.forEach(function (question) { validIds[question.id] = true; });
    state.gerundInfinitiveDeck = state.gerundInfinitiveDeck.filter(function (id, index, deck) {
      return validIds[id] && deck.indexOf(id) === index;
    });
    if (state.gerundInfinitiveDeck.length >= QUESTION_COUNT) return;
    var queued = {};
    state.gerundInfinitiveDeck.forEach(function (id) { queued[id] = true; });
    var candidates = BANK.filter(function (question) { return !queued[question.id]; });
    var previous = state.gerundInfinitiveDeck.length ? questionById(state.gerundInfinitiveDeck[state.gerundInfinitiveDeck.length - 1]) : null;
    var shuffled = balancedShuffle(candidates, previous && previous.form);
    state.gerundInfinitiveDeck = state.gerundInfinitiveDeck.concat(shuffled.map(function (question) { return question.id; }));
  }
  function buildQueue(state) {
    refillDeck(state);
    return state.gerundInfinitiveDeck.slice(0, QUESTION_COUNT).map(questionById).filter(Boolean);
  }
  function consumeQueue(state, quiz, consumed) {
    var ids = quiz.queue.slice(0, consumed).map(function (question) { return question.id; });
    ids.forEach(function (id) {
      var position = state.gerundInfinitiveDeck.indexOf(id);
      if (position >= 0) state.gerundInfinitiveDeck.splice(position, 1);
    });
  }

  function beginGerundInfinitiveQuiz(fixture) {
    var state = stateNow();
    if (!state || !fixture) return false;
    ensure(state);
    var queue = buildQueue(state);
    if (queue.length < QUESTION_COUNT) return false;
    global.lexLeague.quiz = {
      kind: 'gerund-infinitive',
      gerundInfinitive: true,
      queue: queue,
      index: 0,
      correct: 0,
      revealed: false,
      committed: false,
      recoveredQuestions: 0,
      recoveryBonus: 0,
      skipped: false,
      startCursor: state.gerundInfinitiveCursor,
      fixture: Object.assign({}, fixture)
    };
    state.gerundInfinitivePending = false;
    save();
    global.llRenderLeagueQuiz();
    return true;
  }

  function renderGrammarCard(content, extraClass) {
    if (typeof global.llSetWide === 'function') global.llSetWide(false);
    global.llArea().innerHTML =
      '<div class="ll-shell ll-quiz-card ll-relative-quiz ll-gerund-infinitive-quiz ' + (extraClass || '') + '">' +
        '<div class="ll-panel ll-relative-quiz-panel">' + content + '</div>' +
      '</div>';
    return true;
  }

  function renderGerundInfinitiveQuiz() {
    var quiz = global.lexLeague && global.lexLeague.quiz;
    if (!quiz || !quiz.gerundInfinitive || !global.llArea) return false;
    var current = quiz.queue[quiz.index];
    if (!current) return false;
    var history = (stateNow().gerundInfinitiveHistory || {})[current.id] || {};
    var revealed = !!quiz.revealed;
    var prompt = esc(current.sentence).replace('______', '<strong class="ll-relative-blank">______</strong>');
    var answer = revealed ? (
      '<div class="ll-answer">' +
        '<b>' + esc(current.answer) + '</b>' +
        '<div class="ll-grammar-full-en"><b>Tam c\u00fcmle:</b> ' + esc(current.full) + '</div>' +
        '<div class="ll-grammar-translation"><b>T\u00fcrk\u00e7esi:</b> ' + esc(current.fullTr) + '</div>' +
        '<small class="ll-relative-rule-en"><b>A\u00e7\u0131klama:</b> ' + esc(current.explanation) + '</small>' +
        '<small class="ll-relative-rule-tr"><b>T\u00fcrk\u00e7e a\u00e7\u0131klama:</b> ' + esc(current.explanationTr) + '</small>' +
      '</div>'
    ) : '<div class="ll-muted" style="margin-top:25px">Cevab\u0131 a\u00e7mak i\u00e7in karta t\u0131kla</div>';

    var questionHtml =
      '<div class="ll-topbar"><div><div class="ll-title">Gerund &amp; Infinitive <em>Ma\u00e7\u0131</em></div>' +
        '<div class="ll-muted">' + (quiz.index + 1) + '/8 \u00b7 Her do\u011fru 7 AP \u00b7 7/8: reroll \u00b7 8/8: reroll + ma\u00e7l\u0131k +1</div></div>' +
        '<div class="ll-stars">Do\u011fru: ' + quiz.correct + '/8' + (quiz.recoveredQuestions ? ' \u00b7 Geri kazan\u0131m: ' + quiz.recoveredQuestions : '') + '</div></div>' +
        '<div class="ll-progress"><div style="width:' + ((quiz.index / QUESTION_COUNT) * 100) + '%"></div></div>' +
        '<div class="ll-question" onclick="llRevealQuiz()"><div>' +
        '<div class="ll-position">GERUND / INFINITIVE</div>' +
        '<div class="ll-question-word">' + prompt + '</div>' + answer +
        (history.wrong && !revealed ? '<div class="ll-notice" style="margin-top:16px;text-align:left">Daha \u00f6nce yanl\u0131\u015f: bu kez do\u011fru bilirsen +4 AP geri kazan\u0131rs\u0131n.</div>' : '') +
        '</div></div>' +
        '<div class="ll-quiz-actions" style="' + (revealed ? '' : 'opacity:.35;pointer-events:none') + '">' +
        '<button type="button" class="ll-btn danger" onclick="llRateLeagueQuiz(false)">\u2715 Bilmiyorum</button>' +
        '<button type="button" class="ll-btn primary" onclick="llRateLeagueQuiz(true)">\u2713 Bildim</button></div>' +
        '<button class="ll-btn" style="width:100%;margin-top:10px" onclick="llSkipLeagueQuiz()">Ge\u00e7 \u00b7 ' + quiz.index + ' cevap \u00fczerinden puan\u0131 al ve ma\u00e7a devam et</button>' +
      '</div>';
    return renderGrammarCard(questionHtml, 'll-relative-question-card ll-gerund-infinitive-question-card');
  }

  function revealGerundInfinitiveQuiz() {
    var quiz = global.lexLeague && global.lexLeague.quiz;
    if (!quiz || !quiz.gerundInfinitive) return false;
    quiz.revealed = true;
    global.llRenderLeagueQuiz();
    return true;
  }

  function rateGerundInfinitiveQuiz(correct) {
    var state = stateNow();
    var quiz = global.lexLeague && global.lexLeague.quiz;
    if (!state || !quiz || !quiz.gerundInfinitive || !quiz.revealed || quiz.committed) return false;
    ensure(state);
    var question = quiz.queue[quiz.index];
    var record = state.gerundInfinitiveHistory[question.id] || { seen: 0, wrong: false, correct: 0 };
    record.seen += 1;
    if (correct) {
      quiz.correct += 1;
      state.gerundInfinitiveStats.correct += 1;
      if (record.wrong) {
        quiz.recoveredQuestions += 1;
        quiz.recoveryBonus += 4;
        state.gerundInfinitiveStats.recovered += 1;
        record.wrong = false;
      }
      record.correct += 1;
    } else {
      record.wrong = true;
      state.gerundInfinitiveStats.wrong += 1;
    }
    state.gerundInfinitiveStats.shown += 1;
    state.gerundInfinitiveHistory[question.id] = record;
    quiz.index += 1;
    quiz.revealed = false;
    save();
    if (quiz.index >= QUESTION_COUNT) return finishGerundInfinitiveQuiz(false);
    global.llRenderLeagueQuiz();
    return true;
  }

  function finishGerundInfinitiveQuiz(skipped) {
    var state = stateNow();
    var quiz = global.lexLeague && global.lexLeague.quiz;
    if (!state || !quiz || !quiz.gerundInfinitive || quiz.committed) return false;
    ensure(state);
    quiz.committed = true;
    quiz.skipped = !!skipped;
    quiz.completed = !skipped && quiz.index >= QUESTION_COUNT;
    quiz.apEarned = (quiz.correct * 7) + quiz.recoveryBonus;
    state.ap = (Number(state.ap) || 0) + quiz.apEarned;
    if (quiz.completed) {
      state.gerundInfinitiveStats.completed += 1;
      if (quiz.correct === 8) quiz.reward = 'perfect';
      else if (quiz.correct === 7) quiz.reward = 'reroll';
      else quiz.reward = 'none';
    } else quiz.reward = 'none';

    var consumed = quiz.completed ? QUESTION_COUNT : quiz.index;
    consumeQueue(state, quiz, consumed);
    state.gerundInfinitiveCursor = (quiz.startCursor + consumed) % BANK.length;
    save();
    global.llRenderQuizReward();
    return true;
  }

  function skipGerundInfinitiveQuiz() {
    var quiz = global.lexLeague && global.lexLeague.quiz;
    if (!quiz || !quiz.gerundInfinitive) return false;
    if (typeof global.confirm === 'function' && !global.confirm('Gerund & Infinitive s\u0131nav\u0131n\u0131 burada bitirmek istiyor musun? Mevcut do\u011frular\u0131n AP\'si verilir.')) return false;
    return finishGerundInfinitiveQuiz(true);
  }

  function renderGerundInfinitiveReward() {
    var quiz = global.lexLeague && global.lexLeague.quiz;
    if (!quiz || !quiz.gerundInfinitive || !quiz.committed || !global.llArea) return false;
    var answered = Math.max(0, Math.min(QUESTION_COUNT, Number(quiz.index || 0)));
    var recoveryAp = Number(quiz.recoveryBonus || 0);
    var rerollReady = quiz.reward === 'reroll' || quiz.reward === 'perfect';
    var icon = quiz.reward === 'perfect' ? '\ud83c\udfc6' : quiz.reward === 'reroll' ? '\ud83c\udfaf' : quiz.skipped ? '\u23ed\ufe0f' : '\ud83d\udcda';
    var metricsColumns = recoveryAp > 0 ? 'repeat(3,1fr)' : '1fr 1fr';
    var metricsWidth = recoveryAp > 0 ? '600px' : '420px';
    var notice;
    var action;

    if (quiz.skipped) {
      notice = answered + ' Gerund & Infinitive cevab\u0131n\u0131n AP \u00f6d\u00fcl\u00fc hesab\u0131na i\u015flendi. Cevaplanmayan sorular sonraki Gerund & Infinitive ma\u00e7lar\u0131nda yeniden gelebilir.';
    } else if (quiz.reward === 'perfect') {
      notice = 'Kusursuz 8/8! 1 reroll ve se\u00e7ece\u011fin mevkiye bu ma\u00e7 i\u00e7in +1 kazand\u0131n.';
    } else if (quiz.reward === 'reroll') {
      notice = '7/8 do\u011fru ile bu ma\u00e7 i\u00e7in 1 reroll kazand\u0131n.';
    } else {
      notice = 'Reroll \u00f6d\u00fcl\u00fc i\u00e7in 7 do\u011fru gerekiyordu. Kazand\u0131\u011f\u0131n AP hesab\u0131na i\u015flendi.';
    }
    if (recoveryAp > 0) notice += ' Daha \u00f6nce yanl\u0131\u015f bildi\u011fin sorular\u0131 d\u00fczeltti\u011fin i\u00e7in +' + recoveryAp + ' AP geri kazan\u0131m ald\u0131n.';

    if (quiz.reward === 'perfect') {
      var roles = [
        ['Kaleci', '\ud83e\udde4 Kaleci'],
        ['Orta Saha', '\u2699\ufe0f Orta Saha'],
        ['Forvet', '\u26bd Forvet']
      ];
      action = '<div class="ll-card-title" style="margin-top:20px">+1 Uygulanacak Zar\u0131 Se\u00e7</div><div class="ll-squad">' +
        roles.map(function (role) {
          return '<button type="button" class="ll-team-option" onclick="llBeginMatch(\'' + role[0] + '\')">' +
            '<div class="ll-team-name">' + role[1] + '</div>' +
            '<div class="ll-range">Bu ma\u00e7 zar sonucuna +1 \u00b7 1 reroll ayr\u0131ca haz\u0131r</div>' +
            '</button>';
        }).join('') + '</div>';
    } else {
      action = '<button type="button" class="ll-btn primary" style="margin-top:18px" onclick="llBeginMatch(null)">Zar D\u00fcellosuna Ge\u00e7</button>';
    }

    var rewardHtml =
      '<div style="font-size:52px">' + icon + '</div>' +
        '<div class="quiz-start-title" style="margin-top:8px">' + quiz.correct + '/' + answered + ' <em>Do\u011fru</em></div>' +
        '<div class="ll-metrics" style="grid-template-columns:' + metricsColumns + ';max-width:' + metricsWidth + ';margin:18px auto">' +
        '<div class="ll-metric"><strong>+' + Number(quiz.apEarned || 0) + '</strong><span>Toplam AP</span></div>' +
        (recoveryAp > 0 ? '<div class="ll-metric"><strong>+' + recoveryAp + '</strong><span>Hata Geri Kazan\u0131m AP</span></div>' : '') +
        '<div class="ll-metric"><strong>' + (rerollReady ? '1' : '0') + '</strong><span>Reroll</span></div></div>' +
        '<div class="ll-notice" style="text-align:left">' + notice + '</div>' +
        '<div class="ll-relative-result-actions">' + action + '</div>';
    return renderGrammarCard(rewardHtml, 'll-relative-result-card ll-gerund-infinitive-result-card');
  }

  function wrap(name, replacement) {
    var base = global[name];
    if (typeof base !== 'function') return;
    global[name] = replacement(base);
  }

  function install() {
    wrap('llStartMatchPreparation', function (baseStart) {
      return function () {
        var state = stateNow();
        var fixture = fixtureNow();
        var due = state && fixture && isDue(state, fixture);
        var output = baseStart.apply(this, arguments);
        var quiz = global.lexLeague && global.lexLeague.quiz;

        if (due && quiz && quiz.relativeClause) {
          ensure(state);
          state.gerundInfinitivePending = true;
          save();
        } else if (due && quiz && !quiz.gerundInfinitive && isOfficial(quiz.fixture || fixture)) {
          beginGerundInfinitiveQuiz(quiz.fixture || fixture);
        } else if (due && (!quiz || !quiz.gerundInfinitive)) {
          ensure(state);
          state.gerundInfinitivePending = true;
          save();
        }
        setDashboardButton();
        return output;
      };
    });

    wrap('llRenderDashboard', function (baseRenderDashboard) {
      return function () {
        var output = baseRenderDashboard.apply(this, arguments);
        setDashboardButton();
        return output;
      };
    });
    wrap('llRenderLeagueQuiz', function (baseRender) {
      return function () {
        if (global.lexLeague && global.lexLeague.quiz && global.lexLeague.quiz.gerundInfinitive) return renderGerundInfinitiveQuiz();
        return baseRender.apply(this, arguments);
      };
    });
    wrap('llRevealQuiz', function (baseReveal) {
      return function () {
        if (global.lexLeague && global.lexLeague.quiz && global.lexLeague.quiz.gerundInfinitive) return revealGerundInfinitiveQuiz();
        return baseReveal.apply(this, arguments);
      };
    });
    wrap('llRateLeagueQuiz', function (baseRate) {
      return function (correct) {
        if (global.lexLeague && global.lexLeague.quiz && global.lexLeague.quiz.gerundInfinitive) return rateGerundInfinitiveQuiz(!!correct);
        return baseRate.apply(this, arguments);
      };
    });
    wrap('llSkipLeagueQuiz', function (baseSkip) {
      return function () {
        if (global.lexLeague && global.lexLeague.quiz && global.lexLeague.quiz.gerundInfinitive) return skipGerundInfinitiveQuiz();
        return baseSkip.apply(this, arguments);
      };
    });
    wrap('llFinishLeagueQuiz', function (baseFinish) {
      return function () {
        if (global.lexLeague && global.lexLeague.quiz && global.lexLeague.quiz.gerundInfinitive) return finishGerundInfinitiveQuiz(false);
        return baseFinish.apply(this, arguments);
      };
    });
    wrap('llRenderQuizReward', function (baseReward) {
      return function () {
        if (global.lexLeague && global.lexLeague.quiz && global.lexLeague.quiz.gerundInfinitive) return renderGerundInfinitiveReward();
        return baseReward.apply(this, arguments);
      };
    });
    wrap('llCommitCurrentMatch', function (baseCommit) {
      return function () {
        var state = stateNow();
        var fixture = global.lexLeague && global.lexLeague.quiz && global.lexLeague.quiz.fixture || fixtureNow();
        var before = state ? officialResults(state).length : 0;
        var output = baseCommit.apply(this, arguments);
        if (state && isOfficial(fixture) && officialResults(state).length > before) {
          ensure(state);
          state.gerundInfinitiveOfficialMatches = Math.max(state.gerundInfinitiveOfficialMatches + 1, officialResults(state).length);
          save();
        }
        return output;
      };
    });
    setDashboardButton();
  }

  global.LL_GERUND_INFINITIVE_BANK = BANK;
  global.llGerundInfinitiveQuiz = {
    version: 1,
    questionCount: QUESTION_COUNT,
    dueEvery: DUE_EVERY,
    bankSize: BANK.length,
    isDue: function () { return isDue(stateNow(), fixtureNow()); },
    buildQueueForTest: function (state) { ensure(state); return buildQueue(state); }
  };
  install();
})(window);
