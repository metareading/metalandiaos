/* Филмова въртележка · съдържание (MET-1276) · единственото място с думи.
   Имената са дословно от projects/maitapp-site/CONTEXT.md (Снимачна площадка · Метагерой) и от тикета (продукциите).
   accent = единственото, което продукцията сменя (НЖ sep2026 токени живеят в :root на страницата). */
export default {
  ui: { stage: 'Филмова въртележка', sets: 'Снимачна площадка', heroes: 'Метагерой', back: 'Назад' },
  sets: [
    { id: 'set-1', accent: '#E8C77E', heroes: [
      { id: 'woman', name: 'Жена', production: 'НоваЖена' },
      { id: 'man', name: 'Мъж', production: 'МеттаМъж' } ] },
    { id: 'set-2', accent: '#D4895E', heroes: [
      { id: 'teen', name: 'Тийн', production: 'МетаТийн' },
      { id: 'mother', name: 'Майка', production: 'МетаРодител' } ] },
    { id: 'set-3', accent: '#6FB59A', heroes: [
      { id: 'reader', name: 'Читател', production: 'Метачетене' },
      { id: 'writer', name: 'Писателка', production: 'Метаписане' } ] },
    { id: 'set-4', accent: '#EFE4C9', heroes: [
      { id: 'storyteller', name: 'Разказвачка', production: 'ТРИП' },
      { id: 'director', name: 'Режисьор', production: 'И4' } ] },
  ],
};
