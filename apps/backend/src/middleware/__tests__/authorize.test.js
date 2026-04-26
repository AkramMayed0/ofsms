const authorize = require('../authorize');
const ROLES = require('../../constants/roles');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('authorize middleware', () => {
  it('يسمح بالدخول إذا كان الدور مسموحاً', () => {
    const middleware = authorize(ROLES.SUPERVISOR, ROLES.GM);
    const req = { user: { id: '1', role: ROLES.GM } };
    const res = mockRes();
    const next = jest.fn();

    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('يرجع 403 إذا كان الدور غير مسموح', () => {
    const middleware = authorize(ROLES.GM);
    const req = { user: { id: '2', role: ROLES.AGENT } };
    const res = mockRes();
    const next = jest.fn();

    middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('يرجع 401 إذا لم يكن هناك مستخدم', () => {
    const middleware = authorize(ROLES.GM);
    const req = {};
    const res = mockRes();
    const next = jest.fn();

    middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});