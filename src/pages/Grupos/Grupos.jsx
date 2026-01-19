import React, { useState, useRef, useEffect, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import axios from 'axios';
import { 
    FaPlus, FaArrowLeft, FaCamera, FaThumbsUp, FaComment, FaSearch, FaTimes, FaEllipsisH, FaShare, 
    FaGlobeAmericas, FaRegImage, FaUserFriends, FaPaperPlane
} from 'react-icons/fa';
import './Grupos.css';

const API_URL = "https://controversial-jacquette-vibe-u-d09f766e.koyeb.app/api/grupos";

const Grupos = () => {
    // --- ESTADOS ---
    const [grupos, setGrupos] = useState([]);
    const [filtro, setFiltro] = useState("");
    const [loading, setLoading] = useState(false);
    const [userName, setUserName] = useState("Usuario");
    const [avatar, setAvatar] = useState(null);
    const userEmail = localStorage.getItem("correo");
    const [grupoActivo, setGrupoActivo] = useState(() => {
        const persistido = localStorage.getItem("ultimoGrupoVisitado");
        return persistido ? JSON.parse(persistido) : null;
    });

    const [nuevoPost, setNuevoPost] = useState("");
    const [fotoPost, setFotoPost] = useState(null);
    const [likes, setLikes] = useState({});
    const [comentarioTexto, setComentarioTexto] = useState({});
    const [comentariosAbiertos, setComentariosAbiertos] = useState({});

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [nuevoGrupo, setNuevoGrupo] = useState({ nombre: "", imagen: "" });
    const [imageToCrop, setImageToCrop] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    const fileInputRef = useRef(null);
    const postFotoRef = useRef(null);

    // --- CARGAR DATOS ---
    useEffect(() => {
        const fetchUserInfo = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;
                const response = await axios.get(`https://controversial-jacquette-vibe-u-d09f766e.koyeb.app/api/usuarios/perfil`, 
                    { headers: { Authorization: `Bearer ${token}` } });
                if (response.data?.nombre) setUserName(response.data.nombre);
                if (response.data?.avatar) setAvatar(response.data.avatar);
            } catch (error) { console.error("Error perfil:", error); }
        };
        fetchUserInfo();
        cargarGrupos();
    }, []);

    const cargarGrupos = async () => {
        try {
            const res = await fetch(`${API_URL}/listar`);
            const data = await res.json();
            setGrupos(data);
        } catch (error) { console.error("Error grupos:", error); }
    };

    useEffect(() => {
        if (grupoActivo) localStorage.setItem("ultimoGrupoVisitado", JSON.stringify(grupoActivo));
        else localStorage.removeItem("ultimoGrupoVisitado");
    }, [grupoActivo]);

    // --- FUNCION CLAVE: MANEJO DE COMENTARIOS ---
    const handleComentar = async (e, postId) => {
        if (e) e.preventDefault(); // Evita recarga de página
        
        const texto = comentarioTexto[postId];
        if (!texto || !texto.trim()) return;

        // Optimistic UI o bloqueo de botón si lo deseas
        try {
            const res = await fetch(`${API_URL}/${grupoActivo._id}/post/${postId}/comentar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    autor: userName,
                    autorFoto: avatar,
                    autorEmail: userEmail,
                    contenido: texto
                })
            });

            if (res.ok) {
                const nuevoComentario = await res.json();
                
                // Actualizamos el estado local de los grupos para mostrar el comentario de inmediato
                setGrupos(prevGrupos => prevGrupos.map(g => {
                    if (g._id === grupoActivo._id) {
                        return {
                            ...g,
                            posts: g.posts.map(p => 
                                p._id === postId 
                                ? { ...p, comentarios: [...(p.comentarios || []), nuevoComentario] } 
                                : p
                            )
                        };
                    }
                    return g;
                }));

                // Limpiar el campo de texto específico de ese post
                setComentarioTexto(prev => ({ ...prev, [postId]: "" }));
            }
        } catch (error) {
            console.error("Error al comentar:", error);
        }
    };

    // --- PUBLICAR POST ---
    const handlePublicar = async (e) => {
        e.preventDefault();
        if (!nuevoPost.trim() && !fotoPost) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/${grupoActivo._id}/post`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ autor: userName, autorFoto: avatar, autorEmail: userEmail, contenido: nuevoPost, foto: fotoPost })
            });
            const postGuardado = await res.json();
            setGrupos(prev => prev.map(g => g._id === grupoActivo._id ? { ...g, posts: [postGuardado, ...g.posts] } : g));
            setNuevoPost(""); setFotoPost(null);
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    // --- VISTA DEL MURO (POSTS Y COMENTARIOS) ---
    if (grupoActivo) {
        const grupoData = grupos.find(g => g._id === grupoActivo._id) || grupoActivo;
        return (
            <div className="fb-layout">
                {/* Cabecera del Grupo omitida para brevedad, igual a la tuya */}
                <div className="fb-header-container">
                    <div className="fb-cover-photo" style={{ backgroundImage: `url(${grupoData.imagen})` }}>
                        <button className="fb-back-btn" onClick={() => setGrupoActivo(null)}><FaArrowLeft /></button>
                    </div>
                    <div className="fb-profile-nav">
                        <div className="fb-avatar-section">
                            <div className="fb-avatar-wrapper">
                                <img src={grupoData.imagen || "https://via.placeholder.com/150"} alt="avatar" />
                            </div>
                            <div className="fb-name-stats">
                                <h1 style={{color: '#000'}}>{grupoData.nombre}</h1>
                                <p style={{color: '#65676b'}}><FaGlobeAmericas /> Grupo Público</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="fb-body-grid single-column">
                    <main className="fb-feed-center">
                        {/* INPUT PUBLICAR POST */}
                        <div className="fb-card-white publish-area">
                            <div className="publish-input-row">
                                <img src={avatar || "https://via.placeholder.com/40"} className="mini-avatar-fb" alt="yo" />
                                <input placeholder={`¿Qué piensas, ${userName}?`} value={nuevoPost} onChange={(e) => setNuevoPost(e.target.value)} />
                            </div>
                            <div className="publish-footer-fb">
                                <button onClick={() => postFotoRef.current.click()}><FaRegImage color="#45bd62" /> Foto</button>
                                <button onClick={handlePublicar} className="btn-send-fb">Publicar</button>
                                <input type="file" ref={postFotoRef} style={{display:'none'}} onChange={(e) => {
                                    const file = e.target.files[0];
                                    const reader = new FileReader();
                                    reader.onloadend = () => setFotoPost(reader.result);
                                    if(file) reader.readAsDataURL(file);
                                }} />
                            </div>
                        </div>

                        {/* LISTA DE POSTS */}
                        {grupoData.posts?.map(post => (
                            <div key={post._id} className="fb-card-white post-container">
                                <div className="post-top-header">
                                    <img src={post.autorFoto || "https://via.placeholder.com/40"} className="mini-avatar-fb" alt="a" />
                                    <div className="post-user-meta">
                                        <span className="author-fb" style={{color: '#000'}}>{post.autor}</span>
                                        <span className="time-fb">Ahora · <FaGlobeAmericas /></span>
                                    </div>
                                </div>
                                <div className="post-body-text" style={{color: '#000'}}>{post.contenido}</div>
                                {post.foto && <img src={post.foto} className="img-full-post" alt="p" />}
                                
                                <div className="post-action-buttons-fb">
                                    <button onClick={() => setLikes({...likes, [post._id]: !likes[post._id]})} className={likes[post._id] ? "liked" : ""}>
                                        <FaThumbsUp /> Like
                                    </button>
                                    <button onClick={() => setComentariosAbiertos({...comentariosAbiertos, [post._id]: !comentariosAbiertos[post._id]})}>
                                        <FaComment /> Comentar
                                    </button>
                                    <button><FaShare /> Compartir</button>
                                </div>

                                {/* SECCIÓN DE COMENTARIOS */}
                                {comentariosAbiertos[post._id] && (
                                    <div className="fb-comments-section">
                                        <div className="comments-list">
                                            {post.comentarios?.map((com, i) => (
                                                <div key={i} className="comment-item">
                                                    <img src={com.autorFoto || "https://via.placeholder.com/32"} className="comment-mini-avatar" alt="c" />
                                                    <div className="comment-bubble">
                                                        <div className="comment-author-name">{com.autor}</div>
                                                        <div className="comment-text">{com.contenido}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* FORMULARIO DE COMENTARIO: Aquí es donde la flecha funciona */}
                                        <form onSubmit={(e) => handleComentar(e, post._id)} className="comment-input-wrapper">
                                            <img src={avatar || "https://via.placeholder.com/32"} className="comment-mini-avatar" alt="yo" />
                                            <div className="comment-input-container-with-btn">
                                                <input 
                                                    placeholder="Escribe un comentario..." 
                                                    value={comentarioTexto[post._id] || ""}
                                                    onChange={(e) => setComentarioTexto({...comentarioTexto, [post._id]: e.target.value})}
                                                />
                                                {/* Este botón type="submit" activará handleComentar al hacer clic o dar Enter */}
                                                <button type="submit" className="btn-send-comment-icon">
                                                    <FaPaperPlane />
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                )}
                            </div>
                        ))}
                    </main>
                </div>
            </div>
        );
    }

    // Render de lista de grupos (simplificado)
    return (
        <section className="grupos-page">
            <div className="grupos-header-top">
                <h2>Comunidades</h2>
                <button className="btn-crear-grupo" onClick={() => setIsModalOpen(true)}><FaPlus /> Crear</button>
            </div>
            <div className="grupos-grid-moderno">
                {grupos.map(grupo => (
                    <div key={grupo._id} className="grupo-card-row" onClick={() => setGrupoActivo(grupo)}>
                        <img src={grupo.imagen} alt="g" />
                        <div className="grupo-textos-info">
                            <h3 style={{color: '#000'}}>{grupo.nombre}</h3>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default Grupos;
