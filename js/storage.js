// Storage — persists all state so PWA survives refresh / close
const STORE_KEY = 'timekeeper_v2';

const Storage = {
  save(state) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch(e) {}
  },
  load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch(e) { return null; }
  },
  clear() {
    localStorage.removeItem(STORE_KEY);
  }
};
