// home.js
import { state, fetchQuote, renderImageFromQuote, generateThumbnailFallback, loadSavedForUser, persistSaved } from './common.js';

const el = {
  btnGenerate: document.getElementById('btn-generate'),
  btnSave: document.getElementById('btn-save'),
  previewImage: document.getElementById('preview-image'),
  quoteText: document.getElementById('quote-text'),
  quoteAuthor: document.getElementById('quote-author'),
  profileMsg: document.getElementById('profile-msg'),
  profileUsername: document.getElementById('profile-username'),
  btnClearSaved: document.getElementById('btn-clear-saved')
};

function updateProfileUI(){
  const lastUser = localStorage.getItem('dqg_last_user');
  if(lastUser){
    state.user = lastUser;
    el.profileMsg.textContent = 'Signed in as';
    el.profileUsername.textContent = state.user;
    loadSavedForUser();
  } else {
    el.profileMsg.textContent = 'Not signed in';
    el.profileUsername.textContent = '';
  }
}

function renderPreview(quote, imageUrl) {
  state.currentQuote = quote;
  state.currentImageUrl = imageUrl || '';

  el.quoteText.style.transform = 'scale(1.02)';
  setTimeout(() => el.quoteText.style.transform = 'scale(1)', 300);

  el.quoteText.textContent = quote.text;
  el.quoteAuthor.textContent = `— ${quote.author || quote.source || 'Unknown'}`;

  if (imageUrl) {
    el.previewImage.src = imageUrl;
    el.previewImage.style.opacity = '1';

    el.previewImage.onerror = () => {
      console.warn("Image failed to load, using fallback.");
      const fallback = generateThumbnailFallback(quote);
      el.previewImage.src = fallback;
    };
  } else {
    const fallback = generateThumbnailFallback(quote);
    el.previewImage.src = fallback;
    el.previewImage.style.opacity = '1';
  }
}

el.btnSave.addEventListener('click', ()=>{
  if(!state.user){ alert('Please sign in to save'); return; }
  if(!state.currentQuote){ alert('Nothing to save'); return; }

  const saveObj = {
    id: state.currentQuote.id,
    text: state.currentQuote.text,
    author: state.currentQuote.author,
    tags: state.currentQuote.tags,
    source: state.currentQuote.source,
    dateSaved: new Date().toISOString(),
    templateUsed: 'picsum',
    bgColor: '#', 
    length: state.currentQuote.length,
    imageUrl: state.currentImageUrl || '',
    popularity: state.currentQuote.popularity || 0
  };
  const exists = state.saved.find(s=>s.id === saveObj.id && s.templateUsed === saveObj.templateUsed);
  if(exists){ alert('Already saved'); return; }
  state.saved.unshift(saveObj);
  persistSaved();
  alert('Saved');
});

el.btnClearSaved.addEventListener('click', ()=>{
  if(!state.user){ alert('Sign in first'); return; }
  state.saved = [];
  persistSaved();
  alert('Cleared saved items');
});

el.btnGenerate.addEventListener('click', async () => {
  try {
    const quote = await fetchQuote();
    const imageUrl = renderImageFromQuote(quote);
    renderPreview(quote, imageUrl);
  } catch (err) {
    console.error('Error generating quote:', err);
    alert('Failed to generate quote. Please try again.');
  }
});

window.addEventListener('load', ()=>{
  updateProfileUI();

  const raw = localStorage.getItem('dqg_preview');
  if(raw){
    try{
      const item = JSON.parse(raw);
      renderPreview(item, item.imageUrl || generateThumbnailFallback(item));
    } catch(e){}
    localStorage.removeItem('dqg_preview');
  }
});

window.addEventListener('storage', (ev)=>{
  if(!state.user) return;
  if(ev.key && ev.key.startsWith('dqg_user_')) loadSavedForUser();
});