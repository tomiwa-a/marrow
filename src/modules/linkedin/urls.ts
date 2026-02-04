export interface JobSearchParams {
  keywords?: string;
  location?: string;
  geoId?: string;
  distance?: number;
  remote?: boolean;
  timePosted?: "r86400" | "r604800" | "r2592000";
  experienceLevel?: string[];
}

export class LinkedInUrls {
  private static BASE = "https://www.linkedin.com";

  static jobs(): string {
    return `${this.BASE}/jobs/`;
  }

  static jobSearch(params: JobSearchParams): string {
    const searchParams = new URLSearchParams();

    if (params.keywords) {
      searchParams.set("keywords", params.keywords);
    }

    if (params.location) {
      searchParams.set("location", params.location);
    }

    if (params.geoId) {
      searchParams.set("geoId", params.geoId);
    }

    if (params.distance) {
      searchParams.set("distance", params.distance.toString());
    }

    if (params.remote) {
      searchParams.set("f_WT", "2");
    }

    if (params.timePosted) {
      searchParams.set("f_TPR", params.timePosted);
    }

    searchParams.set("origin", "JOB_SEARCH_PAGE_SEARCH_BUTTON");
    searchParams.set("refresh", "true");

    return `${this.BASE}/jobs/search/?${searchParams.toString()}`;
  }

  static feed(): string {
    return `${this.BASE}/feed/`;
  }

  static myNetwork(): string {
    return `${this.BASE}/mynetwork/`;
  }

  static messaging(): string {
    return `${this.BASE}/messaging/`;
  }
}

export const TimeFilters = {
  PAST_24_HOURS: "r86400" as const,
  PAST_WEEK: "r604800" as const,
  PAST_MONTH: "r2592000" as const,
};
