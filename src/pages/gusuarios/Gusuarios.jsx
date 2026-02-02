import { useEffect, useState } from "react";
import storeAuth from "../../context/storeAuth";
import "./Gusuarios.css";

const API_URL = `${import.meta.env.VITE_BACKEND_URL}/api/admins/usuarios`;

export default function Gusuario() {
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Obtenemos el usuario actual de forma segura
  const currentUser = storeAuth((state) => state.user);

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
      // Verificación de consola para depurar los emails
      console.log("Datos recibidos:", data); 
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

  // FILTRO CORREGIDO
  const usuariosFiltrados = usuarios.filter((u) => {
    // 1. Filtro de búsqueda
    const coincideBusqueda = 
      u.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      u.email?.toLowerCase().includes(busqueda.toLowerCase());
    
    // 2. Filtro para no mostrarte a ti mismo (usando email que es único)
    // Si currentUser no existe todavía, dejamos que pase (true)
    const noSoyYo = currentUser ? u.email !== currentUser.email : true;

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
              <th style={{ textAlign: "center" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuariosFiltrados.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: "center", padding: "40px" }}>
                  No se encontraron otros usuarios
                </td>
              </tr>
            ) : (
              usuariosFiltrados.map((usuario) => (
                <tr key={usuario._id}>
                  <td className="font-bold">{usuario.nombre}</td>
                  {/* Cambia 'email' por la propiedad exacta que veas en el console.log */}
                  <td>{usuario.email || <span style={{color: '#ccc'}}>Sin correo</span>}</td>
                  <td>
                    <span className={`gestion-badge ${usuario.rol === 'administrador' ? 'admin' : 'usuario'}`}>
                      {usuario.rol || "estudiante"}
                    </span>
                  </td>
                  <td>
                    <div className="actions-cell" style={{ justifyContent: "center" }}>
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
