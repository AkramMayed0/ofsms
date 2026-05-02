const service = require('./dashboard.service');

const getGmDashboard = async (_req, res, next) => {
  try {
    return res.json(await service.getGmDashboard());
  } catch (err) { next(err); }
};

const getAgentDashboard = async (req, res, next) => {
  try {
    return res.json(await service.getAgentDashboard(req.user.id));
  } catch (err) { next(err); }
};

const getSupervisorDashboard = async (_req, res, next) => {
  try {
    return res.json(await service.getSupervisorDashboard());
  } catch (err) { next(err); }
};

const getFinanceDashboard = async (_req, res, next) => {
  try {
    return res.json(await service.getFinanceDashboard());
  } catch (err) { next(err); }
};

module.exports = {
  getGmDashboard,
  getAgentDashboard,
  getSupervisorDashboard,
  getFinanceDashboard,
};
