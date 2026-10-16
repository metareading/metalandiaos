/* Филмова въртележка · съдържание (MET-1276 · MET-1277) · единственото място с думи и образи.
   Имената са дословно от projects/maitapp-site/CONTEXT.md (Снимачна площадка · Метагерой) и от тикета (продукциите).
   accent = единственото, което продукцията сменя (НЖ sep2026 токени живеят в :root на страницата).
   image (MET-1277 · Metahero image): 2 frames, before → transformation. after = the classical painting (only from ~/metalandiaos/img · nothing generated) ·
   credit = the master (mandatory under the image) · before = a real "before" frame (the NZh heroine, taken as is); without before, the "before" frame is the same painting in shadow ·
   pos = object-position for 375×812 (the image fills the screen, no letterbox). */
export default {
  selectable: 'set-2',   // Ep5: id на ЕДИНСТВЕНАТА избираема площадка (Тийн ◆ · Майка ✧) · останалите показват само имената си · index.html не носи този id
  ui: { stage: 'Филмова въртележка', sets: 'Снимачна площадка', heroes: 'Метагерой', back: 'Назад', metahero: 'Метагерой-образ', before: 'преди', after: 'преображение' },
  sets: [
    { id: 'set-1', accent: '#E8C77E', heroes: [
      { id: 'woman', name: 'Жена', production: '' },
      { id: 'man', name: 'Мъж', production: 'МеттаМъж',
        image: { after: 'https://maitapp.com/img/art-areas/02.jpg', credit: 'Caspar David Friedrich · Wanderer above the Sea of Fog · 1818', pos: '50% 50%' } } ] },
    { id: 'set-2', accent: '#D4895E', heroes: [
      { id: 'teen', name: 'Тийн', production: 'МетаТийн',
        image: { after: 'https://maitapp.com/img/metateen-ep5/teen-millais-autumn-leaves.webp', credit: 'John Everett Millais · Autumn Leaves · 1856', pos: '50% 40%' } },
      { id: 'mother', name: 'Майка', production: 'МетаРодител',
        image: { after: 'https://maitapp.com/img/metateen-ep5/mother-klimt-three-ages.webp', credit: 'Gustav Klimt · The Three Ages of Woman · 1905', pos: '44% 50%' } } ] },
    { id: 'set-3', accent: '#6FB59A', heroes: [
      { id: 'reader', name: 'Читател', production: 'Метачетене',
        image: { after: 'https://maitapp.com/img/art-areas/03.jpg', credit: 'Leonardo da Vinci · Lady with an Ermine · c. 1490', pos: '50% 50%' } },
      { id: 'writer', name: 'Писателка', production: 'Метаписане',
        image: { after: 'https://maitapp.com/img/nz-ep4/ep4-03.webp', credit: 'John William Waterhouse · The Magic Circle · 1886', pos: '50% 50%' } } ] },
    { id: 'set-4', accent: '#EFE4C9', heroes: [
      { id: 'storyteller', name: 'Разказвачка', production: 'ТРИП',
        image: { after: 'https://maitapp.com/img/nz7-мудборд3/erhughes2.jpg', credit: 'Edward Robert Hughes · Midsummer Eve · c. 1908', pos: '50% 50%' } },
      { id: 'director', name: 'Режисьор', production: 'И4',
        image: { after: 'https://maitapp.com/img/nz-ep4/ep4-05.webp', credit: 'Frederic Leighton · Perseus on Pegasus · 1895', pos: '50% 45%' } } ] },
  ],
};
