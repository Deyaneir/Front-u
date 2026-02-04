import React, { useState, useRef, useEffect, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import axios from 'axios';
import { 
    FaPlus, FaArrowLeft, FaCamera, FaThumbsUp, FaComment, FaSearch, FaTimes, FaEllipsisH, FaShare, 
    FaGlobeAmericas, FaRegImage, FaUserFriends, FaUserCircle, FaTrash, FaSignOutAlt,
    FaRegBookmark, FaBookmark, FaPaperPlane
} from 'react-icons/fa';
import './Grupos.css';

const API_URL = `${import.meta.env.VITE_BACKEND_URL}/api/grupos`;

const Grupos = () => {

    // ===== ESTADOS =====
    const [grupos, setGrupos] = useState([]);
    const [filtro, setFiltro] = useState("");
    const [pestana, setPestana] = useState("todos");
    const [menuAbiertoId, setMenuAbiertoId] = useState(null);
    const [loading, setLoading] = useState(false);

    const [userName, setUserName] = useState("Usuario");
    const [userRole, setUserRole] = useState("");
    const [avatar, setAvatar] = useState(null);

    const userEmail = localStorage.getItem("correo");

    const [grupoActivo, setGrupoActivo] = useState(null);
    const [nuevoPost, setNuevoPost] = useState("");
    const [fotoPost, setFotoPost] = useState(null);

    const [likes, setLikes] = useState({});
    const [guardados, setGuardados] = useState({});
    const [comentarioTexto, setComentarioTexto] = useState({});
    const [comentariosAbiertos, setComentariosAbiertos] = useState({});

    // ===== PERFIL =====
    useEffect(() => {
        const fetchPerfil = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) return;

                const res = await axios.get(
                    `${import.meta.env.VITE_BACKEND_URL}/api/usuarios/perfil`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                setUserName(res.data.nombre);
                setAvatar(res.data.avatar);
                setUserRole(res.data.rol);
            } catch (e) {
                console.error(e);
            }
        };

        fetchPerfil();
    }, []);

    // ===== GRUPOS =====
    const cargarGrupos = async () => {
        try {
            const res = await fetch(`${API_URL}/listar`);
            const data = await res.json();
            setGrupos(data);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        cargarGrupos();
    }, []);

    // ===== PUBLICAR =====
    const handlePublicar = async (e) => {
        e.preventDefault();
        if (!nuevoPost.trim() && !fotoPost) return;

        try {
            const res = await fetch(`${API_URL}/${grupoActivo._id}/post`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    autor: userName,
                    autorEmail: userEmail,
                    autorFoto: avatar, // se guarda, pero NO se usa si es tu post
                    contenido: nuevoPost,
                    foto: fotoPost
                })
            });

            const post = await res.json();

            setGrupos(prev =>
                prev.map(g =>
                    g._id === grupoActivo._id
                        ? { ...g, posts: [post, ...g.posts] }
                        : g
                )
            );

            setNuevoPost("");
            setFotoPost(null);
        } catch (e) {
            console.error(e);
        }
    };

    // ===== COMENTAR =====
    const handleComentar = async (e, postId) => {
        e.preventDefault();
        const texto = comentarioTexto[postId];
        if (!texto?.trim()) return;

        try {
            const res = await fetch(
                `${API_URL}/${grupoActivo._id}/post/${postId}/comentar`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        autor: userName,
                        autorEmail: userEmail,
                        autorFoto: avatar,
                        contenido: texto
                    })
                }
            );

            const comentario = await res.json();

            setGrupos(prev =>
                prev.map(g => {
                    if (g._id === grupoActivo._id) {
                        return {
                            ...g,
                            posts: g.posts.map(p =>
                                p._id === postId
                                    ? { ...p, comentarios: [...(p.comentarios || []), comentario] }
                                    : p
                            )
                        };
                    }
                    return g;
                })
            );

            setComentarioTexto({ ...comentarioTexto, [postId]: "" });
        } catch (e) {
            console.error(e);
        }
    };

    // ===== RENDER GRUPO =====
    if (grupoActivo) {
        const grupoData = grupos.find(g => g._id === grupoActivo._id);

        return (
            <div className="fb-layout">
                <main className="fb-feed-center">

                    {/* PUBLICAR */}
                    <div className="fb-card-white">
                        <div className="publish-input-row">
                            <img
                                src={avatar || "https://via.placeholder.com/40"}
                                className="mini-avatar-fb"
                                alt="yo"
                            />
                            <input
                                value={nuevoPost}
                                onChange={(e) => setNuevoPost(e.target.value)}
                                placeholder={`¿Qué compartes hoy, ${userName}?`}
                            />
                        </div>

                        <button onClick={handlePublicar}>Publicar</button>
                    </div>

                    {/* POSTS */}
                    {grupoData?.posts?.map(post => (
                        <div key={post._id} className="fb-card-white">

                            {/* HEADER POST */}
                            <div className="post-top-header">
                                <img
                                    src={
                                        post.autorEmail === userEmail
                                            ? avatar
                                            : post.autorFoto || "https://via.placeholder.com/40"
                                    }
                                    className="round-img"
                                    alt="autor"
                                />

                                <span>{post.autor}</span>
                            </div>

                            {/* CONTENIDO */}
                            <p>{post.contenido}</p>

                            {post.foto && (
                                <img src={post.foto} className="img-full-post" alt="post" />
                            )}

                            {/* COMENTARIOS */}
                            {post.comentarios?.map((com, i) => (
                                <div key={i} className="comment-item">
                                    <img
                                        src={
                                            com.autorEmail === userEmail
                                                ? avatar
                                                : com.autorFoto || "https://via.placeholder.com/32"
                                        }
                                        className="comment-mini-avatar"
                                        alt="comentario"
                                    />
                                    <span>{com.contenido}</span>
                                </div>
                            ))}

                            <form onSubmit={(e) => handleComentar(e, post._id)}>
                                <input
                                    value={comentarioTexto[post._id] || ""}
                                    onChange={(e) =>
                                        setComentarioTexto({
                                            ...comentarioTexto,
                                            [post._id]: e.target.value
                                        })
                                    }
                                    placeholder="Escribe un comentario..."
                                />
                                <button type="submit">
                                    <FaPaperPlane />
                                </button>
                            </form>
                        </div>
                    ))}
                </main>
            </div>
        );
    }

    return <div>Cargando grupos...</div>;
};

export default Grupos;
