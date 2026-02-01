import { useEffect, useState } from "react";

const API_URL = "https://controversial-jacquette-vibe-u-d09f766e.koyeb.app/"; 
// cambia la URL si usas Vercel o backend remoto

export default function Gusuario() {
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);

  // ===============================
  // OBTENER USUARIOS
  // ===============================
  const getUsuarios = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setUsuarios(data);
    } catch (error) {
      console.error("Error al obtener usuarios", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getUsuarios();
  }, []);

  // ===============================
  // ELIMINAR USUARIO
  // ===============================
  const eliminarUsuario = async (id) => {
    const confirmacion = window.confirm("¿Eliminar este usuario?");
    if (!confirmacion) return;

    try {
      await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
      });
      setUsuarios(usuarios.filter((u) => u._id !== id));
    } catch (error) {
      console.error("Error al eliminar usuario", error);
    }
  };

  // ===============================
  // FILTRO DE BÚSQUEDA
  // ===============================
  const usuariosFiltrados = usuarios.filter((u) =>
    u.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.email?.toLowerCase().includes(busqueda.toLowerCase())
  );

  if (loading) {
    return <p>Cargando usuarios...</p>;
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2>👤 Gestión de Usuarios</h2>

      {/* BUSCADOR */}
      <input
        type="text"
        placeholder="Buscar usuario..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        style={{
          padding: "8px",
          width: "100%",
          maxWidth: "300px",
          marginBottom: "15px",
        }}
      />

      {/* TABLA */}
      <table border="1" cellPadding="10" cellSpacing="0" width="100%">
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
              <td colSpan="4" align="center">
                No hay usuarios
              </td>
            </tr>
          ) : (
            usuariosFiltrados.map((usuario) => (
              <tr key={usuario._id}>
                <td>{usuario.nombre}</td>
                <td>{usuario.email}</td>
                <td>{usuario.rol || "usuario"}</td>
                <td>
                  <button
                    style={{ marginRight: "8px" }}
                    onClick={() =>
                      alert("Aquí puedes abrir un modal para editar")
                    }
                  >
                    ✏️ Editar
                  </button>

                  <button
                    onClick={() => eliminarUsuario(usuario._id)}
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
  );
}
