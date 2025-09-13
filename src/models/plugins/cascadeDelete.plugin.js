const mongoose = require('mongoose');

const cascadeDelete = (schema, options) => {
  schema.post('findOneAndDelete', async function (doc, next) {
    if (doc) {
      await deleteReferences(schema, doc._id, options);
    }
    next();
  });
};

async function deleteReferences(schema, id, options) {
  for (const key in schema.paths) {
    const path = schema.paths[key];
    if (path.instance === 'ObjectID' && path.options.ref) {
      if (options && options.include && !options.include.includes(key)) {
        continue;
      }
      const Model = mongoose.model(path.options.ref);
      await Model.deleteMany({ [key]: id });
    }
  }
}

module.exports = cascadeDelete;
