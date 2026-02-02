import { useEffect, useState } from "react";
import storeAuth from "../../context/storeAuth";
import "./Gusuarios.css";

const API_URL = `${import.meta.env.VITE_BACKEND_URL}/api/admins/usuarios`;

export default function Gusuario() {
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Obtenemos los datos del admin logueado desde el store
  const auth = storeAuth((state) => state.user); 

  const getUsuarios = async () => {
    try {
      setLoading(true);
      const token = storeAuth.getState().token;
      const res = await fetch(API_URL, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Error al cargar");

      const data = await res.json();
      setUsuarios(Array.isArray(data) ? data : data.users || []);
    } catch (err) {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getUsuarios();
  }, []);

  // FILTRADO: Busqueda + Excluirte a ti mismo
  const usuariosFiltrados = usuarios.filter((u) => {
    const coincideBusqueda = 
      u.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      u.email?.toLowerCase().includes(busqueda.toLowerCase());
    
    // Suponiendo que tu ID de usuario está en auth.id o auth._id
    const noSoyYo = u._id !== auth?._id && u.email !== auth?.email;

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
          placeholder="Buscar por nombre o email..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      <div className="gestion-tabla-wrapper">
        <table className="gestion-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th style={{ textAlign: "right" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuariosFiltrados.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: "center", padding: "30px" }}>
                  No hay otros usuarios registrados
                </td>
              </tr>
            ) : (
              usuariosFiltrados.map((usuario) => (
                <tr key={usuario._id}>
                  <td className="font-bold">{usuario.nombre}</td>
                  {/* Asegúrate de que el backend envíe el campo 'email' */}
                  <td>{usuario.email || "Sin email"}</td>
                  <td>
                    <span className={`gestion-badge ${usuario.rol === 'administrador' ? 'admin' : 'usuario'}`}>
                      {usuario.rol || "usuario"}
                    </span>
                  </td>
                  <td>
                    <div className="actions-cell" style={{ justifyContent: "flex-end" }}>
                      <button className="btn-edit" onClick={() => alert("Editar")}>
                        ✏️ Editar
                      </button>
                      <button className="btn-delete" onClick={() => eliminarUsuario(usuario._id)}>
                        🗑️ Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
