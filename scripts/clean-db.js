// scripts/clean-db.js
/**
 * Elimina TODAS las colecciones (tablas) de la base de datos.
 * Por seguridad pide confirmación salvo --yes.
 *
 * Uso:
 *   node scripts/clean-db.js              # interactivo: pide escribir "SI"
 *   node scripts/clean-db.js --yes        # sin confirmación (CI/scripts)
 *   node scripts/clean-db.js --yes --keep-users
 *       -> solo vacía datos (métricas, alertas, insights, registros)
 *          conservando users y devices (no pierdes admins ni API keys)
 */
require('../configs/env.config');
const readline = require('readline');
const mongoose = require('mongoose');
const mongoService = require('../configs/mongo.config');

const args = new Set(process.argv.slice(2));
const YES = args.has('--yes');
const KEEP_USERS = args.has('--keep-users');

const confirm = () => new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question('⚠ Esto ELIMINARÁ todas las colecciones de la base de datos. Escribe "SI" para confirmar: ', (ans) => {
        rl.close();
        resolve(ans.trim().toUpperCase() === 'SI');
    });
});

async function main() {
    if (!YES && !(await confirm())) {
        console.log('Cancelado.');
        process.exit(0);
    }

    await mongoService.connect();
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();

    if (KEEP_USERS) {
        // Modo suave: vacía datos pero conserva users y devices
        const keep = new Set(['users', 'devices']);
        console.log(`Vaciando datos en: ${db.databaseName} (conservando users y devices)`);
        for (const c of collections) {
            if (keep.has(c.name)) continue;
            const res = await db.collection(c.name).deleteMany({});
            console.log(`  ${c.name}: ${res.deletedCount} docs eliminados`);
        }
        console.log('✓ Datos limpiados (users y devices conservados)');
    } else {
        // Modo por defecto: DROP de todas las colecciones
        console.log(`Eliminando TODAS las colecciones de: ${db.databaseName}`);
        for (const c of collections) {
            await db.dropCollection(c.name);
            console.log(`  ${c.name}: colección eliminada (dropped)`);
        }
        console.log(`✓ ${collections.length} colecciones eliminadas por completo`);
    }

    await mongoService.disconnect();
    process.exit(0);
}

main().catch((e) => { console.error('✗ Error:', e.message); process.exit(1); });
