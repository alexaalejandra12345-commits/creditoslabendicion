// ===== APLICACIÓN PRINCIPAL DE COBRO DIARIO =====

class CobroApp {
    constructor() {
        this.currentUser = null;
        this.clients = [];
        this.collections = [];
        this.currentPage = 'dashboard';
        
        // NO inicializar automáticamente
    }

    // Inicializar aplicación manualmente
    init() {
        try {
            // Verificar autenticación
            if (!checkAuthentication()) {
                return false;
            }

            // Cargar usuario actual
            this.currentUser = authSystem.getCurrentUser();
            
            // Cargar datos
            this.loadData();
            
            // Configurar eventos
            this.setupEventListeners();
            
            // Mostrar página inicial
            this.showPage('dashboard');
            
            // Inicializar fecha actual
            this.setCurrentDate();
            
            return true;
        } catch (error) {
            console.error('Error inicializando CobroApp:', error);
            return false;
        }
    }

    // Cargar datos desde localStorage
    loadData() {
        const userId = this.currentUser.id;
        this.clients = this.getStorageData(`clients_${userId}`, []);
        this.collections = this.getStorageData(`collections_${userId}`, []);
    }

    // Obtener datos de localStorage con valor por defecto
    getStorageData(key, defaultValue) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    }

    // Guardar datos en localStorage
    saveData(key, data) {
        const userId = this.currentUser.id;
        localStorage.setItem(`${key}_${userId}`, JSON.stringify(data));
    }

    // Configurar event listeners
    setupEventListeners() {
        // Navegación
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = e.currentTarget.dataset.page;
                this.showPage(page);
            });
        });

        // Formularios
        document.getElementById('collectionForm')?.addEventListener('submit', (e) => {
            this.handleCollectionSubmit(e);
        });

        document.getElementById('clientForm')?.addEventListener('submit', (e) => {
            this.handleClientSubmit(e);
        });

        document.getElementById('reportFilterForm')?.addEventListener('submit', (e) => {
            this.handleReportFilter(e);
        });

        // Notificaciones
        document.querySelector('.notification-close')?.addEventListener('click', () => {
            authSystem.hideNotification();
        });

        // Cargar clientes en select de cobros
        this.updateClientSelect();
    }

    // Mostrar página específica
    showPage(pageName) {
        // Ocultar todas las páginas
        document.querySelectorAll('.page-content').forEach(page => {
            page.style.display = 'none';
        });

        // Mostrar página solicitada
        document.getElementById(`${pageName}-page`).style.display = 'block';

        // Actualizar navegación
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-page="${pageName}"]`).classList.add('active');

        // Actualizar título
        const titles = {
            dashboard: 'Dashboard',
            clients: 'Gestión de Clientes',
            collections: 'Registro de Cobros',
            reports: 'Reportes y Estadísticas'
        };
        document.querySelector('.page-title').textContent = titles[pageName];

        // Cargar contenido específico de la página
        this.loadPageContent(pageName);
        
        this.currentPage = pageName;
    }

    // Cargar contenido específico de cada página
    loadPageContent(pageName) {
        switch(pageName) {
            case 'dashboard':
                this.updateDashboard();
                break;
            case 'clients':
                this.updateClientsTable();
                break;
            case 'collections':
                this.updateCollectionsTable();
                this.updateClientSelect();
                break;
            case 'reports':
                this.setDefaultReportDates();
                break;
        }
    }

    // Establecer fecha actual en formularios
    setCurrentDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('collectionDate').value = today;
    }

    // ===== DASHBOARD =====
    updateDashboard() {
        this.updateDashboardStats();
        this.updateRecentActivity();
    }

    updateDashboardStats() {
        const today = new Date().toISOString().split('T')[0];
        const thisMonth = new Date().toISOString().substring(0, 7);

        // Ventas de hoy
        const todaySales = this.collections
            .filter(c => c.date === today)
            .reduce((sum, c) => sum + parseFloat(c.amount), 0);

        // Cobros del mes
        const monthlyCollections = this.collections
            .filter(c => c.date.startsWith(thisMonth))
            .reduce((sum, c) => sum + parseFloat(c.amount), 0);

        // Total clientes
        const totalClients = this.clients.length;

        // Promedio diario
        const daysInMonth = new Date().getDate();
        const dailyAverage = daysInMonth > 0 ? monthlyCollections / daysInMonth : 0;

        // Actualizar UI
        document.getElementById('todaySales').textContent = `$${todaySales.toFixed(2)}`;
        document.getElementById('monthlyCollections').textContent = `$${monthlyCollections.toFixed(2)}`;
        document.getElementById('totalClients').textContent = totalClients;
        document.getElementById('dailyAverage').textContent = `$${dailyAverage.toFixed(2)}`;
    }

    updateRecentActivity() {
        const recent = this.collections
            .sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time))
            .slice(0, 5);

        const tbody = document.getElementById('recentActivity');
        
        if (recent.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; color: var(--neutral-500);">
                        No hay actividad reciente
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = recent.map(collection => {
            const client = this.clients.find(c => c.id === collection.clientId);
            const clientName = client ? client.name : 'Cliente eliminado';
            
            return `
                <tr>
                    <td>${clientName}</td>
                    <td>$${parseFloat(collection.amount).toFixed(2)}</td>
                    <td>${this.formatDate(collection.date)}</td>
                    <td>${collection.time || 'N/A'}</td>
                </tr>
            `;
        }).join('');
    }

    // ===== GESTIÓN DE CLIENTES =====
    // Manejar submit de formulario de cliente
    handleClientSubmit(e) {
        e.preventDefault();
        
        if (!this.currentUser) {
            console.error('Usuario no autenticado');
            return;
        }
        
        const formData = new FormData(e.target);
        const clientData = {
            id: document.getElementById('clientId').value || this.generateId(),
            name: formData.get('clientName') || document.getElementById('clientName').value,
            email: formData.get('clientEmail') || document.getElementById('clientEmail').value,
            phone: formData.get('clientPhone') || document.getElementById('clientPhone').value,
            address: formData.get('clientAddress') || document.getElementById('clientAddress').value,
            createdAt: new Date().toISOString()
        };

        const isEdit = !!document.getElementById('clientId').value;

        if (isEdit) {
            const index = this.clients.findIndex(c => c.id === clientData.id);
            if (index !== -1) {
                this.clients[index] = clientData;
                authSystem.showNotification('Cliente actualizado exitosamente', 'success');
            }
        } else {
            this.clients.push(clientData);
            authSystem.showNotification('Cliente registrado exitosamente', 'success');
        }

        this.saveData('clients', this.clients);
        this.updateClientsTable();
        this.updateClientSelect();
        closeClientModal();
    }

    updateClientsTable() {
        const tbody = document.getElementById('clientsTable');
        
        if (this.clients.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: var(--neutral-500);">
                        No hay clientes registrados
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.clients.map(client => {
            const clientCollections = this.collections.filter(c => c.clientId === client.id);
            const totalCollected = clientCollections.reduce((sum, c) => sum + parseFloat(c.amount), 0);
            const lastCollection = clientCollections.sort((a, b) => 
                new Date(b.date) - new Date(a.date)
            )[0];

            return `
                <tr>
                    <td>${client.name}</td>
                    <td>${client.email}</td>
                    <td>${client.phone}</td>
                    <td>$${totalCollected.toFixed(2)}</td>
                    <td>${lastCollection ? this.formatDate(lastCollection.date) : 'N/A'}</td>
                    <td>
                        <button onclick="editClient('${client.id}')" style="margin-right: 8px;">✏️</button>
                        <button onclick="deleteClient('${client.id}')" style="color: var(--error);">🗑️</button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    updateClientSelect() {
        const select = document.getElementById('collectionClient');
        if (!select) return;

        select.innerHTML = '<option value="">Seleccionar cliente</option>';
        
        this.clients.forEach(client => {
            const option = document.createElement('option');
            option.value = client.id;
            option.textContent = client.name;
            select.appendChild(option);
        });
    }

    // ===== GESTIÓN DE COBROS =====
    // Manejar submit de formulario de cobro
    handleCollectionSubmit(e) {
        e.preventDefault();
        
        if (!this.currentUser) {
            console.error('Usuario no autenticado');
            return;
        }
        
        const formData = new FormData(e.target);
        const collectionData = {
            id: this.generateId(),
            clientId: formData.get('collectionClient') || document.getElementById('collectionClient').value,
            amount: parseFloat(formData.get('collectionAmount') || document.getElementById('collectionAmount').value),
            date: formData.get('collectionDate') || document.getElementById('collectionDate').value,
            description: formData.get('collectionDescription') || document.getElementById('collectionDescription').value,
            time: new Date().toLocaleTimeString(),
            createdAt: new Date().toISOString()
        };

        this.collections.push(collectionData);
        this.saveData('collections', this.collections);

        // Limpiar formulario
        document.getElementById('collectionForm').reset();
        this.setCurrentDate();

        authSystem.showNotification('Cobro registrado exitosamente', 'success');
        
        this.updateCollectionsTable();
        this.updateDashboard();
    }

    updateCollectionsTable() {
        const tbody = document.getElementById('collectionsTable');
        
        if (this.collections.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; color: var(--neutral-500);">
                        No hay cobros registrados
                    </td>
                </tr>
            `;
            return;
        }

        const sortedCollections = this.collections.sort((a, b) => 
            new Date(b.date + ' ' + (b.time || '00:00:00')) - new Date(a.date + ' ' + (a.time || '00:00:00'))
        );

        tbody.innerHTML = sortedCollections.map(collection => {
            const client = this.clients.find(c => c.id === collection.clientId);
            const clientName = client ? client.name : 'Cliente eliminado';
            
            return `
                <tr>
                    <td>${clientName}</td>
                    <td>$${parseFloat(collection.amount).toFixed(2)}</td>
                    <td>${this.formatDate(collection.date)}</td>
                    <td>${collection.description || '-'}</td>
                    <td>
                        <button onclick="deleteCollection('${collection.id}')" style="color: var(--error);">🗑️</button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // ===== REPORTES =====
    setDefaultReportDates() {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        
        document.getElementById('reportFrom').value = firstDay.toISOString().split('T')[0];
        document.getElementById('reportTo').value = today.toISOString().split('T')[0];
    }

    handleReportFilter(e) {
        e.preventDefault();
        
        const fromDate = document.getElementById('reportFrom').value;
        const toDate = document.getElementById('reportTo').value;

        if (!fromDate || !toDate) {
            authSystem.showNotification('Por favor selecciona un rango de fechas válido', 'error');
            return;
        }

        if (new Date(fromDate) > new Date(toDate)) {
            authSystem.showNotification('La fecha de inicio debe ser anterior a la fecha final', 'error');
            return;
        }

        this.generateReport(fromDate, toDate);
    }

    generateReport(fromDate, toDate) {
        const filteredCollections = this.collections.filter(collection => {
            return collection.date >= fromDate && collection.date <= toDate;
        });

        // Calcular estadísticas
        const total = filteredCollections.reduce((sum, c) => sum + parseFloat(c.amount), 0);
        const count = filteredCollections.length;
        const average = count > 0 ? total / count : 0;

        // Encontrar mejor día
        const dailyTotals = {};
        filteredCollections.forEach(collection => {
            dailyTotals[collection.date] = (dailyTotals[collection.date] || 0) + parseFloat(collection.amount);
        });
        
        const bestDay = Object.keys(dailyTotals).reduce((a, b) => 
            dailyTotals[a] > dailyTotals[b] ? a : b, '-'
        );

        // Actualizar UI
        document.getElementById('reportTotal').textContent = `$${total.toFixed(2)}`;
        document.getElementById('reportCount').textContent = count;
        document.getElementById('reportAverage').textContent = `$${average.toFixed(2)}`;
        document.getElementById('reportBestDay').textContent = bestDay !== '-' ? this.formatDate(bestDay) : '-';

        // Actualizar tabla
        const tbody = document.getElementById('reportTable');
        
        if (filteredCollections.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; color: var(--neutral-500);">
                        No hay cobros en el rango de fechas seleccionado
                    </td>
                </tr>
            `;
            return;
        }

        const sortedCollections = filteredCollections.sort((a, b) => 
            new Date(b.date) - new Date(a.date)
        );

        tbody.innerHTML = sortedCollections.map(collection => {
            const client = this.clients.find(c => c.id === collection.clientId);
            const clientName = client ? client.name : 'Cliente eliminado';
            
            return `
                <tr>
                    <td>${this.formatDate(collection.date)}</td>
                    <td>${clientName}</td>
                    <td>$${parseFloat(collection.amount).toFixed(2)}</td>
                    <td>${collection.description || '-'}</td>
                </tr>
            `;
        }).join('');
    }

    // ===== FUNCIONES AUXILIARES =====
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES');
    }

    // ===== ACCIONES DE CLIENTES =====
    editClient(clientId) {
        const client = this.clients.find(c => c.id === clientId);
        if (!client) return;

        document.getElementById('clientId').value = client.id;
        document.getElementById('clientName').value = client.name;
        document.getElementById('clientEmail').value = client.email;
        document.getElementById('clientPhone').value = client.phone;
        document.getElementById('clientAddress').value = client.address || '';
        
        document.getElementById('clientModalTitle').textContent = 'Editar Cliente';
        document.getElementById('clientModal').style.display = 'flex';
    }

    deleteClient(clientId) {
        if (!confirm('¿Estás seguro de que deseas eliminar este cliente?')) {
            return;
        }

        // Verificar si tiene cobros asociados
        const hasCollections = this.collections.some(c => c.clientId === clientId);
        if (hasCollections) {
            if (!confirm('Este cliente tiene cobros asociados. ¿Continuar con la eliminación?')) {
                return;
            }
        }

        this.clients = this.clients.filter(c => c.id !== clientId);
        this.saveData('clients', this.clients);
        
        authSystem.showNotification('Cliente eliminado exitosamente', 'success');
        this.updateClientsTable();
        this.updateClientSelect();
    }

    deleteCollection(collectionId) {
        if (!confirm('¿Estás seguro de que deseas eliminar este cobro?')) {
            return;
        }

        this.collections = this.collections.filter(c => c.id !== collectionId);
        this.saveData('collections', this.collections);
        
        authSystem.showNotification('Cobro eliminado exitosamente', 'success');
        this.updateCollectionsTable();
        this.updateDashboard();
    }
}

// ===== FUNCIONES GLOBALES PARA HTML =====
function openClientModal() {
    if (typeof window.cobroApp !== 'undefined' && window.cobroApp) {
        document.getElementById('clientId').value = '';
        document.getElementById('clientForm').reset();
        document.getElementById('clientModalTitle').textContent = 'Nuevo Cliente';
        document.getElementById('clientModal').style.display = 'flex';
    }
}

function closeClientModal() {
    const modal = document.getElementById('clientModal');
    if (modal) {
        modal.style.display = 'none';
        document.getElementById('clientForm').reset();
    }
}

function editClient(clientId) {
    if (typeof window.cobroApp !== 'undefined' && window.cobroApp) {
        window.cobroApp.editClient(clientId);
    }
}

function deleteClient(clientId) {
    if (typeof window.cobroApp !== 'undefined' && window.cobroApp) {
        window.cobroApp.deleteClient(clientId);
    }
}

function deleteCollection(collectionId) {
    if (typeof window.cobroApp !== 'undefined' && window.cobroApp) {
        window.cobroApp.deleteCollection(collectionId);
    }
}

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop();
    
    // Solo inicializar si estamos en app.html y la página está cargada
    if (currentPage === 'app.html' && document.getElementById('dashboard-page')) {
        // Esperar un poco para asegurar que el DOM esté completamente cargado
        setTimeout(() => {
            if (typeof window.cobroApp === 'undefined') {
                try {
                    window.cobroApp = new CobroApp();
                    window.cobroApp.init();
                } catch (error) {
                    console.error('Error al inicializar la aplicación:', error);
                }
            }
        }, 200);
    }
});

// Hacer global la función de logout
window.logout = function() {
    if (typeof authSystem !== 'undefined' && authSystem) {
        authSystem.logout();
    }
};

// Cerrar modal al hacer clic fuera
window.addEventListener('click', (e) => {
    const modal = document.getElementById('clientModal');
    if (e.target === modal) {
        closeClientModal();
    }
});