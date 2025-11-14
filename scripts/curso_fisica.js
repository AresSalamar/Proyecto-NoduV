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
            
    // --- Lógica del Menú Móvil del Dashboard ---
    const menuButton = document.getElementById('mobile-menu-button-dash');
    const mobileMenu = document.getElementById('mobile-menu-dash');
    
    if (menuButton) {
        menuButton.addEventListener('click', function () {
            if(mobileMenu) mobileMenu.classList.toggle('hidden');
        });
    }

    // --- Lógica de Navegación de Apuntes de FÍSICA ---
     const setupCourseNotesToggle = (courseId, notesData) => {
        const section = document.getElementById(courseId);
        if (!section) return;

        const summaryView = section.querySelector(`#${courseId}-summary`);
        const notesIndexView = section.querySelector(`#${courseId}-notes`);
        const showNotesBtn = section.querySelector(`#show-${courseId}-notes-btn`);
        const backToSummaryBtn = section.querySelector(`#back-to-${courseId}-summary-btn`);

        if (showNotesBtn) {
            showNotesBtn.addEventListener('click', () => {
                summaryView.classList.remove('active'); 
                notesIndexView.classList.add('active'); 
            });
        }

        if (backToSummaryBtn) {
            backToSummaryBtn.addEventListener('click', () => {
                notesIndexView.classList.remove('active'); 
                summaryView.classList.add('active'); 
            });
        }

        notesData.forEach(note => {
            const topicView = section.querySelector(`#${courseId}-topic-${note.id}`);
            if (!topicView) return; 
            
            const showTopicBtn = section.querySelector(`#show-${note.id}-notes-btn`);
            const backToIndexBtn = topicView.querySelector(`#back-to-${courseId}-index-btn${note.backBtnId ? '-' + note.backBtnId : ''}`);

            if (showTopicBtn) {
                showTopicBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    notesIndexView.classList.remove('active'); 
                    topicView.classList.add('active'); 
                });
            }

            if (backToIndexBtn) {
                backToIndexBtn.addEventListener('click', () => {
                    topicView.classList.remove('active'); 
                    notesIndexView.classList.add('active'); 
                });
            }
        });
    };

    setupCourseNotesToggle('fisica', [
        { id: 'newton', backBtnId: null },
        { id: 'cinematica', backBtnId: 'cinematica' },
        { id: 'proyectiles', backBtnId: 'proyectiles' }
    ]);
    
    // --- Lógica de To-Do List (Simplificada para esta página) ---
    const todoForm = document.getElementById('todo-form');
    const todoInput = document.getElementById('todo-input');
    const todoList = document.getElementById('todo-list');
    let tasks = [
        { id: 2, text: 'Terminar reporte de laboratorio.', completed: true }
    ]; // Tareas solo para esta página

    function renderTasks() {
        if (!todoList) return; 
        
        todoList.innerHTML = ''; 
        if (tasks.length === 0) {
            todoList.innerHTML = `<p class="text-noduv-gris-medio text-center">¡No hay tareas pendientes! 🎉</p>`;
            return;
        }

        tasks.forEach(task => {
            const taskItem = document.createElement('div');
            taskItem.className = 'task-item flex items-center justify-between p-3 bg-noduv-fondo rounded-lg';
            taskItem.dataset.id = task.id;
            
            const label = document.createElement('label');
            label.className = 'flex items-center flex-grow cursor-pointer';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = task.completed;
            checkbox.className = 'h-4 w-4 rounded border-gray-300 text-noduv-celeste focus:ring-noduv-celeste';
            
            const span = document.createElement('span');
            span.textContent = task.text;
            span.className = `ml-3 ${task.completed ? 'line-through text-noduv-gris-medio' : 'text-noduv-texto'}`;
            
            label.appendChild(checkbox);
            label.appendChild(span);

            const deleteButton = document.createElement('button');
            deleteButton.textContent = '✖';
            deleteButton.className = 'delete-btn ml-4 text-noduv-gris-medio hover:text-noduv-error transition-colors';
            
            taskItem.appendChild(label);
            taskItem.appendChild(deleteButton);
            todoList.appendChild(taskItem);
        });
    }

    if(todoForm) {
        todoForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const text = todoInput.value.trim();
            if (text) {
                tasks.push({ id: Date.now(), text, completed: false });
                todoInput.value = '';
                renderTasks();
            }
        });
    }

    if(todoList) {
        todoList.addEventListener('click', function(e) {
            const taskItem = e.target.closest('.task-item');
            if (!taskItem) return;

            const taskId = Number(taskItem.dataset.id);
            const task = tasks.find(t => t.id === taskId);
            if (!task) return;

            if (e.target.matches('input[type="checkbox"]')) {
                task.completed = e.target.checked;
            } else if (e.target.matches('.delete-btn')) {
                tasks = tasks.filter(t => t.id !== taskId);
            } else if (e.target.closest('label')) {
                task.completed = !task.completed;
            }
            
            renderTasks();
        });
    }

    renderTasks(); // Render inicial de tareas


    // ------------------------------------------------------------------
    // ¡NUEVA LÓGICA DE FIREBASE Y BIBLIOTECA!
    // ------------------------------------------------------------------

    const allBookmarkButtons = document.querySelectorAll('.bookmark-btn');
    let userBibliotecaRef = null;

    auth.onAuthStateChanged(user => {
        if (user) {
            // El usuario ha iniciado sesión
            currentUser = user;
            // Definir la referencia a la biblioteca del usuario
            userBibliotecaRef = db.collection('artifacts').doc(appId)
                                  .collection('users').doc(currentUser.uid)
                                  .collection('biblioteca');
            
            // Comprobar el estado inicial de los marcadores
            checkInitialBookmarkState();
            // Añadir los listeners a los botones
            addBookmarkListeners();
        } else {
            // El usuario no ha iniciado sesión, proteger la página
            console.log("Usuario no autenticado, redirigiendo a index.html");
            window.location.href = 'index.html'; 
        }
    });

    /**
     * Comprueba el estado inicial de los marcadores en la página
     * y los colorea si ya están guardados en Firebase.
     */
    function checkInitialBookmarkState() {
        if (!userBibliotecaRef) return;
        
        allBookmarkButtons.forEach(btn => {
            const apunteId = btn.dataset.id;
            userBibliotecaRef.doc(apunteId).get().then(doc => {
                if (doc.exists) {
                    btn.classList.add('saved'); // 'saved' activa el color azul
                } else {
                    btn.classList.remove('saved');
                }
            });
        });
    }

    /**
     * Añade los event listeners a todos los botones de marcador.
     */
    function addBookmarkListeners() {
        allBookmarkButtons.forEach(btn => {
            btn.addEventListener('click', handleBookmarkClick);
        });
    }

    /**
     * Maneja el clic en un botón de marcador (guardar/quitar).
     */
    function handleBookmarkClick(e) {
        if (!currentUser || !userBibliotecaRef) {
            alert("Error: No se pudo verificar el usuario.");
            return;
        }

        const btn = e.currentTarget;
        const apunte = {
            id: btn.dataset.id,
            titulo: btn.dataset.title,
            descripcion: btn.dataset.desc,
            url: btn.dataset.url
        };

        const apunteRef = userBibliotecaRef.doc(apunte.id);

        if (btn.classList.contains('saved')) {
            // --- Ya está guardado, así que lo quitamos ---
            apunteRef.delete().then(() => {
                console.log("Apunte quitado de la biblioteca");
                // Sincronizar todos los botones con el mismo data-id
                document.querySelectorAll(`.bookmark-btn[data-id="${apunte.id}"]`).forEach(b => b.classList.remove('saved'));
            }).catch(error => console.error("Error al quitar apunte: ", error));
            
        } else {
            // --- No está guardado, así que lo añadimos ---
            apunteRef.set(apunte).then(() => {
                console.log("Apunte guardado en la biblioteca");
                // Sincronizar todos los botones con el mismo data-id
                document.querySelectorAll(`.bookmark-btn[data-id="${apunte.id}"]`).forEach(b => b.classList.add('saved'));
            }).catch(error => console.error("Error al guardar apunte: ", error));
        }
    }

});