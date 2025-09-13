const Joi = require('joi');

const inviteUser = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    email: Joi.string().required().email(),
    role: Joi.string().required(),
    teams: Joi.array()
      .items(
        Joi.object({
          team: Joi.string().required(),
          role: Joi.string().valid('member', 'leader').required(),
        }),
      )
      .required(),
    organizationId: Joi.string().required(),
  }),
};

const acceptInvitation = {
  params: Joi.object().keys({
    token: Joi.string().required(),
  }),
};

const removeInvitation = {
  body: Joi.object().keys({
    invitationId: Joi.string().required(),
  }),
};

module.exports = {
  inviteUser,
  acceptInvitation,
  removeInvitation,
};
