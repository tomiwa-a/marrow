export interface SessionMetadata {
  domain: string;
  createdAt: number;
  lastUsed: number;
}

export interface StoredSession {
  metadata: SessionMetadata;
  storageState: any;
}
