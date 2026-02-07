export interface SessionMetadata {
  domain: string;
  createdAt: number;
  lastUsed: number;
}

export interface StoredSession {
  metadata: SessionMetadata;
  storageState: any;
}

export interface AuthSignal {
  type: "http_status" | "url_redirect" | "dom_element" | "content_pattern";
  description: string;
  weight: number;
}

export interface AuthDetectionResult {
  required: boolean;
  confidence: number;
  signals: AuthSignal[];
  redirectChain: string[];
  finalUrl: string;
}

export interface AuthDetectorOptions {
  confidenceThreshold?: number;
  loginFormSelectors?: string[];
  authWallSelectors?: string[];
}

export interface EscalationOptions {
  timeoutMs?: number;
  pollIntervalMs?: number;
  successIndicators?: string[];
}

export interface EscalationResult {
  success: boolean;
  domain: string;
  sessionCaptured: boolean;
  error?: string;
}
