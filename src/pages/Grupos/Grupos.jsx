import React, { useState, useRef, useEffect, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import axios from 'axios';
import { 
    FaPlus, FaArrowLeft, FaCamera, FaThumbsUp, FaComment, FaSearch, FaTimes, FaEllipsisH, FaShare, 
    FaGlobeAmericas, FaRegImage, FaUserFriends, FaUserCircle, FaTrash, FaSignOutAlt, FaRegFileAlt,
    FaRegBookmark, FaBookmark, FaPaperPlane
} from 'react-icons/fa';
import './Grupos.css';

const API_URL = "https://controversial-jacquette-vibe-u-d09f766e.koyeb.app/api/grupos";

const Grupos = () => {
    // --- ESTADOS DE DATOS ---
    const [grupos, setGrupos] = useState([]);
    const [filtro, setFiltro] = useState("");
    const [pestana, setPestana] = useState("todos");
    const [menuAbiertoId, setMenuAbiertoId] = useState(null);
    const [loading, setLoading] = useState(false);

    // --- ESTADO DEL USUARIO ---
    const [userName, setUserName] = useState("Usuario");
    const [userRole, setUserRole] = useState(""); 
    const [avatar, setAvatar] = useState(null);
    const userEmail = localStorage.getItem("correo");

    // --- ESTADOS DE NAVEGACIÓN Y POSTS ---
    const [grupoActivo, setGrupoActivo] = useState(() => {
        const persistido = localStorage.getItem("ultimoGrupoVisitado");
        return persistido ? JSON.parse(persistido) : null;
    });
    const [nuevoPost, setNuevoPost] = useState("");
    const [fotoPost, setFotoPost] = useState(null);
    const [likes, setLikes] = useState({});
    const [guardados, setGuardados] = useState({});

    // --- ESTADOS DE COMENTARIOS ---
    const [comentarioTexto, setComentarioTexto] = useState({});
    const [comentariosAbiertos, setComentariosAbiertos] = useState({});

    // --- ESTADOS DE CREACIÓN Y RECORTE ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [nuevoGrupo, setNuevoGrupo] = useState({ nombre: "", imagen: "" });
    const [imageToCrop, setImageToCrop] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    const fileInputRef = useRef(null);
    const postFotoRef = useRef(null);

    // --- 1. CARGAR PERFIL DEL USUARIO ---
    useEffect(() => {
        const fetchUserInfo = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;
                const response = await axios.get(
                    `https://controversial-jacquette-vibe-u-d09f766e.koyeb.app/api/usuarios/perfil`, 
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                if (response.data?.nombre) {
                    setUserName(response.data.nombre);
                }
                if (response.data?.avatar) {
                    setAvatar(response.data.avatar);
                }
                if (response.data?.rol) {
                    setUserRole(response.data.rol);
                }
            } catch (error) {
                console.error("Error al obtener el perfil del usuario:", error);
            }
        };
        fetchUserInfo();
    }, []);

    // --- 2. CARGAR LISTADO DE GRUPOS ---
    const cargarGrupos = async () => {
        try {
            const res = await fetch(`${API_URL}/listar`);
            const data = await res.json();
            setGrupos(data);
        } catch (error) {
            console.error("Error al cargar la lista de grupos:", error);
        }
    };

    useEffect(() => {
        cargarGrupos();
    }, []);

    // --- 3. PERSISTENCIA DE NAVEGACIÓN ---
    useEffect(() => {
        if (grupoActivo) {
            localStorage.setItem("ultimoGrupoVisitado", JSON.stringify(grupoActivo));
        } else {
            localStorage.removeItem("ultimoGrupoVisitado");
        }
    }, [grupoActivo]);

    // --- 4. LÓGICA DE COMENTARIOS FUNCIONAL ---
    const toggleComentarios = (postId) => {
        setComentariosAbiertos(prev => ({
            ...prev,
            [postId]: !prev[postId]
        }));
    };

    const handleComentar = async (e, postId) => {
        e.preventDefault();
        const texto = comentarioTexto[postId];
        if (!texto?.trim()) return;

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
                
                // Actualización del estado local para visualización inmediata
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

                // Limpiar el campo de texto y mantener el foco
                setComentarioTexto(prev => ({ ...prev, [postId]: "" }));
            }
        } catch (error) {
            console.error("Error al enviar el comentario al servidor:", error);
        }
    };

    // --- 5. LÓGICA DE RECORTE DE IMAGEN (CROPPER) ---
    const onCropComplete = useCallback((_ , pixels) => {
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
                0, 0, canvas.width, canvas.height
            );
            setNuevoGrupo({ ...nuevoGrupo, imagen: canvas.toDataURL('image/jpeg') });
            setImageToCrop(null); 
        } catch (e) {
            console.error("Error durante el proceso de recorte:", e);
        }
    };

    // --- 6. GESTIÓN DE MIEMBROS Y GRUPOS ---
    const handleUnirseGrupo = async (grupo) => {
        try {
            const res = await fetch(`${API_URL}/${grupo._id}/unirse`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ correo: userEmail })
            });
            if (res.ok) {
                cargarGrupos();
            }
        } catch (error) {
            console.error("Error al intentar unirse al grupo:", error);
        }
    };

    const handleAbandonarGrupo = async (id) => {
        if (!window.confirm("¿Estás seguro de que deseas abandonar esta comunidad?")) return;
        try {
            const res = await fetch(`${API_URL}/${id}/abandonar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ correo: userEmail })
            });
            if (res.ok) {
                cargarGrupos();
                setGrupoActivo(null);
            }
        } catch (error) {
            console.error("Error al abandonar el grupo:", error);
        }
    };

    const handleEliminarGrupo = async (id) => {
        if (!window.confirm("ATENCIÓN: ¿Eliminar este grupo permanentemente?")) return;
        try {
            const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
            if (res.ok) {
                cargarGrupos();
                setGrupoActivo(null);
            }
        } catch (error) {
            console.error("Error al eliminar el grupo:", error);
        }
    };

    const handleCrearGrupo = async (e) => {
        e.preventDefault();
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
        } catch (error) {
            console.error("Error al crear el nuevo grupo:", error);
        } finally {
            setLoading(false);
        }
    };

    // --- 7. PUBLICACIÓN DE POSTS ---
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
            const postGuardado = await res.json();
            setGrupos(prev => prev.map(g => 
                g._id === grupoActivo._id ? { ...g, posts: [postGuardado, ...g.posts] } : g
            ));
            setNuevoPost("");
            setFotoPost(null);
        } catch (error) {
            console.error("Error al publicar en el muro:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleImagePreview = (e, destino) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            if (destino === 'grupo') {
                setImageToCrop(reader.result);
            } else if (destino === 'post') {
                setFotoPost(reader.result);
            }
        };
        reader.readAsDataURL(file);
    };

    const entrarAGrupo = (grupo) => setGrupoActivo(grupo);
    const salirDeGrupo = () => setGrupoActivo(null);
    const toggleLike = (postId) => setLikes(prev => ({ ...prev, [postId]: !prev[postId] }));
    const toggleGuardar = (postId) => setGuardados(prev => ({ ...prev, [postId]: !prev[postId] }));

    // --- RENDERIZADO DEL MURO DEL GRUPO ---
    if (grupoActivo) {
        const grupoData = grupos.find(g => g._id === grupoActivo._id) || grupoActivo;
        return (
            <div className="fb-layout">
                <div className="fb-header-container">
                    <div className="fb-cover-photo" style={{ backgroundImage: `url(${grupoData.imagen})` }}>
                        <button className="fb-back-btn" onClick={salirDeGrupo}><FaArrowLeft /></button>
                        <button className="fb-edit-cover"><FaCamera /> Editar Portada</button>
                    </div>
                    <div className="fb-profile-nav">
                        <div className="fb-avatar-section">
                            <div className="fb-avatar-wrapper" style={{ width: '168px', height: '168px', borderRadius: '50%', border: '4px solid white', overflow: 'hidden', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: '2' }}>
                                <img src={grupoData.imagen || "https://via.placeholder.com/150"} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                            <div className="fb-name-stats">
                                <h1 style={{ color: '#000', margin: '0', fontSize: '32px' }}>{grupoData.nombre}</h1>
                                <p style={{ color: '#65676b', margin: '5px 0' }}><FaGlobeAmericas /> Grupo Público · <b>{grupoData.miembrosArray?.length || 1} miembros</b></p>
                            </div>
                            <div className="fb-header-btns">
                                <button className="btn-fb-blue"><FaPlus /> Invitar Amigos</button>
                                <button className="btn-fb-gray"><FaUserFriends /> Eres Miembro</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="fb-body-grid single-column">
                    <main className="fb-feed-center">
                        <div className="fb-card-white publish-area">
                            <div className="publish-input-row">
                                <img src={avatar || "https://via.placeholder.com/40"} className="mini-avatar-fb" alt="perfil" />
                                <input 
                                    style={{ color: '#000', backgroundColor: '#f0f2f5', borderRadius: '20px', padding: '10px 15px', border: 'none', flex: '1', outline: 'none' }} 
                                    placeholder={`¿Qué tienes en mente, ${userName}?`} 
                                    value={nuevoPost} 
                                    onChange={(e) => setNuevoPost(e.target.value)} 
                                />
                            </div>
                            
                            {fotoPost && (
                                <div className="fb-post-preview-container" style={{ padding: '10px 15px', position: 'relative' }}>
                                    <img src={fotoPost} alt="Vista previa" style={{ width: '100%', borderRadius: '8px' }} />
                                    <button onClick={() => setFotoPost(null)} style={{ position: 'absolute', top: '20px', right: '25px', background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', cursor: 'pointer', padding: '5px' }}><FaTimes /></button>
                                </div>
                            )}

                            <div className="publish-footer-fb" style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 15px', borderTop: '1px solid #ddd' }}>
                                <button onClick={() => postFotoRef.current.click()} style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#65676b', fontWeight: 'bold' }}><FaRegImage color="#45bd62" size={20} /> Foto/video</button>
                                <button onClick={handlePublicar} disabled={loading} className="btn-send-fb" style={{ backgroundColor: '#1877f2', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>{loading ? "Publicando..." : "Publicar"}</button>
                                <input type="file" ref={postFotoRef} style={{ display: 'none' }} accept="image/*" onChange={(e) => handleImagePreview(e, 'post')} />
                            </div>
                        </div>

                        {grupoData.posts?.map(post => {
                            const estaAbierto = comentariosAbiertos[post._id];
                            return (
                                <div key={post._id} className="fb-card-white post-container" style={{ marginBottom: '15px' }}>
                                    <div className="post-top-header" style={{ display: 'flex', alignItems: 'center', padding: '12px 15px' }}>
                                        <img src={post.autorFoto || "https://via.placeholder.com/40"} className="mini-avatar-fb" alt="autor" />
                                        <div className="post-user-meta" style={{ marginLeft: '10px', flex: '1' }}>
                                            <span className="author-fb" style={{ color: '#000', fontWeight: 'bold', display: 'block' }}>{post.autor}</span>
                                            <span className="time-fb" style={{ color: '#65676b', fontSize: '12px' }}>Recién publicado · <FaGlobeAmericas /></span>
                                        </div>
                                        <div className="post-actions-right">
                                            <button onClick={() => toggleGuardar(post._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: '10px' }}>{guardados[post._id] ? <FaBookmark color="#1877f2" /> : <FaRegBookmark />}</button>
                                            <button onClick={() => setMenuAbiertoId(menuAbiertoId === post._id ? null : post._id)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><FaEllipsisH /></button>
                                        </div>
                                    </div>

                                    <div className="post-body-text" style={{ color: '#000', padding: '0 15px 10px 15px', fontSize: '15px' }}>{post.contenido}</div>
                                    
                                    {post.foto && (
                                        <div className="post-image-main">
                                            <img src={post.foto} className="img-full-post" alt="Contenido" style={{ width: '100%', display: 'block' }} />
                                        </div>
                                    )}
                                    
                                    <div className="post-action-buttons-fb" style={{ display: 'flex', borderTop: '1px solid #eee', margin: '0 15px', padding: '5px 0' }}>
                                        <button onClick={() => toggleLike(post._id)} style={{ flex: '1', background: 'none', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '8px', cursor: 'pointer', color: likes[post._id] ? '#1877f2' : '#65676b', fontWeight: 'bold' }}><FaThumbsUp /> Me gusta</button>
                                        <button onClick={() => toggleComentarios(post._id)} style={{ flex: '1', background: 'none', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '8px', cursor: 'pointer', color: '#65676b', fontWeight: 'bold' }}><FaComment /> Comentar</button>
                                        <button style={{ flex: '1', background: 'none', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '8px', cursor: 'pointer', color: '#65676b', fontWeight: 'bold' }}><FaShare /> Compartir</button>
                                    </div>

                                    {estaAbierto && (
                                        <div className="fb-comments-section" style={{ borderTop: '1px solid #eee', paddingBottom: '10px' }}>
                                            <div className="comments-list" style={{ maxHeight: '300px', overflowY: 'auto', padding: '10px 15px' }}>
                                                {post.comentarios?.map((com, i) => (
                                                    <div key={i} className="comment-item" style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                                                        <img src={com.autorFoto || "https://via.placeholder.com/32"} className="comment-mini-avatar" alt="com" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                                                        <div className="comment-bubble" style={{ backgroundColor: '#f0f2f5', padding: '8px 12px', borderRadius: '18px', maxWidth: '85%' }}>
                                                            <div className="comment-author-name" style={{ fontWeight: 'bold', fontSize: '12px', color: '#000' }}>{com.autor}</div>
                                                            <div className="comment-text" style={{ fontSize: '13px', color: '#000' }}>{com.contenido}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            
                                            <form onSubmit={(e) => handleComentar(e, post._id)} className="comment-input-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 15px' }}>
                                                <img src={avatar || "https://via.placeholder.com/32"} className="comment-mini-avatar" alt="yo" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                                                <div className="comment-input-container-with-btn" style={{ flex: '1', display: 'flex', alignItems: 'center', backgroundColor: '#f0f2f5', borderRadius: '20px', padding: '0 12px' }}>
                                                    <input 
                                                        placeholder="Escribe un comentario..." 
                                                        className="comment-input-field"
                                                        style={{ flex: '1', border: 'none', background: 'transparent', padding: '10px 0', outline: 'none', color: '#000', fontSize: '14px' }}
                                                        value={comentarioTexto[post._id] || ""}
                                                        onChange={(e) => setComentarioTexto({...comentarioTexto, [post._id]: e.target.value})}
                                                    />
                                                    <button type="submit" className="btn-send-comment-icon" disabled={!comentarioTexto[post._id]?.trim()} style={{ background: 'none', border: 'none', color: '#1877f2', cursor: 'pointer', padding: '5px' }}>
                                                        <FaPaperPlane size={18} />
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </main>
                </div>
            </div>
        );
    }

    // --- RENDERIZADO DEL LISTADO DE COMUNIDADES ---
    return (
        <section className="grupos-page">
            <div className="grupos-header-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px' }}>
                <div className="header-left-side" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <button className="btn-back-main-page" onClick={() => window.history.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' }}><FaArrowLeft /></button>
                    <h2 style={{ color: '#000', margin: '0' }}>Comunidades</h2>
                </div>
                <button className="btn-crear-grupo" onClick={() => setIsModalOpen(true)} style={{ backgroundColor: '#e4e6eb', border: 'none', padding: '8px 15px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}><FaPlus /> Crear Nuevo Grupo</button>
            </div>
            
            <div className="search-bar-pure-white" style={{ margin: '0 15px 15px 15px', display: 'flex', alignItems: 'center', backgroundColor: '#f0f2f5', borderRadius: '20px', padding: '8px 15px' }}>
                <FaSearch style={{ color: '#65676b' }} />
                <input 
                    type="text" 
                    placeholder="Buscar grupos por nombre..." 
                    style={{ background: 'transparent', border: 'none', marginLeft: '10px', flex: '1', outline: 'none', color: '#000' }}
                    value={filtro} 
                    onChange={(e) => setFiltro(e.target.value)} 
                />
            </div>

            <div className="tabs-vibe" style={{ display: 'flex', gap: '10px', margin: '0 15px 20px 15px', borderBottom: '1px solid #ddd' }}>
                <button className={pestana === "todos" ? "active" : ""} onClick={() => setPestana("todos")} style={{ background: 'none', border: 'none', padding: '10px', cursor: 'pointer', color: pestana === "todos" ? '#1877f2' : '#65676b', borderBottom: pestana === "todos" ? '3px solid #1877f2' : 'none', fontWeight: 'bold' }}>Explorar Todos</button>
                <button className={pestana === "mis-grupos" ? "active" : ""} onClick={() => setPestana("mis-grupos")} style={{ background: 'none', border: 'none', padding: '10px', cursor: 'pointer', color: pestana === "mis-grupos" ? '#1877f2' : '#65676b', borderBottom: pestana === "mis-grupos" ? '3px solid #1877f2' : 'none', fontWeight: 'bold' }}>Mis Comunidades</button>
            </div>

            <div className="grupos-grid-moderno" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px', padding: '0 15px' }}>
                {grupos
                    .filter(g => {
                        const match = g.nombre?.toLowerCase().includes(filtro.toLowerCase());
                        if (pestana === "mis-grupos") {
                            return match && g.miembrosArray?.includes(userEmail);
                        }
                        return match;
                    })
                    .map(grupo => (
                        <div key={grupo._id} className="grupo-card-row" style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '15px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div className="grupo-card-top-content" onClick={() => entrarAGrupo(grupo)} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                                <img src={grupo.imagen || "https://via.placeholder.com/150"} className="grupo-img-mini-square" alt="grupo" style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} />
                                <div className="grupo-textos-info">
                                    <h3 className="grupo-nombre-bold" style={{ color: '#000', margin: '0', fontSize: '16px' }}>{grupo.nombre}</h3>
                                    <p style={{ color: '#65676b', fontSize: '13px', margin: '3px 0' }}>{grupo.miembrosArray?.length || 1} miembros activos</p>
                                </div>
                            </div>
                            <div className="grupo-card-actions-row" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <button className="btn-ver-grupo-vibe-blue" onClick={() => entrarAGrupo(grupo)} style={{ backgroundColor: '#e7f3ff', color: '#1877f2', border: 'none', padding: '8px 15px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Entrar</button>
                                <div style={{ position: 'relative' }}>
                                    <button className="btn-dots-gray" onClick={() => setMenuAbiertoId(menuAbiertoId === grupo._id ? null : grupo._id)} style={{ background: '#e4e6eb', border: 'none', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FaEllipsisH /></button>
                                    {menuAbiertoId === grupo._id && (
                                        <div className="dropdown-fb-options" style={{ position: 'absolute', right: '0', top: '40px', backgroundColor: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.2)', borderRadius: '8px', zIndex: '10', width: '180px', padding: '8px' }}>
                                            <button onClick={() => handleAbandonarGrupo(grupo._id)} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '8px', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', color: '#000', fontWeight: 'bold' }}><FaSignOutAlt /> Abandonar</button>
                                            <button onClick={() => handleEliminarGrupo(grupo._id)} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '8px', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', color: 'red', fontWeight: 'bold' }}><FaTrash /> Eliminar</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
            </div>

            {/* --- MODAL PARA CREAR NUEVO GRUPO --- */}
            {isModalOpen && (
                <div className="modal-overlay" style={{ position: 'fixed', top: '0', left: '0', right: '0', bottom: '0', backgroundColor: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: '100' }}>
                    <div className="vibe-modal-container" style={{ backgroundColor: '#fff', width: '90%', maxWidth: '500px', borderRadius: '12px', boxShadow: '0 12px 28px rgba(0,0,0,0.2)', position: 'relative' }}>
                        <div className="modal-header" style={{ padding: '15px', borderBottom: '1px solid #ddd', textAlign: 'center' }}>
                            <h3 style={{ margin: '0', color: '#000' }}>Crear Comunidad</h3>
                            <button className="vibe-close-circle" onClick={() => setIsModalOpen(false)} style={{ position: 'absolute', right: '15px', top: '15px', background: '#e4e6eb', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer' }}><FaTimes /></button>
                        </div>
                        <form onSubmit={handleCrearGrupo} style={{ padding: '20px' }}>
                            <div className="vibe-modal-content-body">
                                <label style={{ display: 'block', marginBottom: '8px', color: '#65676b', fontWeight: 'bold' }}>Nombre del Grupo</label>
                                <input className="vibe-input-field" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '20px', outline: 'none', color: '#000' }} placeholder="Ej: Amantes de la tecnología" required value={nuevoGrupo.nombre} onChange={(e) => setNuevoGrupo({...nuevoGrupo, nombre: e.target.value})} />
                                
                                <label style={{ display: 'block', marginBottom: '8px', color: '#65676b', fontWeight: 'bold' }}>Imagen de Portada</label>
                                <div className="vibe-upload-box" onClick={() => fileInputRef.current.click()} style={{ width: '100%', height: '150px', border: '2px dashed #ddd', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', marginBottom: '20px' }}>
                                    {nuevoGrupo.imagen ? <img src={nuevoGrupo.imagen} className="vibe-img-fit" alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ textAlign: 'center', color: '#65676b' }}><FaCamera size={30} /><p>Subir Foto</p></div>}
                                </div>
                                <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={(e) => handleImagePreview(e, 'grupo')} />
                                
                                <button type="submit" disabled={loading} className="vibe-btn-primary-full" style={{ width: '100%', backgroundColor: '#1877f2', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>{loading ? "Procesando..." : "Finalizar y Crear"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- MODAL PARA RECORTAR IMAGEN DEL GRUPO --- */}
            {imageToCrop && (
                <div className="modal-overlay cropper-overlay" style={{ position: 'fixed', top: '0', left: '0', right: '0', bottom: '0', backgroundColor: '#000', zIndex: '200' }}>
                    <div className="vibe-modal-container cropper-modal" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <div className="crop-area-container" style={{ flex: '1', position: 'relative' }}>
                            <Cropper 
                                image={imageToCrop} 
                                crop={crop} 
                                zoom={zoom} 
                                rotation={rotation}
                                aspect={16 / 9} 
                                onCropChange={setCrop} 
                                onZoomChange={setZoom} 
                                onRotationChange={setRotation}
                                onCropComplete={onCropComplete} 
                            />
                        </div>
                        <div className="cropper-footer" style={{ padding: '20px', backgroundColor: '#fff', display: 'flex', justifyContent: 'center', gap: '20px' }}>
                            <button onClick={() => setImageToCrop(null)} style={{ padding: '10px 30px', borderRadius: '8px', border: '1px solid #ddd', background: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>Cancelar</button>
                            <button className="btn-confirm-vibe" onClick={handleConfirmCrop} style={{ padding: '10px 30px', borderRadius: '8px', border: 'none', background: '#1877f2', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>Guardar Cambios</button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default Grupos;
