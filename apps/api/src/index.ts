import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { PrismaClient } from '../generated/prisma';
import { z } from 'zod';
// import { authenticateToken, generateToken, verifyGoogleToken, AuthenticatedRequest } from './auth';

const app = express();
const prisma = new PrismaClient();
const logger = pinoHttp();

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    'https://canada-tracker-web.onrender.com',
    'https://canada-tracker-web.onrender.com/',
    'http://localhost:5173', // For local development
    'http://localhost:3000',  // Alternative local dev port
    'http://localhost:4173'   // Vite preview port
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());
app.use(logger);

// Validation schemas
const entryExitSchema = z.object({
  type: z.enum(['ENTRY', 'EXIT']),
  date: z.string().datetime(),
  portOfEntry: z.string().min(1, 'Port of entry is required'),
  notes: z.string().optional(),
  proofLink: z.string().url().optional().or(z.literal('')), // Allow empty string or valid URL
  i94Proof: z.string().url().optional().or(z.literal('')) // Allow empty string or valid URL
});

// Helper function to calculate days in Canada
function calculateDaysInCanada(entries: any[]): number {
  let totalDays = 0;
  let currentEntry: any = null;
  const sortedEntries = entries.sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  console.log('Calculating days for entries:', sortedEntries.map(e => ({
    type: e.type,
    date: e.date,
    localDate: new Date(e.date).toLocaleDateString()
  })));
  
  // Process all completed entry/exit pairs
  for (let i = 0; i < sortedEntries.length; i++) {
    const entry = sortedEntries[i];
    
    if (entry.type === 'ENTRY') {
      currentEntry = entry;
    } else if (entry.type === 'EXIT' && currentEntry) {
      const entryDate = new Date(currentEntry.date);
      const exitDate = new Date(entry.date);
      const entryDay = entryDate.toLocaleDateString('en-CA');
      const exitDay = exitDate.toLocaleDateString('en-CA');
      
      console.log(`Processing: Entry ${entryDay} -> Exit ${exitDay}`);
      
      if (entryDay === exitDay) {
        totalDays += 1;
        console.log(`Same day: +1 day (total: ${totalDays})`);
      } else {
        const startDate = new Date(entryDay);
        const endDate = new Date(exitDay);
        let currentDate = new Date(startDate);
        
        while (currentDate <= endDate) {
          totalDays += 1;
          console.log(`Day ${currentDate.toLocaleDateString()}: +1 day (total: ${totalDays})`);
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
      currentEntry = null;
    }
  }
  
  // Only count current open entry if it's the most recent entry and has no exit
  if (currentEntry) {
    // Check if this is the most recent entry (no subsequent entries)
    const currentEntryDate = new Date(currentEntry.date);
    const isMostRecent = !sortedEntries.some(entry => {
      const entryDate = new Date(entry.date);
      return entryDate > currentEntryDate;
    });
    
    // Check if there are any completed entry/exit pairs in the entire dataset
    const hasAnyCompletedPairs = (() => {
      let completedPairs = 0;
      let tempEntry = null;
      
      for (const entry of sortedEntries) {
        if (entry.type === 'ENTRY') {
          tempEntry = entry;
        } else if (entry.type === 'EXIT' && tempEntry) {
          completedPairs++;
          tempEntry = null;
        }
      }
      
      return completedPairs > 0;
    })();
    
    if (isMostRecent && !hasAnyCompletedPairs) {
      const entryDate = new Date(currentEntry.date);
      const today = new Date();
      const entryDay = entryDate.toLocaleDateString('en-CA');
      const todayDay = today.toLocaleDateString('en-CA');
      
      console.log(`Current open entry: Entry ${entryDay} -> Today ${todayDay}`);
      
      if (entryDay === todayDay) {
        totalDays += 1;
        console.log(`Same day as today: +1 day (total: ${totalDays})`);
      } else {
        const startDate = new Date(entryDay);
        const endDate = new Date(todayDay);
        let currentDate = new Date(startDate);
        
        while (currentDate <= endDate) {
          totalDays += 1;
          console.log(`Day ${currentDate.toLocaleDateString()}: +1 day (total: ${totalDays})`);
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
    } else {
      if (hasAnyCompletedPairs) {
        console.log(`Open entry ${currentEntry.date} ignored - there are completed entry/exit pairs in the dataset`);
      } else {
        console.log(`Past open entry ${currentEntry.date} ignored - not the most recent entry`);
      }
    }
  }
  
  console.log(`Final total days: ${totalDays}`);
  return totalDays;
}

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Canada Tracker API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      entries: '/api/entries',
      stats: '/api/stats'
    },
    timestamp: new Date().toISOString()
  });
});

