# Lexicon League — kaynak, mantık ve uzun dönem denetimi

Tarih: 2026-07-27

## Yönetici özeti

Denetim, `outputs/lexicon-fixed.html` ve yüklenen 12 çalışma zamanı modülünü; veri, lig/kupa/Avrupa, kart, AI, kelime, kayıt ve sunum testlerini kapsadı. Başlangıç regresyonu temizdi; buna rağmen mevcut testlerin yakalamadığı beş nesnel sorun yeniden üretildi ve düzeltildi:

1. AI kulüplerinin gelişmiş yıldızı her state onarımında registry başlangıç yıldızına dönüyordu.
2. Sezon arşivi yalnızca aktif ülkenin iki ligini saklıyor; diğer altı ülkenin sonuçlarını kaybediyordu.
3. Son şampiyon kaydı ülke bazlı değildi.
4. Yeni sezon UEFA katılımcıları yalnızca aktif ülke/legacy alanlarından türetiliyor, aynı sezonda kupalar arasında kulüp çakışması oluşabiliyordu.
5. Kariyer kaybı ve bazı arayüz metinleri çok ülkeli motorda hâlâ Türkiye’ye sabitlenmişti.

Düzeltme sonrasında 1.001 ülke-sezonu, 733.590 lig maçı, 50.000 AI reroll kararı, 100 kariyer başlangıcı ve 60.000’in üzerinde yerel kupa eşleşmesi seed’li olarak işlendi; takım kaybı/çoğalması, puan denklemi veya UEFA kesişimi oluşmadı.

## Çalışma zamanı yükleme sırası

1. `outputs/lexicon-fixed.html` — ana UI, kelime verisi, temel maç/kart motoru
2. `outputs/league-v2.js` — lig/kupa/Avrupa, transfer, kart sözleşmesi, kariyer yuvaları
3. `outputs/save-backup-hardening.js` — güvenli/atomik save-import-export
4. `outputs/manager-market.js` — sezon sonu menajer pazarı
5. `outputs/europe-knockout-center.js` — UEFA eleme yol haritası
6. `outputs/europe-knockout-tiebreak.js` — iki ayak/penaltı nedenselliği
7. `outputs/europe-team-pools.js` — Avrupa aday havuzları ve sezon alanları
8. `outputs/european-leagues-pools.js` — yedi ülkenin merkezi lig/team metadata’sı
9. `outputs/last-champions.js` — son şampiyon geçmişi
10. `outputs/penalty-shootout-animation.js` — kayıtlı penaltı sonucunun sunumu
11. `outputs/ai-opponent-strategy.js` — AI ekonomi, kart ve reroll kararları
12. `outputs/multi-league-engine.js` — ülke-agnostik state, alias ve son override katmanı
13. `outputs/diagnostics.js` — hata kaydı ve event geçmişi

## Kritik override zinciri

| Global | Kaynak/override zinciri | Nihai sorumluluk |
|---|---|---|
| `llV2RepairState` | `league-v2.js` → save/kart/UEFA/AI wrapper’ları → `multi-league-engine.js` | migration, state invariant ve legacy alias |
| `llRenderDashboard` | `league-v2.js` → sunum wrapper’ları → `multi-league-engine.js` | ülke etiketli dashboard |
| `llV2FinalizeSeason` | `league-v2.js` → kariyer/menajer wrapper’ları → `multi-league-engine.js` | yedi ülke özeti, arşiv ve kariyer sınırı |
| `llV2ArchiveSeason` | `league-v2.js` → kart/kariyer wrapper’ları → `multi-league-engine.js` | bütün ülke tablolarının snapshot’ı |
| `llStartNextSeason` | `league-v2.js` → manager market → `multi-league-engine.js` | ülke hareketleri ve yeni UEFA katılımı |
| `llRenderSeasonEnd` | `league-v2.js` → career/manager wrapper’ları → `multi-league-engine.js` | ülkeye göre sezon sonu |
| `llRenderCompetitionCenter` | `league-v2.js` → UEFA center → `multi-league-engine.js` | lig/kupa/Avrupa ekranı |
| `llRenderSeasonArchive` | `league-v2.js` → `multi-league-engine.js` | sezon ve ülke seçilebilir arşiv |
| `llV14RebuildEuropeStandings` | `europe-team-pools.js` → `multi-league-engine.js` katılımcı kaynağı | 36 takımlı, kupalar arası ayrık alan |
| `llAutoRerollWithCredits` | temel motor → `ai-opponent-strategy.js` | kart zinciri tabanlı AI reroll |

