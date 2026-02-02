import { useEffect, useState } from "react";
import storeAuth from "../../context/storeAuth";
import "./Gusuarios.css";

const API_URL = `${import.meta.env.VITE_BACKEND_URL}/api/admins/usuarios`;

export default function Gusuario() {
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getUsuarios = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = storeAuth.getState().token;
      const res = await fetch(API_URL, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("No se pudieron cargar los usuarios");

      const data = await res.json();
      setUsuarios(Array.isArray(data) ? data : data.users || []);
    } catch (err) {
      setError("Error al conectar con el servidor");
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getUsuarios();
  }, []);

  const eliminarUsuario = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este usuario?")) return;
    try {
      const token = storeAuth.getState().token;
      const res = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("No se pudo eliminar");
      setUsuarios((prev) => prev.filter((u) => u._id !== id));
    } catch (err) {
      alert("Error al eliminar usuario");
    }
  };

  const usuariosFiltrados = usuarios.filter(
    (u) =>
      u.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      u.email?.toLowerCase().includes(busqueda.toLowerCase())
  );

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
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuariosFiltrados.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: "center", padding: "30px" }}>
                  No se encontraron usuarios
                </td>
              </tr>
            ) : (
              usuariosFiltrados.map((usuario) => (
                <tr key={usuario._id}>
                  <td className="font-bold">{usuario.nombre}</td>
                  <td>{usuario.email}</td>
                  <td>
                    <span className={`gestion-badge ${usuario.rol === 'admin' ? 'admin' : 'usuario'}`}>
                      {usuario.rol || "usuario"}
                    </span>
                  </td>
                  <td>
                    <div className="actions-cell">
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
