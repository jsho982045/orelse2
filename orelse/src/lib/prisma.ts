// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

// Augment the NodeJS global type to include 'prisma'
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      // log: ['query', 'info', 'warn', 'error'], // Enable for dev debugging
    });
  }
  prisma = global.prisma;
}

export default prisma;