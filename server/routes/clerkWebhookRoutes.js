import express from 'express';
import { inngest } from '../inngest/index.js';

const router = express.Router();

// Clerk webhook endpoint - receives Clerk events and forwards them to Inngest
router.post('/', async (req, res) => {
    try {
        const { type, data } = req.body;

        // Map Clerk event types to Inngest event names
        const eventMap = {
            "user.created": "clerk/user.created",
            "user.updated": "clerk/user.updated",
            "user.deleted": "clerk/user.deleted",
            "organization.created": "clerk/organization.created",
            "organization.updated": "clerk/organization.updated",
            "organization.deleted": "clerk/organization.deleted",
            "organizationInvitation.accepted": "clerk/organizationInvitation.accepted",
        };

        const eventName = eventMap[type];

        if (!eventName) {
            console.log(`Unknown Clerk event type: ${type}`);
            return res.status(200).json({ message: 'Event type not handled' });
        }

        // Send event to Inngest
        await inngest.send({
            name: eventName,
            data: data,
        });

        console.log(`Sent ${eventName} event to Inngest`);
        res.status(200).json({ message: 'Webhook received and forwarded to Inngest' });
    } catch (error) {
        console.error('Error processing Clerk webhook:', error);
        res.status(500).json({ message: error.message });
    }
});

export default router;

