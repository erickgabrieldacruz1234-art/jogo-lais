import { PHASES } from "./data/phases";

const SAVE_KEY = "a_lenda_de_lais_save_v3";

/** progresso: { phase: índice da próxima fase (0..5), roses: [ids], diamonds: { [faseId]: n } } */
export const newProgress = () => ({ phase: 0, roses: [], diamonds: {} });

export const saveManager = {
  hasSave() {
    return Boolean(this.load());
  },
  save(progress) {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({ ...progress, timestamp: new Date().toISOString() }));
      return true;
    } catch (e) {
      return false;
    }
  },
  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const d = JSON.parse(raw);
      const p = { ...newProgress(), ...d };
      p.roses = (p.roses || []).filter((id) => PHASES.some((ph) => ph.id === id));
      p.phase = Math.max(0, Math.min(PHASES.length, p.phase | 0));
      return p;
    } catch (e) {
      return null;
    }
  },
  clear() {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch (e) {}
  }
};
