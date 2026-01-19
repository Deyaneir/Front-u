import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Cropper from 'react-easy-crop';
import axios from 'axios';
import { 
    FaPlus, FaArrowLeft, FaCamera, FaThumbsUp, FaComment, FaSearch, FaTimes, FaShare, 
    FaGlobeAmericas, FaRegImage, FaUserFriends, FaPaperPlane, FaEllipsisH, FaRegSmile,
    FaCheckCircle, FaExclamationTriangle
} from 'react-icons/fa';
import './Grupos.css';

const API_URL = "https://controversial-jacquette-vibe-u-d09f766e.koyeb.app/api/grupos";

const Grupos = () => {
    // --- 1. ESTADOS DE DATOS E INTERFAZ ---
    const [grupos, setGrupos] = useState([]);
    const [filtro, setFiltro] = useState("");
    const [loading, setLoading] = useState(false);
    const [globalError, setGlobalError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);

    // --- 2. ESTADOS DE SESIÓN ---
    const [userName, setUserName] = useState("Usuario");
    const [avatar, setAvatar] = useState(null);
    const userEmail = localStorage.getItem("correo");
    const token = localStorage.getItem('token');

    // --- 3. NAVEGACIÓN Y PERSISTENCIA ---
    const [grupoActivo, setGrupoActivo] = useState(() => {
        try {
            const persistido = localStorage.getItem("ultimoGrupoVisitado");
            return persistido ? JSON.parse(persistido) : null;
        } catch { return null; }
    });

    // --- 4. ESTADOS DEL FEED (POSTS) ---
    const [nuevoPost, setNuevoPost] = useState("");
    const [fotoPost, setFotoPost] = useState(null);
    const [publicando, setPublicando] = useState(false);
    const [likes, setLikes] = useState({});

    // --- 5. ESTADOS DE COMENTARIOS ---
    const [comentarioTexto, setComentarioTexto] = useState({});
    const [comentariosAbiertos, setComentariosAbiertos] = useState({});
    const [enviandoComentario, setEnviandoComentario] = useState({});

    // --- 6. CREACIÓN DE GRUPOS Y CROPPING ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [nuevoGrupo, setNuevoGrupo] = useState({ nombre: "", imagen: "" });
    const [imageToCrop, setImageToCrop] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    // --- 7. REFS ---
    const fileInputRef = useRef(null);
    const postFotoRef = useRef(null);
    const scrollRef = useRef(null);

    // --- 8. CARGA DE DATOS (PERFIL) ---
    useEffect(() => {
        let isMounted = true;
        const fetchUser = async () => {
            if (!token) return;
            try {
                const res = await axios.get(`https://controversial-jacquette-vibe-u-d09f766e.koyeb.app/api/usuarios/perfil`, 
                    { headers: { Authorization: `Bearer ${token}` } });
                if (isMounted && res.data) {
                    setUserName(res.data.nombre || "Usuario");
                    setAvatar(res.data.avatar || null);
                }
            } catch (err) { console.error("Error Perfil:", err); }
        };
        fetchUser();
        return () => { isMounted = false; };
    }, [token]);

    // --- 9. CARGA DE GRUPOS ---
    const fetchGrupos = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/listar`);
            if (!res.ok) throw new Error("No se pudieron cargar las comunidades.");
            const data = await res.json();
            setGrupos(data);
        } catch (err) {
            setGlobalError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchGrupos(); }, [fetchGrupos]);

    // --- 10. EFECTO PERSISTENCIA ---
    useEffect(() => {
        if (grupoActivo) localStorage.setItem("ultimoGrupoVisitado", JSON.stringify(grupoActivo));
        else localStorage.removeItem("ultimoGrupoVisitado");
    }, [grupoActivo]);

    // --- 11. LÓGICA DE POSTS ---
    const handlePublicar = async (e) => {
        e.preventDefault();
        if (!nuevoPost.trim() && !fotoPost) return;
        setPublicando(true);
        try {
            const res = await fetch(`${API_URL}/${grupoActivo._id}/post`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    autor: userName, autorFoto: avatar, autorEmail: userEmail,
                    contenido: nuevoPost, foto: fotoPost
                })
            });
            if (res.ok) {
                const postData = await res.json();
                setGrupos(prev => prev.map(g => g._id === grupoActivo._id ? { ...g, posts: [postData, ...g.posts] } : g));
                setNuevoPost(""); setFotoPost(null);
                setSuccessMsg("Publicado con éxito");
                setTimeout(() => setSuccessMsg(null), 3000);
            }
        } catch (err) { setGlobalError("Error al publicar."); }
        finally { setPublicando(false); }
    };

    // --- 12. LÓGICA DE COMENTARIOS ---
    const handleComentar = async (e, postId) => {
        if (e) e.preventDefault();
        const texto = comentarioTexto[postId];
        if (!texto?.trim()) return;

        setEnviandoComentario(prev => ({ ...prev, [postId]: true }));
        try {
            const res = await fetch(`${API_URL}/${grupoActivo._id}/post/${postId}/comentar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    autor: userName, autorFoto: avatar, autorEmail: userEmail, contenido: texto
                })
            });
            if (res.ok) {
                const newCom = await res.json();
                setGrupos(prev => prev.map(g => g._id === grupoActivo._id ? {
                    ...g, posts: g.posts.map(p => p._id === postId ? { ...p, comentarios: [...(p.comentarios || []), newCom] } : p)
                } : g));
                setComentarioTexto(prev => ({ ...prev, [postId]: "" }));
            }
        } catch (err) { console.error(err); }
        finally { setEnviandoComentario(prev => ({ ...prev, [postId]: false })); }
    };

    // --- 13. CROPPING Y ARCHIVOS ---
    const onCropComplete = useCallback((_, pixels) => setCroppedAreaPixels(pixels), []);

    const handleConfirmCrop = async () => {
        const image = new Image();
        image.src = imageToCrop;
        await image.decode();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = croppedAreaPixels.width; canvas.height = croppedAreaPixels.height;
        ctx.drawImage(image, croppedAreaPixels.x, croppedAreaPixels.y, croppedAreaPixels.width, 
            croppedAreaPixels.height, 0, 0, croppedAreaPixels.width, croppedAreaPixels.height);
        setNuevoGrupo({ ...nuevoGrupo, imagen: canvas.toDataURL('image/jpeg') });
        setImageToCrop(null);
    };

    const handleFileChange = (e, target) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            if (target === 'grupo') setImageToCrop(reader.result);
            else setFotoPost(reader.result);
        };
        reader.readAsDataURL(file);
    };

    // --- 14. FILTRADO DE GRUPOS ---
    const gruposFiltrados = useMemo(() => {
        return grupos.filter(g => g.nombre?.toLowerCase().includes(filtro.toLowerCase()));
    }, [grupos, filtro]);

    // --- RENDER: MURO ---
    if (grupoActivo) {
        const gd = grupos.find(g => g._id === grupoActivo._id) || grupoActivo;
        return (
            <div className="fb-layout animate-fade-in">
                {successMsg && <div className="toast-success"><FaCheckCircle /> {successMsg}</div>}
                <div className="fb-header-container">
                    <div className="fb-cover-photo" style={{ backgroundImage: `url(${gd.imagen})` }}>
                        <button className="fb-back-btn" onClick={() => setGrupoActivo(null)}><FaArrowLeft /></button>
                    </div>
                    <div className="fb-profile-nav">
                        <div className="fb-avatar-section">
                            <div className="fb-avatar-wrapper"><img src={gd.imagen} alt="group" /></div>
                            <div className="fb-name-stats">
                                <h1>{gd.nombre}</h1>
                                <p><FaGlobeAmericas /> Grupo Público · <b>{gd.miembrosArray?.length || 1} miembros</b></p>
                            </div>
                            <div className="fb-header-btns">
                                <button className="btn-fb-blue"><FaPlus /> Invitar</button>
                                <button className="btn-fb-gray"><FaUserFriends /> Unido</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="fb-body-grid">
                    <main className="fb-feed-center">
                        {/* AREA DE PUBLICAR */}
                        <div className="fb-card-white publish-area">
                            <div className="publish-input-row">
                                <img src={avatar || "https://via.placeholder.com/40"} className="mini-avatar-fb" alt="u" />
                                <input placeholder={`Escribe algo a este grupo...`} value={nuevoPost} onChange={e => setNuevoPost(e.target.value)} />
                            </div>
                            {fotoPost && <div className="fb-post-preview"><img src={fotoPost} alt="p" /><button onClick={() => setFotoPost(null)}><FaTimes /></button></div>}
                            <div className="publish-footer-fb">
                                <button onClick={() => postFotoRef.current.click()}><FaRegImage color="#45bd62" /> Foto/video</button>
                                <button onClick={handlePublicar} className="btn-send-fb" disabled={publicando}>{publicando ? "..." : "Publicar"}</button>
                                <input type="file" ref={postFotoRef} hidden onChange={e => handleFileChange(e, 'post')} />
                            </div>
                        </div>

                        {/* LISTA DE POSTS */}
                        {gd.posts?.map(post => (
                            <div key={post._id} className="fb-card-white post-container">
                                <div className="post-top-header">
                                    <img src={post.autorFoto || "https://via.placeholder.com/40"} className="mini-avatar-fb" alt="a" />
                                    <div className="post-user-meta">
                                        <span className="author-fb">{post.autor}</span>
                                        <span className="time-fb">Ahora · <FaGlobeAmericas /></span>
                                    </div>
                                    <FaEllipsisH className="post-options" />
                                </div>
                                <div className="post-body-text">{post.contenido}</div>
                                {post.foto && <img src={post.foto} className="img-full-post" alt="post-img" />}
                                
                                <div className="post-action-buttons-fb">
                                    <button onClick={() => setLikes(p => ({ ...p, [post._id]: !p[post._id] }))} className={likes[post._id] ? "liked" : ""}>
                                        <FaThumbsUp /> Me gusta
                                    </button>
                                    <button onClick={() => setComentariosAbiertos(p => ({ ...p, [post._id]: !p[post._id] }))}>
                                        <FaComment /> Comentar
                                    </button>
                                    <button><FaShare /> Compartir</button>
                                </div>

                                {/* SECCIÓN COMENTARIOS ESTILO BURBUJA */}
                                {comentariosAbiertos[post._id] && (
                                    <div className="fb-comments-section">
                                        {post.comentarios?.map((c, i) => (
                                            <div key={i} className="comment-item">
                                                <img src={c.autorFoto || "https://via.placeholder.com/32"} className="comment-mini-avatar" alt="c" />
                                                <div className="comment-bubble">
                                                    <span className="comment-author-name">{c.autor}</span>
                                                    <p>{c.contenido}</p>
                                                </div>
                                            </div>
                                        ))}
                                        <form onSubmit={e => handleComentar(e, post._id)} className="comment-input-area">
                                            <img src={avatar || "https://via.placeholder.com/32"} className="comment-mini-avatar" alt="yo" />
                                            <div className="comment-input-container">
                                                <input placeholder="Escribe un comentario..." value={comentarioTexto[post._id] || ""} 
                                                    onChange={e => setComentarioTexto({ ...comentarioTexto, [post._id]: e.target.value })} />
                                                <div className="comment-input-icons">
                                                    <FaRegSmile />
                                                    <button type="submit" disabled={enviandoComentario[post._id]}><FaPaperPlane /></button>
                                                </div>
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

    // --- RENDER: LISTA PRINCIPAL ---
    return (
        <section className="grupos-page">
            <div className="grupos-header-top">
                <div className="header-left-side">
                    <button className="btn-back-main-page" onClick={() => window.history.back()}><FaArrowLeft /></button>
                    <h2>Comunidades</h2>
                </div>
                <button className="btn-crear-grupo" onClick={() => setIsModalOpen(true)}><FaPlus /> Crear Grupo</button>
            </div>
            
            <div className="search-bar-pure-white">
                <FaSearch />
                <input type="text" placeholder="Buscar en tus grupos..." value={filtro} onChange={e => setFiltro(e.target.value)} />
            </div>

            {loading ? <div className="loader">Cargando grupos...</div> : (
                <div className="grupos-grid-moderno">
                    {gruposFiltrados.map(g => (
                        <div key={g._id} className="grupo-card-row" onClick={() => setGrupoActivo(g)}>
                            <img src={g.imagen || "https://via.placeholder.com/60"} alt="g" />
                            <div className="grupo-info">
                                <h3>{g.nombre}</h3>
                                <p>{g.miembrosArray?.length || 1} miembros</p>
                            </div>
                            <button className="btn-entrar-vibe">Entrar</button>
                        </div>
                    ))}
                </div>
            )}

            {/* MODAL CREAR GRUPO */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="vibe-modal-container">
                        <button className="vibe-close" onClick={() => setIsModalOpen(false)}><FaTimes /></button>
                        <h3>Nueva Comunidad</h3>
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            if (!nuevoGrupo.nombre) return;
                            const res = await fetch(`${API_URL}/crear`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ ...nuevoGrupo, creadorEmail: userEmail, miembrosArray: [userEmail] })
                            });
                            const data = await res.json();
                            setGrupos([data, ...grupos]);
                            setIsModalOpen(false);
                        }}>
                            <input className="vibe-input" placeholder="Nombre del grupo" required 
                                value={nuevoGrupo.nombre} onChange={e => setNuevoGrupo({ ...nuevoGrupo, nombre: e.target.value })} />
                            <div className="vibe-upload" onClick={() => fileInputRef.current.click()}>
                                {nuevoGrupo.imagen ? <img src={nuevoGrupo.imagen} alt="pre" /> : <><FaCamera /> Subir Portada</>}
                            </div>
                            <input type="file" ref={fileInputRef} hidden onChange={e => handleFileChange(e, 'grupo')} />
                            <button type="submit" className="vibe-btn-submit">Crear Grupo</button>
                        </form>
                    </div>
                </div>
            )}

            {/* CROPPER MODAL */}
            {imageToCrop && (
                <div className="modal-overlay">
                    <div className="cropper-container">
                        <Cropper image={imageToCrop} crop={crop} zoom={zoom} aspect={16 / 9} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete} />
                        <div className="cropper-controls">
                            <button onClick={() => setImageToCrop(null)}>Cancelar</button>
                            <button onClick={handleConfirmCrop}>Cortar y Guardar</button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default Grupos;
