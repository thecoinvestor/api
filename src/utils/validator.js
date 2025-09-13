const validator = async (schema, data) => {
  try {
    const { value, warning } = await schema.validateAsync(data, {
      warnings: true,
      abortEarly: true,
    });
    if (warning) throw new Error();
    return value;
  } catch (error) {
    const { details } = error;
    const message = details.map((i) => i.message).join(',');
    throw {
      errmsg: message,
    };
  }
};

module.exports = { validator };
