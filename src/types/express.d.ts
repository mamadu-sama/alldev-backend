import { Role } from "@prisma/client";

declare global {
  namespace Express {
    // Augment the User interface which is used by req.user
    interface User {
      id: string;
      username: string;
      email: string;
      roles: Role[];
    }
  }
}
