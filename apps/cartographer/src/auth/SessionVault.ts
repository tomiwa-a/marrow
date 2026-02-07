import { homedir } from "os";
import { join } from "path";
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, unlinkSync } from "fs";
import { StoredSession, SessionMetadata } from "./types";

export class SessionVault {
  private readonly vaultDir: string;

  constructor() {
    this.vaultDir = join(homedir(), ".marrow", "sessions");
    this.ensureVaultExists();
  }

  private ensureVaultExists(): void {
    if (!existsSync(this.vaultDir)) {
      mkdirSync(this.vaultDir, { recursive: true });
    }
  }

  private getSessionPath(domain: string): string {
    const sanitized = domain.replace(/[^a-z0-9.-]/gi, "_");
    return join(this.vaultDir, `${sanitized}.json`);
  }

  async save(domain: string, storageState: any): Promise<void> {
    const session: StoredSession = {
      metadata: {
        domain,
        createdAt: Date.now(),
        lastUsed: Date.now(),
      },
      storageState,
    };

    const path = this.getSessionPath(domain);
    writeFileSync(path, JSON.stringify(session, null, 2));
  }

  async load(domain: string): Promise<any | null> {
    const path = this.getSessionPath(domain);
    
    if (!existsSync(path)) {
      return null;
    }

    const content = readFileSync(path, "utf-8");
    const session: StoredSession = JSON.parse(content);

    session.metadata.lastUsed = Date.now();
    writeFileSync(path, JSON.stringify(session, null, 2));

    return session.storageState;
  }

  exists(domain: string): boolean {
    return existsSync(this.getSessionPath(domain));
  }

  async delete(domain: string): Promise<void> {
    const path = this.getSessionPath(domain);
    if (existsSync(path)) {
      unlinkSync(path);
    }
  }

  async list(): Promise<string[]> {
    const files = readdirSync(this.vaultDir);
    return files
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(".json", ""));
  }

  async getMetadata(domain: string): Promise<SessionMetadata | null> {
    const path = this.getSessionPath(domain);
    
    if (!existsSync(path)) {
      return null;
    }

    const content = readFileSync(path, "utf-8");
    const session: StoredSession = JSON.parse(content);
    return session.metadata;
  }
}
