function softDelete(schema) {
  schema.add({ deleted: { type: Boolean, default: false } });
  schema.add({ deletedAt: { type: Date, default: null } });

  schema.pre(['find', 'findOne', 'findById'], function (next) {
    const filter = this.getFilter();

    if (filter.deleted === undefined) {
      this.where({ deleted: false });
    }

    next();
  });

  schema.methods.softDelete = async function () {
    this.deleted = true;
    this.deletedAt = new Date();
    return this.save();
  };

  schema.methods.restore = async function () {
    this.deleted = false;
    this.deletedAt = null;
    return this.save();
  };

  schema.statics.softDelete = async function (conditions) {
    return this.updateMany(conditions, { deleted: true, deletedAt: new Date() });
  };

  schema.statics.restore = async function (conditions) {
    return this.updateMany(conditions, { deleted: false, deletedAt: null });
  };
}

module.exports = softDelete;
