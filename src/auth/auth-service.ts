export interface User {
  id: string;
  email: string;
  name: string;
  plan: 'free' | 'pro' | 'team';
  tokenLimit: number;
  tokensUsed: number;
  createdAt: Date;
  lastLoginAt: Date;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}

export class AuthService {
  private users: Map<string, User> = new Map();
  private sessions: Map<string, { userId: string; expiresAt: Date }> = new Map();

  async register(email: string, password: string, name: string): Promise<AuthResult> {
    // Check if user already exists
    const existingUser = Array.from(this.users.values()).find(u => u.email === email);
    if (existingUser) {
      return { success: false, error: 'User already exists' };
    }

    // Create new user
    const user: User = {
      id: this.generateId(),
      email,
      name,
      plan: 'free',
      tokenLimit: 1000, // Free tier limit
      tokensUsed: 0,
      createdAt: new Date(),
      lastLoginAt: new Date(),
    };

    this.users.set(user.id, user);

    // Create session
    const token = this.generateToken();
    this.sessions.set(token, {
      userId: user.id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    return { success: true, user, token };
  }

  async login(email: string, password: string): Promise<AuthResult> {
    // Find user by email
    const user = Array.from(this.users.values()).find(u => u.email === email);
    if (!user) {
      return { success: false, error: 'Invalid credentials' };
    }

    // Update last login
    user.lastLoginAt = new Date();
    this.users.set(user.id, user);

    // Create session
    const token = this.generateToken();
    this.sessions.set(token, {
      userId: user.id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    return { success: true, user, token };
  }

  async validateToken(token: string): Promise<User | null> {
    const session = this.sessions.get(token);
    if (!session) return null;

    if (session.expiresAt < new Date()) {
      this.sessions.delete(token);
      return null;
    }

    const user = this.users.get(session.userId);
    return user || null;
  }

  async logout(token: string): Promise<boolean> {
    return this.sessions.delete(token);
  }

  async updateUserPlan(userId: string, plan: 'free' | 'pro' | 'team'): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) return false;

    user.plan = plan;

    // Update token limits based on plan
    switch (plan) {
      case 'free':
        user.tokenLimit = 1000;
        break;
      case 'pro':
        user.tokenLimit = 10000;
        break;
      case 'team':
        user.tokenLimit = 50000;
        break;
    }

    this.users.set(userId, user);
    return true;
  }

  async updateTokenUsage(userId: string, tokensUsed: number): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) return false;

    user.tokensUsed += tokensUsed;
    this.users.set(userId, user);
    return true;
  }

  async checkTokenLimit(userId: string, requestedTokens: number): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) return false;

    return (user.tokensUsed + requestedTokens) <= user.tokenLimit;
  }

  getUser(userId: string): User | null {
    return this.users.get(userId) || null;
  }

  // Clean up expired sessions (should be called periodically)
  cleanupExpiredSessions(): void {
    const now = new Date();
    for (const [token, session] of this.sessions.entries()) {
      if (session.expiresAt < now) {
        this.sessions.delete(token);
      }
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private generateToken(): string {
    return this.generateId() + this.generateId();
  }
}