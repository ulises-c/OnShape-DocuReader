import 'express-session';

declare module 'express-session' {
  interface SessionData {
    authenticated?: boolean;
    accessToken?: string;
    refreshToken?: string;
  }
}
