// ===== DATOS DE DEMOSTRACIÓN =====
// Este archivo contiene funciones para cargar datos de ejemplo en la aplicación

const DemoData = {
    // Generar datos de ejemplo
    generateDemoData() {
        // Usuarios de ejemplo
        const demoUsers = [
            {
                id: 'demo_user_1',
                name: 'Juan Pérez',
                email: 'demo@example.com',
                password: '123456',
                createdAt: '2024-01-01T00:00:00.000Z'
            }
        ];

        // Clientes de ejemplo
        const demoClients = [
            {
                id: 'client_1',
                name: 'María García',
                email: 'maria.garcia@email.com',
                phone: '+1 234 567 8901',
                address: 'Calle Principal 123, Ciudad',
                createdAt: '2024-01-15T00:00:00.000Z'
            },
            {
                id: 'client_2',
                name: 'Carlos López',
                email: 'carlos.lopez@email.com',
                phone: '+1 234 567 8902',
                address: 'Avenida Central 456, Ciudad',
                createdAt: '2024-01-20T00:00:00.000Z'
            },
            {
                id: 'client_3',
                name: 'Ana Rodríguez',
                email: 'ana.rodriguez@email.com',
                phone: '+1 234 567 8903',
                address: 'Boulevard Norte 789, Ciudad',
                createdAt: '2024-02-01T00:00:00.000Z'
            },
            {
                id: 'client_4',
                name: 'Luis Martínez',
                email: 'luis.martinez@email.com',
                phone: '+1 234 567 8904',
                address: 'Plaza Mayor 321, Ciudad',
                createdAt: '2024-02-05T00:00:00.000Z'
            },
            {
                id: 'client_5',
                name: 'Carmen Fernández',
                email: 'carmen.fernandez@email.com',
                phone: '+1 234 567 8905',
                address: 'Río Grande 654, Ciudad',
                createdAt: '2024-02-10T00:00:00.000Z'
            }
        ];

        // Cobros de ejemplo (últimos 30 días)
        const demoCollections = [];
        const today = new Date();
        
        // Generar cobros para los últimos 30 días
        for (let i = 0; i < 30; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            // Generar entre 0-3 cobros por día
            const numCollections = Math.floor(Math.random() * 4);
            
            for (let j = 0; j < numCollections; j++) {
                const client = demoClients[Math.floor(Math.random() * demoClients.length)];
                const amount = (Math.random() * 500 + 50).toFixed(2); // Entre $50 y $550
                
                demoCollections.push({
                    id: `collection_${i}_${j}`,
                    clientId: client.id,
                    amount: parseFloat(amount),
                    date: dateStr,
                    description: this.getRandomDescription(),
                    time: this.getRandomTime(),
                    createdAt: date.toISOString()
                });
            }
        }

        return {
            users: demoUsers,
            clients: demoClients,
            collections: demoCollections
        };
    },

    // Generar descripción aleatoria
    getRandomDescription() {
        const descriptions = [
            'Pago de cuota semanal',
            'Abono préstamo personal',
            'Venta productos',
            'Servicio técnico',
            'Consultoría',
            'Pago mensual',
            'Comisión ventas',
            'Mantenimiento equipo',
            'Capacitación',
            'Pago parcial'
        ];
        return descriptions[Math.floor(Math.random() * descriptions.length)];
    },

    // Generar hora aleatoria entre 8 AM y 8 PM
    getRandomTime() {
        const hour = Math.floor(Math.random() * 12) + 8; // 8-20
        const minute = Math.floor(Math.random() * 60);
        return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    },

    // Cargar datos de demostración
    loadDemoData() {
        const demoData = this.generateDemoData();
        
        // Guardar en localStorage
        localStorage.setItem('users', JSON.stringify(demoData.users));
        localStorage.setItem('clients_demo_user_1', JSON.stringify(demoData.clients));
        localStorage.setItem('collections_demo_user_1', JSON.stringify(demoData.collections));
        
        console.log('Datos de demostración cargados exitosamente');
        console.log('Credenciales de acceso:');
        console.log('Email: demo@example.com');
        console.log('Contraseña: 123456');
    },

    // Limpiar datos de demostración
    clearDemoData() {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.includes('demo_user_1') || key === 'users')) {
                keysToRemove.push(key);
            }
        }
        
        keysToRemove.forEach(key => localStorage.removeItem(key));
        console.log('Datos de demostración eliminados');
    },

    // Verificar si los datos de demostración están cargados
    isDemoDataLoaded() {
        const demoClients = localStorage.getItem('clients_demo_user_1');
        const demoCollections = localStorage.getItem('collections_demo_user_1');
        return !!(demoClients && demoCollections);
    },

    // Función para ejecutar desde la consola del navegador
    initDemo() {
        console.log('Cargando datos de demostración...');
        this.loadDemoData();
        alert('Datos de demostración cargados. Usa estas credenciales para acceder:\n\nEmail: demo@example.com\nContraseña: 123456');
        
        // Recargar la página
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    },

    // Función para limpiar desde la consola del navegador
    clearDemo() {
        console.log('Eliminando datos de demostración...');
        this.clearDemoData();
        alert('Datos de demostración eliminados.');
        
        // Recargar la página
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    }
};

// Hacer las funciones disponibles globalmente
window.DemoData = DemoData;

// Instrucciones para usar en la consola del navegador
console.log('%c💰 Datos de Demostración - Sistema de Cobro Diario', 'color: #0D6EFD; font-size: 16px; font-weight: bold;');
console.log('%cPara cargar datos de demostración, ejecuta:', 'color: #198754; font-weight: bold;');
console.log('%cDemoData.initDemo()', 'color: #0D6EFD; font-weight: bold; background: #f0f8ff; padding: 2px 4px;');
console.log('');
console.log('%cPara eliminar datos de demostración, ejecuta:', 'color: #DC3545; font-weight: bold;');
console.log('%cDemoData.clearDemo()', 'color: #DC3545; font-weight: bold; background: #ffe6e6; padding: 2px 4px;');
console.log('');
console.log('%cCredenciales de acceso:', 'color: #FFC107; font-weight: bold;');
console.log('%cEmail: demo@example.com', 'color: #212529; background: #fff3cd; padding: 2px 4px;');
console.log('%cContraseña: 123456', 'color: #212529; background: #fff3cd; padding: 2px 4px;');