import { RequestIdMiddleware } from './request-id.middleware';

describe('RequestIdMiddleware', () => {
  const middleware = new RequestIdMiddleware();

  it('generates a uuid when no inbound X-Request-ID is present', () => {
    const req: any = { headers: {} };
    const res: any = { setHeader: jest.fn() };
    const next = jest.fn();

    middleware.use(req, res, next);

    expect(typeof req.id).toBe('string');
    expect(req.id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(res.setHeader).toHaveBeenCalledWith('X-Request-ID', req.id);
    expect(next).toHaveBeenCalled();
  });

  it('echoes the inbound X-Request-ID when provided', () => {
    const incoming = 'abc-123-from-caller';
    const req: any = { headers: { 'x-request-id': incoming } };
    const res: any = { setHeader: jest.fn() };
    const next = jest.fn();

    middleware.use(req, res, next);

    expect(req.id).toBe(incoming);
    expect(res.setHeader).toHaveBeenCalledWith('X-Request-ID', incoming);
  });
});
