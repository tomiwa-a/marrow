export interface PageSnapshot {
  html: string;
  axeSummary: string;
}

export interface SnapDebug {
  timingsMs: {
    init: number;
    goto: number;
    html: number;
    axe: number;
    total: number;
  };
  finalUrl: string;
  htmlLength: number;
  axeCounts: {
    violations: number;
    passes: number;
    incomplete: number;
  };
}

export interface ExtractSelectorDebug {
  selector: string;
  found: boolean;
  textLength: number;
  error?: string;
}

export interface ExtractDebug {
  timingsMs: {
    init: number;
    goto: number;
    extract: number;
    total: number;
  };
  finalUrl: string;
  selectors: ExtractSelectorDebug[];
}
