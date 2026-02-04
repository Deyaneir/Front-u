import { Routes, Route, BrowserRouter } from "react-router-dom";
import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

// 📄 Páginas públicas
import Landing from "./pages/Landing";
import Register from "./pages/register/Register";
import Login from "./pages/login/Login";
import Gracias from "./pages/gracias/Gracias";
import Contacto from "./pages/contacto/Contacto";
import Eventos from "./pages/eventos/Eventos";
import Beneficios from "./pages/beneficios/Beneficios";
import ForgotPassword from "./pages/forgot-password/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import { Confirm } from "./pages/confirm";

// 🔐 Páginas privadas
import Dashboard from "./pages/dashboard/Dashboard";
import Perfil from "./pages/perfil/Perfil";
import Matches from "./pages/Matches/Matches";
import MUsuario from "./pages/MUsuario/MUsuario";
import Ajustes from "./pages/Ajustes/Ajustes.jsx";
import ActualizarInfo from "./Actualizacion/ActualizarInfo.jsx";
import ChangePasswordForm from "./pages/Password/ActualizarPass.jsx";
import Grupos from "./pages/Grupos/Grupos.jsx";
import Gusuario from "./pages/gusuarios/Gusuarios.jsx";
import Gautomatizacion from "./pages/Gautomatizacion/Gautomatizacion.jsx";

// 🧭 Rutas protegidas
import PublicRoute from "./routes/PublicRouter.jsx";
import PrivateRoute from "./routes/PrivateRouter.jsx";

// 🗃️ Stores
import storeProfile from "./context/storeProfile";
import storeAuth from "./context/storeAuth";

function App() {
  const profile = storeProfile((state) => state.profile);
  const token = storeAuth((state) => state.token);

  // 🔹 Cargar perfil si existe sesión
  useEffect(() => {
    if (token) {
      profile();
    }
  }, [token, profile]);

  // 🔹 Inicializar animaciones
  useEffect(() => {
    AOS.init({ once: true, duration: 800 });
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* 🌐 RUTAS QUE SÓLO SE VEN SI NO ESTÁS LOGUEADO */}
        <Route element={<PublicRoute />}>
          <Route index element={<Landing />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="gracias" element={<Gracias />} />
          <Route path="confirmar/:token" element={<Confirm />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="recuperarpassword/:token" element={<ResetPassword />} />
        </Route>

        {/* 🔒 RUTAS PROTEGIDAS (REQUIEREN LOGIN) */}
        <Route element={<PrivateRoute />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="perfil" element={<Perfil />} />
          <Route path="matches" element={<Matches />} />
          <Route path="musuario" element={<MUsuario />} />
          <Route path="user-profile" element={<MUsuario />} />
          <Route path="ajustes" element={<Ajustes />} />
          <Route path="actualizar-info" element={<ActualizarInfo />} />
          <Route path="actualizar-pass" element={<ChangePasswordForm />} />
          <Route path="grupos" element={<Grupos />} />
          <Route path="gusuarios" element={<Gusuario />} />
          <Route path="gautomatizacion" element={<Gautomatizacion />} />
        </Route>

        {/* 📢 RUTAS ABIERTAS A TODO EL MUNDO */}
        <Route path="contacto" element={<Contacto />} />
        <Route path="eventos" element={<Eventos />} />
        <Route path="beneficios" element={<Beneficios />} />

        {/* 404 - Opcional: Redirigir si la ruta no existe */}
        <Route path="*" element={<div>Página no encontrada</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
