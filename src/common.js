export const state = { currentQuote: null, currentImageUrl: '', user: null, saved: [] };

export function storageKeyForUser(username){ return `dqg_user_${username}_saved`; }

export function loadSavedForUser(){
  if(!state.user) return;
  const key = storageKeyForUser(state.user);
  try{ const raw = localStorage.getItem(key); state.saved = raw ? JSON.parse(raw) : []; }catch(e){ state.saved = []; }
  return state.saved;
}

export function persistSaved(){
  if(!state.user) return;
  localStorage.setItem(storageKeyForUser(state.user), JSON.stringify(state.saved));
}

export function signIn(username){
  state.user = username;
  localStorage.setItem('dqg_last_user', username);
  loadSavedForUser();
}

export function signOut(){
  localStorage.removeItem('dqg_last_user');
  state.user = null;
  state.saved = [];
}

function enrichQuote(quoteObj){
  return {
    id: quoteObj.id || quoteObj.uuid || ('q_' + Date.now()),
    text: quoteObj.text || quoteObj.quote || 'No text available',
    author: quoteObj.author || quoteObj.by || 'Unknown',
    tags: quoteObj.tags || (quoteObj.categories || []).slice(0,3),
    source: quoteObj.source || 'quotes.rest',
    length: (quoteObj.text||quoteObj.quote||'').split(' ').length,
    language: quoteObj.language || 'en',
    dateGenerated: new Date().toISOString(),
    popularity: quoteObj.popularity || Math.floor(Math.random()*100),
    license: quoteObj.license || 'unknown'
  };
}

// export async function fetchQuote() {
//   try {
//     const res = await fetch('https://type.fit/api/quotes');
//     const data = await res.json();
//     const quoteObj = data[Math.floor(Math.random() * data.length)];

//     return enrichQuote({
//       text: quoteObj.text,
//       author: quoteObj.author,
//       tags: ['inspiration'],
//       source: 'type.fit',
//       license: 'public-domain'
//     });
//   } catch (err) {
//     console.error('Quote fetch failed', err);
//     return enrichQuote({
//       id: 'local-1',
//       text: 'Do not wait to strike till the iron is hot; but make it hot by striking.',
//       author: 'William Butler Yeats',
//       tags: ['motivation','action'],
//       source: 'local_fallback',
//       popularity: 76,
//       license: 'public-domain'
//     });
//   }
// }

export async function fetchQuote() {
  try {
    const res = await fetch('/data/quotes.json');
    const data = await res.json();
    const quoteObj = data[Math.floor(Math.random() * data.length)];

    return enrichQuote({
      text: quoteObj.text,
      author: quoteObj.author,
      tags: [quoteObj.tag || 'inspiration'],
      source: 'local_file',
      license: 'public-domain'
    });
  } catch (err) {
    console.error('Quote fetch failed', err);
    return enrichQuote({
      id: 'local-1',
      text: 'Do not wait to strike till the iron is hot; but make it hot by striking.',
      author: 'William Butler Yeats',
      tags: ['motivation','action'],
      source: 'local_fallback',
      popularity: 76,
      license: 'public-domain'
    });
  }
}

export function renderImageFromQuote(quote) {
  return `https://picsum.photos/1200/630?random=${Date.now()}`;
}

export function generateThumbnailFallback(item){
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 800; canvas.height = 400;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = item.bgColor || '#3D5467';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = '28px Alegreya, serif';
    wrapText(ctx, item.text, 24, 60, 740, 34);
    return canvas.toDataURL('image/png');
  } catch(e){
    return '';
  }
}

export function truncate(s, n){ return s.length>n ? s.slice(0,n-1)+'…' : s; }
export function wrapText(ctx, text, x, y, maxWidth, lineHeight){
  const words = text.split(' ');
  let line = '';
  for(let n=0;n<words.length;n++){
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if(testWidth > maxWidth && n > 0){
      ctx.fillText(line, x, y);
      line = words[n] + ' ';
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
}