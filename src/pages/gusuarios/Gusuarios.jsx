import { useEffect, useState } from "react";
import storeAuth from "../../context/storeAuth";
import "./Gusuarios.css";

const API_URL = `${import.meta.env.VITE_BACKEND_URL}/api/admins/usuarios`;

export default function Gusuario() {
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);
  
  const [modal, setModal] = useState({ show: false, user: null, type: "" });

  // Obtenemos los datos del usuario logueado desde el store
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

    // Bloqueo de seguridad por ID y por Correo
    if (String(user._id) === String(currentUser?._id) || user.correoInstitucional === currentUser?.correoInstitucional) {
      alert("No puedes realizar acciones sobre tu propia cuenta.");
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

  // 🔹 FILTRO BLINDADO
  const usuariosFiltrados = usuarios.filter((u) => {
    const coincideBusqueda = u.nombre?.toLowerCase().includes(busqueda.toLowerCase()) || 
                             u.correoInstitucional?.toLowerCase().includes(busqueda.toLowerCase());
    
    // EXCLUSIÓN POR CORREO (Más fiable que el ID si hay dudas con el store)
    // Comprobamos que el correo de la lista sea diferente al tuyo logueado
    const noSoyYo = u.correoInstitucional !== currentUser?.correoInstitucional && 
                     String(u._id) !== String(currentUser?._id);

    return coincideBusqueda && noSoyYo;
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
              usuariosFiltrados.map((usuario) => (
                <tr key={usuario._id}>
                  <td className="font-bold">{usuario.nombre}</td>
                  <td>{usuario.correoInstitucional}</td>
                  <td>
                    <span className={`gestion-badge ${usuario.rol === 'administrador' ? 'admin' : 'usuario'}`}>
                      {usuario.rol}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button 
                      className={usuario.rol === "administrador" ? "btn-downgrade" : "btn-promote"} 
                      onClick={() => setModal({ show: true, user: usuario, type: "ROL" })}
                    >
                      {usuario.rol === "administrador" ? "⬇️ Quitar Admin" : "⬆️ Hacer Admin"}
                    </button>
                    <button 
                      className="btn-delete" 
                      onClick={() => setModal({ show: true, user: usuario, type: "DELETE" })}
                    >
                      🗑️ Eliminar
                    </button>
                  </td>
                </tr>
              ))
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
              <button className="btn-modal-cancel" onClick={() => setModal({ show: false })}>Cancelar</button>
              <button className="btn-modal-confirm-rol" onClick={confirmarAccion}>Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
