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

document.addEventListener('DOMContentLoaded', function () {
    
    // --- Lógica del Menú Móvil ---
    const menuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (menuButton && mobileMenu) {
        menuButton.addEventListener('click', function () {
            mobileMenu.classList.toggle('hidden');
        });

        const menuLinks = mobileMenu.getElementsByTagName('a');
        for (let link of menuLinks) {
            link.addEventListener('click', function () {
                mobileMenu.classList.add('hidden');
            });
        }
    }

    // --- Lógica de Modales ---

    // Obtener los modales
    const loginModal = document.getElementById('login-modal');
    const registerModal = document.getElementById('register-modal');
    const passwordModal = document.getElementById('password-modal'); 
    const monthlyPlanModal = document.getElementById('monthly-plan-modal'); 
    const annualPlanModal = document.getElementById('annual-plan-modal'); 

    // Obtener los botones para ABRIR los modales
    const openLoginBtn = document.getElementById('open-login-button');
    const openLoginBtnMobile = document.getElementById('open-login-button-mobile');
    const openRegisterBtn = document.getElementById('open-register-button');
    const openRegisterBtnFooter = document.getElementById('open-register-button-footer');
    const openPasswordLink = document.getElementById('open-password-link'); 
    const openMonthlyPlanBtn = document.getElementById('open-monthly-plan'); 
    const openAnnualPlanBtn = document.getElementById('open-annual-plan'); 

    // Obtener los botones para CERRAR los modales
    const closeLoginBtn = document.getElementById('close-login-modal');
    const closeRegisterBtn = document.getElementById('close-register-modal');
    const closePasswordBtn = document.getElementById('close-password-modal'); 
    const closeMonthlyPlanBtn = document.getElementById('close-monthly-plan-modal'); 
    const closeAnnualPlanBtn = document.getElementById('close-annual-plan-modal'); 

    // Obtener los enlaces para CAMBIAR de modal
    const gotoRegisterLink = document.getElementById('open-register-link');
    const gotoLoginLink = document.getElementById('open-login-link');
    const backToLoginLink = document.getElementById('back-to-login-link'); 

    // --- Funciones para mostrar/ocultar ---
    function hideAllModals() {
        if (loginModal) loginModal.classList.add('hidden');
        if (registerModal) registerModal.classList.add('hidden');
        if (passwordModal) passwordModal.classList.add('hidden');
        if (monthlyPlanModal) monthlyPlanModal.classList.add('hidden');
        if (annualPlanModal) annualPlanModal.classList.add('hidden');
    }
    
    function showLoginModal() {
        hideAllModals();
        if (loginModal) loginModal.classList.remove('hidden');
    }
    function showRegisterModal() {
        hideAllModals();
        if (registerModal) registerModal.classList.remove('hidden');
    }
    function showPasswordModal() {
        hideAllModals();
        if (passwordModal) passwordModal.classList.remove('hidden');
    }
    function showMonthlyPlanModal() {
        hideAllModals();
        if (monthlyPlanModal) monthlyPlanModal.classList.remove('hidden');
    }
    function showAnnualPlanModal() {
        hideAllModals();
        if (annualPlanModal) annualPlanModal.classList.remove('hidden');
    }

    // --- Asignar Eventos ---
    
    // Abrir Modales
    if (openLoginBtn) openLoginBtn.addEventListener('click', (e) => { e.preventDefault(); showLoginModal(); });
    if (openLoginBtnMobile) openLoginBtnMobile.addEventListener('click', (e) => { e.preventDefault(); showLoginModal(); });
    if (openRegisterBtn) openRegisterBtn.addEventListener('click', (e) => { e.preventDefault(); showRegisterModal(); });
    if (openRegisterBtnFooter) openRegisterBtnFooter.addEventListener('click', (e) => { e.preventDefault(); showRegisterModal(); });
    if (openPasswordLink) openPasswordLink.addEventListener('click', (e) => { e.preventDefault(); showPasswordModal(); });
    if (openMonthlyPlanBtn) openMonthlyPlanBtn.addEventListener('click', (e) => { e.preventDefault(); showMonthlyPlanModal(); });
    if (openAnnualPlanBtn) openAnnualPlanBtn.addEventListener('click', (e) => { e.preventDefault(); showAnnualPlanModal(); });

    // Cerrar Modales
    if (closeLoginBtn) closeLoginBtn.addEventListener('click', hideAllModals);
    if (closeRegisterBtn) closeRegisterBtn.addEventListener('click', hideAllModals);
    if (closePasswordBtn) closePasswordBtn.addEventListener('click', hideAllModals);
    if (closeMonthlyPlanBtn) closeMonthlyPlanBtn.addEventListener('click', hideAllModals);
    if (closeAnnualPlanBtn) closeAnnualPlanBtn.addEventListener('click', hideAllModals);

    // Cambiar entre Modales
    if(gotoRegisterLink) {
        gotoRegisterLink.addEventListener('click', (e) => { e.preventDefault(); showRegisterModal(); });
    }
    if(gotoLoginLink) {
        gotoLoginLink.addEventListener('click', (e) => { e.preventDefault(); showLoginModal(); });
    }
    if(backToLoginLink) {
        backToLoginLink.addEventListener('click', (e) => { e.preventDefault(); showLoginModal(); });
    }

    // Opcional: Cerrar al hacer clic fuera del contenido del modal
    [loginModal, registerModal, passwordModal, monthlyPlanModal, annualPlanModal].forEach(modal => {
        if(modal) {
            modal.addEventListener('click', function (e) {
                if (e.target === modal) {
                    hideAllModals();
                }
            });
        }
    });


    // --- Lógica de Autenticación  ---
    
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const passwordForm = document.getElementById('password-form');
    
    const loginError = document.getElementById('login-error');
    const registerError = document.getElementById('register-error');
    const passwordMessage = document.getElementById('password-message');

    // Comprobar si la config de Firebase está rellenada
    if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "¡PEGA TU API KEY AQUÍ!") {
        
        // --- MODO 1: FIREBASE REAL  ---
        
        // Inicializar Firebase
        firebase.initializeApp(firebaseConfig);
        const auth = firebase.auth();
        const db = firebase.firestore();

        // Función para manejar errores de Firebase
        function handleAuthError(error, element) {
            let message = '';
            switch (error.code) {
                case 'auth/user-not-found':
                    message = 'No existe cuenta con este correo.';
                    break;
                case 'auth/wrong-password':
                    message = 'Contraseña incorrecta. Inténtalo de nuevo.';
                    break;
                case 'auth/email-already-in-use':
                    message = 'Este correo ya está registrado. Intenta iniciar sesión.';
                    break;
                case 'auth/weak-password':
                    message = 'La contraseña debe tener al menos 6 caracteres.';
                    break;
                case 'auth/invalid-email':
                    message = 'El formato del correo no es válido.';
                    break;
                default:
                    message = 'Ocurrió un error. Por favor, inténtalo de nuevo.';
            }
            element.textContent = message;
            element.classList.remove('hidden');
        }

        // --- Formulario de Iniciar Sesión (Real) ---
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const email = document.getElementById('login-email').value;
                const password = document.getElementById('login-password').value;
                
                if (loginError) loginError.classList.add('hidden'); // Ocultar error previo

                auth.signInWithEmailAndPassword(email, password)
                    .then((userCredential) => {
                        console.log('Usuario autenticado:', userCredential.user.uid);
                        window.location.href = 'dashboard.html';
                    })
                    .catch((error) => {
                        handleAuthError(error, loginError);
                    });
            });
        }

        // --- Formulario de Crear Cuenta (Real) ---
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const name = document.getElementById('reg-nombre').value;
                const email = document.getElementById('reg-email').value;
                const password = document.getElementById('reg-password').value;
                const role = document.querySelector('input[name="role"]:checked').value;
                
                if (registerError) registerError.classList.add('hidden');

                auth.createUserWithEmailAndPassword(email, password)
                    .then((userCredential) => {
                        const user = userCredential.user;
                        // Usamos el `appId` para la ruta de la colección
                        const userDocRef = db.collection('artifacts').doc(appId).collection('users').doc(user.uid);
                        
                        return userDocRef.set({
                            uid: user.uid,
                            name: name,
                            email: email,
                            role: role,
                            createdAt: firebase.firestore.FieldValue.serverTimestamp()
                        });
                    })
                    .then(() => {
                        console.log('Usuario creado y guardado en Firestore');
                        window.location.href = 'dashboard.html';
                    })
                    .catch((error) => {
                        handleAuthError(error, registerError);
                    });
            });
        }

        // --- Formulario de Recuperar Contraseña (Real) ---
        if (passwordForm) {
            passwordForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const email = document.getElementById('pass-email').value;
                
                if (passwordMessage) {
                    passwordMessage.classList.add('hidden');
                    passwordMessage.classList.remove('text-noduv-error', 'text-noduv-exito');
                }

                auth.sendPasswordResetEmail(email)
                    .then(() => {
                        if (passwordMessage) {
                            passwordMessage.textContent = '¡Enlace enviado! Revisa tu correo.';
                            passwordMessage.classList.add('text-noduv-exito');
                            passwordMessage.classList.remove('hidden');
                        }
                        setTimeout(hideAllModals, 2000); // Ocultar modal después de 2s
                    })
                    .catch((error) => {
                        if (passwordMessage) {
                            handleAuthError(error, passwordMessage);
                            passwordMessage.classList.add('text-noduv-error');
                        }
                    });
            });
        }

    } else {
        
        // --- MODO 2: SIMULACIÓN (Si la config está vacía) ---
        
        console.warn('Configuración de Firebase no encontrada. Ejecutando en modo de simulación.');

        function simulateLogin(e) {
            e.preventDefault(); 
            console.log('Accediendo (Simulación)... Redirigiendo a dashboard.html');
            window.location.href = 'dashboard.html';
        }
        
        function simulatePasswordReset(e) {
            e.preventDefault();
            if (passwordMessage) {
                passwordMessage.textContent = '¡Enlace enviado (Simulación)!';
                passwordMessage.classList.add('text-noduv-exito');
                passwordMessage.classList.remove('hidden', 'text-noduv-error');
            }
            console.log('Enviando enlace de recuperación (Simulación)...');
            setTimeout(hideAllModals, 2000);
        }

        if (loginForm) loginForm.addEventListener('submit', simulateLogin);
        if (registerForm) registerForm.addEventListener('submit', simulateLogin);
        if (passwordForm) passwordForm.addEventListener('submit', simulatePasswordReset);
    }
});