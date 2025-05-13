import { Project } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: any;
      project?: Project;
    }
  }
}

export {}; 