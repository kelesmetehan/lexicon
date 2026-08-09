const fs=require('fs');
const source=fs.readFileSync('outputs/lexicon-fixed.html','utf8');
const bad='interpretation of a bug';
const expected='{en:"diagnose a bug", tr:"bir yazılım hatasını teşhis etmek / nedenini bulmak", example:"The developer diagnosed the bug before the release.", exampleTr:"Geliştirici sürümden önce hatayı teşhis etti.", pos:"phrase"';
if(source.includes('{en:"'+bad+'"'))throw new Error('Eski, doğal olmayan kelime kaydı kaynakta kaldı.');
if(!source.includes(expected))throw new Error('Yeni kelime kaydı veya örnek/çeviri alanı eksik.');
if(!source.includes("'interpretation of a bug':'diagnose a bug'"))throw new Error('Eski kaydı mevcut localStorage verisinde taşıyacak dönüşüm eksik.');
console.log('Kelime düzeltmesi ve kayıt taşıması: 3 kontrol geçti.');