Tam dosya/satır/hash envanteri `tests/full-system-audit.report.json` içindedir.

## Düzeltme raporu

| ID | Önem | Gerçek davranış/kök neden | Düzeltme | Kanıt |
|---|---|---|---|---|
| ML-01 | Yüksek | `llV2RepairState`, oyuncu dışındaki takım yıldızını her çağrıda başlangıç değerine yazıyordu | Geçerli 1–6 saved star korunuyor; registry yalnızca eksik/geçersiz değerde fallback | `multi-league-engine-simulation`: non-player star regression |
| ML-02 | Kritik | Arşiv entry’si yalnız `superRows/firstRows` içeriyordu | `countrySummaries` ve `leagueRows` deep snapshot olarak saklanıyor | 7 ülkenin tablo uzunlukları ve resolver testi |
| ML-03 | Orta | Son şampiyon anahtarları yalnız `super/first/cup` idi | `domestic:COUNTRY:tier1/tier2/cup` anahtarları ve legacy fallback | `last-champions.test.js` |
| ML-04 | Kritik | UEFA katılımcıları aktif ülke legacy qualification verisinden geliyordu | Önceki sezonun 7 ülke özetinden her kupaya 2 takım; katılım kaynağı kaydı | dinamik qualifier testi |
| ML-05 | Kritik | Aynı kulüp aynı sezon iki UEFA kupasında bulunabiliyordu; aliaslar duplicate üretebiliyordu | canonical alias, modeled-club filtresi ve üç kupaya ortak reservation set’i | 36+36+36 pairwise intersection = 0 |
| ML-06 | Yüksek | AI kulüp yıldız gelişimi ve UEFA alanı onarım sırasında birbirini bozabiliyordu | geçerli saved state önceliği | 1.001 ülke-sezonu |
| ML-07 | Orta | `innerHTML.replace` render edilmiş DOM’u yeniden kuruyordu | text-node/attribute bazlı güvenli relabel | syntax + presentation regresyonu |
| ML-08 | Yüksek | Kariyer kaybı `TFF 1. Lig / son 4` sabitiydi | ülke bazlı boundary: TUR 4, ENG 3, GER 2, ESP 4, FRA 2, ITA 3, NED 0 | country boundary regression |
| ML-09 | Yüksek | Sezon arşivinde diğer ülkeler görüntülenemiyordu | sezon + ülke + tier seçilebilir immutable arşiv | archive resolver regression |
| TEST-01 | Orta | Avrupa havuz test düzeneği üretimdeki fixture builder’ı yüklemiyordu | test load order üretim bağımlılığıyla eşitlendi | `europe-team-pools.js` geçti |
| ML-10 | Yüksek | Aktif ülkenin son yükselen listesi final wrapper’da yeniden ilk 2 + play-off diye kuruluyordu | Nihai liste ve özet metadata direct/play-off adetlerinden üretiliyor | metadata mutation regression |
| AI-02 | Yüksek | Yükselen AI takımının logunda +300 AP görünmesine rağmen bakiye artmıyordu | AP gerçek bakiyeye idempotent işlendi | AI promotion migration regression |
| TARGET-01 | Yüksek | Çok ülkeli hedef override’ı önceki sezon sırası/yükselme-düşme bağlamını atıyordu | 7 ülkenin arşiv snapshot’ından previous context çözülüyor | promoted/relegated contextual target regression |

