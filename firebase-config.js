// =============================================
// FIREBASE CONFIGURATION
// Sistema de Gestão de Jornada de Motoristas
// =============================================

// ⚠️ ATENÇÃO: Substitua os valores abaixo pelas credenciais do seu projeto Firebase.
// Nunca commite credenciais reais em repositórios públicos.
// Use variáveis de ambiente ou um arquivo .env (não versionado).

const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "your-project.firebaseapp.com",
    databaseURL: "https://your-project-default-rtdb.firebaseio.com",
    projectId: "your-project-id",
    storageBucket: "your-project.firebasestorage.app",
    messagingSenderId: "000000000000",
    appId: "1:000000000000:web:0000000000000000000000"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Reference to the database
const database = firebase.database();

// Reference to Auth (if available)
let auth;
let googleProvider;

if (firebase.auth) {
    auth = firebase.auth();
    googleProvider = new firebase.auth.GoogleAuthProvider();
}

// =============================================
// DATABASE REFERENCES
// =============================================
const driversRef = database.ref('drivers');
const trainingRecordsRef = database.ref('trainingRecords');
const configRef = database.ref('config');

// =============================================
// FIREBASE HELPER FUNCTIONS
// =============================================

/**
 * Inicializar banco de dados (Deprecated/Removido)
 * Dados migrados e mantidos apenas no Firebase.
 */
async function initializeDatabase() {
    // Função mantida vazia para compatibilidade.
}

/**
 * Buscar motorista por CPF
 */
async function firebaseFindDriverByCPF(cpf) {
    const cleanCPF = cpf.replace(/\D/g, '');
    try {
        const snapshot = await driversRef.orderByChild('cpf').equalTo(cleanCPF).once('value');
        if (snapshot.exists()) {
            const data = snapshot.val();
            const key = Object.keys(data)[0];
            return { ...data[key], firebaseKey: key };
        }
        return null;
    } catch (error) {
        console.error('Erro ao buscar motorista:', error);
        return null;
    }
}

/**
 * Buscar motorista por Nome
 */
async function firebaseFindDriverByName(name) {
    if (!name) return null;
    const cleanName = name.trim().toUpperCase();
    try {
        const snapshot = await driversRef.orderByChild('nome').equalTo(cleanName).once('value');
        if (snapshot.exists()) {
            const data = snapshot.val();
            const key = Object.keys(data)[0];
            return { ...data[key], firebaseKey: key };
        }
        return null;
    } catch (error) {
        console.error('Erro ao buscar motorista por nome:', error);
        return null;
    }
}

/**
 * Buscar todos os motoristas de uma empresa
 */
async function firebaseGetDriversByCompany(company) {
    try {
        const snapshot = await driversRef.orderByChild('empresa').equalTo(company).once('value');
        if (snapshot.exists()) {
            const data = snapshot.val();
            return Object.entries(data).map(([key, value]) => ({ ...value, firebaseKey: key }));
        }
        return [];
    } catch (error) {
        console.error('Erro ao buscar motoristas:', error);
        return [];
    }
}

/**
 * Buscar todos os motoristas
 */
async function firebaseGetAllDrivers() {
    try {
        const snapshot = await driversRef.once('value');
        if (snapshot.exists()) {
            const data = snapshot.val();
            return Object.entries(data).map(([key, value]) => ({ ...value, firebaseKey: key }));
        }
        return [];
    } catch (error) {
        console.error('Erro ao buscar motoristas:', error);
        return [];
    }
}

/**
 * Adicionar novo motorista
 */
async function firebaseAddDriver(driver) {
    try {
        const snapshot = await driversRef.once('value');
        const existingDrivers = snapshot.val() || {};
        const maxId = Object.values(existingDrivers).reduce((max, d) => Math.max(max, d.id || 0), 0);

        const newDriver = {
            ...driver,
            id: maxId + 1,
            cpf: driver.cpf.replace(/\D/g, ''),
            ativo: true
        };

        await driversRef.child(newDriver.id.toString()).set(newDriver);
        console.log('✅ Motorista adicionado:', newDriver.nome);
        return newDriver;
    } catch (error) {
        console.error('Erro ao adicionar motorista:', error);
        return null;
    }
}

/**
 * Atualizar motorista
 */
async function firebaseUpdateDriver(id, updates) {
    try {
        await driversRef.child(id.toString()).update(updates);
        console.log('✅ Motorista atualizado:', id);
        return true;
    } catch (error) {
        console.error('Erro ao atualizar motorista:', error);
        return false;
    }
}

