const fs=require('fs');
const vm=require('vm');
const assert=require('assert');

const html=fs.readFileSync('outputs/lexicon-fixed.html','utf8');
const wordsSource=html.match(/const NATIVE_USER_DATA\s*=\s*(\[[\s\S]*?\]);\s*\/\/ İngilizce örnek cümlelerin/);
const translationsSource=html.match(/const NATIVE_EXAMPLE_TRANSLATIONS\s*=\s*(\[[\s\S]*?\]);\s*const LL_WORD_POS_OVERRIDES/);
assert(wordsSource,'native vocabulary array missing');
assert(translationsSource,'example translation array missing');

const words=vm.runInNewContext(`(${wordsSource[1]})`);
const translations=vm.runInNewContext(`(${translationsSource[1]})`);
assert.strictEqual(words.length,translations.length,'every word must have a matching Turkish example translation');

const expected={
  notice:{pos:'v',tr:'fark etmek / dikkatini çekmek'},
  slightly:{pos:'adv',tr:'biraz / hafifçe'},
  visual:{pos:'adj',tr:'görsel / görmeye ilişkin'},
  itchy:{pos:'adj',tr:'kaşıntılı / kaşındıran'},
  bump:{pos:'n',tr:'şişlik / küçük çıkıntı'},
  though:{pos:'conj',tr:'gerçi / -mesine rağmen'},
  legacy:{pos:'n',tr:'miras / kalıcı etki'},
  commute:{pos:'v',tr:'işe veya okula gidip gelmek'},
  'get rid of':{pos:'pv',tr:'kurtulmak / elden çıkarmak'},
  harsh:{pos:'adj',tr:'sert / ağır / acımasız'},
  insane:{pos:'adj',tr:'çılgınca / akıl almaz'},
  perform:{pos:'v',tr:'gerçekleştirmek / performans göstermek'}
};

for(const [term,details] of Object.entries(expected)){
  const index=words.findIndex(word=>word.en===term);
  assert(index>=0,`${term} missing`);
  assert.strictEqual(words[index].pos,details.pos,`${term} part of speech`);
  assert.strictEqual(words[index].tr,details.tr,`${term} Turkish meaning`);
  assert(words[index].example&&translations[index],`${term} example and translation required`);
}
assert(!words.some(word=>word.en==='sglihtly'),'misspelled sglihtly must not be stored');
assert.strictEqual(words.filter(word=>word.en==='legacy').length,1,'duplicate legacy input must create only one word');

console.log(`Vocabulary integrity: ${words.length} words, aligned translations, new batch passed.`);
