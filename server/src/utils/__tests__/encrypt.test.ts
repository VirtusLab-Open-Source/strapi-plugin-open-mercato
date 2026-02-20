import crypto from 'crypto';
import { encryptConfig, decryptConfig } from '../encrypt';
import { PluginConfig } from '../../config/schema';

const encrypt = (text: string, key: string): string => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
};

const decrypt = (text: string, key: string): string => {
  const [ivHex, encryptedHex] = text.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv);
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};

describe('encryption utilities', () => {
  const encryptionKey = '01234567890123456789012345678901'; // 32 characters

  const getMockConfig = (): PluginConfig => ({
    apiUrl: 'https://my-instance.openmercato.com',
    accessToken: 'test-access-token',
    encryptionKey: encryptionKey,
  });

  describe('encryptConfig', () => {
    it('should encrypt the sensitive fields in the config', () => {
      // Arrange
      const mockConfig = getMockConfig();

      // Act
      const encryptedConfig = encryptConfig(mockConfig, encryptionKey);

      // Assert
      expect(encryptedConfig).not.toBe(mockConfig);
      expect(encryptedConfig.accessToken).not.toBe(mockConfig.accessToken);

      expect(encryptedConfig.apiUrl).toBe(mockConfig.apiUrl);

      expect(encryptedConfig.accessToken).toContain(':');
    });

    it('should handle null/undefined sensitive fields', () => {
      // Arrange
      const mockConfig = {
        ...getMockConfig(),
        accessToken: undefined,
      } as unknown as PluginConfig;

      // Act
      const encryptedConfig = encryptConfig(mockConfig, encryptionKey);

      // Assert
      expect(encryptedConfig.accessToken).toBe(undefined);
    });
  });

  describe('decryptConfig', () => {
    it('should decrypt the sensitive fields in the config', () => {
      // Arrange
      const mockConfig = getMockConfig();
      const encryptedConfig = encryptConfig(mockConfig, encryptionKey);

      // Act
      const decryptedConfig = decryptConfig(encryptedConfig, encryptionKey);

      // Assert
      expect(decryptedConfig).not.toBe(encryptedConfig);
      expect(decryptedConfig.accessToken).toBe(mockConfig.accessToken);
    });

    it('should handle null/undefined sensitive fields', () => {
      // Arrange
      const mockConfig = {
        ...getMockConfig(),
        accessToken: undefined,
      } as unknown as PluginConfig;
      const encryptedConfig = encryptConfig(mockConfig, encryptionKey);

      // Act
      const decryptedConfig = decryptConfig(encryptedConfig, encryptionKey);

      // Assert
      expect(decryptedConfig.accessToken).toBe(undefined);
    });
  });

  describe('encrypt-decrypt integration', () => {
    it('should successfully decrypt what was encrypted', () => {
      // Arrange
      const testKey = '01234567890123456789012345678901';
      const mockConfig = getMockConfig();

      // Act
      const encryptedConfig = encryptConfig(mockConfig, testKey);
      const decryptedConfig = decryptConfig(encryptedConfig, testKey);

      // Assert
      expect(decryptedConfig.accessToken).toBe(mockConfig.accessToken);

      expect(encryptedConfig.accessToken).not.toBe(mockConfig.accessToken);
      expect(encryptedConfig.accessToken).toContain(':');
    });
  });

  describe('actual crypto operations', () => {
    it('should encrypt and decrypt a value using real crypto operations', () => {
      // Arrange
      const testValue = 'sensitive-data-to-encrypt';
      const testKey = '01234567890123456789012345678901';

      // Act
      const encrypted = encrypt(testValue, testKey);

      // Assert
      expect(encrypted).not.toBe(testValue);
      expect(encrypted).toContain(':');

      const [ivHex, encryptedHex] = encrypted.split(':');
      expect(ivHex).toBeTruthy();
      expect(encryptedHex).toBeTruthy();
      expect(ivHex.length).toBe(32);
      expect(encryptedHex.length).toBeGreaterThan(0);

      const decrypted = decrypt(encrypted, testKey);
      expect(decrypted).toBe(testValue);
    });

    it('should correctly encrypt and decrypt a full config object', () => {
      // Arrange
      const testKey = '01234567890123456789012345678901';
      const sensitiveConfig: PluginConfig = {
        apiUrl: 'https://my-instance.openmercato.com',
        accessToken: 'real-access-token-xyz789',
        encryptionKey: testKey,
      };

      // Act
      const encryptedConfig = encryptConfig(sensitiveConfig, testKey);

      // Assert
      expect(encryptedConfig.accessToken).not.toBe(sensitiveConfig.accessToken);
      expect(encryptedConfig.apiUrl).toBe(sensitiveConfig.apiUrl);

      const tokenParts = encryptedConfig.accessToken.split(':');
      expect(tokenParts.length).toBe(2);
      expect(tokenParts[0].length).toBe(32);

      const decryptedConfig = decryptConfig(encryptedConfig, testKey);

      expect(decryptedConfig.accessToken).toBe(sensitiveConfig.accessToken);
      expect(decryptedConfig.apiUrl).toBe(sensitiveConfig.apiUrl);
    });
  });
});