// Authentication routes (temporarily disabled until migration completes)
/*
app.post('/api/auth/google', async (req, res) => {
  try {
    const { idToken } = req.body;
    
    if (!idToken) {
      return res.status(400).json({ error: 'Google ID token required' });
    }

    const googleUser = await verifyGoogleToken(idToken);
    
    // Find or create user
    let user = await prisma.user.findUnique({
      where: { googleId: googleUser.googleId }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: googleUser.email,
          name: googleUser.name,
          picture: googleUser.picture,
          googleId: googleUser.googleId
        }
      });
    }

    const token = generateToken(user.id);
    
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture
      }
    });
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
});

// app.get('/api/auth/me', authenticateToken, async (req: AuthenticatedRequest, res) => {
//   try {
//     const user = await prisma.user.findUnique({
//       where: { id: req.user!.id }
//     });

//     if (!user) {
//       return res.status(404).json({ error: 'User not found' });
//     }

//     res.json({
//       id: user.id,
//       email: user.email,
//       name: user.name,
//       picture: user.picture
//     });
//   } catch (error) {
//     console.error('Error fetching user:', error);
//     res.status(500).json({ error: 'Failed to fetch user' });
//   }
// });
*/

app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    res.json({ 
      status: 'OK', 
      database: 'connected',
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ 
      status: 'ERROR', 
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString() 
    });
  }
});

// Get all entries/exits (temporarily without auth until migration completes)
app.get('/api/entries', async (req, res) => {
  try {
    console.log('Attempting to fetch entries from database...');
    // For now, get all entries since userId field doesn't exist yet
    const entries = await prisma.entryExit.findMany({
      orderBy: { date: 'asc' }, // Changed from 'desc' to 'asc' for chronological order
    });
    console.log(`Successfully fetched ${entries.length} entries`);
    res.json(entries);
  } catch (error) {
    console.error('Error fetching entries:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      meta: error.meta
    });
    res.status(500).json({ 
      error: 'Failed to fetch entries',
      details: error.message 
    });
  }
});

// Add new entry/exit (temporarily without auth until migration completes)
app.post('/api/entries', async (req, res) => {
  try {
    const validatedData = entryExitSchema.parse(req.body);
    
    const entry = await prisma.entryExit.create({
      data: {
        type: validatedData.type,
        date: new Date(validatedData.date),
        portOfEntry: validatedData.portOfEntry,
        notes: validatedData.notes,
      },
    });
    
    res.status(201).json(entry);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.issues });
    } else {
      console.error('Error creating entry:', error);
      res.status(500).json({ error: 'Failed to create entry' });
    }
  }
});

// Get total days in Canada (temporarily without auth until migration completes)
app.get('/api/stats', async (req, res) => {
  try {
    const entries = await prisma.entryExit.findMany({
      orderBy: { date: 'asc' },
    });
    
    const totalDays = calculateDaysInCanada(entries);
    const remainingDays = Math.max(0, 730 - totalDays);
    
    res.json({
      totalDaysInCanada: totalDays,
      remainingDays: remainingDays,
      targetDays: 730,
      percentageComplete: Math.min(100, (totalDays / 730) * 100),
    });
  } catch (error) {
    console.error('Error calculating stats:', error);
    res.status(500).json({ error: 'Failed to calculate stats' });
  }
});

// Delete entry (temporarily without auth until migration completes)
app.delete('/api/entries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.entryExit.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting entry:', error);
    res.status(500).json({ error: 'Failed to delete entry' });
  }
});

// Update entry (temporarily without auth until migration completes)
app.put('/api/entries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = entryExitSchema.parse(req.body);
    
    const entry = await prisma.entryExit.update({
      where: { id },
      data: {
        type: validatedData.type,
        date: new Date(validatedData.date),
        portOfEntry: validatedData.portOfEntry,
        notes: validatedData.notes,
      },
    });
    
    res.json(entry);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.issues });
    } else {
      console.error('Error updating entry:', error);
      res.status(500).json({ error: 'Failed to update entry' });
    }
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});
