import express from "express";
import {
  createWorker,
  getAllWorkers,
  getWorkerById,
  updateWorker,
  deleteWorker,
  getTopWorkers,
  toggleAvailability,
  getActiveWorkers
} from "@/controllers/worker.controller";

const router = express.Router();

router.post("/", createWorker);
router.get("/", getAllWorkers);
router.get("/top", getTopWorkers);
router.get("/:id", getWorkerById);
router.put("/:id", updateWorker);
router.delete("/:id", deleteWorker);
router.patch("/:id/availability", toggleAvailability);
router.get("/active", getActiveWorkers);

export default router;