## Matematik ve veri bütünlüğü

- Yedi ülke, her ülkede tier1/tier2 ve merkezi takım registry’si doğrulandı.
- Aynı yerel kulübün iki ülke veya iki yerel ligde bulunmadığı doğrulandı.
- Yıldızların 1–6 aralığında olduğu doğrulandı.
- Her lig satırında `O = G+B+M`, `AV = AG-YG`, `P = 3G+B` korundu.
- 733.590 simüle lig maçından sonra hiçbir takım kaybolmadı veya çoğalmadı.
- UCL, UEL ve UECL aynı sezonda 36 benzersiz kulüp içerdi ve üç kümenin ikili kesişimleri boş kaldı.
- Yeni sezon katılımcı provenance’ı `europeQualificationSources` içinde tutuluyor.
- Eski arşivler yalnız geçmişte gerçekten saklanmış aktif ülkeyi gösterebilir; geçmişte hiç kaydedilmemiş altı ülkenin tarihsel tabloları geriye dönük uydurulmaz.

## Organizasyon ve nedensellik

- Özel fikstür önceliği: mevcut pending → play-off → yerel kupa → Avrupa → lig.
- Yerel kupa aynı haftada oluşursa lig haftasını artırmadan önce oynanır; tamamlanınca aynı haftadaki Avrupa yeniden değerlendirilir.
- UEFA gelecek turu önceki tur kesinleşmeden sonuç üretmez; iki ayak toplam eşitliğinde kayıtlı penaltı serisi kullanılır.
- Eleme merkezi render fonksiyonlarının state ilerletmediği mevcut runtime testleriyle doğrulandı.
- Sezonun bitişinde canlı eleme aşaması varsa `llCompleteSeason` önce pending Avrupa fikstürünü açar.

## Kart ve AI

- 100 kart, 53 aile, 149 slot varyantı, 34 senaryo.
- 1.978.126 kart çözümü; invariant, trigger log, symmetry ve katalog hatası: 0.
- AI başlangıç bütçesi, üç rol kartı, elite pack, trigger olasılığı, gerçek performans ağırlığı ve sözleşme/upgrade davranışları geçti.
- 50.000 seed’li reroll kararında yalnız yasal zar aralığı üretildi, bir kararda en fazla bir reroll loglandı.
- Kart performansı ve preview/commit ayrımı mevcut regresyonlarda doğrulandı.

## Kayıt, migration ve güvenlik

- Save/import/export derin denetimi: 57 kontrol.
- Slot/tam yedek: 19 kontrol; legacy migration: 6 kontrol.
- `__proto__`, `prototype`, `constructor` reddediliyor.
- Import metinleri modalda escape ediliyor; XSS test edildi.
- Yazma kısmen başarısız olursa localStorage snapshot rollback uygulanıyor.
- Telefon/PC JSON Unicode round-trip ve güvenlik yedeği doğrulandı.
- Üç kariyer ayrı; kelime ilerlemesi ortak kalıyor.

## Kelime sistemi

- 406 kayıt için EN/TR dizileri, type, örnek cümle ve yeni kelime batch bütünlüğü geçti.
- Yakın tekrar koruması, hedef yenileme ve hata kaydı testleri geçti.
- Skip ve AP’nin iki kez verilmemesi mevcut presentation/vocabulary test kapsamındadır.

## Performans

| İşlem | Sonuç | Hedef |
|---|---:|---:|
| Bir paralel arka plan haftası | 28.37 ms | <100 ms |
| 1.001 ülke-sezonu / 733.590 maç | 1.23 sn motor bölümü | Bilgi amaçlı |
| 50.000 AI reroll kararı | 29.05 sn | Bilgi amaçlı |
| 100 kariyer başlangıcı | 70.11 sn | Yoğun test; UI işlemi değil |
| Tam uzun denetim | yaklaşık 104 sn | CI/audit |

