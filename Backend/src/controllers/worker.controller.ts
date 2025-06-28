import { db } from "@/config/drizzle";
import { workers, jobs, transactions, reviews, liveLocations, specializations } from "@/db/schema";
import { workerSchema } from "@/types/validation";
import { eq, sql, and, count, avg, sum } from "drizzle-orm";
import { Request, Response } from "express";
import { ZodError } from "zod";

// Create Worker
export const createWorker = async (req: Request, res: Response) => {
  try {
    const parsedData = workerSchema.omit({ createdAt: true, id: true }).parse(req.body);

    const formattedData = {
      ...parsedData,
      dateOfBirth: parsedData.dateOfBirth.toISOString().split("T")[0],
    };

    const newWorker = await db
      .insert(workers)
      .values(formattedData)
      .returning();

    res.status(201).json({ message: "Worker created", data: newWorker[0] });
  } catch (error: any) {
    if (error instanceof ZodError) {
      const formattedErrors = error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));
      res
        .status(400)
        .json({ message: "Validation failed", errors: formattedErrors });
      return;
    }
    res.status(400).json({ error: error.message || "Failed to create worker" });
    return;
  }
};

//  Get All Workers
export const getAllWorkers = async (req: Request, res: Response) => {
  try {
    const { email } = req.query;
    
    if (email) {
      // Filter by email
      const workersByEmail = await db.select().from(workers).where(eq(workers.email, email as string));
      res.status(200).json({ data: workersByEmail });
    } else {
      // Get all workers
      const allWorkers = await db.select().from(workers);
      res.status(200).json({ data: allWorkers });
    }
  } catch (error) {
    console.error("Error fetching workers:", error);
    res.status(500).json({ error: "Failed to fetch workers" });
  }
};

// Get Worker by ID
export const getWorkerById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const worker = await db.select().from(workers).where(eq(workers.id, id));

    if (worker.length === 0) {
      res.status(404).json({ error: "Worker not found" });
      return;
    }

    res.status(200).json({ data: worker[0] });
  } catch (error) {
    console.error("Error fetching worker:", error);
    res.status(500).json({ error: "Failed to fetch worker" });
    return;
  }
};

//  Update Worker
export const updateWorker = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const parsedData = workerSchema.partial().parse(req.body);

    // Format data for database
    const updatedData: any = { ...parsedData };
    if (parsedData.dateOfBirth) {
      updatedData.dateOfBirth = parsedData.dateOfBirth
        .toISOString()
        .split("T")[0];
    }

    const updated = await db
      .update(workers)
      .set(updatedData)
      .where(eq(workers.id, id))
      .returning();

    if (updated.length === 0) {
      res.status(404).json({ error: "Worker not found or not updated" });
      return;
    }

    res.status(200).json({ message: "Worker updated", data: updated[0] });
  } catch (error: any) {
    if (error instanceof ZodError) {
      const formattedErrors = error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));
      res
        .status(400)
        .json({ message: "Validation failed", errors: formattedErrors });
      return;
    }
    res.status(400).json({ error: error.message || "Failed to update worker" });
    return;
  }
};

//  Delete Worker
export const deleteWorker = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const deleted = await db
      .delete(workers)
      .where(eq(workers.id, id))
      .returning();

    if (deleted.length === 0) {
      res.status(404).json({ error: "Worker not found" });
      return;
    }

    res.status(200).json({ message: "Worker deleted", data: deleted[0] });
  } catch (error) {
    console.error("Error deleting worker:", error);
    res.status(500).json({ error: "Failed to delete worker" });
    return;
  }
};

// Toggle worker availability
export const toggleAvailability = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isActive, lat, lng } = req.body;

    // Add debug logging
    console.log('Request body received:', req.body);
    console.log('isActive value:', isActive, typeof isActive);

    // Validate isActive is a boolean
    if (typeof isActive !== 'boolean') {
      res.status(400).json({ 
        error: "isActive must be a boolean value (true/false)",
        receivedValue: isActive,
        receivedType: typeof isActive
      });
      return;
    }

    const updateData = {
      isActive,
      lastActiveAt: new Date()
    };

    // Update live location if provided
    if (lat && lng) {
      await db.insert(liveLocations)
        .values({ workerId: id, lat, lng, createdAt: new Date() })
        .onConflictDoUpdate({
          target: liveLocations.workerId,
          set: { lat, lng, createdAt: new Date() }
        });
    }

    const [updatedWorker] = await db.update(workers)
      .set(updateData)
      .where(eq(workers.id, id))
      .returning();

    // Verify the update worked
    console.log('Database update result:', updatedWorker);

    res.status(200).json({
      message: `Worker marked as ${isActive ? 'active' : 'inactive'}`,
      isActive: updatedWorker.isActive, // Return the actual value from DB
      data: updatedWorker
    });

  } catch (error) {
    console.error("Error in toggleAvailability:", error);
    res.status(500).json({ 
      error: "Failed to update availability",
      details: error instanceof Error ? error.message : String(error)
    });
  }
};

// Get active workers by specialization
export const getActiveWorkers = async (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    
    const query = db.select()
      .from(workers)
      .innerJoin(liveLocations, eq(workers.id, liveLocations.workerId))
      .leftJoin(specializations, eq(workers.id, specializations.workerId))
      .where(
        and(
          eq(workers.isActive, true),
          category ? eq(specializations.category, category as string) : undefined
        )
      );

    const result = await query;
    res.status(200).json({ data: result });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch active workers" });
  }
};

// Get Top Workers with Statistics
export const getTopWorkers = async (_req: Request, res: Response) => {
  try {
    // Get workers with their statistics
    const workersWithStats = await db
      .select({
        id: workers.id,
        firstName: workers.firstName,
        lastName: workers.lastName,
        email: workers.email,
        experienceYears: workers.experienceYears,
        profilePicture: workers.profilePicture,
        // Calculate total income from completed transactions
        totalIncome: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`,
        // Calculate average rating from reviews
        averageRating: sql<number>`COALESCE(AVG(${reviews.rating}), 0)`,
        // Calculate completion rate (completed jobs / total jobs)
        totalJobs: count(jobs.id),
        completedJobs: sql<number>`COUNT(CASE WHEN ${jobs.status} = 'completed' THEN 1 END)`,
      })
      .from(workers)
      .leftJoin(jobs, eq(workers.id, jobs.workerId))
      .leftJoin(transactions, eq(jobs.id, transactions.jobId))
      .leftJoin(reviews, eq(workers.id, reviews.workerId))
      .groupBy(workers.id, workers.firstName, workers.lastName, workers.email, workers.experienceYears, workers.profilePicture)
      .orderBy(sql`COALESCE(SUM(${transactions.amount}), 0) DESC`);

    // Transform the data to match the frontend interface
    const transformedData = workersWithStats.map(worker => ({
      id: worker.id,
      name: `${worker.firstName} ${worker.lastName}`,
      email: worker.email,
      experienceYears: worker.experienceYears || 0,
      profilePicture: worker.profilePicture,
      income: Number(worker.totalIncome) || 0,
      rating: Number(worker.averageRating) || 0,
      completionRate: worker.totalJobs > 0 
        ? Math.round((Number(worker.completedJobs) / Number(worker.totalJobs)) * 100)
        : 0,
      totalJobs: Number(worker.totalJobs) || 0,
      completedJobs: Number(worker.completedJobs) || 0,
    }));

    res.status(200).json({ 
      message: "Top workers fetched successfully", 
      data: transformedData 
    });
  } catch (error) {
    console.error("Error fetching top workers:", error);
    res.status(500).json({ error: "Failed to fetch top workers" });
  }
};
