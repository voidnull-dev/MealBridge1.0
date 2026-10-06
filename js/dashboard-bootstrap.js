(() => {
  if(location.protocol==='file:'){
    document.getElementById('access-title').textContent='Open your local server.';
    document.getElementById('access-message').textContent='Google authentication requires HTTP(S). Serve this project and open http://127.0.0.1:8080/hostel.html.';
    return;
  }
  const script=document.createElement('script');script.type='module';script.src='js/dashboard-gate.js';
  script.addEventListener('error',()=>{document.getElementById('access-title').textContent='Connection unavailable.';document.getElementById('access-message').textContent='The workspace could not load. Refresh or return to MealBridge.';});
  document.head.appendChild(script);
})();
