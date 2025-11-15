// --- Cargar dinámicamente la librería Showdown para Markdown ---
// Esto nos permite convertir el texto de los apuntes a HTML
const showdownScript = document.createElement('script');
showdownScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/showdown/2.1.0/showdown.min.js';
document.head.appendChild(showdownScript);

const firebaseConfig = {
  apiKey: "AIzaSyDMfuoVZwNzMsnAuvzBW7qnStP7y8NP1oo",
  authDomain: "noduv-d146b.firebaseapp.com",
  projectId: "noduv-d146b",
  storageBucket: "noduv-d146b.firebasestorage.app",
  messagingSenderId: "644426808762",
  appId: "1:644426808762:web:7ac80b6141acfa292fb183",
  measurementId: "G-5LGG2BF6QY"
};

// Variable global para el App ID (para las reglas de seguridad de Firestore)
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';


firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

let currentUser = null; // Para guardar la info del usuario actual
let currentUserName = null; 
let userBibliotecaRef = null; 
let comunidadPostsRef = null; 
let apuntesRef = null; 
let reportesRef = null; // --- ¡ REFERENCIA PARA REPORTES! ---


// ---  FUNCIÓN: Para cargar el perfil del usuario (obtener su nombre) ---
function loadUserProfile(userId) {
    if (!userId || !db) return;

    const userDocRef = db.collection('artifacts').doc(appId)
                         .collection('users').doc(userId);
    
    userDocRef.get().then(doc => {
        if (doc.exists) {
            currentUserName = doc.data().name || 'Usuario Anónimo';
            // --- NUEVO: Actualizar nombre en el perfil ---
            const perfilNombre = document.querySelector('#perfil-page h1'); 
            if (perfilNombre) {
                perfilNombre.textContent = `¡Hola, ${currentUserName}!`;
            }
        } else {
            console.warn("No se encontró el documento del perfil del usuario.");
            currentUserName = 'Usuario Anónimo';
        }
    }).catch(error => {
        console.error("Error al cargar perfil de usuario: ", error);
        currentUserName = 'Usuario Anónimo';
    });
}

// --- NUEVA FUNCIÓN: Para convertir timestamp a formato "hace..." ---
function timeAgo(timestamp) {
    if (!timestamp) return "justo ahora";
    
    const now = Date.now();
    // Convertir el timestamp de Firebase (segundos) a milisegundos
    const seconds = timestamp.seconds ? timestamp.seconds * 1000 : now; 
    
    const diff = now - seconds;
    const s = Math.floor(diff / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);

    if (d > 0) return `hace ${d} día${d > 1 ? 's' : ''}`;
    if (h > 0) return `hace ${h} hora${h > 1 ? 's' : ''}`;
    if (m > 0) return `hace ${m} minuto${m > 1 ? 's' : ''}`;
    if (s > 10) return `hace ${s} segundos`;
    return "justo ahora";
}


