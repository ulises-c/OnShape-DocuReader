import fs from "fs/promises";
import path from "path";
import type {
  UsageEntry,
  UsageStats,
  EndpointStats,
  UserStats,
  CostEstimate,
} from "../types/usage.d.ts";

export class ApiUsageTracker {
  private logFile: string;
  private dataDir: string;

  constructor(logFile = ".data/api-usage.jsonl") {
    this.logFile = logFile;
    this.dataDir = path.dirname(this.logFile);
  }

  private async ensureDataDir(): Promise<void> {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
    } catch (error) {
      console.error("Failed to create data directory:", error);
    }
  }

  async log(entry: UsageEntry): Promise<void> {
    try {
      await this.ensureDataDir();
      const line = JSON.stringify(entry) + "\n";
      await fs.appendFile(this.logFile, line, { encoding: "utf-8" });
    } catch (error) {
      console.error("Failed to log API usage:", error);
    }
  }

  async getStats(hours: number = 24): Promise<UsageStats> {
    try {
      const since = new Date(Date.now() - hours * 60 * 60 * 1000);
      const entries = await this.readEntries(since);

      const uniqueUsers = new Set(
        entries.filter((e) => e.userId).map((e) => e.userId)
      ).size;

      const responseTimes = entries
        .map((e) => e.responseTime)
        .sort((a, b) => a - b);

      const endpointMap = this.groupByEndpoint(entries);
      const userMap = this.groupByUser(entries);

      return {
        timeWindow: `${hours} hours`,
        summary: {
          totalRequests: entries.length,
          uniqueUsers,
          avgResponseTime: this.average(responseTimes),
          errorRate: this.calculateErrorRate(entries),
        },
        byEndpoint: this.calculateEndpointStats(endpointMap),
        byUser: this.calculateUserStats(userMap),
        responseTimePercentiles: {
          p50: this.percentile(responseTimes, 0.5),
          p95: this.percentile(responseTimes, 0.95),
          p99: this.percentile(responseTimes, 0.99),
        },
      };
    } catch (error) {
      console.error("Failed to get usage stats:", error);
      return this.emptyStats(hours);
    }
  }

  async getEndpointBreakdown(): Promise<EndpointStats[]> {
    try {
      const entries = await this.readEntries();
      const endpointMap = this.groupByEndpoint(entries);
      return this.calculateEndpointStats(endpointMap);
    } catch (error) {
      console.error("Failed to get endpoint breakdown:", error);
      return [];
    }
  }

  async estimateCosts(
    costMap: Record<string, number> = {}
  ): Promise<CostEstimate> {
    try {
      const entries = await this.readEntries();
      const endpointMap = this.groupByEndpoint(entries);

      const costByEndpoint = Object.entries(endpointMap).map(
        ([endpoint, entries]) => {
          const normalizedEndpoint = this.normalizeEndpoint(endpoint);
          const unitCost = costMap[normalizedEndpoint] || 1;
          const count = entries.length;
          return {
            endpoint: normalizedEndpoint,
            count,
            unitCost,
            totalCost: count * unitCost,
          };
        }
      );

      const totalEstimatedCost = costByEndpoint.reduce(
        (sum, item) => sum + item.totalCost,
        0
      );

      return {
        totalEstimatedCost,
        costByEndpoint: costByEndpoint.sort((a, b) => b.totalCost - a.totalCost),
      };
    } catch (error) {
      console.error("Failed to estimate costs:", error);
      return { totalEstimatedCost: 0, costByEndpoint: [] };
    }
  }

  private async readEntries(since?: Date): Promise<UsageEntry[]> {
    try {
      const content = await fs.readFile(this.logFile, "utf-8");
      const entries = content
        .trim()
        .split("\n")
        .filter((line) => line.trim())
        .map((line) => JSON.parse(line) as UsageEntry)
        .filter((e) => !since || new Date(e.timestamp) >= since);

      return entries;
    } catch (error: any) {
      if (error.code === "ENOENT") {
        return [];
      }
      throw error;
    }
  }

  private normalizeEndpoint(endpoint: string): string {
    return endpoint
      .replace(/\/d\/[a-zA-Z0-9]+/g, "/d/*")
      .replace(/\/w\/[a-zA-Z0-9]+/g, "/w/*")
      .replace(/\/e\/[a-zA-Z0-9]+/g, "/e/*")
      .replace(/\/v\/[a-zA-Z0-9]+/g, "/v/*")
      .replace(/\/m\/[a-zA-Z0-9]+/g, "/m/*")
      .replace(/\/p\/[a-zA-Z0-9]+/g, "/p/*");
  }

  private groupByEndpoint(
    entries: UsageEntry[]
  ): Record<string, UsageEntry[]> {
    return entries.reduce(
      (acc, entry) => {
        const normalized = this.normalizeEndpoint(entry.endpoint);
        if (!acc[normalized]) {
          acc[normalized] = [];
        }
        acc[normalized].push(entry);
        return acc;
      },
      {} as Record<string, UsageEntry[]>
    );
  }

  private groupByUser(entries: UsageEntry[]): Record<string, UsageEntry[]> {
    return entries.reduce(
      (acc, entry) => {
        const userId = entry.userId || "unknown";
        if (!acc[userId]) {
          acc[userId] = [];
        }
        acc[userId].push(entry);
        return acc;
      },
      {} as Record<string, UsageEntry[]>
    );
  }

  private calculateEndpointStats(
    endpointMap: Record<string, UsageEntry[]>
  ): EndpointStats[] {
    return Object.entries(endpointMap)
      .map(([endpoint, entries]) => ({
        endpoint,
        count: entries.length,
        avgResponseTime: this.average(entries.map((e) => e.responseTime)),
        errorRate: this.calculateErrorRate(entries),
      }))
      .sort((a, b) => b.count - a.count);
  }

  private calculateUserStats(
    userMap: Record<string, UsageEntry[]>
  ): UserStats[] {
    return Object.entries(userMap)
      .map(([userId, entries]) => ({
        userId,
        count: entries.length,
        avgResponseTime: this.average(entries.map((e) => e.responseTime)),
      }))
      .sort((a, b) => b.count - a.count);
  }

  private average(arr: number[]): number {
    if (arr.length === 0) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  private percentile(arr: number[], p: number): number {
    if (arr.length === 0) return 0;
    const index = Math.ceil(arr.length * p) - 1;
    return arr[Math.max(0, index)];
  }

  private calculateErrorRate(entries: UsageEntry[]): number {
    if (entries.length === 0) return 0;
    const errors = entries.filter((e) => e.status >= 400).length;
    return errors / entries.length;
  }

  private emptyStats(hours: number): UsageStats {
    return {
      timeWindow: `${hours} hours`,
      summary: {
        totalRequests: 0,
        uniqueUsers: 0,
        avgResponseTime: 0,
        errorRate: 0,
      },
      byEndpoint: [],
      byUser: [],
      responseTimePercentiles: {
        p50: 0,
        p95: 0,
        p99: 0,
      },
    };
  }
}
