import React, { useState, useEffect } from 'react';
import { Search, MoreVertical, Edit2, Trash2, Shield, User, Filter, RefreshCcw } from 'lucide-react';

const App = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Simulación de carga de datos
  useEffect(() => {
    const fetchData = async () => {
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
      } catch (err) {
        setError("Error al conectar con el servidor.");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f4fb] p-6">
        <div className="text-center bg-white p-10 rounded-3xl shadow-xl border border-purple-100 max-w-sm">
          <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <RefreshCcw className="text-red-500" size={30} />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error de carga</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-semibold transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f4fb] p-4 md:p-10 text-gray-800 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Header simplificado sin botón de añadir */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-purple-900 mb-2">Vibe-U</h1>
          <p className="text-purple-600/60 font-medium italic">Directorio General de Miembros</p>
        </div>

        {/* Contenedor Principal */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-purple-50 overflow-hidden">
          
          {/* Barra de búsqueda y contadores */}
          <div className="p-6 bg-white flex flex-col sm:flex-row gap-4 justify-between items-center border-b border-purple-50">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-300" size={18} />
              <input 
                type="text"
                placeholder="Filtrar por nombre o correo..."
                className="w-full bg-purple-50/40 border border-purple-100 rounded-2xl py-3 pl-12 pr-4 text-gray-700 placeholder:text-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <button className="p-3 text-purple-400 hover:bg-purple-50 rounded-xl transition-colors border border-purple-50">
                <Filter size={20} />
              </button>
              <span className="text-xs font-bold text-purple-500 tracking-wide bg-purple-50 px-4 py-2.5 rounded-xl border border-purple-100">
                {filteredUsers.length} USUARIOS ENCONTRADOS
              </span>
            </div>
          </div>

          {/* Tabla de Datos */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-purple-50/20 text-purple-400 text-[11px] uppercase tracking-widest text-left border-b border-purple-50">
                  <th className="px-8 py-5 font-bold">Perfil</th>
                  <th className="px-8 py-5 font-bold">Permisos</th>
                  <th className="px-8 py-5 font-bold">Estado</th>
                  <th className="px-8 py-5 font-bold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50/50">
                {loading ? (
                  Array(4).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan="4" className="px-8 py-6">
                        <div className="h-12 bg-purple-50/50 rounded-2xl w-full"></div>
                      </td>
                    </tr>
                  ))
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-purple-50/20 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-100 to-purple-50 flex items-center justify-center text-purple-700 font-bold border border-purple-100">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-gray-800">{user.name}</p>
                            <p className="text-sm text-gray-400">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${user.role === 'Administrador' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                            {user.role === 'Administrador' ? <Shield size={14} /> : <User size={14} />}
                          </div>
                          <span className="text-sm font-semibold text-gray-600">{user.role}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-tighter ${
                          user.status === 'Activo' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-gray-50 text-gray-400 border border-gray-100'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'Activo' ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]' : 'bg-gray-300'}`} />
                          {user.status}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button title="Editar" className="p-2.5 hover:bg-purple-100 rounded-xl text-purple-400 hover:text-purple-700 transition-all">
                            <Edit2 size={18} />
                          </button>
                          <button title="Eliminar" className="p-2.5 hover:bg-red-50 rounded-xl text-purple-300 hover:text-red-500 transition-all">
                            <Trash2 size={18} />
                          </button>
                          <button className="p-2.5 text-purple-200">
                            <MoreVertical size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-8 py-24 text-center">
                      <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-50 rounded-full mb-4">
                        <Search className="text-purple-200" size={40} />
                      </div>
                      <p className="text-purple-300 font-medium text-lg">No hay coincidencias para tu búsqueda</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        <footer className="mt-12 text-center">
          <div className="inline-block px-6 py-2 bg-white rounded-full border border-purple-50 shadow-sm">
            <p className="text-purple-300 text-[10px] font-bold uppercase tracking-[0.2em]">
              Vibe-U &bull; Sistema de Gestión de Red
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;
