import { useEffect, useState } from "react";
import storeAuth from "../../context/storeAuth";
import "./Gusuarios.css";

const API_URL = `${import.meta.env.VITE_BACKEND_URL}/api/admins/usuarios`;

export default function Gusuario() {
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);
  
  const [modal, setModal] = useState({ show: false, user: null, type: "" });

  // Datos del usuario logueado (Damaris Lopez)
  const currentUser = storeAuth((state) => state.user);
  const token = storeAuth.getState().token;

  const getUsuarios = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_URL, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      setUsuarios(Array.isArray(data) ? data : data.users || []);
    } catch (err) {
      console.error("Error al obtener usuarios:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getUsuarios();
  }, []);

  const confirmarAccion = async () => {
    const { user, type } = modal;
    if (!user) return;

    // Bloqueo de seguridad en la función (Doble capa)
    if (String(user._id) === String(currentUser?._id)) {
      alert("No puedes realizar acciones administrativas sobre tu propia cuenta.");
      setModal({ show: false, user: null, type: "" });
      return;
    }

    try {
      if (type === "ROL") {
        const nuevoRol = user.rol === "administrador" ? "estudiante" : "administrador";
        const res = await fetch(`${API_URL}/${user._id}`, {
          method: "PUT",
          headers: { 
            "Content-Type": "application/json", 
            Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify({ rol: nuevoRol }),
        });

        if (res.ok) {
          setUsuarios(prev => prev.map(u => u._id === user._id ? { ...u, rol: nuevoRol } : u));
        }
      } else if (type === "DELETE") {
        const res = await fetch(`${API_URL}/${user._id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          setUsuarios(prev => prev.filter(u => u._id !== user._id));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setModal({ show: false, user: null, type: "" });
    }
  };

  // 🔹 FILTRO: Ahora solo filtra por búsqueda, NO te excluye de la lista
  const usuariosFiltrados = usuarios.filter((u) => {
    return u.nombre?.toLowerCase().includes(busqueda.toLowerCase()) || 
           u.correoInstitucional?.toLowerCase().includes(busqueda.toLowerCase());
  });

  if (loading) return <div className="gestion-usuarios-seccion"><h3>Cargando...</h3></div>;

  return (
    <div className="gestion-usuarios-seccion">
      <div className="gestion-header">
        <h2>👤 Gestión de Usuarios</h2>
      </div>

      <div className="gestion-search-container">
        <input
          type="text"
          className="gestion-input-search"
          placeholder="Buscar por nombre o correo..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      <div className="gestion-tabla-wrapper">
        <table className="gestion-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email Institucional</th>
              <th>Rol</th>
              <th style={{ textAlign: "center" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuariosFiltrados.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: "center", padding: "40px" }}>No hay registros</td>
              </tr>
            ) : (
              usuariosFiltrados.map((usuario) => {
                // Comprobamos si el usuario de esta fila eres TÚ
                const esMiCuenta = String(usuario._id) === String(currentUser?._id);

                return (
                  <tr key={usuario._id} className={esMiCuenta ? "fila-propia" : ""}>
                    <td className="font-bold">{usuario.nombre} {esMiCuenta && "(Tú)"}</td>
                    <td>{usuario.correoInstitucional}</td>
                    <td>
                      <span className={`gestion-badge ${usuario.rol === 'administrador' ? 'admin' : 'usuario'}`}>
                        {usuario.rol}
                      </span>
                    </td>
                    <td className="actions-cell">
                      {/* Botón de ROL deshabilitado si es tu cuenta */}
                      <button 
                        className={usuario.rol === "administrador" ? "btn-downgrade" : "btn-promote"} 
                        onClick={() => setModal({ show: true, user: usuario, type: "ROL" })}
                        disabled={esMiCuenta}
                        title={esMiCuenta ? "No puedes cambiar tu propio rol" : ""}
                      >
                        {usuario.rol === "administrador" ? "⬇️ Quitar Admin" : "⬆️ Hacer Admin"}
                      </button>

                      {/* Botón de ELIMINAR deshabilitado si es tu cuenta */}
                      <button 
                        className="btn-delete" 
                        onClick={() => setModal({ show: true, user: usuario, type: "DELETE" })}
                        disabled={esMiCuenta}
                        title={esMiCuenta ? "No puedes eliminar tu propia cuenta" : ""}
                      >
                        🗑️ Eliminar
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {modal.show && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 className="modal-title">Confirmar Acción</h3>
            <p className="modal-text">¿Deseas modificar a <strong>{modal.user?.nombre}</strong>?</p>
            <div className="modal-buttons">
              <button className="btn-modal-cancel" onClick={() => setModal({ show: false, user: null, type: "" })}>Cancelar</button>
              <button className="btn-modal-confirm-rol" onClick={confirmarAccion}>Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
