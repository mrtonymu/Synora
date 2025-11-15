import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import workspaceRouter from "./routes/workspaceRoutes.js";
import projectRouter from "./routes/projectRoutes.js";
import taskRouter from "./routes/taskRoutes.js";
import commentRouter from "./routes/commentRoutes.js";
import clerkWebhookRouter from "./routes/clerkWebhookRoutes.js";
import { protect } from './middlewares/authMiddleware.js';
import { clerkMiddleware } from '@clerk/express';
import { inngest, functions } from './inngest/index.js';
import { serve } from "inngest/express";

const app = express();

app.use(express.json());
app.use(cors({
    origin: true, // Allow all origins in dev, or specify your frontend URL
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'svix-id', 'svix-signature', 'svix-timestamp'],
}));
app.use(clerkMiddleware());

app.get('/', (req, res) => res.send('Server is live!'));

// Clerk webhook endpoint (no signature validation needed for Clerk)
app.use("/api/clerk-webhook", clerkWebhookRouter);

// Inngest serve endpoint (for Inngest's own calls, with signature validation)
app.use("/api/inngest", serve({ client: inngest, functions }));

// Routes
app.use("/api/workspaces", protect, workspaceRouter);
app.use("/api/projects", protect, projectRouter);
app.use("/api/tasks", protect, taskRouter);
app.use("/api/comments", protect, commentRouter);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));