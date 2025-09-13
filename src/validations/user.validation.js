const Joi = require('joi');

const updateUserTeam = {
  body: Joi.object()
    .keys({
      userId: Joi.string().required(),
      teams: Joi.array().items(
        Joi.object().keys({
          team: Joi.string().required(),
          role: Joi.string().valid('leader', 'member').default('member'),
        }),
      ),
      teamId: Joi.string(),
    })
    .xor('teams', 'teamId'),
};

module.exports = {
  updateUserTeam,
};
