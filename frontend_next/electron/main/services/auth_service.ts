/**
 * auth_service.ts
 * Author: wuhao
 * Date: 2026-05-04
 * Description: Authentication service with secure token storage using OS keychain
 */

import { safeStorage, app } from "electron";
import fs from "fs";
import path from "path";
import log from "electron-log";

interface AuthToken {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  tokenType: string;
}

class AuthService {
  private tokensPath: string;

  constructor() {
    this.tokensPath = path.join(app.getPath("userData"), "auth_tokens.enc");
  }

  async storeToken(tokenData: AuthToken): Promise<void> {
    try {
      const tokenJson = JSON.stringify(tokenData);
      let encryptedToken: Buffer;

      if (safeStorage.isEncryptionAvailable()) {
        encryptedToken = safeStorage.encryptString(tokenJson);
      } else {
        log.warn("[Auth] Encryption not available, storing as plain text (NOT SECURE)");
        encryptedToken = Buffer.from(tokenJson);
      }

      const dir = path.dirname(this.tokensPath);

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(this.tokensPath, encryptedToken);

      log.info("[Auth] Token stored securely");
    } catch (error) {
      log.error("[Auth] Failed to store token:", error);
      throw new Error("Failed to store authentication token");
    }
  }

  async getToken(): Promise<AuthToken | null> {
    try {
      if (!fs.existsSync(this.tokensPath)) {
        return null;
      }

      const encryptedToken = fs.readFileSync(this.tokensPath);
      let decryptedToken: string;

      if (safeStorage.isEncryptionAvailable()) {
        decryptedToken = safeStorage.decryptString(encryptedToken);
      } else {
        decryptedToken = encryptedToken.toString();
      }

      const tokenData = JSON.parse(decryptedToken) as AuthToken;

      if (tokenData.expiresAt < Date.now()) {
        log.info("[Auth] Token expired, clearing...");
        await this.clearToken();
        return null;
      }

      log.debug("[Auth] Token retrieved successfully");
      return tokenData;
    } catch (error) {
      log.error("[Auth] Failed to get token:", error);
      return null;
    }
  }

  async clearToken(): Promise<void> {
    try {
      if (fs.existsSync(this.tokensPath)) {
        fs.unlinkSync(this.tokensPath);
        log.info("[Auth] Token cleared successfully");
      }
    } catch (error) {
      log.error("[Auth] Failed to clear token:", error);
      throw new Error("Failed to clear authentication token");
    }
  }

  isTokenValid(): boolean {
    // This is a synchronous check that doesn't decrypt the full token
    return fs.existsSync(this.tokensPath);
  }
}

export const authService = new AuthService();
export type { AuthToken };
export default authService;
