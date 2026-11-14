// models/user.model.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

/**
 * Usuario del sistema de monitoreo de salud para misiones espaciales.
 * Roles:
 *  - 'astronaut': miembro de tripulación que se auto-monitorea
 *  - 'medic':     cirujano de vuelo / control de misión (ve toda la tripulación)
 *  - 'admin':     gestión de usuarios y dispositivos
 */
const userSchema = new mongoose.Schema(
    {
        nombre: {
            type: String,
            required: [true, 'El nombre es obligatorio'],
            trim: true
        },
        apellido: {
            type: String,
            required: [true, 'El apellido es obligatorio'],
            trim: true
        },
        email: {
            type: String,
            required: [true, 'El correo electrónico es obligatorio'],
            lowercase: true,
            trim: true,
            match: [
                /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                'Por favor ingrese un correo electrónico válido'
            ]
        },
        password: {
            type: String,
            required: [true, 'La contraseña es obligatoria'],
            minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
            select: false
        },
        role: {
            type: String,
            enum: {
                values: ['astronaut', 'medic', 'admin'],
                message: 'El rol {VALUE} no es válido.'
            },
            default: 'astronaut',
            index: true
        },
        // Misión a la que pertenece el usuario
        missionId: {
            type: String,
            default: 'MISSION-01',
            index: true
        },
        // Perfil fisiológico (contexto para evaluaciones e insights de IA)
        perfil: {
            edad:     { type: Number, min: 18, max: 100, default: null },
            sexo:     { type: String, enum: ['M', 'F', 'Otro'], default: null },
            pesoKg:   { type: Number, default: null },
            alturaCm: { type: Number, default: null }
        },
        // Línea base pre-vuelo: valores de referencia para detectar desviaciones
        baseline: {
            restingHeartRate:  { type: Number, default: null },
            spo2:              { type: Number, default: null },
            systolicBP:        { type: Number, default: null },
            diastolicBP:       { type: Number, default: null },
            bodyTemperature:   { type: Number, default: null }
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true
        },
        lastLogin: {
            type: Date,
            default: null
        },
        loginAttempts: {
            type: Number,
            default: 0
        },
        lockUntil: {
            type: Date,
            default: null
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        isDeleted: {
            type: Boolean,
            default: false,
            index: true
        },
        deletedAt: {
            type: Date,
            default: null
        },
        deletedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        }
    },
    {
        timestamps: true,
        id: false,
        toJSON: {
            virtuals: true,
            transform: function (doc, ret) {
                delete ret.id;
                delete ret.password;
                delete ret.__v;
                return ret;
            }
        },
        toObject: { virtuals: true }
    }
);

userSchema.index(
    { email: 1 },
    { unique: true, partialFilterExpression: { isDeleted: false } }
);

userSchema.virtual('fullName').get(function () {
    return `${this.nombre} ${this.apellido}`.trim();
});

userSchema.virtual('isLocked').get(function () {
    return Boolean(this.lockUntil && this.lockUntil > Date.now());
});

userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    } catch (error) {
        throw new Error(`Error al encriptar la contraseña: ${error.message}`);
    }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
    if (!this.password) {
        throw new Error('La contraseña no está cargada en el documento para comparar.');
    }
    return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
