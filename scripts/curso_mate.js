
const firebaseConfig = {
  apiKey: "AIzaSyDMfuoVZwNzMsnAuvzBW7qnStP7y8NP1oo",
  authDomain: "noduv-d146b.firebaseapp.com",
  projectId: "noduv-d146b",
  storageBucket: "noduv-d146b.firebasestorage.app",
  messagingSenderId: "644426808762",
  appId: "1:644426808762:web:7ac80b6141acfa292fb183",
  measurementId: "G-5LGG2BF6QY"
};

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

document.addEventListener('DOMContentLoaded', function () {
            
    // --- Lógica del Menú Móvil del Dashboard ---
    const menuButton = document.getElementById('mobile-menu-button-dash');
    const mobileMenu = document.getElementById('mobile-menu-dash');
    
    if (menuButton) {
        menuButton.addEventListener('click', function () {
            mobileMenu.classList.toggle('hidden');
        });
    }

    const todoForm = document.getElementById('todo-form');
    const todoInput = document.getElementById('todo-input');
    const todoList = document.getElementById('todo-list');
    let tasks = []; 

    function renderTasks() {
        if (!todoList) return; // Salir si no hay lista de tareas en esta página
        
        todoList.innerHTML = ''; // Limpiar lista
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

    renderTasks();

});