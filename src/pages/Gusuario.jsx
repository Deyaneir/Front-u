import React, { useState, useEffect } from "react";
import {
  Search,
  MoreVertical,
  Edit2,
  Trash2,
  Shield,
  User,
  Filter,
  RefreshCcw
} from "lucide-react";

const Gusuario = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    try {
      setLoading(true);
      const data = [
        { id: 1, name: "Deyaneir", email: "deyaneir@vibe-u.app", role: "Administrador", status: "Activo" },
        { id: 2, name: "S. Lopez", email: "slopez_l@dominio.com", role: "Usuario", status: "Inactivo" },
        { id: 3, name: "Carlos Dev", email: "carlos@vibe-u.app", role: "Editor", status: "Activo" },
        { id: 4, name: "M. García", email: "mgarcia@empresa.com", role: "Usuario", status: "Activo" },
      ];

      setTimeout(() => {
        setUsers(data);
        setLoading(false);
      }, 600);

    } catch {
      setError("Error al conectar con el servidor");
      setLoading(false);
    }
  }, []);

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f4fb] p-6">
      {/* TU JSX COMPLETO (tabla, filtros, etc.) */}
    </div>
  );
};

export default Gusuario;