## Regresyon sonucu

- 21 test dosyasından üretim davranışı sınayanların tamamı geçti.
- Kart matrisi: 1.978.126 çözüm, 0 hata.
- Uzun audit: 10/10 kontrol.
- Bilerek hata üreten save rollback testindeki konsol stack’i beklenen test çıktısıdır; test geçmiştir.

## Görsel/browser raporu

Gerçek in-app browser sürücüsü başlatılmak istendi ancak Codex Node REPL yardımcı süreci Windows ACL sandbox aşamasında `helper_unknown_error: apply deny-read ACLs` ile kapandı. Bu nedenle 1920×1080 ve mobil viewport ekran görüntülü kontrol **geçmiş sayılmadı**. DOM tabanlı 25 presentation testi geçti; gerçek iOS Safari ve ekran görüntülü QA kalan risktir.

## Denge / kullanıcı kararı gerektiren noktalar

- Alt oynanabilir lig kariyer kaybı sayıları ülke metadata’sına ayrıldı. Hollanda Eerste Divisie için sportif düşme olmadığı kabulüyle `0` kullanıldı.
- Yerel liglerin gerçek play-off formatlarının tamamını ayrı ayrı birebir taklit etmek yerine metadata’daki direct/playoff adetleri korunuyor. Format ayrıntısını değiştirmek tasarım kararıdır.
- Kart nadirlik/ekonomi dengesi nesnel hata olmadıkça değiştirilmedi.
- Gerçek UEFA ülke katsayısı yerine oyunun kabul edilmiş “her kupaya iki temsilci” kuralı korunuyor.

## Değiştirilen dosyalar

| Dosya | Değişiklik |
|---|---|
| `outputs/multi-league-engine.js` | yıldız kalıcılığı, 7 ülke arşivi, metadata hareketleri, ülke UI’si, kariyer sınırı, UEFA participant source |
| `outputs/europe-team-pools.js` | canonical/ayrık UEFA alanları ve eksik yabancı adaylar |
| `outputs/last-champions.js` | ülke bazlı son şampiyon ve render purity |
| `outputs/ai-opponent-strategy.js` | yükselen AI kulüplerine gerçek ve idempotent AP desteği |
| `tests/multi-league-engine-simulation.js` | yeni hata regresyonları |
| `tests/multi-league-test-helpers.js` | audit API/load harness |
| `tests/last-champions.test.js` | ülke şampiyon kayıtları |
| `tests/europe-team-pools.js` | gerçek fixture-builder bağımlılığı |
| `tests/full-system-audit.js` | seed’li uzun dönem/invariant denetimi |
| `tests/full-system-audit.report.json` | makinece okunabilir kaynak/simülasyon raporu |
| `tests/full-system-audit.md` | kısa otomatik rapor |
| `tests/LEXICON-LEAGUE-AUDIT-2026-07-27.md` | bu ayrıntılı denetim raporu |

## GitHub yükleme listesi

Zorunlu çalışma zamanı: değişen üç `outputs/*.js` dosyası. Testleri depoda tutuyorsan değişen/yeni `tests/*.js` dosyalarını da yükle. Raporlar isteğe bağlıdır. Kişisel save, indirilen debug JSON, telefon yedeği ve ekran görüntülerini GitHub’a yükleme.

## Kalan riskler

- Gerçek browser ve iOS Safari görsel QA, ortam ACL hatası nedeniyle tamamlanamadı.
- Monolitik inline runtime için statement/branch instrumentation kurulmadı; yapay coverage yüzdesi raporlanmadı.
- Eski sezonlarda hiç saklanmamış arka plan ülke tabloları geriye dönük kurtarılamaz; yalnız yeni tamamlanan sezonlar eksiksizdir.
- Harici logo CDN’lerinin çevrimdışı/erişim engelli davranışı gerçek ağla test edilmedi; fallback kodu statik olarak mevcut.