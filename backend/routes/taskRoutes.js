
import express from "express";
import mongoose from "mongoose";
import Task from "../models/task.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Every task route requires authentication
router.use(auth);

// GET /api/tasks?status=Pending&search=study
router.get("/", async (req, res) => {
  try {
    const filter = { user: req.userId };

    if (["Pending", "Completed"].includes(req.query.status)) {
      filter.status = req.query.status;
    }

    if (req.query.search?.trim()) {
      filter.title = {
        $regex: req.query.search.trim(),
        $options: "i"
      };
    }

    const tasks = await Task.find(filter)
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch {
    res.status(500).json({ message: "Could not fetch tasks" });
  }
});

// POST /api/tasks
router.post("/", async (req, res) => {
  try {
    const { title, description, priority, dueDate } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({
        message: "Task title is required"
      });
    }

    if (title.trim().length > 120) {
      return res.status(400).json({
        message: "Title cannot exceed 120 characters"
      });
    }

    if (description && description.length > 1000) {
      return res.status(400).json({
        message: "Description cannot exceed 1000 characters"
      });
    }

    if (priority !== undefined &&
        !["Low", "Medium", "High"].includes(priority)) {
      return res.status(400).json({
        message: "Invalid priority"
      });
    }

    if (dueDate && Number.isNaN(Date.parse(dueDate))) {
      return res.status(400).json({
        message: "Invalid due date"
      });
    }

    const task = await Task.create({
      title: title.trim(),
      description,
      priority,
      dueDate: dueDate || null,
      user: req.userId
    });

    res.status(201).json(task);
  } catch {
    res.status(500).json({ message: "Could not create task" });
  }
});

// PUT /api/tasks/:id
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid task ID" });
    }

    const allowed = ["title", "description", "priority", "status", "dueDate"];
    const updates = {};

    for (const key of allowed) {
      if (Object.hasOwn(req.body, key)) {
        updates[key] = req.body[key];
      }
    }

    if (Object.hasOwn(updates, "title")) {
      if (typeof updates.title !== "string" || !updates.title.trim()) {
        return res.status(400).json({ message: "Title is required" });
      }
      updates.title = updates.title.trim();
    }

    if (updates.priority !== undefined &&
        !["Low", "Medium", "High"].includes(updates.priority)) {
      return res.status(400).json({ message: "Invalid priority" });
    }

    if (updates.status !== undefined &&
        !["Pending", "Completed"].includes(updates.status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    if (updates.description !== undefined &&
        (typeof updates.description !== "string" ||
         updates.description.length > 1000)) {
      return res.status(400).json({ message: "Invalid description" });
    }

    if (updates.dueDate !== undefined) {
      if (updates.dueDate === "") {
        updates.dueDate = null;
      } else if (updates.dueDate !== null &&
                 Number.isNaN(Date.parse(updates.dueDate))) {
        return res.status(400).json({ message: "Invalid due date" });
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No valid fields provided" });
    }

    const task = await Task.findOneAndUpdate(
      { _id: id, user: req.userId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json(task);
  } catch {
    res.status(500).json({ message: "Could not update task" });
  }
});

// DELETE /api/tasks/:id
router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid task ID" });
    }

    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      user: req.userId
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json({ message: "Task deleted successfully" });
  } catch {
    res.status(500).json({ message: "Could not delete task" });
  }
});

export default router;