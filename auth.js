// ===== SISTEMA DE AUTENTICACIÓN =====

class AuthSystem {
    constructor() {
        try {
            this.currentUser = null;
            this.users = this.loadUsers();
            this.init();
        } catch (error) {
            console.error('Error inicializando AuthSystem:', error);
        }
    }

    // Inicializar el sistema
    init() {
        try {
            // Verificar si el DOM está disponible
            if (!document.body) {
                console.log('DOM no está listo, postponiendo inicialización');
                setTimeout(() => this.init(), 100);
                return;
            }

            // Verificar si hay una sesión activa
            const savedUser = localStorage.getItem('currentUser');
            const currentPage = window.location.pathname.split('/').pop();
            
            // Solo redirigir si estamos en la página de login y hay una sesión
            if (savedUser && (currentPage === 'index.html' || currentPage === '')) {
                this.currentUser = JSON.parse(savedUser);
                this.redirectToDashboard();
                return; // No continuar con la inicialización si redirigimos
            }

            // Configurar eventos solo si no redirigimos
            this.setupEventListeners();
        } catch (error) {
            console.error('Error en init de AuthSystem:', error);
        }
    }

    // Configurar event listeners
    setupEventListeners() {
        // Formulario de login
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Formulario de registro
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }

        // Toggle entre login y registro
        const showRegister = document.getElementById('showRegister');
        if (showRegister) {
            showRegister.addEventListener('click', (e) => {
                e.preventDefault();
                this.showRegisterForm();
            });
        }

        const cancelRegister = document.getElementById('cancelRegister');
        if (cancelRegister) {
            cancelRegister.addEventListener('click', () => {
                this.hideRegisterForm();
            });
        }

        // Cerrar notificación
        const notificationClose = document.querySelector('.notification-close');
        if (notificationClose) {
            notificationClose.addEventListener('click', () => {
                this.hideNotification();
            });
        }
    }

    // Cargar usuarios desde localStorage
    loadUsers() {
        const users = localStorage.getItem('users');
        return users ? JSON.parse(users) : [];
    }

    // Guardar usuarios en localStorage
    saveUsers() {
        localStorage.setItem('users', JSON.stringify(this.users));
    }

    // Manejar login
    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        // Validaciones
        if (!email || !password) {
            this.showNotification('Por favor completa todos los campos', 'error');
            return;
        }

        if (!this.isValidEmail(email)) {
            this.showNotification('Por favor ingresa un email válido', 'error');
            return;
        }

        // Buscar usuario
        const user = this.users.find(u => u.email === email && u.password === password);
        
        if (user) {
            this.currentUser = {
                id: user.id,
                name: user.name,
                email: user.email,
                loginTime: new Date().toISOString()
            };

            // Guardar sesión
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            
            this.showNotification('¡Bienvenido! Iniciando sesión...', 'success');
            
            // Redirigir después de un breve delay
            setTimeout(() => {
                this.redirectToDashboard();
            }, 1000);
        } else {
            this.showNotification('Email o contraseña incorrectos', 'error');
        }
    }

    // Manejar registro
    async handleRegister(e) {
        e.preventDefault();
        
        const name = document.getElementById('regName').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const password = document.getElementById('regPassword').value;
        const confirmPassword = document.getElementById('regConfirmPassword').value;

        // Validaciones
        if (!name || !email || !password || !confirmPassword) {
            this.showNotification('Por favor completa todos los campos', 'error');
            return;
        }

        if (!this.isValidEmail(email)) {
            this.showNotification('Por favor ingresa un email válido', 'error');
            return;
        }

        if (password.length < 6) {
            this.showNotification('La contraseña debe tener al menos 6 caracteres', 'error');
            return;
        }

        if (password !== confirmPassword) {
            this.showNotification('Las contraseñas no coinciden', 'error');
            return;
        }

        // Verificar si el email ya existe
        if (this.users.find(u => u.email === email)) {
            this.showNotification('Este email ya está registrado', 'error');
            return;
        }

        // Crear nuevo usuario
        const newUser = {
            id: this.generateId(),
            name: name,
            email: email,
            password: password, // En producción usar hash
            createdAt: new Date().toISOString()
        };

        this.users.push(newUser);
        this.saveUsers();

        this.showNotification('¡Cuenta creada exitosamente!', 'success');
        
        // Limpiar formulario y volver al login
        setTimeout(() => {
            this.clearRegisterForm();
            this.hideRegisterForm();
        }, 1500);
    }

    // Validar email
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Generar ID único
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Mostrar formulario de registro
    showRegisterForm() {
        document.getElementById('registerSection').style.display = 'block';
        document.querySelector('.login-header p').textContent = 'Crea tu cuenta nueva';
    }

    // Ocultar formulario de registro
    hideRegisterForm() {
        document.getElementById('registerSection').style.display = 'none';
        document.querySelector('.login-header p').textContent = 'Inicia sesión en tu cuenta';
        this.clearRegisterForm();
    }

    // Limpiar formulario de registro
    clearRegisterForm() {
        document.getElementById('regName').value = '';
        document.getElementById('regEmail').value = '';
        document.getElementById('regPassword').value = '';
        document.getElementById('regConfirmPassword').value = '';
    }

    // Redirigir al dashboard
    redirectToDashboard() {
        window.location.href = 'app.html';
    }

    // Cerrar sesión
    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }

    // Verificar si el usuario está autenticado
    isAuthenticated() {
        const savedUser = localStorage.getItem('currentUser');
        return savedUser !== null;
    }

    // Obtener usuario actual
    getCurrentUser() {
        const savedUser = localStorage.getItem('currentUser');
        return savedUser ? JSON.parse(savedUser) : null;
    }

    // Mostrar notificación
    showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        const messageEl = document.getElementById('notificationMessage');
        
        if (notification && messageEl) {
            messageEl.textContent = message;
            notification.className = `notification ${type}`;
            notification.style.display = 'flex';
            
            // Auto-hide después de 5 segundos
            setTimeout(() => {
                this.hideNotification();
            }, 5000);
        }
    }

    // Ocultar notificación
    hideNotification() {
        const notification = document.getElementById('notification');
        if (notification) {
            notification.style.display = 'none';
        }
    }
}

// ===== VERIFICACIÓN DE AUTENTICACIÓN EN DASHBOARD =====
function checkAuthentication() {
    const savedUser = localStorage.getItem('currentUser');
    if (!savedUser) {
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

// ===== INICIALIZACIÓN CONTROLADA =====
document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop();
    
    // Solo inicializar la aplicación si estamos en app.html
    if (currentPage === 'app.html') {
        // Verificar autenticación antes de inicializar la app
        if (!checkAuthentication()) {
            return;
        }
        
        // Inicializar la aplicación después de un pequeño delay
        setTimeout(() => {
            if (typeof CobroApp !== 'undefined') {
                window.cobroApp = new CobroApp();
                window.cobroApp.init();
            }
        }, 100);
    }
});

// Inicializar sistema de autenticación solo en la página de login
document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop();
    if (currentPage === 'index.html' || currentPage === '') {
        const authSystem = new AuthSystem();
    }
});