/**
 * Excluir motorista
 */
async function firebaseDeleteDriver(id) {
    try {
        await driversRef.child(id.toString()).remove();
        const driver = await driversRef.child(id.toString()).once('value');
        if (driver.exists()) {
            const cpf = driver.val().cpf;
            await trainingRecordsRef.child(cpf).remove();
        }
        console.log('✅ Motorista excluído:', id);
        return true;
    } catch (error) {
        console.error('Erro ao excluir motorista:', error);
        return false;
    }
}

/**
 * Alternar status ativo/inativo
 */
async function firebaseToggleDriverActive(id) {
    try {
        const snapshot = await driversRef.child(id.toString()).once('value');
        if (snapshot.exists()) {
            const driver = snapshot.val();
            const newStatus = driver.ativo === false ? true : false;
            await driversRef.child(id.toString()).update({ ativo: newStatus });
            return { ...driver, ativo: newStatus };
        }
        return null;
    } catch (error) {
        console.error('Erro ao alternar status:', error);
        return null;
    }
}

/**
 * Registrar conclusão de treinamento
 */
async function firebaseAddTrainingRecord(record) {
    try {
        const cleanCPF = record.cpf ? record.cpf.replace(/\D/g, '') : '';
        if (!cleanCPF) return null;

        const trainingData = {
            ...record,
            cpf: cleanCPF,
            dataConclusao: new Date().toISOString()
        };

        await trainingRecordsRef.child(cleanCPF).set(trainingData);
        console.log('✅ Treinamento registrado para CPF:', cleanCPF);
        return trainingData;
    } catch (error) {
        console.error('Erro ao registrar treinamento:', error);
        return null;
    }
}

/**
 * Resetar/Excluir registro de treinamento por CPF
 */
async function firebaseResetTrainingRecord(cpf) {
    try {
        const cleanCPF = cpf.replace(/\D/g, '');
        await trainingRecordsRef.child(cleanCPF).remove();
        console.log('✅ Treinamento resetado para CPF:', cleanCPF);
        return true;
    } catch (error) {
        console.error('Erro ao resetar treinamento:', error);
        return false;
    }
}

/**
 * Buscar registro de treinamento por CPF
 */
async function firebaseGetTrainingRecord(cpf) {
    try {
        const cleanCPF = cpf.replace(/\D/g, '');
        const snapshot = await trainingRecordsRef.child(cleanCPF).once('value');
        return snapshot.exists() ? snapshot.val() : null;
    } catch (error) {
        console.error('Erro ao buscar treinamento:', error);
        return null;
    }
}

/**
 * Buscar todos os registros de treinamento
 */
async function firebaseGetAllTrainingRecords() {
    try {
        const snapshot = await trainingRecordsRef.once('value');
        if (snapshot.exists()) {
            const data = snapshot.val();
            return Object.values(data);
        }
        return [];
    } catch (error) {
        console.error('Erro ao buscar treinamentos:', error);
        return [];
    }
}

/**
 * Obter estatísticas de treinamento
 */
async function firebaseGetTrainingStats() {
    try {
        const drivers = await firebaseGetAllDrivers();
        const records = await firebaseGetAllTrainingRecords();

        const total = drivers.length;
        const driverCPFs = drivers.map(d => d.cpf);
        const recordCPFs = records.map(r => r.cpf);

        let completed = 0;
        driverCPFs.forEach(cpf => {
            if (recordCPFs.includes(cpf)) {
                completed++;
            }
        });

        const pending = total - completed;

        const byCompany = {
            'Empresa A': { total: 0, completed: 0 },
            'Empresa B': { total: 0, completed: 0 }
        };

        drivers.forEach(d => {
            if (byCompany[d.empresa]) {
                byCompany[d.empresa].total++;
                if (recordCPFs.includes(d.cpf)) {
                    byCompany[d.empresa].completed++;
                }
            }
        });

        console.log('📊 Estatísticas:', { total, completed, pending, byCompany });
        return { total, completed, pending, byCompany };
    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        return { total: 0, completed: 0, pending: 0, byCompany: { 'Empresa A': { total: 0, completed: 0 }, 'Empresa B': { total: 0, completed: 0 } } };
    }
}

/**
 * Verificar senha de admin
 */
async function firebaseCheckAdminPassword(password) {
    try {
        const snapshot = await configRef.child('adminPassword').once('value');
        return snapshot.val() === password;
    } catch (error) {
        console.error('Erro ao verificar senha:', error);
        return false;
    }
}

// Log de inicialização
console.log('🔥 Firebase Config carregado!');
