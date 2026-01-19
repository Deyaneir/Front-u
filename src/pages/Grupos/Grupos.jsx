import React, { useState, useRef, useEffect, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import axios from 'axios';
import { 
    FaPlus, FaArrowLeft, FaCamera, FaThumbsUp, FaComment, FaSearch, FaTimes, FaShare, 
    FaGlobeAmericas, FaRegImage, FaUserFriends, FaPaperPlane, FaEllipsisH
} from 'react-icons/fa';
import './Grupos.css';

const API_URL = "https://controversial-jacquette-vibe-u-d09f766e.koyeb.app/api/grupos";

const Grupos = () => {
    // --- 1. ESTADOS DE DATOS ---
    const [grupos, setGrupos] = useState([]);
    const [filtro, setFiltro] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // --- 2. ESTADOS DEL USUARIO ---
    const [userName, setUserName] = useState("Usuario");
    const [avatar, setAvatar] = useState(null);
    const userEmail = localStorage.getItem("correo");
    const token = localStorage.getItem('token');

    // --- 3. ESTADOS DE NAVEGACIÓN Y FEED ---
    const [grupoActivo, setGrupoActivo] = useState(() => {
        const persistido = localStorage.getItem("ultimoGrupoVisitado");
        try {
            return persistido ? JSON.parse(persistido) : null;
        } catch (e) {
            return null;
        }
    });
    const [nuevoPost, setNuevoPost] = useState("");
    const [fotoPost, setFotoPost] = useState(null);
    const [likes, setLikes] = useState({});

    // --- 4. ESTADOS DE COMENTARIOS ---
    const [comentarioTexto, setComentarioTexto] = useState({});
    const [comentariosAbiertos, setComentariosAbiertos] = useState({});

    // --- 5. ESTADOS DE CREACIÓN Y RECORTE ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [nuevoGrupo, setNuevoGrupo] = useState({ nombre: "", imagen: "" });
    const [imageToCrop, setImageToCrop] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    // --- 6. REFERENCIAS ---
    const fileInputRef = useRef(null);
    const postFotoRef = useRef(null);

    // --- 7. EFECTO: CARGAR PERFIL DE USUARIO ---
    useEffect(() => {
        const fetchUserInfo = async () => {
            if (!token) return;
            try {
                const response = await axios.get(
                    `https://controversial-jacquette-vibe-u-d09f766e.koyeb.app/api/usuarios/perfil`, 
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                if (response.data) {
                    setUserName(response.data.nombre || "Usuario");
                    setAvatar(response.data.avatar || null);
                }
            } catch (err) {
                console.error("Error al obtener perfil:", err);
            }
        };
        fetchUserInfo();
    }, [token]);

    // --- 8. EFECTO: CARGAR LISTA DE GRUPOS ---
    const cargarGrupos = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/listar`);
            if (!res.ok) throw new Error("Error al obtener grupos");
            const data = await res.json();
            setGrupos(data);
        } catch (err) {
            setError(err.message);
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        cargarGrupos();
    }, [cargarGrupos]);

    // --- 9. EFECTO: PERSISTIR GRUPO ACTIVO ---
    useEffect(() => {
        if (grupoActivo) {
            localStorage.setItem("ultimoGrupoVisitado", JSON.stringify(grupoActivo));
        } else {
            localStorage.removeItem("ultimoGrupoVisitado");
        }
    }, [grupoActivo]);

    // --- 10. LÓGICA DE COMENTARIOS ---
    const handleComentar = async (e, postId) => {
        if (e) e.preventDefault();
        const texto = comentarioTexto[postId];
        if (!texto || !texto.trim()) return;

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
                setComentarioTexto(prev => ({ ...prev, [postId]: "" }));
            }
        } catch (err) {
            console.error("Error al enviar comentario:", err);
        }
    };

    const toggleComentarios = (postId) => {
        setComentariosAbiertos(prev => ({
            ...prev,
            [postId]: !prev[postId]
        }));
    };

    // --- 11. LÓGICA DE LIKES Y COMPARTIR ---
    const toggleLike = (postId) => {
        setLikes(prev => ({ ...prev, [postId]: !prev[postId] }));
    };

    const handleCompartirPost = async (postId) => {
        const confirmacion = window.confirm("¿Quieres compartir esta publicación?");
        if (!confirmacion) return;
        
        try {
            const res = await fetch(`${API_URL}/${grupoActivo._id}/post/${postId}/comentar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    autor: userName,
                    autorFoto: avatar,
                    autorEmail: userEmail,
                    contenido: "📢 Ha compartido esta publicación."
                })
            });
            if (res.ok) {
                alert("¡Publicación compartida!");
                cargarGrupos();
            }
        } catch (err) {
            console.error("Error al compartir:", err);
        }
    };

    // --- 12. LÓGICA DE PUBLICACIÓN ---
    const handlePublicar = async (e) => {
        e.preventDefault();
        if (!nuevoPost.trim() && !fotoPost) return;

        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/${grupoActivo._id}/post`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    autor: userName,
                    autorFoto: avatar,
                    autorEmail: userEmail,
                    contenido: nuevoPost,
                    foto: fotoPost
                })
            });

            if (res.ok) {
                const postGuardado = await res.json();
                setGrupos(prev => prev.map(g => 
                    g._id === grupoActivo._id 
                    ? { ...g, posts: [postGuardado, ...g.posts] } 
                    : g
                ));
                setNuevoPost("");
                setFotoPost(null);
            }
        } catch (err) {
            console.error("Error al publicar:", err);
        } finally {
            setLoading(false);
        }
    };

    // --- 13. MANEJO DE IMÁGENES Y RECORTE ---
    const onCropComplete = useCallback((_, pixels) => {
        setCroppedAreaPixels(pixels);
    }, []);

    const handleConfirmCrop = async () => {
        try {
            const image = new Image();
            image.src = imageToCrop;
            await image.decode();
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = croppedAreaPixels.width;
            canvas.height = croppedAreaPixels.height;
            ctx.drawImage(
                image, 
                croppedAreaPixels.x, croppedAreaPixels.y, 
                croppedAreaPixels.width, croppedAreaPixels.height, 
                0, 0, 
                croppedAreaPixels.width, croppedAreaPixels.height
            );
            setNuevoGrupo({ ...nuevoGrupo, imagen: canvas.toDataURL('image/jpeg') });
            setImageToCrop(null);
        } catch (e) {
            console.error("Error al recortar:", e);
        }
    };

    const handleImagePreview = (e, destino) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            if (destino === 'grupo') {
                setImageToCrop(reader.result);
            } else {
                setFotoPost(reader.result);
            }
        };
        reader.readAsDataURL(file);
    };

    // --- 14. ACCIONES DE GRUPO ---
    const handleCrearGrupo = async (e) => {
        e.preventDefault();
        if (!nuevoGrupo.nombre.trim()) return;

        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/crear`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nombre: nuevoGrupo.nombre,
                    imagen: nuevoGrupo.imagen,
                    creadorEmail: userEmail,
                    miembrosArray: [userEmail]
                })
            });
            const data = await res.json();
            setGrupos([data, ...grupos]);
            setIsModalOpen(false);
            setNuevoGrupo({ nombre: "", imagen: "" });
        } catch (err) {
            console.error("Error al crear grupo:", err);
        } finally {
            setLoading(false);
        }
    };

    const entrarAGrupo = (grupo) => setGrupoActivo(grupo);
    const salirDeGrupo = () => setGrupoActivo(null);

    // --- 15. RENDERIZADO: VISTA DEL MURO ---
    if (grupoActivo) {
        const gd = grupos.find(g => g._id === grupoActivo._id) || grupoActivo;
        return (
            <div className="fb-layout">
                <div className="fb-header-container">
                    <div className="fb-cover-photo" style={{ backgroundImage: `url(${gd.imagen || 'https://via.placeholder.com/1000x300'})` }}>
                        <button className="fb-back-btn" onClick={salirDeGrupo}><FaArrowLeft /></button>
                        <button className="fb-edit-cover"><FaCamera /> Editar Portada</button>
                    </div>
                    <div className="fb-profile-nav">
                        <div className="fb-avatar-section">
                            <div className="fb-avatar-wrapper">
                                <img src={gd.imagen || "https://via.placeholder.com/150"} alt="avatar-grupo" />
                            </div>
                            <div className="fb-name-stats">
                                <h1 style={{color: '#000'}}>{gd.nombre}</h1>
                                <p style={{color: '#65676b'}}><FaGlobeAmericas /> Grupo Público · <b>{gd.miembrosArray?.length || 1} miembros</b></p>
                            </div>
                            <div className="fb-header-btns">
                                <button className="btn-fb-blue"><FaPlus /> Invitar</button>
                                <button className="btn-fb-gray"><FaUserFriends /> Miembro</button>
                                <button className="btn-fb-gray"><FaEllipsisH /></button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="fb-body-grid single-column">
                    <main className="fb-feed-center">
                        <div className="fb-card-white publish-area">
                            <div className="publish-input-row">
                                <img src={avatar || "https://via.placeholder.com/40"} className="mini-avatar-fb" alt="yo" />
                                <input 
                                    placeholder={`¿Qué piensas, ${userName}?`} 
                                    value={nuevoPost} 
                                    onChange={(e) => setNuevoPost(e.target.value)} 
                                />
                            </div>
                            {fotoPost && (
                                <div className="fb-post-preview-container">
                                    <img src={fotoPost} alt="preview" />
                                    <button onClick={() => setFotoPost(null)}><FaTimes /></button>
                                </div>
                            )}
                            <div className="publish-footer-fb">
                                <button onClick={() => postFotoRef.current.click()}><FaRegImage color="#45bd62" /> Foto/video</button>
                                <button className="btn-fb-gray"><FaUserFriends /> Etiquetar</button>
                                <button onClick={handlePublicar} className="btn-send-fb" disabled={loading}>
                                    {loading ? "..." : "Publicar"}
                                </button>
                                <input type="file" ref={postFotoRef} style={{display:'none'}} onChange={(e) => handleImagePreview(e, 'post')} />
                            </div>
                        </div>

                        {gd.posts?.map(post => (
                            <div key={post._id} className="fb-card-white post-container">
                                <div className="post-top-header">
                                    <img src={post.autorFoto || "https://via.placeholder.com/40"} className="mini-avatar-fb" alt="autor" />
                                    <div className="post-user-meta">
                                        <span className="author-fb" style={{color: '#000'}}>{post.autor}</span>
                                        <span className="time-fb">Reciente · <FaGlobeAmericas /></span>
                                    </div>
                                    <FaEllipsisH className="post-options-icon" />
                                </div>
                                <div className="post-body-text" style={{color: '#000'}}>{post.contenido}</div>
                                {post.foto && <img src={post.foto} className="img-full-post" alt="contenido" />}
                                
                                <div className="post-action-buttons-fb">
                                    <button onClick={() => toggleLike(post._id)} className={likes[post._id] ? "liked" : ""}>
                                        <FaThumbsUp /> Me gusta
                                    </button>
                                    <button onClick={() => toggleComentarios(post._id)}>
                                        <FaComment /> Comentar
                                    </button>
                                    <button onClick={() => handleCompartirPost(post._id)}>
                                        <FaShare /> Compartir
                                    </button>
                                </div>

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
                                        
                                        <form onSubmit={(e) => handleComentar(e, post._id)} className="comment-input-area">
                                            <img src={avatar || "https://via.placeholder.com/32"} className="comment-mini-avatar" alt="yo" />
                                            <div className="comment-input-container">
                                                <input 
                                                    placeholder="Escribe un comentario..." 
                                                    value={comentarioTexto[post._id] || ""} 
                                                    onChange={(e) => setComentarioTexto({...comentarioTexto, [post._id]: e.target.value})} 
                                                />
                                                <button type="submit" className="btn-send-comment">
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

    // --- 16. RENDERIZADO: LISTA GENERAL DE GRUPOS ---
    return (
        <section className="grupos-page">
            <div className="grupos-header-top">
                <div className="header-left-side">
                    <button className="btn-back-main-page" onClick={() => window.history.back()}><FaArrowLeft /></button>
                    <h2 style={{color: '#000'}}>Comunidades</h2>
                </div>
                <button className="btn-crear-grupo" onClick={() => setIsModalOpen(true)}><FaPlus /> Crear Grupo</button>
            </div>
            
            <div className="search-bar-pure-white">
                <FaSearch />
                <input 
                    type="text" 
                    placeholder="Buscar grupos..." 
                    value={filtro} 
                    onChange={(e) => setFiltro(e.target.value)} 
                />
            </div>

            <div className="grupos-grid-moderno">
                {grupos.filter(g => g.nombre?.toLowerCase().includes(filtro.toLowerCase())).map(g => (
                    <div key={g._id} className="grupo-card-row">
                        <div className="grupo-card-top-content" onClick={() => entrarAGrupo(g)}>
                            <img src={g.imagen || "https://via.placeholder.com/150"} className="grupo-img-mini-square" alt="g" />
                            <div className="grupo-textos-info">
                                <h3 className="grupo-nombre-bold" style={{color: '#000'}}>{g.nombre}</h3>
                                <p>{g.miembrosArray?.length || 1} miembros</p>
                            </div>
                        </div>
                        <button className="btn-ver-grupo-vibe-blue" onClick={() => entrarAGrupo(g)}>Entrar</button>
                    </div>
                ))}
            </div>

            {/* MODAL DE CREACIÓN */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="vibe-modal-container">
                        <button className="vibe-close-circle" onClick={() => setIsModalOpen(false)}><FaTimes /></button>
                        <h3 style={{color: '#000'}}>Crear nueva comunidad</h3>
                        <form onSubmit={handleCrearGrupo}>
                            <div className="vibe-input-group">
                                <label>Nombre del grupo</label>
                                <input className="vibe-input-field" placeholder="Ej: Amantes del café" required value={nuevoGrupo.nombre} onChange={(e) => setNuevoGrupo({...nuevoGrupo, nombre: e.target.value})} />
                            </div>
                            <div className="vibe-upload-box" onClick={() => fileInputRef.current.click()}>
                                {nuevoGrupo.imagen ? <img src={nuevoGrupo.imagen} className="vibe-img-fit" alt="preview" /> : <div className="upload-placeholder"><FaCamera /> <p>Subir foto de portada</p></div>}
                            </div>
                            <input type="file" ref={fileInputRef} style={{display:'none'}} onChange={(e) => handleImagePreview(e, 'grupo')} />
                            <button type="submit" className="vibe-btn-primary-full" disabled={loading}>
                                {loading ? "Creando..." : "Crear Comunidad"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL DE RECORTE */}
            {imageToCrop && (
                <div className="modal-overlay cropper-overlay">
                    <div className="vibe-modal-container cropper-modal">
                        <div className="crop-area-container">
                            <Cropper image={imageToCrop} crop={crop} zoom={zoom} aspect={16/9} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete} />
                        </div>
                        <div className="cropper-footer">
                            <button className="btn-cancel-vibe" onClick={() => setImageToCrop(null)}>Cancelar</button>
                            <button className="btn-confirm-vibe" onClick={handleConfirmCrop}>Guardar Recorte</button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default Grupos;
