import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import { z } from 'zod';
import { authenticateToken, generateToken, verifySimpleToken, AuthenticatedRequest } from './auth';

const app = express();

// Simple in-memory storage for user-specific data
// In a real app, this would be in the database
const userEntries: { [email: string]: any[] } = {};

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

// Authentication routes
app.post('/api/auth/google', async (req, res) => {
  try {
    const { idToken } = req.body;
    
    if (!idToken) {
      return res.status(400).json({ error: 'Token required' });
    }

    const userData = await verifySimpleToken(idToken);
    
    // For now, just return the user data without database storage
    // In a real app, you'd store this in the database
    const token = generateToken(userData.userId, userData.email, userData.name, userData.picture);
    
    res.json({
      token,
      user: {
        id: userData.userId,
        email: userData.email,
        name: userData.name,
        picture: userData.picture
      }
    });
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    // For now, just return the user data from the token
    // In a real app, you'd fetch this from the database
    res.json({
      id: req.user!.id,
      email: req.user!.email,
      name: req.user!.name,
      picture: req.user!.picture
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

app.get('/api/health', async (req, res) => {
  res.json({ 
    status: 'OK', 
    database: 'connected',
    timestamp: new Date().toISOString() 
  });
});

// Get all entries/exits (temporarily without auth until migration completes)
app.get('/api/entries', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    console.log('Attempting to fetch entries for user:', req.user!.email);
    
    // Get user-specific entries from in-memory storage
    const userEmail = req.user!.email;
    const userSpecificEntries = userEntries[userEmail] || [];
    
    // For now, only return user-specific entries
    // Legacy entries are not user-specific, so we exclude them
    const allEntries = [...userSpecificEntries];
    
    console.log(`Successfully fetched ${allEntries.length} entries for user ${userEmail}`);
    res.json(allEntries);
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

// Add new entry/exit for the authenticated user
app.post('/api/entries', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const validatedData = entryExitSchema.parse(req.body);
    const userEmail = req.user!.email;
    
    // Create entry with user email
    const entry = {
      id: `entry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: validatedData.type,
      date: new Date(validatedData.date),
      portOfEntry: validatedData.portOfEntry,
      notes: validatedData.notes,
      proofLink: validatedData.proofLink,
      i94Proof: validatedData.i94Proof,
      userEmail: userEmail,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Store in user-specific storage
    if (!userEntries[userEmail]) {
      userEntries[userEmail] = [];
    }
    userEntries[userEmail].push(entry);
    
    console.log(`Created entry for user ${userEmail}:`, entry.id);
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

// Get total days in Canada for the authenticated user
app.get('/api/stats', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userEmail = req.user!.email;
    
    // Get user-specific entries
    const userSpecificEntries = userEntries[userEmail] || [];
    
    const totalDays = calculateDaysInCanada(userSpecificEntries);
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

// Delete entry for the authenticated user
app.delete('/api/entries/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const userEmail = req.user!.email;
    
    // Check if entry exists in user's data
    const userSpecificEntries = userEntries[userEmail] || [];
    const entryIndex = userSpecificEntries.findIndex(entry => entry.id === id);
    
    if (entryIndex !== -1) {
      // Remove from user-specific storage
      userSpecificEntries.splice(entryIndex, 1);
      console.log(`Deleted entry ${id} for user ${userEmail}`);
      res.status(204).send();
    } else {
      // Entry not found in user's data
      res.status(404).json({ error: 'Entry not found' });
    }
  } catch (error) {
    console.error('Error deleting entry:', error);
    res.status(500).json({ error: 'Failed to delete entry' });
  }
});



const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});
