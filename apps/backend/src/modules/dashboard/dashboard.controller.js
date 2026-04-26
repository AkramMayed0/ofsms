const service = require('./dashboard.service');

const getGmDashboard = async (_req, res, next) => {
  try {
    const data = await service.getGmDashboard();
    return res.json(data);
  } catch (err) {
    next(err);
  }
};

const getAgentDashboard = async (req, res, next) => {
  try {
    const data = await service.getAgentDashboard(req.user.id);
    return res.json(data);
  } catch (err) {
    next(err);
  }
};

const getSupervisorDashboard = async (_req, res, next) => {
  try {
    const data = await service.getSupervisorDashboard();
    return res.json(data);
  } catch (err) {
    next(err);
  }
};

module.exports = { getGmDashboard, getAgentDashboard, getSupervisorDashboard };