document.addEventListener('DOMContentLoaded', function () {
    
    const body = document.body;

    // --- MANEJO DE AUTENTICACIÓN  ---
    auth.onAuthStateChanged(user => {
        if (user) {
            // El usuario ha iniciado sesión
            console.log("Usuario autenticado:", user.uid);
            currentUser = user;

            // --- Definir referencias de Firestore ---
            userBibliotecaRef = db.collection('artifacts').doc(appId)
                                .collection('users').doc(user.uid)
                                .collection('biblioteca');
            
            comunidadPostsRef = db.collection('artifacts').doc(appId)
                                .collection('public').doc('data')
                                .collection('comunidad');
            
            apuntesRef = db.collection('artifacts').doc(appId)
                                .collection('public').doc('data')
                                .collection('apuntes');
            
            // --- ¡NUEVA DEFINICIÓN DE REFERENCIA! ---
            reportesRef = db.collection('artifacts').doc(appId)
                                .collection('public').doc('data')
                                .collection('reportes');

            // --- Cargar datos iniciales ---
            loadUserProfile(user.uid); 
            loadBiblioteca(); 
            loadComunidadPosts();
            loadApuntesCursos(); 
            loadPerfilApuntes(user.uid); 

        } else {
            // El usuario no ha iniciado sesión
            console.log("No hay usuario autenticado. Redirigiendo a index.html");
            window.location.href = 'index.html';
        }
    });


    // --- LÓGICA DE "MI BIBLIOTECA" ---
    const bibliotecaGrid = document.getElementById('biblioteca-grid');
    const bibliotecaVacia = document.getElementById('biblioteca-vacia');

    function loadBiblioteca() {
        if (!userBibliotecaRef) return;

        userBibliotecaRef.onSnapshot(snapshot => {
            if (snapshot.empty) {
                if (bibliotecaGrid) bibliotecaGrid.innerHTML = ''; 
                if (bibliotecaVacia) bibliotecaVacia.classList.remove('hidden');
                return;
            }

            if (bibliotecaVacia) bibliotecaVacia.classList.add('hidden');
            if (bibliotecaGrid) bibliotecaGrid.innerHTML = ''; 

            snapshot.forEach(doc => {
                const apunte = doc.data();
                const apunteCard = renderBibliotecaCard(apunte, doc.id);
                if (bibliotecaGrid) bibliotecaGrid.appendChild(apunteCard);
            });
        }, (error) => {
            console.error("Error al cargar la biblioteca: ", error);
        });
    }

    function renderBibliotecaCard(apunte, docId) {
        const card = document.createElement('div');
        card.className = "bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl";
        
        const url = apunte.url && apunte.url.startsWith('http') ? apunte.url : `#apunte-detail=${apunte.id || docId}`;
        
        card.innerHTML = `
            <div class="p-6">
                <div class="flex justify-between items-start mb-2">
                    <h3 class="font-hammersmith text-2xl text-noduv-celeste hover:underline cursor-pointer">${apunte.titulo}</h3>
                    <button class="text-noduv-celeste hover:text-noduv-error remove-from-biblioteca" data-id="${docId}" title="Quitar de Mi Biblioteca">
                        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21z"></path></svg>
                    </button>
                </div>
                <p class="font-inter text-noduv-gris-medio mb-4 h-12">${apunte.descripcion}</p>
                <a href="${url}" class="block w-full text-center bg-noduv-fondo text-noduv-celeste font-inter font-semibold py-3 rounded-lg hover:bg-noduv-celeste hover:text-white border-2 border-noduv-celeste transition-colors">
                    Ir al Apunte
                </a>
            </div>
        `;

        card.querySelector('.remove-from-biblioteca').addEventListener('click', () => {
            if (userBibliotecaRef) {
                userBibliotecaRef.doc(docId).delete()
                  .then(() => console.log("Apunte eliminado de la biblioteca"))
                  .catch((error) => console.error("Error al eliminar apunte: ", error));
            }
        });
        return card;
    }

    // --- CARGAR POSTS DE LA COMUNIDAD ---
    const postsContainer = document.getElementById('comunidad-posts-container');
    const postsLoading = document.getElementById('comunidad-loading');
    const postsVacia = document.getElementById('comunidad-vacia');

    function loadComunidadPosts() {
        if (!comunidadPostsRef || !postsContainer) return;

        if(postsLoading) postsLoading.classList.remove('hidden');

        comunidadPostsRef.onSnapshot(snapshot => {
            if(postsLoading) postsLoading.classList.add('hidden');
            
            if (snapshot.empty) {
                if (postsContainer) postsContainer.innerHTML = '';
                if (postsVacia) postsVacia.classList.remove('hidden');
                return;
            }

            if (postsVacia) postsVacia.classList.add('hidden');
            if (postsContainer) postsContainer.innerHTML = '';
            
            let posts = [];
            snapshot.forEach(doc => {
                posts.push({ id: doc.id, ...doc.data() });
            });

            posts.sort((a, b) => {
                const timeA = a.createdAt ? a.createdAt.seconds : 0;
                const timeB = b.createdAt ? b.createdAt.seconds : 0;
                return timeB - timeA;
            });

            posts.forEach(post => {
                const postCard = renderComunidadPost(post);
                if (postsContainer) postsContainer.appendChild(postCard);
            });

        }, (error) => {
            console.error("Error al cargar posts de la comunidad: ", error);
            if(postsLoading) postsLoading.classList.add('hidden');
            if(postsContainer) postsContainer.innerHTML = '<p class="text-noduv-error text-center">Error al cargar publicaciones.</p>';
        });
    }

    function renderComunidadPost(post) {
        const postCard = document.createElement('a');
        postCard.href = `#comunidad-post=${post.id}`;
        postCard.className = "block bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow";
        
        const respuestas = post.respuestas || 0;
        const curso = post.curso || 'general';
        const cursoCapitalizado = curso.charAt(0).toUpperCase() + curso.slice(1);
        
        postCard.innerHTML = `
            <div class="flex flex-col sm:flex-row justify-between sm:items-center mb-2">
                <h3 class="font-hammersmith text-xl md:text-2xl text-noduv-celeste hover:underline">${post.titulo}</h3>
                <span class="flex-shrink-0 ${respuestas > 0 ? 'bg-noduv-celeste/20 text-noduv-celeste' : 'bg-noduv-gris-claro text-noduv-gris-medio'} text-sm font-medium px-3 py-1 rounded-full mt-2 sm:mt-0">${respuestas} ${respuestas === 1 ? 'Respuesta' : 'Respuestas'}</span>
            </div>
            <div class="flex items-center text-sm text-noduv-gris-medio">
                <img src="https://placehold.co/32x32/F5A623/FFFFFF?text=${post.autorNombre ? post.autorNombre.charAt(0) : 'U'}" alt="Avatar" class="w-8 h-8 rounded-full mr-3">
                <span>Publicado por <strong>${post.autorNombre || 'Usuario'}</strong> en <span class="font-semibold text-noduv-azul">${cursoCapitalizado}</span></span>
                <span class="ml-auto text-xs">${timeAgo(post.createdAt)}</span>
            </div>
        `;
        postCard.addEventListener('click', (e) => {
            e.preventDefault();
            if (!localStorage.getItem('noduvComunidadRulesAccepted')) {
                showRulesModal();
                if(acceptRulesBtn) acceptRulesBtn.dataset.target = `comunidad-post=${post.id}`;
            } else {
                window.location.hash = `comunidad-post=${post.id}`;
            }
        });
        return postCard;
    }

    // --- Lógica del Menú Móvil (Contenido) ---
    const mobileMenuButton = document.getElementById('mobile-menu-button-dash');
    const mobileMenu = document.getElementById('mobile-menu-dash');
    
    if (mobileMenuButton) {
        mobileMenuButton.addEventListener('click', function () {
            if(mobileMenu) mobileMenu.classList.toggle('hidden');
        });
    }

    // --- Lógica del Menú Lateral (Sidebar) ---
    const sidebarContainer = document.getElementById('sidebar-container');
    const sidebar = document.getElementById('sidebar');
    const openSidebarButton = document.getElementById('sidebar-open-button');
    const closeSidebarButton = document.getElementById('sidebar-close-button');
    const sidebarOverlay = document.getElementById('sidebar-overlay');

    function showSidebar() {
        if (sidebarContainer) {
            sidebarContainer.classList.remove('hidden');
            body.classList.add('sidebar-open');
            setTimeout(() => {
                if (sidebar) sidebar.classList.remove('-translate-x-full');
                if (sidebarOverlay) sidebarOverlay.classList.remove('opacity-0');
            }, 10);
        }
    }

    function hideSidebar() {
        if (sidebarContainer) {
            body.classList.remove('sidebar-open');
            if (sidebar) sidebar.classList.add('-translate-x-full');
            if (sidebarOverlay) sidebarOverlay.classList.add('opacity-0');
            setTimeout(() => {
                sidebarContainer.classList.add('hidden');
            }, 300); 
        }
    }

    if (openSidebarButton) openSidebarButton.addEventListener('click', showSidebar);
    if (closeSidebarButton) closeSidebarButton.addEventListener('click', hideSidebar);
    if (sidebarOverlay) sidebarOverlay.addEventListener('click', hideSidebar);


    // --- Lógica de Navegación por Pestañas (SPA) ---
    const allNavLinks = document.querySelectorAll('.nav-link, .nav-link-mobile, .nav-link-sidebar');
    const pageSections = document.querySelectorAll('.page-section');

    function updateActivePage(targetId) {
        if (!targetId) return; 
        
        pageSections.forEach(section => {
            section.classList.remove('active');
        });

        const oldReplyForm = document.getElementById('reply-form');
        if (oldReplyForm && oldReplyForm.handler) {
            oldReplyForm.removeEventListener('submit', oldReplyForm.handler);
        }
        
        const apunteDetail = document.getElementById('apunte-detail-content');
        if (apunteDetail) apunteDetail.innerHTML = '';

        const targetPage = document.getElementById(targetId);
        if (targetPage) {
            targetPage.classList.add('active');
        }

        document.querySelectorAll('.nav-link, .nav-link-mobile').forEach(link => {
            if (!link.closest('#desktop-nav') && !link.closest('#mobile-menu-dash') && !link.href.includes('#comunidad') && !link.href.includes('#cursos')) return;
            
            if (link.dataset.target === targetId) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
        
        document.querySelectorAll('.nav-link-sidebar').forEach(link => {
            if (link.dataset.target === targetId) {
                link.classList.add('bg-noduv-fondo', 'text-noduv-celeste');
            } else {
                link.classList.remove('bg-noduv-fondo', 'text-noduv-celeste');
            }
        });


        if (mobileMenu) mobileMenu.classList.add('hidden');
        hideSidebar(); 
        window.scrollTo(0, 0);
    }

    allNavLinks.forEach(link => {
        if (link.id === 'sidebar-logout-button') return;
        
        link.addEventListener('click', function(e) {
            e.preventDefault(); 
            const targetId = this.dataset.target;
            if (!targetId) return; 
            
            if (targetId === 'comunidad-page' && !localStorage.getItem('noduvComunidadRulesAccepted')) {
                showRulesModal();
                if(acceptRulesBtn) acceptRulesBtn.dataset.target = targetId;
            } else {
                window.location.hash = targetId.replace('-page', ''); 
            }
        });
    });

    function checkHash() {
        let targetId = window.location.hash.substring(1);

        if (targetId.startsWith('comunidad-post=')) {
            const postId = targetId.split('=')[1];
            if (!localStorage.getItem('noduvComunidadRulesAccepted')) {
                showRulesModal();
                if(acceptRulesBtn) acceptRulesBtn.dataset.target = targetId; 
            } else {
                updateActivePage('comunidad-post-detail-page');
                loadPostDetail(postId);
            }
            return; 
        }
        
        if (targetId.startsWith('apunte-detail=')) {
            const apunteId = targetId.split('=')[1];
            updateActivePage('apunte-detail-page');
            loadApunteDetail(apunteId); 
            return; 
        }

        if (!targetId) {
            targetId = 'inicio'; 
        }
        const validTargets = Array.from(allNavLinks).map(l => l.dataset.target).filter(Boolean);
        
        if (validTargets.includes(targetId + '-page')) {
             if (targetId === 'comunidad' && !localStorage.getItem('noduvComunidadRulesAccepted')) {
                showRulesModal();
                if(acceptRulesBtn) acceptRulesBtn.dataset.target = targetId + '-page';
             } else {
                updateActivePage(targetId + '-page');
             }
        } else {
            updateActivePage('inicio-page');
        }
    }

    checkHash();
    window.addEventListener('hashchange', checkHash);

    // --- Lógica de la Página de Detalle del Post ---
    const postDetailContent = document.getElementById('post-detail-content');
    const repliesContainer = document.getElementById('post-replies-container');
    const repliesLoading = document.getElementById('replies-loading');
    const repliesVacia = document.getElementById('replies-vacia');
    const replyForm = document.getElementById('reply-form');

    async function loadPostDetail(postId) {
        if (!comunidadPostsRef || !postDetailContent || !repliesContainer) return;

        // Cargar el post principal
        postDetailContent.innerHTML = `<p class="text-noduv-gris-medio text-center p-8">Cargando publicación...</p>`; 
        try {
            const doc = await comunidadPostsRef.doc(postId).get();
            if (doc.exists) {
                renderPostDetail(doc.data());
            } else {
                postDetailContent.innerHTML = '<p class="text-noduv-error text-center p-8">Error: No se encontró la publicación.</p>';
            }
        } catch (error) {
            console.error("Error al cargar el post: ", error);
            postDetailContent.innerHTML = '<p class="text-noduv-error text-center p-8">Error al cargar la publicación.</p>';
        }

        // Cargar las respuestas (subcolección) en tiempo real
        if(repliesLoading) repliesLoading.classList.remove('hidden');
        if(repliesVacia) repliesVacia.classList.add('hidden');
        repliesContainer.innerHTML = ''; 

        const repliesRef = comunidadPostsRef.doc(postId).collection('respuestas');
        
        repliesRef.onSnapshot(snapshot => {
            if(repliesLoading) repliesLoading.classList.add('hidden');
            
            if (snapshot.empty) {
                if(repliesVacia) repliesVacia.classList.remove('hidden');
                repliesContainer.innerHTML = ''; 
                return;
            }

            if(repliesVacia) repliesVacia.classList.add('hidden');
            repliesContainer.innerHTML = ''; 

            let replies = [];
            snapshot.forEach(doc => replies.push({ id: doc.id, ...doc.data() })); // ---  Guardar ID

            // ---  Ordenar por 'likes' (popularidad), luego por fecha ---
            replies.sort((a, b) => {
                const likesA = a.likes || 0;
                const likesB = b.likes || 0;
                if (likesB !== likesA) {
                    return likesB - likesA; // Más likes primero
                }
                // Si los likes son iguales, el más viejo primero
                const timeA = a.createdAt ? a.createdAt.seconds : 0;
                const timeB = b.createdAt ? b.createdAt.seconds : 0;
                return timeA - timeB; 
            });

            replies.forEach(reply => {
                // --- Pasar postId y reply.id ---
                const replyCard = renderReplyCard(postId, reply.id, reply);
                repliesContainer.appendChild(replyCard);
            });
        }, error => {
            console.error("Error al cargar respuestas: ", error);
            if(repliesLoading) repliesLoading.classList.add('hidden');
            repliesContainer.innerHTML = '<p class="text-noduv-error text-center">Error al cargar respuestas.</p>';
        });

        // 3. Asignar el handler para el formulario de respuesta
        if (replyForm.handler) {
            replyForm.removeEventListener('submit', replyForm.handler);
        }
        
        replyForm.handler = (e) => handleReplySubmit(e, postId);
        replyForm.addEventListener('submit', replyForm.handler);
    }

    function renderPostDetail(post) {
        if (!postDetailContent) return;
        
        const curso = post.curso || 'general';
        const cursoCapitalizado = curso.charAt(0).toUpperCase() + curso.slice(1);

        const contenidoHtml = (post.contenido || '').replace(/\n/g, '<br>');

        postDetailContent.innerHTML = `
            <span class="block text-sm font-semibold text-noduv-azul mb-2">${cursoCapitalizado}</span>
            <h1 class="font-hammersmith text-3xl md:text-4xl text-noduv-azul mb-4">${post.titulo}</h1>
            
            <div class="flex items-center text-sm text-noduv-gris-medio mb-6 pb-6 border-b border-noduv-fondo">
                <img src="https://placehold.co/40x40/F5A623/FFFFFF?text=${post.autorNombre ? post.autorNombre.charAt(0) : 'U'}" alt="Avatar" class="w-10 h-10 rounded-full mr-3">
                <div>
                    Publicado por <strong>${post.autorNombre || 'Usuario'}</strong>
                    <span class="block text-xs">${timeAgo(post.createdAt)}</span>
                </div>
            </div>
            
            <div class="prose max-w-none text-noduv-texto text-lg space-y-4">
                <p>${contenidoHtml}</p>
            </div>
        `;
    }

    /**
     * Renderiza una tarjeta de respuesta. 
     * @param {string} postId El ID del post padre.
     * @param {string} replyId El ID de esta respuesta.
     * @param {object} reply Los datos de la respuesta.
     */
    function renderReplyCard(postId, replyId, reply) {
        const card = document.createElement('div');
        card.className = "bg-white p-5 rounded-xl shadow-md flex items-start gap-4";

        const contenidoHtml = (reply.contenido || '').replace(/\n/g, '<br>');
        
        // --- Lógica de Votación ---
        const likes = reply.likes || 0;
        const dislikes = reply.dislikes || 0;
        const userVote = (reply.votos && currentUser) ? reply.votos[currentUser.uid] : null;
        
        const likeBtnClass = userVote === 'like' ? 'text-noduv-celeste' : 'text-noduv-gris-medio hover:text-noduv-celeste';
        const dislikeBtnClass = userVote === 'dislike' ? 'text-noduv-error' : 'text-noduv-gris-medio hover:text-noduv-error';
        // --- FIN Lógica Votación ---

        card.innerHTML = `
            <img src="https://placehold.co/40x40/4A90E2/FFFFFF?text=${reply.autorNombre ? reply.autorNombre.charAt(0) : 'U'}" alt="Avatar" class="w-10 h-10 rounded-full flex-shrink-0">
            <div class="flex-grow">
                <div class="flex items-center justify-between mb-1">
                    <span class="font-semibold text-noduv-texto">${reply.autorNombre || 'Usuario'}</span>
                    <span class="text-xs text-noduv-gris-medio">${timeAgo(reply.createdAt)}</span>
                </div>
                <div class="prose max-w-none text-noduv-texto space-y-2 mb-3">
                    <p>${contenidoHtml}</p>
                </div>
                
                <!-- ===== ¡NUEVOS BOTONES DE ACCIÓN! ===== -->
                <div class="flex items-center gap-4">
                    <!-- Botón de Like -->
                    <button class="vote-btn flex items-center gap-1 ${likeBtnClass}" data-action="like" title="Me gusta">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-7.02a2 2 0 01-1.965-1.504L3.7 9.87a2 2 0 011.506-2.375l7.13-2.288A2 2 0 0114 7.378V10z"></path></svg>
                        <span class="text-sm font-medium">${likes}</span>
                    </button>
                    <!-- Botón de Dislike -->
                    <button class="vote-btn flex items-center gap-1 ${dislikeBtnClass}" data-action="dislike" title="No me gusta">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.737 3h7.02a2 2 0 011.965 1.504L20.3 14.13a2 2 0 01-1.506 2.375l-7.13 2.288A2 2 0 0110 16.622V14z"></path></svg>
                        <span class="text-sm font-medium">${dislikes}</span>
                    </button>
                    <!-- Botón de Reportar -->
                    <button class="report-btn ml-auto text-xs font-medium text-noduv-gris-medio hover:text-noduv-error" data-post-id="${postId}" data-reply-id="${replyId}">
                        Reportar
                    </button>
                </div>
                <!-- ===== FIN DE NUEVOS BOTONES ===== -->
            </div>
        `;
        
        // --- ¡ LISTENERS! ---
        card.querySelectorAll('.vote-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                handleVote(postId, replyId, btn.dataset.action);
            });
        });
        
        card.querySelector('.report-btn').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            showReportModal(postId, replyId);
        });
        
        return card;
    }

    /**
     * Maneja la lógica de votar (like/dislike).
     */
    async function handleVote(postId, replyId, action) {
        if (!currentUser || !comunidadPostsRef) return;
        
        const replyRef = comunidadPostsRef.doc(postId).collection('respuestas').doc(replyId);
        const userId = currentUser.uid;

        try {
            await db.runTransaction(async (transaction) => {
                const replyDoc = await transaction.get(replyRef);
                if (!replyDoc.exists) {
                    throw "La respuesta no existe.";
                }
                
                const data = replyDoc.data();
                const votos = data.votos || {};
                const userVote = votos[userId];
                
                let likeCount = data.likes || 0;
                let dislikeCount = data.dislikes || 0;
                
                if (userVote === action) {
                    // --- El usuario está deshaciendo su voto ---
                    delete votos[userId];
                    if (action === 'like') {
                        likeCount = Math.max(0, likeCount - 1);
                    } else {
                        dislikeCount = Math.max(0, dislikeCount - 1);
                    }
                } else if (userVote) {
                    // --- El usuario está cambiando su voto ---
                    votos[userId] = action;
                    if (action === 'like') {
                        likeCount++;
                        dislikeCount = Math.max(0, dislikeCount - 1);
                    } else {
                        likeCount = Math.max(0, likeCount - 1);
                        dislikeCount++;
                    }
                } else {
                    // --- El usuario vota por primera vez ---
                    votos[userId] = action;
                    if (action === 'like') {
                        likeCount++;
                    } else {
                        dislikeCount++;
                    }
                }
                
                transaction.update(replyRef, {
                    likes: likeCount,
                    dislikes: dislikeCount,
                    votos: votos
                });
            });
            console.log("Voto registrado con éxito.");
        } catch (error) {
            console.error("Error al registrar el voto: ", error);
        }
    }


    async function handleReplySubmit(e, postId) {
        e.preventDefault();
        if (!currentUser || !comunidadPostsRef) return;

        const replyError = document.getElementById('reply-error');
        const replyContent = document.getElementById('reply-contenido');
        const contenido = replyContent.value.trim();

        if (contenido.length === 0) { 
            if(replyError) replyError.textContent = "La respuesta no puede estar vacía.";
            if(replyError) replyError.classList.remove('hidden');
            return;
        }

        if(replyError) replyError.classList.add('hidden');
        const submitButton = e.submitter || replyForm.querySelector('button[type="submit"]');
        if(submitButton) {
            submitButton.disabled = true; 
            submitButton.textContent = "Publicando...";
        }

        try {
            // Crear objeto de respuesta
            const newReply = {
                contenido: contenido,
                autorId: currentUser.uid,
                autorNombre: currentUserName || 'Usuario Anónimo',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                likes: 0,
                dislikes: 0,
                votos: {}
            };

            const repliesRef = comunidadPostsRef.doc(postId).collection('respuestas');
            await repliesRef.add(newReply);

            await comunidadPostsRef.doc(postId).update({
                respuestas: firebase.firestore.FieldValue.increment(1)
            });
            
        } catch (error) {
            console.error("Error al publicar respuesta: ", error);
            if(replyError) replyError.textContent = "Ocurrió un error al publicar.";
            if(replyError) replyError.classList.remove('hidden');
        } finally {
            if(replyForm) replyForm.reset();
            
            if(submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = "Publicar Respuesta";
            }
        }
    }


    // --- Lógica para el Modal de Subida (Apuntes) ---
    const uploadModal = document.getElementById('upload-modal');
    const openUploadBtnHeader = document.getElementById('open-upload-button-header');
    const openUploadBtnMobile = document.getElementById('open-upload-button-mobile');
    const openUploadBtnProfile = document.getElementById('open-upload-button-profile');
    const closeUploadBtn = document.getElementById('close-upload-modal');
    const uploadForm = document.getElementById('upload-form');
    const uploadError = document.getElementById('upload-error');

    function showUploadModal() {
        if(uploadModal) uploadModal.classList.remove('hidden');
    }
    function hideUploadModal() {
        if(uploadModal) uploadModal.classList.add('hidden');
        if(uploadForm) uploadForm.reset();
        if(uploadError) uploadError.classList.add('hidden');
    }

    if (openUploadBtnHeader) openUploadBtnHeader.addEventListener('click', showUploadModal);
    if (openUploadBtnMobile) openUploadBtnMobile.addEventListener('click', showUploadModal);
    if (openUploadBtnProfile) openUploadBtnProfile.addEventListener('click', showUploadModal);
    
    if (closeUploadBtn) closeUploadBtn.addEventListener('click', hideUploadModal);
    if (uploadModal) {
        uploadModal.addEventListener('click', (e) => { if (e.target === uploadModal) hideUploadModal(); });
    }
    
    if (uploadForm) {
        uploadForm.addEventListener('submit', handleApunteSubmit);
    }

    async function handleApunteSubmit(e) {
        e.preventDefault();
        if (!currentUser || !apuntesRef) {
            if(uploadError) uploadError.textContent = "Error: No se pudo conectar. Intenta de nuevo.";
            if(uploadError) uploadError.classList.remove('hidden');
            return;
        }

        const titulo = document.getElementById('upload-titulo').value.trim();
        const curso = document.getElementById('upload-curso').value;
        const descripcion = document.getElementById('upload-descripcion').value.trim();
        const contenido = document.getElementById('upload-contenido').value.trim();

        if (!titulo || !curso || !descripcion || !contenido) {
            if(uploadError) uploadError.textContent = "Por favor, completa todos los campos.";
            if(uploadError) uploadError.classList.remove('hidden');
            return;
        }
        
        if(uploadError) uploadError.classList.add('hidden');
        const submitButton = uploadForm.querySelector('button[type="submit"]');
        if(submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = "Publicando...";
        }

        try {
            const newApunte = {
                titulo: titulo,
                curso: curso,
                descripcion: descripcion,
                contenido: contenido,
                autorId: currentUser.uid,
                autorNombre: currentUserName || 'Usuario Anónimo',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                votos: 0,
                descargas: 0
            };

            await apuntesRef.add(newApunte);
            
            console.log('¡Apunte creado!');
            hideUploadModal(); 

        } catch (error) {
            console.error("Error al crear el apunte: ", error);
            if(uploadError) uploadError.textContent = "Ocurrió un error al publicar el apunte.";
            if(uploadError) uploadError.classList.remove('hidden');
        } finally {
            if(submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = "Publicar Apunte";
            }
        }
    }
    
    // --- Lógica para Cargar Apuntes en Páginas ---
    const cursosContainer = document.getElementById('cursos-container');
    const cursosLoading = document.getElementById('cursos-loading');
    const cursosVacia = document.getElementById('cursos-vacia');

    function loadApuntesCursos() {
        if (!apuntesRef || !cursosContainer) return;

        if(cursosLoading) cursosLoading.classList.remove('hidden');

        apuntesRef.onSnapshot(snapshot => {
            if(cursosLoading) cursosLoading.classList.add('hidden');
            
            if (snapshot.empty) {
                if (cursosContainer) cursosContainer.innerHTML = '';
                if (cursosVacia) cursosVacia.classList.remove('hidden');
                return;
            }

            if (cursosVacia) cursosVacia.classList.add('hidden');
            if (cursosContainer) cursosContainer.innerHTML = '';
            
            let apuntes = [];
            snapshot.forEach(doc => apuntes.push({ id: doc.id, ...doc.data() }));

            apuntes.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

            apuntes.forEach(apunte => {
                const apunteCard = renderApunteCard(apunte.id, apunte);
                if (cursosContainer) cursosContainer.appendChild(apunteCard);
            });

        }, (error) => {
            console.error("Error al cargar apuntes: ", error);
            if(cursosLoading) cursosLoading.classList.add('hidden');
            if(cursosContainer) cursosContainer.innerHTML = '<p class="text-noduv-error text-center md:col-span-4">Error al cargar apuntes.</p>';
        });
    }

    function renderApunteCard(id, apunte) {
        const card = document.createElement('div');
        card.className = "bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl";
        
        const cursoCapitalizado = apunte.curso.charAt(0).toUpperCase() + apunte.curso.slice(1);
        
        card.innerHTML = `
            <div class="p-6">
                <div class="flex justify-between items-start mb-2">
                    <h3 class="font-hammersmith text-2xl text-noduv-azul">${cursoCapitalizado}</h3>
                </div>
                <p class="font-inter text-noduv-gris-medio mb-4 h-16">${apunte.titulo}</p>
                <div class="flex items-center text-sm text-noduv-gris-medio mb-5">
                    <span class="font-semibold text-noduv-alerta mr-1">★ 0.0</span> (${apunte.descargas || 0} Descargas)
                </div>
                <a href="#apunte-detail=${id}" data-target="apunte-detail-page" class="nav-link block w-full text-center bg-noduv-celeste text-white font-inter font-semibold py-3 rounded-lg hover:bg-noduv-azul transition-colors">
                    Ver Apunte
                </a>
            </div>
        `;
        
        card.querySelector('.nav-link').addEventListener('click', (e) => {
            e.preventDefault();
            window.location.hash = e.currentTarget.hash;
        });
        
        return card;
    }
    
    const perfilApuntesContainer = document.getElementById('perfil-apuntes-container');
    const perfilApuntesLoading = document.getElementById('perfil-apuntes-loading');
    const perfilApuntesVacia = document.getElementById('perfil-apuntes-vacia');

    function loadPerfilApuntes(userId) {
        if (!apuntesRef || !perfilApuntesContainer) return;

        if(perfilApuntesLoading) perfilApuntesLoading.classList.remove('hidden');

        apuntesRef.where("autorId", "==", userId).onSnapshot(snapshot => {
            if(perfilApuntesLoading) perfilApuntesLoading.classList.add('hidden');
            
            if (snapshot.empty) {
                if (perfilApuntesContainer) perfilApuntesContainer.innerHTML = '';
                if (perfilApuntesVacia) perfilApuntesVacia.classList.remove('hidden');
                return;
            }

            if (perfilApuntesVacia) perfilApuntesVacia.classList.add('hidden');
            if (perfilApuntesContainer) perfilApuntesContainer.innerHTML = '';
            
            let apuntes = [];
            snapshot.forEach(doc => apuntes.push({ id: doc.id, ...doc.data() }));

            apuntes.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

            apuntes.forEach(apunte => {
                const apunteCard = renderPerfilApunteCard(apunte.id, apunte);
                if (perfilApuntesContainer) perfilApuntesContainer.appendChild(apunteCard);
            });

        }, (error) => {
            console.error("Error al cargar mis apuntes: ", error);
            if(perfilApuntesLoading) perfilApuntesLoading.classList.add('hidden');
            if(perfilApuntesContainer) perfilApuntesContainer.innerHTML = '<p class="text-noduv-error text-center md:col-span-4">Error al cargar mis apuntes.</p>';
        });
    }
    
    function renderPerfilApunteCard(id, apunte) {
        const card = document.createElement('div');
        card.className = "bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl";
        
        const cursoCapitalizado = apunte.curso.charAt(0).toUpperCase() + apunte.curso.slice(1);
        
        card.innerHTML = `
            <div class="p-6">
                <h3 class="font-hammersmith text-2xl text-noduv-azul">${cursoCapitalizado}</h3>
                <p class="font-inter text-noduv-gris-medio mb-4 h-12">${apunte.titulo}</p>
                <a href="#apunte-detail=${id}" data-target="apunte-detail-page" class="nav-link block w-full text-center bg-noduv-fondo text-noduv-celeste font-inter font-semibold py-3 rounded-lg hover:bg-noduv-celeste hover:text-white border-2 border-noduv-celeste transition-colors">
                    Ver mis apuntes
                </a>
            </div>
        `;
        
        card.querySelector('.nav-link').addEventListener('click', (e) => {
            e.preventDefault();
            window.location.hash = e.currentTarget.hash;
        });
        
        return card;
    }

    const apunteDetailContent = document.getElementById('apunte-detail-content');

    async function loadApunteDetail(apunteId) {
        if (!apuntesRef || !apunteDetailContent) return;

        apunteDetailContent.innerHTML = `<p class="text-noduv-gris-medio text-center p-8">Cargando apunte...</p>`;
        
        try {
            const doc = await apuntesRef.doc(apunteId).get();
            if (doc.exists) {
                renderApunteDetail(doc.data(), doc.id); 
            } else {
                apunteDetailContent.innerHTML = '<p class="text-noduv-error text-center p-8">Error: No se encontró el apunte.</p>';
            }
        } catch (error) {
            console.error("Error al cargar el apunte: ", error);
            apunteDetailContent.innerHTML = '<p class="text-noduv-error text-center p-8">Error al cargar el apunte.</p>';
        }
    }
    
    function renderApunteDetail(apunte, apunteId) {
        if (!apunteDetailContent) return;

        const cursoCapitalizado = apunte.curso.charAt(0).toUpperCase() + apunte.curso.slice(1);

        let htmlContent = '';
        if (typeof showdown !== 'undefined') {
            const converter = new showdown.Converter();
            htmlContent = converter.makeHtml(apunte.contenido);
        } else {
            console.warn("Showdown no cargado, usando <br>.");
            htmlContent = apunte.contenido.replace(/\n/g, '<br>');
        }
        
        let adminButtons = '';
        if (currentUser && currentUser.uid === apunte.autorId) {
            adminButtons = `
                <div class="flex items-center gap-4 mt-4">
                    <button id="edit-apunte-btn" data-id="${apunteId}" class="bg-noduv-alerta text-white font-semibold py-2 px-5 rounded-lg hover:bg-yellow-600 transition-colors">
                        Editar
                    </button>
                    <button id="delete-apunte-btn" data-id="${apunteId}" class="bg-noduv-error text-white font-semibold py-2 px-5 rounded-lg hover:bg-red-700 transition-colors">
                        Eliminar
                    </button>
                </div>
            `;
        }

        apunteDetailContent.innerHTML = `
            <span class="block text-sm font-semibold text-noduv-azul mb-2">${cursoCapitalizado}</span>
            <h1 class="font-hammersmith text-3xl md:text-4xl text-noduv-azul mb-4">${apunte.titulo}</h1>
            
            <div class="flex items-center justify-between text-sm text-noduv-gris-medio mb-6 pb-6 border-b border-noduv-fondo">
                <div class="flex items-center">
                    <img src="https://placehold.co/40x40/F5A623/FFFFFF?text=${apunte.autorNombre ? apunte.autorNombre.charAt(0) : 'U'}" alt="Avatar" class="w-10 h-10 rounded-full mr-3">
                    <div>
                        Publicado por <strong>${apunte.autorNombre || 'Usuario'}</strong>
                        <span class="block text-xs">${timeAgo(apunte.createdAt)}</span>
                    </div>
                </div>
                ${adminButtons} 
            </div>
            
            <div class="prose max-w-none">
                ${htmlContent}
            </div>
        `;
        
        const deleteBtn = document.getElementById('delete-apunte-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', async (e) => {
                const id = e.currentTarget.dataset.id;
                if (confirm("¿Estás seguro de que quieres eliminar este apunte? Esta acción no se puede deshacer.")) {
                    try {
                        await apuntesRef.doc(id).delete();
                        console.log("Apunte eliminado");
                        window.location.hash = '#cursos'; 
                    } catch (error) {
                        console.error("Error al eliminar apunte: ", error);
                        alert("No se pudo eliminar el apunte.");
                    }
                }
            });
        }
        
        const editBtn = document.getElementById('edit-apunte-btn');
        if (editBtn) {
            editBtn.addEventListener('click', (e) => {
                alert("La función de editar se implementará pronto. Por ahora, puedes eliminar y volver a crear el apunte.");
            });
        }
    }


    // --- Lógica para el Modal de Publicación (Comunidad) ---
    const postModal = document.getElementById('post-modal');
    const openPostBtn = document.getElementById('open-post-modal-button');
    const closePostBtn = document.getElementById('close-post-modal');
    const postForm = document.getElementById('post-form');
    const postError = document.getElementById('post-error'); 

    function showPostModal() {
        if(postModal) postModal.classList.remove('hidden');
    }
    function hidePostModal() {
        if(postModal) postModal.classList.add('hidden');
        if(postForm) postForm.reset();
        if(postError) postError.classList.add('hidden');
    }

    if (openPostBtn) openPostBtn.addEventListener('click', showPostModal);
    if (closePostBtn) closePostBtn.addEventListener('click', hidePostModal);
    
    if (postModal) {
        postModal.addEventListener('click', (e) => { if (e.target === postModal) hidePostModal(); });
    }
    if (postForm) {
        postForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!currentUser || !comunidadPostsRef) {
                if(postError) postError.textContent = "Error: No se pudo conectar. Intenta de nuevo.";
                if(postError) postError.classList.remove('hidden');
                return;
            }

            const titulo = document.getElementById('post-titulo').value;
            const contenido = document.getElementById('post-contenido').value;
            const curso = document.getElementById('post-curso').value;
            
            if (titulo.trim().length < 5) {
                if(postError) postError.textContent = "El título es muy corto.";
                if(postError) postError.classList.remove('hidden');
                return;
            }

            if (contenido.trim().length === 0) {
                if(postError) postError.textContent = "La publicación debe tener contenido.";
                if(postError) postError.classList.remove('hidden');
                return;
            }
            
            if(postError) postError.classList.add('hidden');
            const submitButton = e.submitter || postForm.querySelector('button[type="submit"]');
            if(submitButton) {
                submitButton.disabled = true; 
                submitButton.textContent = "Publicando...";
            }

            try {
                const newPost = {
                    titulo: titulo,
                    contenido: contenido,
                    curso: curso || 'general',
                    autorId: currentUser.uid,
                    autorNombre: currentUserName || 'Usuario Anónimo',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    respuestas: 0
                };

                await comunidadPostsRef.add(newPost);
                
                console.log('¡Publicación creada!');
                hidePostModal(); 

            } catch (error) {
                console.error("Error al crear publicación: ", error);
                if(postError) postError.textContent = "Ocurrió un error al publicar.";
                if(postError) postError.classList.remove('hidden');
            } finally {
                if(submitButton) {
                    submitButton.disabled = false; 
                    submitButton.textContent = "Publicar Pregunta";
                }
            }
        });
    }

    // --- Lógica para el Modal de Normas de Comunidad ---
    const rulesModal = document.getElementById('community-rules-modal');
    const closeRulesBtn = document.getElementById('close-rules-modal');
    const acceptRulesBtn = document.getElementById('accept-rules-button');

    function showRulesModal() {
        if(rulesModal) rulesModal.classList.remove('hidden');
    }
    function hideRulesModal() {
        if(rulesModal) rulesModal.classList.add('hidden');
    }

    if(closeRulesBtn) closeRulesBtn.addEventListener('click', hideRulesModal);
    
    if(acceptRulesBtn) {
        acceptRulesBtn.addEventListener('click', () => {
            localStorage.setItem('noduvComunidadRulesAccepted', 'true');
            hideRulesModal();
            const targetId = acceptRulesBtn.dataset.target;
            if (targetId) {
                if (targetId.startsWith('comunidad-post=')) {
                    window.location.hash = targetId;
                } else {
                    window.location.hash = targetId.replace('-page', '');
                }
            }
        });
    }

    // --- MODAL DE REPORTE ---
    const reportModal = document.getElementById('report-modal');
    const closeReportModalBtn = document.getElementById('close-report-modal');
    const reportForm = document.getElementById('report-form');
    const reportMessage = document.getElementById('report-message');

    function showReportModal(postId, replyId) {
        if (!reportForm || !reportModal) return;
        // Guardar los IDs en el formulario para usarlos al enviar
        reportForm.dataset.postId = postId;
        reportForm.dataset.replyId = replyId;
        reportModal.classList.remove('hidden');
    }

    function hideReportModal() {
        if (!reportModal || !reportForm || !reportMessage) return;
        reportModal.classList.add('hidden');
        reportForm.reset();
        reportForm.dataset.postId = '';
        reportForm.dataset.replyId = '';
        reportMessage.classList.add('hidden');
        reportMessage.textContent = '';
        reportMessage.classList.remove('text-noduv-exito', 'text-noduv-error');
    }

    if (closeReportModalBtn) closeReportModalBtn.addEventListener('click', hideReportModal);
    if (reportModal) {
        reportModal.addEventListener('click', (e) => {
            if (e.target === reportModal) hideReportModal();
        });
    }
    
    if (reportForm) {
        reportForm.addEventListener('submit', handleReportSubmit);
    }
    
    async function handleReportSubmit(e) {
        e.preventDefault();
        if (!reportesRef || !currentUser) {
            reportMessage.textContent = "Error: No se pudo conectar.";
            reportMessage.classList.add('text-noduv-error');
            reportMessage.classList.remove('hidden');
            return;
        }

        const razon = document.getElementById('report-razon').value;
        const detalles = document.getElementById('report-detalles').value;
        const postId = reportForm.dataset.postId;
        const replyId = reportForm.dataset.replyId;

        if (!razon) {
            reportMessage.textContent = "Por favor, selecciona una razón.";
            reportMessage.classList.add('text-noduv-error');
            reportMessage.classList.remove('hidden');
            return;
        }

        const submitButton = reportForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = "Enviando...";

        try {
            const newReport = {
                postId: postId,
                replyId: replyId,
                razon: razon,
                detalles: detalles,
                reporterId: currentUser.uid,
                reporterName: currentUserName || 'Usuario Anónimo',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                estado: 'pendiente' // Para futura moderación
            };
            
            await reportesRef.add(newReport);
            
            reportMessage.textContent = "¡Reporte enviado! Gracias por ayudarnos.";
            reportMessage.classList.add('text-noduv-exito');
            reportMessage.classList.remove('hidden', 'text-noduv-error');

            setTimeout(hideReportModal, 2500);

        } catch (error) {
            console.error("Error al enviar reporte: ", error);
            reportMessage.textContent = "Error al enviar el reporte. Intenta de nuevo.";
            reportMessage.classList.add('text-noduv-error');
            reportMessage.classList.remove('hidden', 'text-noduv-exito');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = "Enviar Reporte";
        }
    }


    // --- Lógica para el Modal de Cerrar Sesión ---
    const logoutConfirmModal = document.getElementById('logout-confirm-modal');
    const openLogoutModalButton = document.getElementById('sidebar-logout-button');
    const closeLogoutModalButton = document.getElementById('close-logout-modal-button');
    const logoutConfirmButton = document.querySelector('#logout-confirm-modal a'); 

    function showLogoutModal() {
        hideSidebar(); 
        if (logoutConfirmModal) logoutConfirmModal.classList.remove('hidden');
    }
    function hideLogoutModal() {
        if (logoutConfirmModal) logoutConfirmModal.classList.add('hidden');
    }

    if (openLogoutModalButton) openLogoutModalButton.addEventListener('click', showLogoutModal);
    if (closeLogoutModalButton) closeLogoutModalButton.addEventListener('click', hideLogoutModal);
    if (logoutConfirmModal) {
        logoutConfirmModal.addEventListener('click', (e) => {
            if (e.target === logoutConfirmModal) hideLogoutModal();
        });
    }
    if (logoutConfirmButton) {
        logoutConfirmButton.addEventListener('click', (e) => {
            e.preventDefault();
            auth.signOut().then(() => {
                console.log('Sesión cerrada');
                window.location.href = 'index.html';
            }).catch((error) => {
                console.error('Error al cerrar sesión:', error);
            });
        });
    }

    // --- Lógica para el Acordeón de Tips ---
    const tipsAccordion = document.getElementById('tips-accordion');
    if(tipsAccordion){
        tipsAccordion.addEventListener('click', (e) => {
            const item = e.target.closest('.accordion-item');
            if (!item) return;

            const allItems = tipsAccordion.querySelectorAll('.accordion-item');
            allItems.forEach(i => {
                if (i !== item && i.classList.contains('active')) {
                    i.classList.remove('active');
                }
            });
            item.classList.toggle('active');
        });
    }
    
    // --- Lógica para el Acordeón de Soporte ---
    const soporteAccordion = document.getElementById('soporte-accordion');
    if(soporteAccordion){
        soporteAccordion.addEventListener('click', (e) => {
            const item = e.target.closest('.accordion-item');
            if (!item) return;

            const allItems = soporteAccordion.querySelectorAll('.accordion-item');
            allItems.forEach(i => {
                if (i !== item && i.classList.contains('active')) {
                    i.classList.remove('active');
                }
            });
            item.classList.toggle('active');
        });
    }

});