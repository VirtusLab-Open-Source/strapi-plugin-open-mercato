import config from '../index';

describe('config/index', () => {
  it('has empty default config', () => {
    expect(config.default).toEqual({});
  });

  describe('validator', () => {
    it('does not throw for valid minimal config', () => {
      expect(() =>
        config.validator({ encryptionKey: '01234567890123456789012345678901' })
      ).not.toThrow();
    });

    it('does not throw for full valid config', () => {
      expect(() =>
        config.validator({
          encryptionKey: '01234567890123456789012345678901',
          apiUrl: 'https://api.test.com',
          accessToken: 'tok',
          engine: 'memory',
        })
      ).not.toThrow();
    });

    it('throws for missing encryptionKey', () => {
      expect(() => config.validator({})).toThrow();
    });

    it('throws for redis engine without connection', () => {
      expect(() =>
        config.validator({
          encryptionKey: '01234567890123456789012345678901',
          engine: 'redis',
        })
      ).toThrow();
    });

    it('does not throw for redis engine with valid connection', () => {
      expect(() =>
        config.validator({
          encryptionKey: '01234567890123456789012345678901',
          engine: 'redis',
          connection: { host: 'localhost', port: 6379, db: 1 },
        })
      ).not.toThrow();
    });
  });
});
