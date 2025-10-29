
// index.js - Application Entry Point and Initialization

// Main initialization function
function initializeApp() {
    console.log('Initializing JavaScript Frontend Application...');

    // Setup all event listeners
    setupCounterEvents();
    setupTodoEvents();
    setupKeyboardShortcuts();

    // Initialize counter display
    Counter.updateDisplay();

    // Initialize todo list
    TodoManager.render();

    // Start the clock
    Clock.start();

    // Initialize animations
    initAnimations();

    // Show welcome message
    showWelcomeMessage();

    // Start app monitoring
    startAppMonitoring();

    console.log('Application initialized successfully! ✅');
}

// Wait for DOM to be fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    // DOM is already loaded
    initializeApp();
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    Clock.stop();
    console.log('Application cleanup completed');
});

// Handle visibility change (pause clock when tab is hidden)
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        Clock.stop();
        console.log('Clock paused (tab hidden)');
    } else {
        Clock.start();
        console.log('Clock resumed (tab visible)');
    }
});

// Expose API for debugging in console
window.AppAPI = {
    getState: () => AppState,
    getInfo: () => Utils.getAppInfo(),
    counter: Counter,
    todos: TodoManager,
    clock: Clock,
    utils: Utils
};

console.log('index.js loaded successfully!');
console.log('Access app via: window.AppAPI');
