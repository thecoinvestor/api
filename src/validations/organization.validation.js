const Joi = require('joi');

const createOrganization = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    description: Joi.string().allow('', null),
  }),
};

const getOrganizationUsers = {
  query: Joi.object().keys({
    organizationId: Joi.string().required(),
  }),
};

const removeUser = {
  body: Joi.object().keys({
    userId: Joi.string().required(),
  }),
};

const changeRole = {
  body: Joi.object().keys({
    userId: Joi.string().required(),
    role: Joi.string().required(),
  }),
};

const getOrganizationTeams = {
  query: Joi.object().keys({
    organizationId: Joi.string().required(),
  }),
};

module.exports = {
  createOrganization,
  getOrganizationUsers,
  removeUser,
  changeRole,
  getOrganizationTeams,
};
