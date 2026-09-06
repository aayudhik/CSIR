/* Physics JRF Journey V6: per-user progress bridge.
 * The existing portal keeps its client-side state; this bridge mirrors that state
 * to Supabase user_progress so the same student can resume on another device.
 */
(() => {
  const TABLE = 'user_progress';
  const SUPABASE_PREFIX = /^sb-[^:]+-auth-token$/;
  const HIDE_TIMEOUT = 8000;
  let syncing = false;
  let saveTimer = null;

  const isProtectedPortal = !/\/auth\.html(?:$|[?#])/.test(location.pathname);
  if (!isProtectedPortal) return;

  document.body.style.visibility = 'hidden';

  const waitForClient = (timeout = HIDE_TIMEOUT) => new Promise((resolve, reject) => {
    const started = Date.now();
    const tick = () => {
      if (window.PJRJ_SUPABASE_CLIENT && window.PJRJ_AUTH_USER) return resolve({
        client: window.PJRJ_SUPABASE_CLIENT,
        user: window.PJRJ_AUTH_USER
      });
      if (Date.now() - started >= timeout) return reject(new Error('Supabase authentication client unavailable'));
      setTimeout(tick, 100);
    };
    tick();
  });

  const snapshotLocalState = () => {
    const data = {};
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key || SUPABASE_PREFIX.test(key) || key.toLowerCase().includes('supabase')) continue;
      data[key] = localStorage.getItem(key);
    }
    return data;
  };

  const restoreLocalState = data => {
    if (!data || typeof data !== 'object') return;
    Object.entries(data).forEach(([key, value]) => {
      if (typeof key !== 'string' || SUPABASE_PREFIX.test(key) || key.toLowerCase().includes('supabase')) return;
      if (typeof value === 'string') localStorage.setItem(key, value);
    });
  };

  const save = async (client, userId) => {
    if (syncing || !userId) return;
    syncing = true;
    try {
      const progressData = snapshotLocalState();
      const { error } = await client.from(TABLE).upsert({
        user_id: userId,
        progress_data: progressData,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });
      if (error) console.warn('[Physics JRF Journey] Progress save failed:', error.message);
    } finally {
      syncing = false;
    }
  };

  const scheduleSave = () => {
    if (syncing) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      if (window.PJRJ_SUPABASE_CLIENT && window.PJRJ_AUTH_USER) {
        save(window.PJRJ_SUPABASE_CLIENT, window.PJRJ_AUTH_USER.id);
      }
    }, 1200);
  };

  const patchStorage = () => {
    const originalSetItem = Storage.prototype.setItem;
    const originalRemoveItem = Storage.prototype.removeItem;
    Storage.prototype.setItem = function(key, value) {
      originalSetItem.call(this, key, value);
      if (this === localStorage) scheduleSave();
    };
    Storage.prototype.removeItem = function(key) {
      originalRemoveItem.call(this, key);
      if (this === localStorage) scheduleSave();
    };
  };

  const run = async () => {
    try {
      const { client, user } = await waitForClient();
      const { data, error } = await client
        .from(TABLE)
        .select('progress_data,updated_at')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;

      const remote = data?.progress_data;
      if (remote && typeof remote === 'object' && Object.keys(remote).length) {
        restoreLocalState(remote);
      } else {
        await save(client, user.id);
      }

      patchStorage();
      document.body.style.visibility = 'visible';
      window.PJRJ_PROGRESS_READY = true;
      window.dispatchEvent(new CustomEvent('pjrj:progress-ready', { detail: { userId: user.id } }));
    } catch (error) {
      console.warn('[Physics JRF Journey] Progress sync unavailable; continuing with local state:', error.message);
      document.body.style.visibility = 'visible';
    }
  };

  window.addEventListener('pjrj:authenticated', run, { once: true });
  if (window.PJRJ_AUTH_USER && window.PJRJ_SUPABASE_CLIENT) run();
})();
