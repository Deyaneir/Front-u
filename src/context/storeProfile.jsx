import { create } from "zustand";
import axios from "axios";
import storeAuth from "./storeAuth";

const storeProfile = create((set) => ({
  user: null,

  clearUser: () => set({ user: null }),

  profile: async () => {
    const token = storeAuth.getState().token;

    // 🚫 NO pedir perfil si no hay token
    if (!token) {
      console.log("⛔ No hay token, no se pide perfil");
      return;
    }

    try {
      const url = `${import.meta.env.VITE_BACKEND_URL}/api/usuarios/perfil`;

      const respuesta = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      set({ user: respuesta.data });
    } catch (error) {
      console.error(
        "Error al obtener perfil:",
        error.response?.data || error
      );
    }
  },
}));

export default storeProfile;
