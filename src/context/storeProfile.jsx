import { create } from "zustand";
import axios from "axios";
import storeAuth from "./storeAuth";

// Función correcta para headers con token
const getAuthHeaders = () => {
  const token = storeAuth.getState().token;

  return {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  };
};

const storeProfile = create((set) => ({
  user: null,

  clearUser: () => set({ user: null }),

  // 🔐 PERFIL (GET protegido)
  profile: async () => {
    try {
      const url = `${import.meta.env.VITE_BACKEND_URL}/api/usuarios/perfil`;
      const respuesta = await axios.get(url, getAuthHeaders());

      set({ user: respuesta.data });
      return respuesta.data;
    } catch (error) {
      console.error(
        "Error al obtener perfil:",
        error.response?.data || error
      );
      throw error;
    }
  },

  // ✏️ ACTUALIZAR PERFIL (PUT protegido)
  actualizarProfile: async (data) => {
    try {
      const url = `${import.meta.env.VITE_BACKEND_URL}/api/usuarios/actualizar`;
      const respuesta = await axios.put(url, data, getAuthHeaders());

      set({ user: respuesta.data });
      return respuesta.data;
    } catch (error) {
      console.error(
        "Error al actualizar perfil:",
        error.response?.data || error
      );
      throw error;
    }
  },
}));

export default storeProfile;
