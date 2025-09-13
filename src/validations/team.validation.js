const Joi = require('joi');

const getAllTeams = {
  query: Joi.object().keys({
    teamName: Joi.string(),
    userName: Joi.string(),
    userId: Joi.string(),
    role: Joi.string().valid('leader', 'member'),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const createTeam = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    description: Joi.string().required(),
    avatar: Joi.string(),
  }),
};

const updateTeam = {
  body: Joi.object().keys({
    name: Joi.string(),
    description: Joi.string(),
    avatar: Joi.string(),
  }),
  params: Joi.object().keys({
    teamId: Joi.string().required(),
  }),
};

const getTeam = {
  params: Joi.object().keys({
    teamId: Joi.string().required(),
  }),
};

const deleteTeam = {
  params: Joi.object().keys({
    teamId: Joi.string().required(),
  }),
};

module.exports = {
  createTeam,
  getTeam,
  deleteTeam,
  getAllTeams,
  updateTeam,
};
