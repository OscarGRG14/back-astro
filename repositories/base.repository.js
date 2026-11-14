// repositories/base.repository.js
/**
 * Repositorio base con operaciones CRUD comunes.
 * Cada repositorio de dominio extiende esta clase con su modelo.
 */
class BaseRepository {
    constructor(model) {
        this.model = model;
    }

    create(data) {
        return this.model.create(data);
    }

    insertMany(docs) {
        return this.model.insertMany(docs);
    }

    findById(id, options = {}) {
        return this.model.findById(id, options.select || null);
    }

    findOne(filter, options = {}) {
        let query = this.model.findOne(filter);
        if (options.select) query = query.select(options.select);
        if (options.sort) query = query.sort(options.sort);
        return query;
    }

    find(filter = {}, options = {}) {
        let query = this.model.find(filter);
        if (options.select) query = query.select(options.select);
        if (options.sort) query = query.sort(options.sort);
        if (options.skip) query = query.skip(options.skip);
        if (options.limit) query = query.limit(options.limit);
        if (options.populate) query = query.populate(options.populate);
        return query;
    }

    findByIdAndUpdate(id, update, options = {}) {
        return this.model.findByIdAndUpdate(id, update, { returnDocument: 'after', ...options });
    }

    findByIdAndDelete(id) {
        return this.model.findByIdAndDelete(id);
    }

    updateOne(filter, update) {
        return this.model.updateOne(filter, update);
    }

    countDocuments(filter = {}) {
        return this.model.countDocuments(filter);
    }

    aggregate(pipeline) {
        return this.model.aggregate(pipeline);
    }
}

module.exports = BaseRepository;
