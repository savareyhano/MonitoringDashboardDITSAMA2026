// Sesi login. Disimpan di localStorage agar tetap masuk saat halaman dimuat ulang atau dibuka
// di tab baru, sampai token kedaluwarsa (default backend 7 hari) atau pengguna keluar.
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { useDataStore } from "./data.js";

const STORAGE_KEY = "ditsama-session";

// waktu kedaluwarsa (ms) dari payload JWT; token rusak dianggap kedaluwarsa
function expiresAt(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return (payload.exp || 0) * 1000;
  } catch {
    return 0;
  }
}
const isExpired = (session) => !session || expiresAt(session.token || session.loginToken) <= Date.now();

export const useAuthStore = create(persist((set) => ({
  // { name, email, role, programs, loginToken, token }
  // token = token setelah Password Akses (dipakai untuk semua data); null -> belum diverifikasi
  session: null,
  notice: "",   // pesan untuk gerbang login (mis. sesi berakhir)

  login: (user, loginToken) => {
    useDataStore.getState().reset();
    set({
      session: { name: user.name, email: user.email, role: user.role, programs: user.programs || [], loginToken, token: null },
      notice: "",
    });
  },
  unlock: (token) => set((s) => ({ session: s.session && { ...s.session, token } })),
  lockAccess: () => set((s) => ({ session: s.session && { ...s.session, token: null } })),
  logout: (notice = "") => {
    set({ session: null, notice });
    useDataStore.getState().reset();
  },
}), {
  name: STORAGE_KEY,
  storage: createJSONStorage(() => localStorage),
  partialize: (s) => ({ session: s.session }),
  // sesi tersimpan yang sudah kedaluwarsa dibuang saat dimuat
  merge: (saved, current) => {
    const session = saved?.session;
    if (!session) return { ...current, session: null };
    if (!isExpired(session)) return { ...current, session };
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* penyimpanan diblokir */ }
    return { ...current, session: null, notice: "Sesi Anda berakhir. Silakan masuk lagi." };
  },
}));

// masuk/keluar di tab lain langsung berlaku di tab ini
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key !== STORAGE_KEY) return;
    const before = useAuthStore.getState().session?.email;
    useAuthStore.persist.rehydrate();
    if (useAuthStore.getState().session?.email !== before) useDataStore.getState().reset();
  });
}
