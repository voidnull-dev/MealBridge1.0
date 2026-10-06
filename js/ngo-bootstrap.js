(() => {
 if(location.protocol==='file:'){document.getElementById('access-title').textContent='A local server is required.';document.getElementById('access-message').textContent='Serve MealBridge over HTTP(S) to verify your Google session and open this workspace.';return;}
 const script=document.createElement('script');script.type='module';script.src='js/ngo-gate.js';script.onerror=()=>{document.getElementById('access-title').textContent='Connection unavailable.';document.getElementById('access-message').textContent='Reload the page and check your connection.';};document.head.append(script);
})();
