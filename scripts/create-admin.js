// scripts/create-admin.js
/**
 * Crea un usuario administrador sin pasar por el endpoint /auth/register
 * (útil para bootstrap: el primer admin no puede crearse a sí mismo).
 *
 * Uso interactivo (TTY):
 *   node scripts/create-admin.js
 *
 * Uso con argumentos:
 *   node scripts/create-admin.js --nombre=Juan --apellido=Perez \
 *       --email=admin@astro.dev --password=secreto123 [--mission=AURA-01]
 *
 * Uso con pipe (CI/scripts):
 *   printf 'Nombre\nApellido\nemail@x.com\npass123\n' | node scripts/create-admin.js
 */
require('../configs/env.config');
const readline = require('readline');
const mongoService = require('../configs/mongo.config');
const User = require('../models/user.model');

const args = Object.fromEntries(
    process.argv.slice(2)
        .filter((a) => a.startsWith('--'))
        .map((a) => {
            const [k, v = true] = a.slice(2).split('=');
            return [k, v];
        })
);

const FIELDS = [
    ['nombre', 'Nombre: '],
    ['apellido', 'Apellido: '],
    ['email', 'Email: '],
    ['password', 'Password (min 6): '],
];

const readAllStdin = () => new Promise((resolve) => {
    let buf = '';
    process.stdin.on('data', (c) => (buf += c));
    process.stdin.on('end', () => resolve(buf.split('\n').map((l) => l.trim())));
    process.stdin.resume();
});

/** Recoge los campos faltantes: interactivo si hay TTY, o líneas piped si no. */
async function collectInput() {
    const data = {};
    const missing = FIELDS.filter(([k]) => !args[k]);

    if (missing.length === 0) {
        FIELDS.forEach(([k]) => (data[k] = args[k]));
    } else if (process.stdin.isTTY) {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        for (const [key, prompt] of FIELDS) {
            data[key] = args[key] || await new Promise((r) => rl.question(prompt, r));
        }
        rl.close();
    } else {
        const lines = (await readAllStdin()).filter(Boolean);
        FIELDS.forEach(([key]) => (data[key] = args[key] || lines.shift()));
    }

    data.missionId = args.mission || 'MISSION-01';
    return data;
}

async function main() {
    const data = await collectInput();

    if (!data.nombre || !data.apellido || !data.email || !data.password) {
        console.error('✗ Todos los campos son obligatorios (nombre, apellido, email, password)');
        process.exit(1);
    }
    if (data.password.length < 6) {
        console.error('✗ La contraseña debe tener al menos 6 caracteres');
        process.exit(1);
    }

    await mongoService.connect();

    const exists = await User.findOne({ email: data.email.toLowerCase(), isDeleted: false });
    if (exists) {
        console.error(`✗ Ya existe un usuario con el email ${data.email}`);
        process.exit(1);
    }

    const admin = await User.create({ ...data, role: 'admin', isActive: true });

    console.log(`
✓ Administrador creado:
  ${admin.nombre} ${admin.apellido} <${admin.email}>
  role: admin | mission: ${admin.missionId} | id: ${admin._id}
`);

    await mongoService.disconnect();
    process.exit(0);
}

main().catch((e) => { console.error('✗ Error:', e.message); process.exit(1); });
