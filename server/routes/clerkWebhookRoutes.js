import express from 'express';
import { inngest } from '../inngest/index.js';

const router = express.Router();

// Clerk webhook endpoint - receives Clerk events and forwards them to Inngest
router.post('/', async (req, res) => {
    try {
        // Log the full request body for debugging
        console.log('Clerk webhook received:', JSON.stringify(req.body, null, 2));
        console.log('Clerk webhook headers:', req.headers);

        // Clerk webhook payload can have different structures
        // Try to get type and data from different possible locations
        const payload = req.body;
        let eventType = null;
        let eventData = {};

        // Clerk v2 format: { type: "...", data: {...} }
        if (payload.type && payload.data) {
            eventType = payload.type;
            eventData = payload.data;
        }
        // Alternative format: { object: "event", type: "...", data: {...} }
        else if (payload.object === 'event' && payload.type && payload.data) {
            eventType = payload.type;
            eventData = payload.data;
        }
        // Fallback: use the entire body if structure is different
        else if (payload.type) {
            eventType = payload.type;
            eventData = payload.data || payload;
        }

        console.log(`Parsed event type: ${eventType}`);

        if (!eventType) {
            console.error('Could not parse Clerk webhook payload:', payload);
            return res.status(400).json({ message: 'Invalid webhook payload format' });
        }

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

        const eventName = eventMap[eventType];

        if (!eventName) {
            console.log(`Unknown Clerk event type: ${eventType}`);
            return res.status(200).json({ message: 'Event type not handled' });
        }

        console.log(`Sending ${eventName} to Inngest with data:`, JSON.stringify(eventData, null, 2));

        // Send event to Inngest
        const result = await inngest.send({
            name: eventName,
            data: eventData,
        });

        console.log(`Successfully sent ${eventName} event to Inngest:`, result);
        res.status(200).json({ message: 'Webhook received and forwarded to Inngest', eventName });
    } catch (error) {
        console.error('Error processing Clerk webhook:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ message: error.message, stack: error.stack });
    }
});

export default router;

