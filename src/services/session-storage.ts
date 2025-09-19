import fs from 'fs';
import path from 'path';

export class SessionStorage {
  private static instance: SessionStorage;
  private sessionsFilePath: string;

  private constructor() {
    // Store sessions in a .sessions file in the project root
    this.sessionsFilePath = path.join(process.cwd(), '.sessions.json');
    this.ensureSessionsFile();
  }

  public static getInstance(): SessionStorage {
    if (!SessionStorage.instance) {
      SessionStorage.instance = new SessionStorage();
    }
    return SessionStorage.instance;
  }

  private ensureSessionsFile(): void {
    if (!fs.existsSync(this.sessionsFilePath)) {
      fs.writeFileSync(this.sessionsFilePath, JSON.stringify({}));
    }
  }

  private readSessions(): Record<string, any> {
    try {
      const data = fs.readFileSync(this.sessionsFilePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading sessions file:', error);
      return {};
    }
  }

  private writeSessions(sessions: Record<string, any>): void {
    try {
      fs.writeFileSync(this.sessionsFilePath, JSON.stringify(sessions, null, 2));
    } catch (error) {
      console.error('Error writing sessions file:', error);
    }
  }

  public set(sessionId: string, tokens: any): void {
    const sessions = this.readSessions();
    sessions[sessionId] = {
      ...tokens,
      createdAt: new Date().toISOString(),
    };
    this.writeSessions(sessions);
  }

  public get(sessionId: string): any {
    const sessions = this.readSessions();
    return sessions[sessionId];
  }

  public has(sessionId: string): boolean {
    const sessions = this.readSessions();
    return sessionId in sessions;
  }

  public delete(sessionId: string): void {
    const sessions = this.readSessions();
    delete sessions[sessionId];
    this.writeSessions(sessions);
  }

  public keys(): string[] {
    const sessions = this.readSessions();
    return Object.keys(sessions);
  }

  public clear(): void {
    this.writeSessions({});
  }

  // Clean up expired sessions (optional enhancement)
  public cleanup(): void {
    const sessions = this.readSessions();
    const now = new Date().getTime();
    const oneWeekInMs = 7 * 24 * 60 * 60 * 1000; // 1 week

    const cleanedSessions = Object.fromEntries(
      Object.entries(sessions).filter(([_, tokenData]: [string, any]) => {
        const createdAt = new Date(tokenData.createdAt).getTime();
        return now - createdAt < oneWeekInMs;
      })
    );

    this.writeSessions(cleanedSessions);
  }
}