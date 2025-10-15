// login.js - wiring for login.html
import { signIn, signOut, state, loadSavedForUser } from './common.js';

const form = document.getElementById('login-form');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginMsg = document.getElementById('login-msg');
const profileMsg = document.getElementById('profile-msg');
const profileUsername = document.getElementById('profile-username');
const btnLogout = document.getElementById('btn-logout');

function updateProfileUI(){
  const lastUser = localStorage.getItem('dqg_last_user');
  if(lastUser){
    profileMsg.textContent = 'Signed in as';
    profileUsername.textContent = lastUser;
  } else {
    profileMsg.textContent = 'Not signed in';
    profileUsername.textContent = '';
  }
}

form.addEventListener('submit', (ev)=>{
  ev.preventDefault();
  const u = usernameInput.value.trim();
  const p = passwordInput.value;
  if(!u || !p){ loginMsg.textContent = 'Provide credentials'; loginMsg.className = 'small danger'; setTimeout(()=>{ loginMsg.textContent=''; },3000); return; }
  signIn(u);
  updateProfileUI();
  usernameInput.value = ''; passwordInput.value = '';
  loginMsg.textContent = 'Signed in';
  loginMsg.className = 'small ok';
  setTimeout(()=>{ loginMsg.textContent=''; },3000);
});

btnLogout.addEventListener('click', ()=>{
  signOut();
  updateProfileUI();
  loginMsg.textContent = 'Signed out';
  loginMsg.className = 'small danger';
  setTimeout(()=>{ loginMsg.textContent=''; },3000);
});

window.addEventListener('load', updateProfileUI);