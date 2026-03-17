// app.js - Application State and Core Functions
// Global application state
const AppState = {
    counter: 0,
    todos: [],
    clockInterval: null,
    theme: 'light'
};

// Counter Functions
const Counter = {
    increment: function() {
        AppState.counter++;
        this.updateDisplay();
        this.animateCounter();
    },

    decrement: function() {
        AppState.counter--;
        this.updateDisplay();
        this.animateCounter();
    },

    reset: function() {
        AppState.counter = 0;
        this.updateDisplay();
        this.animateCounter();
    },

    updateDisplay: function() {
        const counterElement = document.getElementById('counterValue');
        if (counterElement) {
            counterElement.textContent = AppState.counter;
        }
    },

    animateCounter: function() {
        const counterElement = document.getElementById('counterValue');
        if (counterElement) {
            counterElement.style.transition = 'transform 0.2s ease';
            counterElement.style.transform = 'scale(1.3)';
            setTimeout(() => {
                counterElement.style.transform = 'scale(1)';
            }, 200);
        }
    }
};

// Todo Functions
const TodoManager = {
    add: function(text) {
        if (!text || text.trim() === '') {
            this.showNotification('Please enter a valid task!', 'error');
            return;
        }

        const todo = {
            id: Date.now(),
            text: text.trim(),
            completed: false,
            createdAt: new Date().toISOString()
        };

        AppState.todos.push(todo);
        this.render();
        this.showNotification('Task added successfully!', 'success');
    },

    toggle: function(id) {
        const todo = AppState.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.render();
        }
    },

    delete: function(id) {
        const todoIndex = AppState.todos.findIndex(t => t.id === id);
        if (todoIndex !== -1) {
            AppState.todos.splice(todoIndex, 1);
            this.render();
            this.showNotification('Task deleted!', 'info');
        }
    },

    deleteAll: function() {
        if (AppState.todos.length === 0) return;
        
        if (confirm('Are you sure you want to delete all tasks?')) {
            AppState.todos = [];
            this.render();
            this.showNotification('All tasks cleared!', 'info');
        }
    },

    render: function() {
        const todoList = document.getElementById('todoList');
        if (!todoList) return;

        todoList.innerHTML = '';

        if (AppState.todos.length === 0) {
            todoList.innerHTML = '<li style="text-align: center; color: #a0aec0; padding: 20px;">No tasks yet. Add one above!</li>';
            return;
        }

        AppState.todos.forEach(todo => {
            const li = document.createElement('li');
            li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
            li.style.animation = 'slideIn 0.3s ease';
            
            li.innerHTML = `
                <span class="todo-text">${this.escapeHtml(todo.text)}</span>
                <div class="todo-actions">
                    <button class="todo-btn complete-btn" onclick="TodoManager.toggle(${todo.id})">
                        ${todo.completed ? '↶ Undo' : '✓ Done'}
                    </button>
                    <button class="todo-btn delete-btn" onclick="TodoManager.delete(${todo.id})">
                        ✕ Delete
                    </button>
                </div>
            `;
            
            todoList.appendChild(li);
        });

        this.updateStats();
    },

    updateStats: function() {
        const total = AppState.todos.length;
        const completed = AppState.todos.filter(t => t.completed).length;
        const pending = total - completed;

        // You can display these stats somewhere in your UI
        console.log(`Todo Stats - Total: ${total}, Completed: ${completed}, Pending: ${pending}`);
    },

    escapeHtml: function(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    showNotification: function(message, type) {
        // Simple console notification (can be enhanced with UI notifications)
        const styles = {
            success: 'color: green; font-weight: bold',
            error: 'color: red; font-weight: bold',
            info: 'color: blue; font-weight: bold'
        };
        console.log(`%c${message}`, styles[type] || '');
    }
};

// Clock Functions
const Clock = {
    start: function() {
        this.update();
        AppState.clockInterval = setInterval(() => {
            this.update();
        }, 1000);
    },

    update: function() {
        const clockElement = document.getElementById('clock');
        if (!clockElement) return;

        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        
        clockElement.textContent = `${hours}:${minutes}:${seconds}`;
    },

    stop: function() {
        if (AppState.clockInterval) {
            clearInterval(AppState.clockInterval);
            AppState.clockInterval = null;
        }
    },

    getFormattedDate: function() {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return now.toLocaleDateString('en-US', options);
    }
};

// Utility Functions
const Utils = {
    log: function(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[${timestamp}] [${type.toUpperCase()}]: ${message}`);
    },

    getAppInfo: function() {
        return {
            name: 'JavaScript Frontend Project',
            version: '1.0.0',
            counterValue: AppState.counter,
            totalTodos: AppState.todos.length,
            completedTodos: AppState.todos.filter(t => t.completed).length,
            pendingTodos: AppState.todos.filter(t => !t.completed).length,
            theme: AppState.theme,
            uptime: this.getUptime()
        };
    },

    getUptime: function() {
        if (!window.appStartTime) {
            window.appStartTime = Date.now();
        }
        const uptimeMs = Date.now() - window.appStartTime;
        const seconds = Math.floor(uptimeMs / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    },

    exportData: function() {
        const data = {
            counter: AppState.counter,
            todos: AppState.todos,
            exportedAt: new Date().toISOString()
        };
        return JSON.stringify(data, null, 2);
    },

    importData: function(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            if (data.counter !== undefined) {
                AppState.counter = data.counter;
                Counter.updateDisplay();
            }
            if (Array.isArray(data.todos)) {
                AppState.todos = data.todos;
                TodoManager.render();
            }
            this.log('Data imported successfully', 'success');
            return true;
        } catch (error) {
            this.log('Failed to import data: ' + error.message, 'error');
            return false;
        }
    }
};

// Add CSS animation for todo items
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateX(-20px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
`;
document.head.appendChild(style);

console.log('app.js loaded successfully! 🚀');
