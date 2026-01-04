import { useForm } from "react-hook-form";
import { toast, ToastContainer } from "react-toastify";
import { Link, useParams, useNavigate } from "react-router-dom";
import { IoArrowBack } from "react-icons/io5";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { useState } from "react";
import axios from "axios";
import "react-toastify/dist/ReactToastify.css";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const password = watch("password");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // 🔐 Fuerza de contraseña
  const getStrength = () => {
    if (!password) return 0;
    if (password.length < 6) return 30;
    if (password.length < 10) return 60;
    return 100;
  };

  const handleReset = async (data) => {
    const loading = toast.loading("Restableciendo contraseña...");
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/reset-password/${token}`,
        { password: data.password }
      );
      toast.update(loading, {
        render: res.data.msg,
        type: "success",
        isLoading: false,
        autoClose: 3000
      });
      setTimeout(() => navigate("/login"), 2000);
    } catch (error) {
      toast.update(loading, {
        render: error.response?.data?.msg || "Error 😞",
        type: "error",
        isLoading: false,
        autoClose: 4000
      });
    }
  };

  const styles = {
    container: {
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background: "linear-gradient(135deg,#ffb07c,#9f6bff)",
      padding: "20px",
      position: "relative"
    },
    card: {
      background: "white",
      width: "400px",
      padding: "40px",
      borderRadius: "20px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
      textAlign: "center",
      position: "relative"
    },
    backBtn: {
      position: "absolute",
      top: "25px",
      left: "25px",
      color: "black"
    },
    title: { fontSize: "28px", fontWeight: "bold", color: "#111" },
    subtitle: { color: "#555", marginTop: "8px" },

    inputContainer: {
      position: "relative",
      width: "100%",
      marginTop: "20px"
    },
    input: {
      width: "100%",
      padding: "14px 44px 14px 14px",
      borderRadius: "12px",
      border: "2px solid #d1d5db",
      fontSize: "16px",
      outline: "none",
      transition: "0.3s",
      color: "black"
    },
    eye: {
      position: "absolute",
      right: "12px",
      top: "50%",
      transform: "translateY(-50%)",
      cursor: "pointer",
      color: "#555"
    },
    error: {
      color: "red",
      fontSize: "13px",
      marginTop: "5px",
      display: "block"
    },
    button: {
      width: "100%",
      padding: "14px",
      marginTop: "30px",
      background: "#8a3dff",
      color: "white",
      border: "none",
      borderRadius: "12px",
      fontSize: "16px",
      fontWeight: "bold",
      cursor: "pointer"
    }
  };

  return (
    <div style={styles.container}>
      <Link to="/login" style={styles.backBtn}>
        <IoArrowBack size={30} />
      </Link>

      <div style={styles.card}>
        <h2 style={styles.title}>Restablecer contraseña</h2>
        <p style={styles.subtitle}>Ingresa tu nueva contraseña</p>

        <form onSubmit={handleSubmit(handleReset)}>
          {/* NUEVA CONTRASEÑA */}
          <div style={styles.inputContainer}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Nueva contraseña"
              style={{
                ...styles.input,
                border: errors.password ? "2px solid red" : styles.input.border
              }}
              onFocus={(e) => e.target.style.border = "2px solid #8a3dff"}
              onBlur={(e) => e.target.style.border = errors.password ? "2px solid red" : "2px solid #d1d5db"}
              {...register("password", {
                required: "La contraseña es obligatoria",
                minLength: { value: 6, message: "Mínimo 6 caracteres" }
              })}
            />
            {showPassword
              ? <AiOutlineEye style={styles.eye} onClick={() => setShowPassword(false)} />
              : <AiOutlineEyeInvisible style={styles.eye} onClick={() => setShowPassword(true)} />
            }
          </div>
          {errors.password && <span style={styles.error}>{errors.password.message}</span>}

          {/* BARRA DE FUERZA */}
          <div style={{ marginTop: "10px" }}>
            <div style={{ height: "6px", background: "#e5e7eb", borderRadius: "10px" }}>
              <div
                style={{
                  width: `${getStrength()}%`,
                  height: "100%",
                  borderRadius: "10px",
                  transition: "0.3s",
                  background:
                    getStrength() < 40 ? "red" :
                    getStrength() < 70 ? "orange" : "green"
                }}
              />
            </div>
          </div>

          {/* CONFIRMAR */}
          <div style={styles.inputContainer}>
            <input
              type={showConfirm ? "text" : "password"}
              placeholder="Confirmar contraseña"
              style={{
                ...styles.input,
                border: errors.confirmPassword ? "2px solid red" : styles.input.border
              }}
              {...register("confirmPassword", {
                required: "Debes confirmar",
                validate: value => value === password || "No coinciden"
              })}
            />
            {showConfirm
              ? <AiOutlineEye style={styles.eye} onClick={() => setShowConfirm(false)} />
              : <AiOutlineEyeInvisible style={styles.eye} onClick={() => setShowConfirm(true)} />
            }
          </div>
          {errors.confirmPassword && <span style={styles.error}>{errors.confirmPassword.message}</span>}

          <button type="submit" style={styles.button}>
            Restablecer contraseña
          </button>
        </form>
      </div>

      <ToastContainer position="top-right" />
    </div>
  );
};

export default ResetPassword;
