import { AuthService, User } from '../auth/auth-service';
import { LLMProviderManager } from '../providers/llm-provider';
import { BMADOrchestrationService, AgentSession } from '../services/orchestration-service';

export interface UsageMetrics {
  totalUsers: number;
  activeUsers: number;
  totalTokensUsed: number;
  totalCost: number;
  averageSessionLength: number;
  popularAgents: Array<{ agentId: string; usageCount: number }>;
  errorRate: number;
  responseTime: {
    average: number;
    p95: number;
    p99: number;
  };
}

export interface UserUsageReport {
  userId: string;
  tokensUsed: number;
  cost: number;
  sessionsCount: number;
  lastActivity: Date;
  plan: string;
  tokenLimit: number;
}

export class UsageMonitor {
  private authService: AuthService;
  private llmManager: LLMProviderManager;
  private orchestrationService: BMADOrchestrationService;
  private sessionMetrics: AgentSession[] = [];
  private errorCount: number = 0;
  private totalRequests: number = 0;

  constructor(
    authService: AuthService,
    llmManager: LLMProviderManager,
    orchestrationService: BMADOrchestrationService
  ) {
    this.authService = authService;
    this.llmManager = llmManager;
    this.orchestrationService = orchestrationService;
  }

  recordSession(session: AgentSession): void {
    this.sessionMetrics.push(session);
    this.totalRequests++;

    // Keep only last 1000 sessions for memory efficiency
    if (this.sessionMetrics.length > 1000) {
      this.sessionMetrics = this.sessionMetrics.slice(-1000);
    }
  }

  recordError(): void {
    this.errorCount++;
  }

  getGlobalMetrics(): UsageMetrics {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Filter recent sessions
    const recentSessions = this.sessionMetrics.filter(s => s.createdAt >= last24Hours);

    // Calculate metrics
    const totalTokensUsed = recentSessions.reduce((sum, s) => sum + s.llmMetadata.tokensUsed, 0);
    const totalCost = recentSessions.reduce((sum, s) => sum + s.llmMetadata.cost, 0);

    // Active users (users with sessions in last 24h)
    const activeUserIds = new Set(recentSessions.map(s => s.userId));
    const activeUsers = activeUserIds.size;

    // Popular agents
    const agentUsage = new Map<string, number>();
    recentSessions.forEach(session => {
      agentUsage.set(session.agentId, (agentUsage.get(session.agentId) || 0) + 1);
    });
    const popularAgents = Array.from(agentUsage.entries())
      .map(([agentId, usageCount]) => ({ agentId, usageCount }))
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 5);

    // Response times
    const responseTimes = recentSessions.map(s => s.llmMetadata.latency).sort((a, b) => a - b);
    const averageResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      : 0;

    const p95Index = Math.floor(responseTimes.length * 0.95);
    const p99Index = Math.floor(responseTimes.length * 0.99);

    return {
      totalUsers: this.getTotalUsers(),
      activeUsers,
      totalTokensUsed,
      totalCost,
      averageSessionLength: averageResponseTime,
      popularAgents,
      errorRate: this.totalRequests > 0 ? (this.errorCount / this.totalRequests) * 100 : 0,
      responseTime: {
        average: averageResponseTime,
        p95: responseTimes[p95Index] || 0,
        p99: responseTimes[p99Index] || 0,
      },
    };
  }

  getUserUsageReport(userId: string): UserUsageReport | null {
    const user = this.authService.getUser(userId);
    if (!user) return null;

    const userSessions = this.sessionMetrics.filter(s => s.userId === userId);
    const tokensUsed = userSessions.reduce((sum, s) => sum + s.llmMetadata.tokensUsed, 0);
    const cost = userSessions.reduce((sum, s) => sum + s.llmMetadata.cost, 0);

    const lastActivity = userSessions.length > 0
      ? new Date(Math.max(...userSessions.map(s => s.createdAt.getTime())))
      : user.createdAt;

    return {
      userId,
      tokensUsed,
      cost,
      sessionsCount: userSessions.length,
      lastActivity,
      plan: user.plan,
      tokenLimit: user.tokenLimit,
    };
  }

  getAllUserReports(): UserUsageReport[] {
    // In production, this would query all users from database
    // For now, return empty array as we don't have user enumeration
    return [];
  }

  getAgentPerformance(agentId: string): {
    totalSessions: number;
    averageTokens: number;
    averageCost: number;
    averageLatency: number;
    successRate: number;
  } | null {
    const agentSessions = this.sessionMetrics.filter(s => s.agentId === agentId);
    if (agentSessions.length === 0) return null;

    const totalSessions = agentSessions.length;
    const averageTokens = agentSessions.reduce((sum, s) => sum + s.llmMetadata.tokensUsed, 0) / totalSessions;
    const averageCost = agentSessions.reduce((sum, s) => sum + s.llmMetadata.cost, 0) / totalSessions;
    const averageLatency = agentSessions.reduce((sum, s) => sum + s.llmMetadata.latency, 0) / totalSessions;

    // Assuming all sessions in our mock data are successful
    const successRate = 100;

    return {
      totalSessions,
      averageTokens,
      averageCost,
      averageLatency,
      successRate,
    };
  }

  getSystemHealth(): {
    status: 'healthy' | 'warning' | 'critical';
    uptime: number;
    memoryUsage: number;
    errorRate: number;
    alerts: string[];
  } {
    const metrics = this.getGlobalMetrics();
    const alerts: string[] = [];

    // Check error rate
    if (metrics.errorRate > 5) {
      alerts.push(`High error rate: ${metrics.errorRate.toFixed(2)}%`);
    }

    // Check response time
    if (metrics.responseTime.average > 5000) {
      alerts.push(`Slow response time: ${metrics.responseTime.average.toFixed(0)}ms average`);
    }

    // Determine status
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (alerts.length > 0) {
      status = 'warning';
    }
    if (metrics.errorRate > 10 || metrics.responseTime.average > 10000) {
      status = 'critical';
    }

    return {
      status,
      uptime: 86400, // Mock uptime: 24 hours in seconds
      memoryUsage: 0, // Would need actual memory monitoring
      errorRate: metrics.errorRate,
      alerts,
    };
  }

  // Cleanup old metrics (should be called periodically)
  cleanupOldMetrics(olderThanDays: number = 30): void {
    const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
    this.sessionMetrics = this.sessionMetrics.filter(s => s.createdAt >= cutoffDate);
  }

  private getTotalUsers(): number {
    // In production, this would query the user database
    // For now, return a mock number
    return 150; // Mock total users
  }
}