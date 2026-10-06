(() => {

  const themeToggle = document.getElementById('theme-toggle');

  const themeMenu = document.getElementById('theme-menu');

  function closeTheme() {themeMenu.hidden=true;themeToggle.setAttribute('aria-expanded','false');}

  themeToggle.addEventListener('click', () => { themeMenu.hidden=!themeMenu.hidden;themeToggle.setAttribute('aria-expanded',String(!themeMenu.hidden));if(!themeMenu.hidden){window.MealBridgeAnimate?.({targets:themeMenu,translateY:[-5,0],opacity:[0,1],duration:250,easing:'easeOutExpo'});} });

  document.querySelectorAll('[data-theme-choice]').forEach(button => {button.setAttribute('aria-pressed',String(button.dataset.themeChoice===window.MealBridgeTheme.preference));button.addEventListener('click',()=>{window.MealBridgeTheme.set(button.dataset.themeChoice);closeTheme();themeToggle.focus();});});

  document.addEventListener('click',event=>{if(!event.target.closest('.theme-control'))closeTheme();});

  const menuToggle=document.getElementById('menu-toggle');

  const navigation=document.getElementById('navigation');

  function closeMenu(){navigation.classList.remove('open');menuToggle.setAttribute('aria-expanded','false');menuToggle.setAttribute('aria-label','Open navigation');}

  matchMedia('(min-width: 601px)').addEventListener('change',closeMenu);

  document.addEventListener('focusin',event=>{

    if(!event.target.closest('.theme-control'))closeTheme();

    if(!event.target.closest('.header'))closeMenu();

  });

  menuToggle.addEventListener('click',()=>{const open=navigation.classList.toggle('open');menuToggle.setAttribute('aria-expanded',String(open));menuToggle.setAttribute('aria-label',open?'Close navigation':'Open navigation');if(open)window.MealBridgeAnimate?.({targets:navigation,translateY:[-8,0],opacity:[0,1],duration:300,easing:'easeOutExpo'});});

  navigation.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));

  document.addEventListener('keydown',event=>{if(event.key==='Escape'){if(!themeMenu.hidden){closeTheme();themeToggle.focus();}if(navigation.classList.contains('open')){closeMenu();menuToggle.focus();}}});

  document.addEventListener('click',event=>{if(!event.target.closest('.header'))closeMenu();});

  const info={"safety": "Providers share preparation, packing, allergen and collection details. Collect only within the stated pickup window. MealBridge does not certify food safety; providers and collectors must follow their local food-safety requirements.", "contact": "An official MealBridge contact channel has not been configured yet. Contact your collection partner through the protected active-claim pickup details.", "privacy": "Google sign-in shares your name, email and profile photo with MealBridge. Profiles and collection records are stored in Firebase. Exact pickup details are limited to the owner, authorized admin and a valid active claimant; discovery shows approximate areas. Map features and external location services are currently disabled. Agra registration localities are reviewed by the administrator. Auth state and theme preferences remain in your browser."};

  document.querySelectorAll('[data-info]').forEach(button=>{

    button.setAttribute('aria-controls','footer-info');button.setAttribute('aria-expanded','false');

    button.addEventListener('click',()=>{

      const panel=document.getElementById('footer-info'),open=button.getAttribute('aria-expanded')!=='true';

      document.querySelectorAll('[data-info]').forEach(item=>item.setAttribute('aria-expanded','false'));

      button.setAttribute('aria-expanded',String(open));panel.textContent=info[button.dataset.info];panel.hidden=!open;

    });

  });

  document.getElementById('year').textContent=new Date().getFullYear();

})();

