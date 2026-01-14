import React, { useState, useRef, useEffect, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { 
    FaPlus, FaArrowLeft, FaPaperPlane, 
    FaCamera, FaThumbsUp, FaComment, FaSearch, FaTimes, FaEllipsisH, FaShare, 
    FaHeart, FaBell, FaRegFileAlt, FaChevronRight, FaThumbtack, FaExclamationCircle, FaSignOutAlt, FaTrash,
    FaInfoCircle, FaShieldAlt, FaUserFriends, FaRegImage, FaChartBar, FaSmile
} from 'react-icons/fa';
import './Grupos.css';

const API_URL = "https://controversial-jacquette-vibe-u-d09f766e.koyeb.app/api/grupos";

const Grupos = () => {
    const [grupos, setGrupos] = useState([]);
    const [filtro, setFiltro] = useState("");
    const [pestana, setPestana] = useState("todos");
    const [menuAbiertoId, setMenuAbiertoId] = useState(null);
    
    // --- ESTADO AUMENTADO: MODAL DE DETALLES DEL GRUPO ---
    const [grupoParaDetalle, setGrupoParaDetalle] = useState(null);

    const [grupoActivo, setGrupoActivo] = useState(() => {
        const persistido = localStorage.getItem("ultimoGrupoVisitado");
        return persistido ? JSON.parse(persistido) : null;
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [nuevoPost, setNuevoPost] = useState("");
    const [fotoPost, setFotoPost] = useState(null);
    const [nuevoGrupo, setNuevoGrupo] = useState({ nombre: "", imagen: "" });
    const [loading, setLoading] = useState(false);

    const [imageToCrop, setImageToCrop] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    const [favoritos, setFavoritos] = useState({});
    const [likes, setLikes] = useState({});

    const fileInputRef = useRef(null);
    const postFotoRef = useRef(null);
    const bannerInputRef = useRef(null);
    const perfilInputRef = useRef(null);

    const userEmail = localStorage.getItem("correo");
    const userName = localStorage.getItem("nombre") || "Usuario";

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
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate((rotation * Math.PI) / 180);
            ctx.translate(-canvas.width / 2, -canvas.height / 2);
            ctx.drawImage(
                image,
                croppedAreaPixels.x, croppedAreaPixels.y, croppedAreaPixels.width, croppedAreaPixels.height,
                0, 0, croppedAreaPixels.width, croppedAreaPixels.height
            );
            const result = canvas.toDataURL('image/jpeg');
            setNuevoGrupo({ ...nuevoGrupo, imagen: result });
            setImageToCrop(null);
        } catch (e) {
            console.error("Error al recortar", e);
        }
    };

    const handleUnirseGrupo = async (grupo) => {
        if (grupo.miembrosArray?.includes(userEmail)) {
            alert("Ya estás en este grupo");
            return;
        }
        try {
            const res = await fetch(`${API_URL}/${grupo._id}/unirse`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ correo: userEmail })
            });
            if (res.ok) {
                alert("Te has unido al grupo");
                cargarGrupos();
            }
        } catch (error) { console.error(error); }
    };

    const handleAbandonarGrupo = async (id) => {
        if (!window.confirm("¿Seguro que quieres abandonar el grupo?")) return;
        try {
            const res = await fetch(`${API_URL}/${id}/abandonar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ correo: userEmail })
            });
            if (res.ok) {
                alert("Has abandonado el grupo");
                cargarGrupos();
            }
        } catch (error) { console.error(error); }
    };

    const handleEliminarGrupo = async (id) => {
        if (!window.confirm("¿ESTÁS SEGURO? Esta acción eliminará el grupo permanentemente.")) return;
        try {
            const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
            if (res.ok) {
                alert("Grupo eliminado");
                cargarGrupos();
                if (grupoActivo?._id === id) setGrupoActivo(null);
            }
        } catch (error) { console.error(error); }
    };

    useEffect(() => {
        const cerrarTodosLosMenus = () => setMenuAbiertoId(null);
        window.addEventListener('click', cerrarTodosLosMenus);
        return () => window.removeEventListener('click', cerrarTodosLosMenus);
    }, []);

    useEffect(() => {
        if (grupoActivo) {
            localStorage.setItem("ultimoGrupoVisitado", JSON.stringify(grupoActivo));
        } else {
            localStorage.removeItem("ultimoGrupoVisitado");
        }
    }, [grupoActivo]);

    const cargarGrupos = async () => {
        try {
            const res = await fetch(`${API_URL}/listar`);
            const data = await res.json();
            setGrupos(data);
        } catch (error) {
            console.error("Error al cargar grupos:", error);
        }
    };

    useEffect(() => { cargarGrupos(); }, []);

    const entrarAGrupo = (grupo) => setGrupoActivo(grupo);
    const salirDeGrupo = () => setGrupoActivo(null);

    const toggleFavorito = (postId) => setFavoritos(prev => ({ ...prev, [postId]: !prev[postId] }));
    const toggleLike = (postId) => setLikes(prev => ({ ...prev, [postId]: !prev[postId] }));

    const handleToggleMenu = (e, id) => {
        e.stopPropagation(); 
        setMenuAbiertoId(menuAbiertoId === id ? null : id);
    };

    const handleImagePreview = (e, destino) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            if (destino === 'grupo') setImageToCrop(reader.result);
            else if (destino === 'post') setFotoPost(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handlePublicar = async (e) => {
        e.preventDefault();
        if (!nuevoPost.trim() && !fotoPost) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/${grupoActivo._id}/post`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ autor: userName, contenido: nuevoPost, foto: fotoPost })
            });
            const postGuardado = await res.json();
            setGrupos(prev => prev.map(g => g._id === grupoActivo._id ? { ...g, posts: [postGuardado, ...g.posts] } : g));
            setNuevoPost(""); 
            setFotoPost(null);
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
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
            const grupoGuardado = await res.json();
            setGrupos([grupoGuardado, ...grupos]);
            setIsModalOpen(false);
            setNuevoGrupo({ nombre: "", imagen: "" });
        } catch (error) { alert("Error al crear grupo"); }
        finally { setLoading(false); }
    };

    // --- VISTA DE MURO AUMENTADA (ESTILO TWITTER) ---
    if (grupoActivo) {
        const grupoData = grupos.find(g => g._id === grupoActivo._id) || grupoActivo;
        return (
            <div className="grupo-muro-wrapper twitter-style">
                {/* CABECERA: BANNER */}
                <div className="muro-banner-container">
                    <div className="muro-banner-bg" style={{ backgroundImage: `url(${grupoData.imagen})` }}>
                        <button className="btn-regresar-circle" onClick={salirDeGrupo}><FaArrowLeft /></button>
                    </div>
                </div>

                {/* INFO DEL PERFIL / GRUPO */}
                <div className="perfil-info-twitter">
                    <div className="perfil-header-row">
                        <div className="foto-perfil-overlap-tw">
                            <img src={grupoData.imagen || "https://via.placeholder.com/150"} alt="grupo" />
                        </div>
                        <div className="perfil-acciones-tw">
                            <button className="btn-tw-outline" onClick={(e) => { e.stopPropagation(); setGrupoParaDetalle(grupoData); }}><FaEllipsisH /></button>
                            <button className="btn-tw-outline"><FaBell /></button>
                            <button className="btn-tw-main">
                                {grupoData.miembrosArray?.includes(userEmail) ? "Siguiendo" : "Unirse"}
                            </button>
                        </div>
                    </div>

                    <div className="perfil-textos-tw">
                        <h2 className="tw-nombre">{grupoData.nombre} <FaShieldAlt className="icon-verify" /></h2>
                        <p className="tw-username">@{grupoData.nombre.toLowerCase().replace(/\s+/g, '')}</p>
                        
                        <p className="tw-descripcion">
                            Comunidad oficial de {grupoData.nombre}. Únete para compartir contenido, participar en eventos y conectar con otros miembros.
                        </p>

                        <div className="tw-meta-info">
                            <span><FaRegFileAlt /> Comunidad Vibe</span>
                            <span><FaPlus /> Creado por {grupoData.creadorEmail.split('@')[0]}</span>
                        </div>

                        <div className="tw-stats-row">
                            <span><b>{grupoData.miembrosArray?.length || 0}</b> Miembros</span>
                            <span><b>{Math.floor(Math.random() * 100)}</b> Siguiendo</span>
                            <span><b>{grupoData.posts?.length || 0}</b> Posts</span>
                        </div>
                    </div>
                </div>

                {/* TABS NAVEGACIÓN */}
                <div className="muro-nav-tabs-tw">
                    <button className="nav-tab-tw active">Publicaciones</button>
                    <button className="nav-tab-tw">Respuestas</button>
                    <button className="nav-tab-tw">Fotos y vídeos</button>
                    <button className="nav-tab-tw">Me gusta</button>
                </div>

                {/* CONTENIDO CENTRAL: PUBLICAR Y FEED */}
                <div className="muro-contenido-central-tw">
                    {/* CUADRO DE PUBLICAR */}
                    <div className="publicar-card-tw">
                        <div className="publicar-input-group">
                            <img src="https://via.placeholder.com/48" className="user-avatar-tw" alt="u" />
                            <div className="input-tw-container">
                                <textarea 
                                    className="input-tw-transparent" 
                                    placeholder="¿Qué está pasando?"
                                    value={nuevoPost} 
                                    onChange={(e) => setNuevoPost(e.target.value)} 
                                />
                                {fotoPost && (
                                    <div className="previa-post-tw">
                                        <img src={fotoPost} alt="p" />
                                        <button onClick={() => setFotoPost(null)} className="btn-remove-foto"><FaTimes /></button>
                                    </div>
                                )}
                                <div className="publicar-actions-tw">
                                    <div className="iconos-tw-media">
                                        <button onClick={() => postFotoRef.current.click()} title="Media"><FaRegImage /></button>
                                        <button title="GIF"><FaPlus /></button>
                                        <button title="Encuesta"><FaChartBar /></button>
                                        <button title="Emoji"><FaSmile /></button>
                                    </div>
                                    <button className="btn-tw-post" onClick={handlePublicar} disabled={loading || (!nuevoPost.trim() && !fotoPost)}>
                                        {loading ? "..." : "Postear"}
                                    </button>
                                    <input type="file" ref={postFotoRef} style={{display: 'none'}} accept="image/*" onChange={(e) => handleImagePreview(e, 'post')} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* FEED DE POSTS */}
                    <div className="lista-feed-tw">
                        {grupoData.posts?.map(post => (
                            <div key={post._id} className="post-tw-card">
                                <div className="post-tw-aside">
                                    <div className="avatar-post-tw"></div>
                                </div>
                                <div className="post-tw-main">
                                    <div className="post-tw-header">
                                        <span className="author-tw">{post.autor}</span>
                                        <span className="user-handle-tw">@{post.autor.toLowerCase().replace(/\s+/g, '')} · 1m</span>
                                        <FaEllipsisH className="post-opt-tw" />
                                    </div>
                                    <p className="content-tw">{post.contenido}</p>
                                    {post.foto && (
                                        <div className="post-img-container-tw">
                                            <img src={post.foto} className="img-post-tw" alt="f" />
                                        </div>
                                    )}
                                    <div className="actions-tw-row">
                                        <button className="action-tw-btn"><FaComment /> <span>{Math.floor(Math.random() * 10)}</span></button>
                                        <button className="action-tw-btn"><FaShare /> <span>{Math.floor(Math.random() * 5)}</span></button>
                                        <button 
                                            className={`action-tw-btn ${likes[post._id] ? 'liked' : ''}`} 
                                            onClick={() => toggleLike(post._id)}
                                        >
                                            <FaHeart /> <span>{likes[post._id] ? 1 : 0}</span>
                                        </button>
                                        <button className="action-tw-btn"><FaChartBar /> <span>{Math.floor(Math.random() * 100)}</span></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <section className="grupos-page">
            <div className="grupos-header-top">
                <div className="header-left-side">
                    <button className="btn-back-main-page" onClick={() => window.history.back()}>
                        <FaArrowLeft />
                    </button>
                    <h2 className="texto-negro">Comunidades</h2>
                </div>
                <button className="btn-crear-grupo" onClick={() => setIsModalOpen(true)}><FaPlus /> Crear Grupo</button>
            </div>
            
            <div className="search-bar-pure-white">
                <FaSearch className="icon-s" />
                <input type="text" placeholder="Buscar grupos..." value={filtro} onChange={(e) => setFiltro(e.target.value)} />
            </div>

            <div className="tabs-vibe">
                <button className={pestana === "todos" ? "active" : ""} onClick={() => setPestana("todos")}>Todos los grupos</button>
                <button className={pestana === "mis-grupos" ? "active" : ""} onClick={() => setPestana("mis-grupos")}>Mis grupos</button>
            </div>

            <div className="grupos-grid-moderno">
                {grupos.filter(g => g.nombre?.toLowerCase().includes(filtro.toLowerCase())).map(grupo => (
                    <div key={grupo._id} className="grupo-card-row">
                        <div className="grupo-card-top-content">
                            <img src={grupo.imagen || "https://via.placeholder.com/150"} className="grupo-img-mini-square" alt={grupo.nombre} />
                            <div className="grupo-textos-info">
                                <h3 className="grupo-nombre-bold">{grupo.nombre}</h3>
                                <p className="ultima-visita">Tu última visita: hace poco</p>
                            </div>
                        </div>
                        <div className="grupo-card-actions-row">
                            {grupo.miembrosArray?.includes(userEmail) ? (
                                <button className="btn-ver-grupo-vibe-blue" onClick={() => entrarAGrupo(grupo)}>Ver grupo</button>
                            ) : (
                                <button className="btn-ver-grupo-vibe-blue" onClick={() => handleUnirseGrupo(grupo)}>Unirse</button>
                            )}
                            
                            <div className="contenedor-opciones-grupo">
                                <button className="btn-dots-gray" onClick={(e) => handleToggleMenu(e, grupo._id)}><FaEllipsisH /></button>
                                {menuAbiertoId === grupo._id && (
                                    <div className="dropdown-fb-style">
                                        <div className="arrow-up-fb"></div>
                                        <button className="fb-item" onClick={(e) => { e.stopPropagation(); setGrupoParaDetalle(grupo); }}>
                                            <FaInfoCircle className="fb-icon" /> Información del grupo
                                        </button>
                                        <button className="fb-item"><FaRegFileAlt className="fb-icon" /> Tu contenido</button>
                                        <button className="fb-item justify"><span><FaShare className="fb-icon" /> Compartir</span><FaChevronRight className="fb-arrow" /></button>
                                        {grupo.creadorEmail === userEmail ? (
                                            <button className="fb-item" onClick={() => handleEliminarGrupo(grupo._id)}>
                                                <FaTrash className="fb-icon" style={{color: 'red'}} /> Eliminar Grupo
                                            </button>
                                        ) : grupo.miembrosArray?.includes(userEmail) ? (
                                            <button className="fb-item item-danger" onClick={() => handleAbandonarGrupo(grupo._id)}>
                                                <FaSignOutAlt className="fb-icon" /> Abandonar grupo
                                            </button>
                                        ) : null}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* --- MODAL AUMENTADO: DETALLES Y OPCIONES DE GRUPO --- */}
            {grupoParaDetalle && (
                <div className="modal-overlay" onClick={() => setGrupoParaDetalle(null)}>
                    <div className="vibe-modal-container modal-detalle-grupo" onClick={(e) => e.stopPropagation()}>
                        <div className="vibe-modal-header">
                            <button className="vibe-close-circle" onClick={() => setGrupoParaDetalle(null)}>
                                <FaTimes />
                            </button>
                            <h3 className="vibe-modal-title-main">Opciones de Comunidad</h3>
                        </div>
                        <div className="vibe-modal-content-body">
                            <div className="detalle-grupo-header-mini">
                                <img src={grupoParaDetalle.imagen} alt="p" className="img-detalle-circle" />
                                <div>
                                    <h4>{grupoParaDetalle.nombre}</h4>
                                    <p>{grupoParaDetalle.miembrosArray?.length} Miembros • Privacidad Pública</p>
                                </div>
                            </div>
                            <hr className="vibe-hr" />
                            <div className="lista-opciones-detalle">
                                <div className="opcion-item-vibe">
                                    <FaShieldAlt className="opcion-icon" />
                                    <div className="opcion-text">
                                        <span>Reglas del grupo</span>
                                        <p>Consulta las normas de convivencia</p>
                                    </div>
                                </div>
                                <div className="opcion-item-vibe">
                                    <FaUserFriends className="opcion-icon" />
                                    <div className="opcion-text">
                                        <span>Administradores</span>
                                        <p>Contactar con el equipo de gestión</p>
                                    </div>
                                </div>
                                <div className="opcion-item-vibe">
                                    <FaBell className="opcion-icon" />
                                    <div className="opcion-text">
                                        <span>Notificaciones</span>
                                        <p>Gestionar alertas de actividad</p>
                                    </div>
                                </div>
                                <div className="opcion-item-vibe">
                                    <FaThumbtack className="opcion-icon" />
                                    <div className="opcion-text">
                                        <span>Fijar grupo</span>
                                        <p>Mantener al inicio de tu lista</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="vibe-modal-footer">
                            <button className="vibe-btn-primary-full" onClick={() => setGrupoParaDetalle(null)}>Cerrar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DE CREACIÓN */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="vibe-modal-container">
                        <div className="vibe-modal-header">
                            <button className="vibe-close-circle" onClick={() => setIsModalOpen(false)}>
                                <FaTimes />
                            </button>
                            <h3 className="vibe-modal-title-main">Nuevo Grupo</h3>
                        </div>
                        <form onSubmit={handleCrearGrupo}>
                            <div className="vibe-modal-content-body">
                                <div className="vibe-input-wrapper">
                                    <input 
                                        type="text" 
                                        className="vibe-input-field" 
                                        placeholder="Nombre de la comunidad" 
                                        required
                                        value={nuevoGrupo.nombre} 
                                        onChange={(e) => setNuevoGrupo({...nuevoGrupo, nombre: e.target.value})} 
                                    />
                                </div>
                                <div className="vibe-upload-box" onClick={() => fileInputRef.current.click()}>
                                    {nuevoGrupo.imagen ? (
                                        <img src={nuevoGrupo.imagen} className="vibe-img-fit" alt="preview" />
                                    ) : (
                                        <div className="vibe-upload-placeholder">
                                            <FaCamera className="vibe-camera-icon" />
                                            <p>Subir foto de portada</p>
                                        </div>
                                    )}
                                </div>
                                <input type="file" ref={fileInputRef} style={{display: 'none'}} accept="image/*" onChange={(e) => handleImagePreview(e, 'grupo')} />
                            </div>
                            <div className="vibe-modal-footer">
                                <button type="submit" className="vibe-btn-primary-full" disabled={loading}>
                                    {loading ? "Cargando..." : "Crear Comunidad"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* SEGUNDO MODAL: AJUSTAR AVATAR */}
            {imageToCrop && (
                <div className="modal-overlay cropper-overlay">
                    <div className="vibe-modal-container cropper-modal">
                        <div className="cropper-header">
                            <h3 className="vibe-modal-title-main">Ajustar Imagen</h3>
                        </div>
                        <div className="cropper-body">
                            <div className="crop-area-container">
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
                                    cropShape="rect"
                                    showGrid={true}
                                />
                            </div>
                            <div className="cropper-controls-vibe">
                                <input type="range" min={1} max={3} step={0.1} value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} />
                            </div>
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
