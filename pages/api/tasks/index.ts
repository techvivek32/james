import type { NextApiRequest, NextApiResponse } from "next";
import { connectMongo } from "../../../src/lib/mongodb";
import { TaskModel } from "../../../src/lib/models/Task";
import { requireAuth } from "../../../src/lib/auth";

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await connectMongo();

  if (req.method === "GET") {
    const { assignedTo } = req.query;
    const query: any = {};
    if (assignedTo) {
      query.assignedTo = assignedTo;
    }
    const tasks = await TaskModel.find(query).lean();
    res.status(200).json(tasks);
    return;
  }

  if (req.method === "POST") {
    const { assignedTo, ...taskData } = req.body;
    
    // If assignedTo is an array, create multiple tasks
    if (Array.isArray(assignedTo) && assignedTo.length > 0) {
      const tasks = await Promise.all(
        assignedTo.map((userId: string) => 
          TaskModel.create({
            ...taskData,
            id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            assignedTo: userId
          })
        )
      );
      res.status(201).json(tasks);
    } else {
      // Single user, create one task
      const task = await TaskModel.create(req.body);
      res.status(201).json(task);
    }
    return;
  }

  if (req.method === "PUT") {
    const { id } = req.body;
    const task = await TaskModel.findOneAndUpdate(
      { id },
      req.body,
      { new: true }
    ).lean();
    res.status(200).json(task);
    return;
  }

  if (req.method === "DELETE") {
    const { id } = req.body;
    await TaskModel.findOneAndDelete({ id });
    res.status(204).end();
    return;
  }

  res.setHeader("Allow", "GET, POST, PUT, DELETE");
  res.status(405).end();
}

export default requireAuth(handler);
