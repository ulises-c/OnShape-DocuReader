import fs from 'fs';
import path from 'path';
import { Store } from 'express-session';

export class SessionStorage extends Store {
  private static instance: SessionStorage;
  private sessionsFilePath: string;
  private sessions: Record<string, any>;

  private constructor() {
    super();
    // Store sessions in a .sessions file in the project root
    this.sessionsFilePath = path.join(process.cwd(), '.sessions.json');
    this.sessions = {};
    this.load();
  }

  public static getInstance(): SessionStorage {
    if (!SessionStorage.instance) {
      SessionStorage.instance = new SessionStorage();
    }
    return SessionStorage.instance;
  }

  public load(): void {
    try {
      if (fs.existsSync(this.sessionsFilePath)) {
        const data = fs.readFileSync(this.sessionsFilePath, 'utf8');
        this.sessions = JSON.parse(data);
      } else {
        this.sessions = {};
        this.persist();
      }
    } catch (error) {
      console.error('Error loading sessions file:', error);
      this.sessions = {};
    }
  }

  private persist(): void {
    try {
      fs.writeFileSync(this.sessionsFilePath, JSON.stringify(this.sessions, null, 2), { encoding: 'utf8', flag: 'w' });
    } catch (error) {
      console.error('Error writing sessions file:', error);
    }
  }

  // Express-session Store interface methods
  public get(sid: string, callback: (err: any, session?: any) => void): void {
    try {
      const session = this.sessions[sid];
      callback(null, session || null);
    } catch (error) {
      callback(error);
    }
  }

  public set(sid: string, session: any, callback?: (err?: any) => void): void {
    try {
      this.sessions[sid] = {
        ...session,
        lastAccess: new Date().toISOString(),
      };
      this.persist();
      if (callback) callback(null);
    } catch (error) {
      if (callback) callback(error);
    }
  }

  public destroy(sid: string, callback?: (err?: any) => void): void {
    try {
      delete this.sessions[sid];
      this.persist();
      if (callback) callback(null);
    } catch (error) {
      if (callback) callback(error);
    }
  }

  public all(callback: (err: any, obj?: any) => void): void {
    try {
      callback(null, this.sessions);
    } catch (error) {
      callback(error);
    }
  }

  public length(callback: (err: any, length?: number) => void): void {
    try {
      callback(null, Object.keys(this.sessions).length);
    } catch (error) {
      callback(error);
    }
  }

  public clear(callback?: (err?: any) => void): void {
    try {
      this.sessions = {};
      this.persist();
      if (callback) callback(null);
    } catch (error) {
      if (callback) callback(error);
    }
  }

  public touch(sid: string, session: any, callback?: (err?: any) => void): void {
    try {
      if (this.sessions[sid]) {
        this.sessions[sid].lastAccess = new Date().toISOString();
        this.persist();
      }
      if (callback) callback(null);
    } catch (error) {
      if (callback) callback(error);
    }
  }

  // Clean up expired sessions (optional enhancement)
  public cleanup(): void {
    const now = new Date().getTime();
    const oneWeekInMs = 7 * 24 * 60 * 60 * 1000; // 1 week

    const cleanedSessions = Object.fromEntries(
      Object.entries(this.sessions).filter(([_, session]: [string, any]) => {
        const lastAccess = new Date(session.lastAccess || session.cookie?.expires || 0).getTime();
        return now - lastAccess < oneWeekInMs;
      })
    );

    if (Object.keys(cleanedSessions).length !== Object.keys(this.sessions).length) {
      this.sessions = cleanedSessions;
      this.persist();
    }
  }
}
