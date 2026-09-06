(() => {
  const AUTH_PAGE = './auth.html';
  const SUPABASE_CDN = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
  const config = window.PJRJ_SUPABASE;
  if (!config) return;

  const isAuthPage = /\/auth\.html(?:$|[?#])/.test(location.pathname);

  const loadSupabase = () => new Promise((resolve, reject) => {
    if (window.supabase?.createClient) return resolve(window.supabase);
    const script = document.createElement('script');
    script.src = SUPABASE_CDN;
    script.onload = () => window.supabase?.createClient ? resolve(window.supabase) : reject(new Error('Supabase client failed to load'));
    script.onerror = () => reject(new Error('Unable to load Supabase client'));
    document.head.appendChild(script);
  });

  const setBusy = (form, busy) => {
    form.querySelectorAll('button').forEach(b => { b.disabled = busy; });
  };

  const message = (text, error = false) => {
    const el = document.getElementById('auth-message');
    if (!el) return;
    el.textContent = text;
    el.dataset.error = error ? 'true' : 'false';
  };

  const initAuthPage = async (client) => {
    const form = document.getElementById('auth-form');
    const mode = document.body.dataset.authMode || 'login';
    if (!form) return;

    const { data: { session } } = await client.auth.getSession();
    if (session) {
      location.replace('./');
      return;
    }

    form.addEventListener('submit', async event => {
      event.preventDefault();
      setBusy(form, true);
      message(mode === 'signup' ? 'Creating your account…' : 'Signing you in…');

      const email = form.email.value.trim();
      const password = form.password.value;

      try {
        if (mode === 'signup') {
          const fullName = form.fullName.value.trim();
          const { data, error } = await client.auth.signUp({
            email,
            password,
            options: { data: { full_name: fullName } }
          });
          if (error) throw error;
          if (data.session) {
            location.replace('./');
          } else {
            message('Account created. Check your email to confirm your account, then return here to log in.');
          }
        } else {
          const { error } = await client.auth.signInWithPassword({ email, password });
          if (error) throw error;
          location.replace('./');
        }
      } catch (error) {
        message(error?.message || 'Authentication failed. Please try again.', true);
      } finally {
        setBusy(form, false);
      }
    });

    const forgot = document.getElementById('forgot-password');
    if (forgot) forgot.addEventListener('click', async event => {
      event.preventDefault();
      const email = form.email.value.trim();
      if (!email) return message('Enter your email address first, then choose Forgot password.', true);
      setBusy(form, true);
      const { error } = await client.auth.resetPasswordForEmail(email, {
        redirectTo: `${location.origin}${location.pathname}`
      });
      setBusy(form, false);
      if (error) message(error.message, true);
      else message('Password reset instructions have been sent to your email.');
    });
  };

  const initProtectedPortal = async (client) => {
    const { data: { session } } = await client.auth.getSession();
    if (!session) {
      location.replace(AUTH_PAGE);
      return;
    }

    window.PJRJ_SUPABASE_CLIENT = client;
    window.PJRJ_AUTH_USER = session.user;
    document.documentElement.dataset.authenticated = 'true';

    client.auth.onAuthStateChange((event, nextSession) => {
      if (event === 'SIGNED_OUT' || !nextSession) location.replace(AUTH_PAGE);
      else window.PJRJ_AUTH_USER = nextSession.user;
    });

    window.PJRJ_signOut = async () => {
      await client.auth.signOut();
      location.replace(AUTH_PAGE);
    };
  };

  loadSupabase().then(supabaseApi => {
    const client = supabaseApi.createClient(config.url, config.publishableKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    window.PJRJ_SUPABASE_CLIENT = client;
    return isAuthPage ? initAuthPage(client) : initProtectedPortal(client);
  }).catch(error => {
    console.error('[Physics JRF Journey] Supabase initialization failed:', error);
    if (!isAuthPage) location.replace(AUTH_PAGE);
    else message('Authentication service could not be loaded. Please refresh the page.', true);
  });
})();
