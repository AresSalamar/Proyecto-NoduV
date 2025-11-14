
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

// ------------------------------------------------------------------
// INICIALIZACIÓN DE FIREBASE
// ------------------------------------------------------------------
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
let currentUser = null; // Para guardar la info del usuario actual

// ------------------------------------------------------------------
// LÓGICA DE LA PÁGINA
// ------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', function () {
    
    const body = document.body;

    // --- MANEJO DE AUTENTICACIÓN ---
    auth.onAuthStateChanged(user => {
        if (user) {
            // El usuario ha iniciado sesión
            console.log("Usuario autenticado:", user.uid);
            currentUser = user;
            // Cargar datos iniciales que dependen del usuario
            loadBiblioteca(user.uid); 
        } else {
            // El usuario no ha iniciado sesión
            console.log("No hay usuario autenticado. Redirigiendo a index.html");
            // Proteger la página: si no hay usuario, volver al inicio
            window.location.href = 'index.html';
        }
    });


    // --- LÓGICA DE "MI BIBLIOTECA" ---
    const bibliotecaGrid = document.getElementById('biblioteca-grid');
    const bibliotecaVacia = document.getElementById('biblioteca-vacia');

    function loadBiblioteca(userId) {
        if (!userId || !db) return;

        const bibliotecaRef = db.collection('artifacts').doc(appId)
                                .collection('users').doc(userId)
                                .collection('biblioteca');

        // Escuchar cambios en tiempo real
        bibliotecaRef.onSnapshot(snapshot => {
            if (snapshot.empty) {
                if (bibliotecaGrid) bibliotecaGrid.innerHTML = ''; // Limpiar por si acaso
                if (bibliotecaVacia) bibliotecaVacia.classList.remove('hidden');
                return;
            }

            if (bibliotecaVacia) bibliotecaVacia.classList.add('hidden');
            if (bibliotecaGrid) bibliotecaGrid.innerHTML = ''; // Limpiar antes de renderizar

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
        card.innerHTML = `
            <div class="p-6">
                <div class="flex justify-between items-start mb-2">
                    <h3 class="font-hammersmith text-2xl text-noduv-celeste hover:underline cursor-pointer">${apunte.titulo}</h3>
                    <!-- Botón de "Quitar de Favoritos" -->
                    <button class="text-noduv-celeste hover:text-noduv-error remove-from-biblioteca" data-id="${docId}" title="Quitar de Mi Biblioteca">
                        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21z"></path></svg>
                    </button>
                </div>
                <p class="font-inter text-noduv-gris-medio mb-4 h-12">${apunte.descripcion}</p>
                <a href="${apunte.url}" class="block w-full text-center bg-noduv-fondo text-noduv-celeste font-inter font-semibold py-3 rounded-lg hover:bg-noduv-celeste hover:text-white border-2 border-noduv-celeste transition-colors">
                    Ir al Apunte
                </a>
            </div>
        `;

        // Añadir evento al botón de eliminar
        card.querySelector('.remove-from-biblioteca').addEventListener('click', () => {
            if (currentUser) {
                db.collection('artifacts').doc(appId)
                  .collection('users').doc(currentUser.uid)
                  .collection('biblioteca').doc(docId).delete()
                  .then(() => console.log("Apunte eliminado de la biblioteca"))
                  .catch((error) => console.error("Error al eliminar apunte: ", error));
            }
        });
        return card;
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
            }, 300); // Esperar a que termine la transición
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

        const targetPage = document.getElementById(targetId);
        if (targetPage) {
            targetPage.classList.add('active');
        }

        // Actualizar links de la barra superior
        document.querySelectorAll('.nav-link, .nav-link-mobile').forEach(link => {
            if (link.dataset.target === targetId) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
        
        // Actualizar links del sidebar
        document.querySelectorAll('.nav-link-sidebar').forEach(link => {
            if (link.dataset.target === targetId) {
                link.classList.add('bg-noduv-fondo', 'text-noduv-celeste');
            } else {
                link.classList.remove('bg-noduv-fondo', 'text-noduv-celeste');
            }
        });


        if (mobileMenu) mobileMenu.classList.add('hidden');
        hideSidebar(); // Cierra el sidebar al navegar
        window.scrollTo(0, 0);
    }

    allNavLinks.forEach(link => {
        if(link.id.includes('logout') || (link.href && link.href.includes('.html'))) return;
        
        link.addEventListener('click', function(e) {
            e.preventDefault(); 
            const targetId = this.dataset.target;
            if (!targetId) return;
            
            window.location.hash = targetId.replace('-page', ''); 
            updateActivePage(targetId);
        });
    });

    function checkHash() {
        let targetId = window.location.hash.substring(1);
        if (!targetId) {
            targetId = 'inicio'; 
        }
        const validTargets = Array.from(allNavLinks).map(l => l.dataset.target).filter(Boolean);
        if (validTargets.includes(targetId + '-page')) {
             updateActivePage(targetId + '-page');
        } else {
            updateActivePage('inicio-page');
        }
    }

    checkHash();
    window.addEventListener('hashchange', checkHash);

    // --- Lógica para el Modal de Subida ---
    const uploadModal = document.getElementById('upload-modal');
    const openUploadBtnHeader = document.getElementById('open-upload-button-header');
    const openUploadBtnMobile = document.getElementById('open-upload-button-mobile');
    const openUploadBtnProfile = document.getElementById('open-upload-button-profile');
    const closeUploadBtn = document.getElementById('close-upload-modal');
    const uploadForm = document.getElementById('upload-form');

    function showUploadModal() {
        if(uploadModal) uploadModal.classList.remove('hidden');
    }
    function hideUploadModal() {
        if(uploadModal) uploadModal.classList.add('hidden');
    }

    if (openUploadBtnHeader) openUploadBtnHeader.addEventListener('click', showUploadModal);
    if (openUploadBtnMobile) openUploadBtnMobile.addEventListener('click', showUploadModal);
    if (openUploadBtnProfile) openUploadBtnProfile.addEventListener('click', showUploadModal);
    
    if (closeUploadBtn) closeUploadBtn.addEventListener('click', hideUploadModal);
    if (uploadModal) {
        uploadModal.addEventListener('click', (e) => { if (e.target === uploadModal) hideUploadModal(); });
    }
    if (uploadForm) {
        uploadForm.addEventListener('submit', (e) => {
            e.preventDefault();
            console.log('¡Apunte subido (simulación)!');
            hideUploadModal();
        });
    }

    // --- Lógica para el Modal de Publicación (Comunidad) ---
    const postModal = document.getElementById('post-modal');
    const openPostBtn = document.getElementById('open-post-modal-button');
    const closePostBtn = document.getElementById('close-post-modal');
    const postForm = document.getElementById('post-form');

    function showPostModal() {
        if(postModal) postModal.classList.remove('hidden');
    }
    function hidePostModal() {
        if(postModal) postModal.classList.add('hidden');
    }

    if (openPostBtn) openPostBtn.addEventListener('click', showPostModal);
    if (closePostBtn) closePostBtn.addEventListener('click', hidePostModal);
    
    if (postModal) {
        postModal.addEventListener('click', (e) => { if (e.target === postModal) hidePostModal(); });
    }
    if (postForm) {
        postForm.addEventListener('submit', (e) => {
            e.preventDefault();
            console.log('¡Publicación creada (simulación)!');
            hidePostModal();
        });
    }

    // --- Lógica para el Modal de Cerrar Sesión ---
    const logoutConfirmModal = document.getElementById('logout-confirm-modal');
    const openLogoutModalButton = document.getElementById('sidebar-logout-button');
    const closeLogoutModalButton = document.getElementById('close-logout-modal-button');
    const logoutConfirmButton = document.querySelector('#logout-confirm-modal a'); // Botón "Sí, Salir"

    function showLogoutModal() {
        hideSidebar(); // Oculta el sidebar primero
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
    // ¡NUEVO! Lógica de Logout Real
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