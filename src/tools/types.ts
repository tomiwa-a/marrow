export interface SnapshotMetadata {
  pageName: string;
  url: string;
  timestamp: string;
  viewport: {
    width: number;
    height: number;
  };
  userAgent: string;
}

export interface SnapshotData {
  html: string;
  accessibilityTree: any;
  metadata: SnapshotMetadata;
}

export interface SelectorTestResult {
  selector: string;
  found: boolean;
  count: number;
  elements?: string[];
}

export interface PageConfig {
  name: string;
  url: string;
  waitForSelector: string;
  description: string;
}
