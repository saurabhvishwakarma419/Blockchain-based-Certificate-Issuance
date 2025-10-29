
// main.js - Event Handlers and DOM Manipulation

// Event handler for counter buttons
function setupCounterEvents() {
    const incrementBtn = document.getElementById('incrementBtn');
    const decrementBtn = document.getElementById('decrementBtn');
    const resetBtn = document.getElementById('resetBtn');

    if (incrementBtn) {
        incrementBtn.addEventListener('click', () => {
            Counter.increment();
            Utils.log('Counter incremented', 'info');
            addRippleEffect(incrementBtn);
        });
    }

    if (decrementBtn) {
        decrementBtn.addEventListener('click', () => {
            Counter.decrement();
            Utils.log('Counter decremented', 'info');
            addRippleEffect(decrementBtn);
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            Counter.reset();
            Utils.log('Counter reset', 'info');
            addRippleEffect(resetBtn);
        });
    }
}

// Event handler for todo list
function setupTodoEvents() {
    const addTodoBtn = document.getElementById('addTodoBtn');
    const todoInput = document.getElementById('todoInput');

    if (addTodoBtn) {
        addTodoBtn.addEventListener('click', () => {
            const text = todoInput.value;
            TodoManager.add(text);
            todoInput.value = '';
            todoInput.focus();
            Utils.log('Todo added via button', 'success');
        });
    }

    if (todoInput) {
        // Handle Enter key
        todoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const text = todoInput.value;
                TodoManager.add(text);
                todoInput.value = '';
                Utils.log('Todo added via Enter key', 'success');
            }
        });

        // Add input validation feedback
        todoInput.addEventListener('input', (e) => {
            const value = e.target.value.trim();
            if (value.length > 100) {
                todoInput.style.borderColor = '#f56565';
                Utils.log('Todo text too long (max 100 chars)', 'warning');
            } else {
                todoInput.style.borderColor = '#e2e8f0';
            }
        });

        // Focus effect
        todoInput.addEventListener('focus', () => {
            todoInput.style.borderColor = '#667eea';
        });

        todoInput.addEventListener('blur', () => {
            if (!todoInput.value.trim()) {
                todoInput.style.borderColor = '#e2e8f0';
            }
        });
    }
}

// Initialize animations with enhanced effects
function initAnimations() {
    const cards = document.querySelectorAll('.card');
    
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 150);
    });

    // Animate header
    const header = document.querySelector('header');
    if (header) {
        header.style.opacity = '0';
        header.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            header.style.transition = 'all 0.8s ease';
            header.style.opacity = '1';
            header.style.transform = 'translateY(0)';
        }, 50);
    }
}

// Add keyboard shortcuts with visual feedback
function setupKeyboardShortcuts() {
    let shortcutTimeout;

    document.addEventListener('keydown', (e) => {
        // Alt + I to increment
        if (e.altKey && e.key === 'i') {
            e.preventDefault();
            Counter.increment();
            showShortcutFeedback('Incremented! (+1)');
        }
        
        // Alt + D to decrement
        if (e.altKey && e.key === 'd') {
            e.preventDefault();
            Counter.decrement();
            showShortcutFeedback('Decremented! (-1)');
        }
        
        // Alt + R to reset
        if (e.altKey && e.key === 'r') {
            e.preventDefault();
            Counter.reset();
            showShortcutFeedback('Counter Reset!');
        }

        // Alt + T to focus todo input
        if (e.altKey && e.key === 't') {
            e.preventDefault();
            const todoInput = document.getElementById('todoInput');
            if (todoInput) {
                todoInput.focus();
                showShortcutFeedback('Todo Input Focused');
            }
        }

        // Alt + C to clear completed todos
        if (e.altKey && e.key === 'c') {
            e.preventDefault();
            clearCompletedTodos();
            showShortcutFeedback('Completed Todos Cleared');
        }

        // Alt + A to clear all todos
        if (e.altKey && e.key === 'a') {
            e.preventDefault();
            TodoManager.deleteAll();
            showShortcutFeedback('All Todos Cleared');
        }

        // Alt + E to export data
        if (e.altKey && e.key === 'e') {
            e.preventDefault();
            exportAppData();
            showShortcutFeedback('Data Exported to Console');
        }

        // Alt + S to show stats
        if (e.altKey && e.key === 's') {
            e.preventDefault();
            showAppStats();
        }
    });
}

