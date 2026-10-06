// Keep the static landing page usable under file:// without module CORS errors.
(() => {
  if(location.protocol!=='file:') {
    const script=document.createElement('script');script.type='module';script.src='js/onboarding.js';document.head.appendChild(script);return;
  }
  const dialog=document.getElementById('auth-dialog');
  const error=document.getElementById('auth-error');
  error.textContent='Google sign-in requires a local server. Run the server in README.md, then open http://127.0.0.1:8080.';error.hidden=false;
  document.getElementById('google-signin').disabled=true;
  let previous;
  document.querySelectorAll('[data-auth-open]').forEach(button=>button.addEventListener('click',event=>{event.preventDefault();previous=document.activeElement;dialog.showModal();document.body.classList.add('auth-dialog-open');}));
  document.querySelectorAll('[data-auth-close]').forEach(button=>button.addEventListener('click',()=>dialog.close()));
  dialog.addEventListener('close',()=>{document.body.classList.remove('auth-dialog-open');previous?.focus();});
})();
