import { state, loadSavedForUser, persistSaved, generateThumbnailFallback, truncate, storageKeyForUser } from './common.js';

const savedGrid = document.getElementById('saved-grid');
const noSaved = document.getElementById('no-saved');
const sortSelect = document.getElementById('sort-select');
const profileMsg = document.getElementById('profile-msg');
const profileUsername = document.getElementById('profile-username');

function updateProfileUI(){
  const lastUser = localStorage.getItem('dqg_last_user');
  if(lastUser){
    profileMsg.textContent = 'Signed in as';
    profileUsername.textContent = lastUser;
    loadSavedForUser();
  } else {
    profileMsg.textContent = 'Not signed in';
    profileUsername.textContent = '';
  }
  renderSavedGrid();
}

function renderSavedGrid(){
  savedGrid.innerHTML = '';
  if(!state.saved || state.saved.length === 0){ noSaved.style.display = 'block'; return; }
  noSaved.style.display = 'none';
  let list = [...state.saved];
  const sort = sortSelect.value;
  if(sort === 'newest') list.sort((a,b)=> new Date(b.dateSaved) - new Date(a.dateSaved));
  if(sort === 'oldest') list.sort((a,b)=> new Date(a.dateSaved) - new Date(b.dateSaved));
  if(sort === 'author') list.sort((a,b)=> (a.author || '').localeCompare(b.author || ''));
  for(const item of list){
    const flip = document.createElement('div'); flip.className = 'flip';
    const inner = document.createElement('div'); inner.className = 'flip-inner';
    const front = document.createElement('div'); front.className = 'flip-front';
    const back = document.createElement('div'); back.className = 'flip-back';
    const thumb = document.createElement('img'); thumb.className = 'thumbnail'; thumb.alt = item.text.slice(0,40);
    thumb.src = item.imageUrl || generateThumbnailFallback(item);
    const title = document.createElement('div'); title.innerHTML = `<strong style="font-size:1rem">${truncate(item.text,80)}</strong>`;
    const meta = document.createElement('div'); meta.className = 'meta'; meta.textContent = `${item.author} · ${new Date(item.dateSaved).toLocaleString()}`;
    const tags = document.createElement('div'); tags.className = 'small muted'; tags.textContent = (item.tags || []).slice(0,3).join(', ');
    front.appendChild(thumb); front.appendChild(title); front.appendChild(meta); front.appendChild(tags);
    back.innerHTML = `
      <div>
        <div style="font-weight:700">${item.author}</div>
        <div style="margin-top:8px;font-size:.95rem">${truncate(item.text,120)}</div>
        <div style="margin-top:12px" class="small">Template: ${item.templateUsed} · BG: ${item.bgColor}</div>
        <div style="margin-top:12px;display:flex;gap:8px">
          <button class="btn" data-action="view">View</button>
          <button class="btn danger" data-action="delete">Delete</button>
        </div>
      </div>`;
    inner.appendChild(front); inner.appendChild(back); flip.appendChild(inner); savedGrid.appendChild(flip);
    back.querySelectorAll('button').forEach(btn=>{
      btn.addEventListener('click', (e)=>{
        const action = btn.getAttribute('data-action');
        if(action === 'view'){
          localStorage.setItem('dqg_preview', JSON.stringify(item));
          window.location.href = 'index.html';
        } else if(action === 'delete'){
          state.saved = state.saved.filter(s=> !(s.id === item.id && s.dateSaved === item.dateSaved));
          persistSaved();
          renderSavedGrid();
        }
      });
    });
  }
}

sortSelect.addEventListener('change', renderSavedGrid);

window.addEventListener('load', ()=>{
  updateProfileUI();
});

window.addEventListener('storage', (ev)=>{
  const lastUser = localStorage.getItem('dqg_last_user');
  if(!lastUser) return;
  if(ev.key === storageKeyForUser(lastUser)){
    loadSavedForUser();
    renderSavedGrid();
  }
});