// Show visual feedback for keyboard shortcuts
function showShortcutFeedback(message) {
    let feedback = document.getElementById('shortcutFeedback');
    
    if (!feedback) {
        feedback = document.createElement('div');
        feedback.id = 'shortcutFeedback';
        feedback.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #667eea;
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            z-index: 1000;
            font-weight: bold;
            animation: slideInRight 0.3s ease;
        `;
        document.body.appendChild(feedback);
    }

    feedback.textContent = message;
    feedback.style.display = 'block';

    setTimeout(() => {
        feedback.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            feedback.style.display = 'none';
        }, 300);
    }, 2000);
}

// Add ripple effect to buttons
function addRippleEffect(button) {
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    
    ripple.style.cssText = `
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.6);
        width: ${size}px;
        height: ${size}px;
        left: ${event.clientX - rect.left - size / 2}px;
        top: ${event.clientY - rect.top - size / 2}px;
        animation: ripple 0.6s ease-out;
        pointer-events: none;
    `;
    
    button.style.position = 'relative';
    button.style.overflow = 'hidden';
    button.appendChild(ripple);
    
    setTimeout(() => ripple.remove(), 600);
}

// Clear completed todos
function clearCompletedTodos() {
    const completedCount = AppState.todos.filter(t => t.completed).length;
    if (completedCount === 0) {
        Utils.log('No completed todos to clear', 'info');
        return;
    }
    
    AppState.todos = AppState.todos.filter(t => !t.completed);
    TodoManager.render();
    Utils.log(`Cleared ${completedCount} completed todo(s)`, 'success');
}

// Export app data to console
function exportAppData() {
    const data = Utils.exportData();
    console.log('%c📦 EXPORTED DATA:', 'background: #48bb78; color: white; font-size: 14px; padding: 5px 10px; border-radius: 3px;');
    console.log(data);
    console.log('%cCopy the above JSON to save your data!', 'color: #667eea; font-weight: bold;');
}

// Show app statistics in a styled console output
function showAppStats() {
    const info = Utils.getAppInfo();
    console.log('%c📊 APP STATISTICS', 'background: #667eea; color: white; font-size: 16px; padding: 10px; border-radius: 5px;');
    console.table(info);
    
    showShortcutFeedback('Stats Shown in Console');
}

// Log application info periodically
function startAppMonitoring() {
    setInterval(() => {
        const info = Utils.getAppInfo();
        Utils.log(`App Status - Counter: ${info.counterValue}, Todos: ${info.totalTodos} (${info.completedTodos} completed)`, 'info');
    }, 60000); // Every 60 seconds
}

// Add welcome message with styled console output
function showWelcomeMessage() {
    console.clear();
    console.log('%c╔══════════════════════════════════════════════════════╗', 'color: #667eea');
    console.log('%c║     Welcome to JavaScript Frontend Project! 🚀      ║', 'color: #667eea; font-size: 16px; font-weight: bold');
    console.log('%c╚══════════════════════════════════════════════════════╝', 'color: #667eea');
    console.log('');
    console.log('%c⌨️  KEYBOARD SHORTCUTS:', 'background: #48bb78; color: white; font-size: 14px; padding: 5px; border-radius: 3px;');
    console.log('%cAlt + I', 'color: #667eea; font-weight: bold', '→ Increment Counter');
    console.log('%cAlt + D', 'color: #667eea; font-weight: bold', '→ Decrement Counter');
    console.log('%cAlt + R', 'color: #667eea; font-weight: bold', '→ Reset Counter');
    console.log('%cAlt + T', 'color: #667eea; font-weight: bold', '→ Focus Todo Input');
    console.log('%cAlt + C', 'color: #667eea; font-weight: bold', '→ Clear Completed Todos');
    console.log('%cAlt + A', 'color: #667eea; font-weight: bold', '→ Clear All Todos');
    console.log('%cAlt + E', 'color: #667eea; font-weight: bold', '→ Export Data');
    console.log('%cAlt + S', 'color: #667eea; font-weight: bold', '→ Show Statistics');
    console.log('');
    console.log('%c🔧 DEVELOPER API:', 'background: #764ba2; color: white; font-size: 14px; padding: 5px; border-radius: 3px;');
    console.log('%cwindow.AppAPI', 'color: #667eea; font-weight: bold', '→ Access application API');
    console.log('%cwindow.AppAPI.getInfo()', 'color: #667eea; font-weight: bold', '→ Get app information');
    console.log('%cwindow.AppAPI.utils.exportData()', 'color: #667eea; font-weight: bold', '→ Export app data');
    console.log('');
    console.log('%c✨ Enjoy your experience!', 'color: #48bb78; font-size: 12px; font-style: italic');
}

// Add CSS animations
const animationStyles = document.createElement('style');
animationStyles.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    @keyframes ripple {
        from {
            transform: scale(0);
            opacity: 1;
        }
        to {
            transform: scale(2);
            opacity: 0;
        }
    }
`;
document.head.appendChild(animationStyles);

console.log('main.js loaded successfully! ⚡');
