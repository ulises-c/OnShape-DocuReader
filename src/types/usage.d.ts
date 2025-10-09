export interface UsageEntry {
  timestamp: string;
  endpoint: string;
  method: string;
  userId?: string;
  responseTime: number;
  status: number;
  cached?: boolean;
}

export interface UsageStats {
  timeWindow: string;
  summary: {
    totalRequests: number;
    uniqueUsers: number;
    avgResponseTime: number;
    errorRate: number;
  };
  byEndpoint: EndpointStats[];
  byUser: UserStats[];
  responseTimePercentiles: {
    p50: number;
    p95: number;
    p99: number;
  };
}

export interface EndpointStats {
  endpoint: string;
  count: number;
  avgResponseTime: number;
  errorRate: number;
}

export interface UserStats {
  userId: string;
  count: number;
  avgResponseTime: number;
}

export interface CostEstimate {
  totalEstimatedCost: number;
  costByEndpoint: Array<{
    endpoint: string;
    count: number;
    unitCost: number;
    totalCost: number;
  }>;
}

export interface UsageQueryOptions {
  since?: Date;
  hours?: number;
  detailed?: boolean;
}
