// common.js - shared utilities, state, and API logic (UPDATED to use LoremFlickr)
export const CONFIG = {
  QUOTE_API_BASE: 'https://api.thequoteshub.example', // replace with real URL
  // PLACID values removed — LoremFlickr requires no API key
  LOREMFLICKR: {
    BASE: 'https://loremflickr.com', // usage: https://loremflickr.com/{width}/{height}/{keywords}
    WIDTH: 1200,
    HEIGHT: 630
  },
  QUOTE_ENDPOINTS: { today: '/quote/today', random: '/quote/random', list: '/quotes' }
};

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

// JSON normalization
function enrichQuote(quoteObj){
  return {
    id: quoteObj.id || quoteObj.uuid || ('q_' + Date.now()),
    text: quoteObj.text || quoteObj.quote || 'No text available',
    author: quoteObj.author || quoteObj.by || 'Unknown',
    tags: quoteObj.tags || (quoteObj.categories || []).slice(0,3),
    source: quoteObj.source || 'thequoteshub',
    length: (quoteObj.text||quoteObj.quote||'').split(' ').length,
    language: quoteObj.language || 'en',
    dateGenerated: new Date().toISOString(),
    popularity: quoteObj.popularity || Math.floor(Math.random()*100),
    license: quoteObj.license || 'unknown'
  };
}

export async function fetchQuote(mode = 'today'){
  const ep = CONFIG.QUOTE_API_BASE + (CONFIG.QUOTE_ENDPOINTS[mode] || CONFIG.QUOTE_ENDPOINTS.today);
  try {
    const res = await fetch(ep);
    const data = await res.json();
    let quoteObj;
    if(Array.isArray(data)) quoteObj = data[Math.floor(Math.random()*data.length)];
    else if(data.quote) quoteObj = data.quote;
    else quoteObj = data;
    return enrichQuote(quoteObj);
  } catch (err){
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

// Generate an image URL using LoremFlickr. Uses quote text and tags to create keyword string.
// Example: https://loremflickr.com/1200/630/inspiration,life
export function renderImageFromQuote(quote, template, bgColor){
  // Build keywords: prefer tags, fall back to keywords from quote text
  const keywords = (quote.tags && quote.tags.length > 0)
    ? quote.tags.slice(0,3).map(k=>encodeURIComponent(k)).join(',')
    : extractKeywordsFromText(quote.text).slice(0,3).map(k=>encodeURIComponent(k)).join(',');
  const w = CONFIG.LOREMFLICKR.WIDTH;
  const h = CONFIG.LOREMFLICKR.HEIGHT;
  const url = `${CONFIG.LOREMFLICKR.BASE}/${w}/${h}/${keywords || 'quotes'}`;
  // Add a cache-busting param with timestamp so new image variations can be requested
  const finalUrl = `${url}?lock=${Date.now()}`;
  // Return URL synchronously to keep contract similar to earlier API usage
  return finalUrl;
}

function extractKeywordsFromText(text){
  if(!text) return ['quotes'];
  // Very simple keyword extraction: remove punctuation, lowercase, split, filter stopwords, sort by length
  const stop = new Set(['the','and','a','an','of','to','in','is','be','that','it','for','on','with','as','are','this','by','from','at']);
  const cleaned = text.replace(/[^\w\s]/g,'').toLowerCase();
  const words = cleaned.split(/\s+/).filter(w=>w && !stop.has(w) && w.length>3);
  // prefer unique and longer words
  const uniq = Array.from(new Set(words));
  uniq.sort((a,b)=>b.length-a.length);
  return uniq.length ? uniq : ['quotes'];
}

// Utility functions
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