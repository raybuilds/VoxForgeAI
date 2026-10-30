import { ConversationSession } from "@/types/agent";

export interface MockScenarioOptions {
  agentId: string;
  agentName: string;
  scenarioType?:
    | "appointment_booking"
    | "customer_enquiry"
    | "complaint_escalation"
    | "unresolved_request"
    | "abandoned_conversation";
}

/**
 * Deterministic Mock Session Provider (M5 Observability)
 * Generates realistic yet clearly labeled simulated sessions for testing and observability.
 */
export class MockSessionProvider {
  name = "MockSessionProvider";

  generateSession(options: MockScenarioOptions): ConversationSession {
    const { agentId, agentName, scenarioType = "customer_enquiry" } = options;
    const now = new Date();
    const id = crypto.randomUUID();
    const uid = Math.random().toString(36).substring(2, 9);

    switch (scenarioType) {
      case "appointment_booking": {
        const start = new Date(now.getTime() - 15 * 60 * 1000).toISOString();
        const end = new Date(now.getTime() - 11 * 60 * 1000).toISOString();
        return {
          id,
          agentId,
          agentName,
          source: "simulated",
          status: "completed",
          outcome: "resolved",
          startedAt: start,
          endedAt: end,
          summary: "Caller successfully confirmed an appointment reservation for next Wednesday at 2:00 PM.",
          isTestSession: true,
          metrics: {
            durationSeconds: 240,
            userTurns: 3,
            agentTurns: 3,
            totalMessages: 6,
            averageLatencyMs: 410,
            firstResponseLatencyMs: 360,
            interruptionCount: 0,
            sentiment: "positive",
            isSimulatedMetrics: true,
          },
          transcript: [
            {
              id: `tr-${uid}-1`,
              role: "agent",
              text: `Hello! Thank you for calling ${agentName}. How may I assist you with your booking today?`,
              timestamp: start,
              latencyMs: 360,
            },
            {
              id: `tr-${uid}-2`,
              role: "user",
              text: "Hi, I'd like to book an appointment next Wednesday afternoon around 2 PM.",
              timestamp: new Date(new Date(start).getTime() + 15000).toISOString(),
            },
            {
              id: `tr-${uid}-3`,
              role: "agent",
              text: "Wednesday at 2:00 PM is currently available! May I have your full name and best phone number to reserve it?",
              timestamp: new Date(new Date(start).getTime() + 30000).toISOString(),
              latencyMs: 430,
            },
            {
              id: `tr-${uid}-4`,
              role: "user",
              text: "Sure, my name is Jordan Davis, and my number is 555-0199.",
              timestamp: new Date(new Date(start).getTime() + 45000).toISOString(),
            },
            {
              id: `tr-${uid}-5`,
              role: "agent",
              text: "Thank you Jordan. Your reservation for Wednesday at 2:00 PM is confirmed. You will receive an SMS reminder. Have a great day!",
              timestamp: new Date(new Date(start).getTime() + 60000).toISOString(),
              latencyMs: 440,
            },
            {
              id: `tr-${uid}-6`,
              role: "user",
              text: "Thank you so much, appreciate it!",
              timestamp: new Date(new Date(start).getTime() + 75000).toISOString(),
            },
          ],
          createdAt: start,
        };
      }

      case "complaint_escalation": {
        const start = new Date(now.getTime() - 40 * 60 * 1000).toISOString();
        const end = new Date(now.getTime() - 37 * 60 * 1000).toISOString();
        const escTime = new Date(new Date(start).getTime() + 120000).toISOString();
        return {
          id,
          agentId,
          agentName,
          source: "simulated",
          status: "completed",
          outcome: "escalated",
          startedAt: start,
          endedAt: end,
          summary: "Customer reported repeated billing discrepancies and disputed unexpected penalty fees. Escalated to senior supervisor queue.",
          isTestSession: true,
          metrics: {
            durationSeconds: 180,
            userTurns: 2,
            agentTurns: 2,
            totalMessages: 5,
            averageLatencyMs: 340,
            firstResponseLatencyMs: 310,
            interruptionCount: 1,
            sentiment: "negative",
            isSimulatedMetrics: true,
          },
          escalation: {
            occurred: true,
            reason: "Persistent billing fee dispute and caller request for management review",
            target: "human_supervisor_queue",
            escalatedAt: escTime,
          },
          transcript: [
            {
              id: `tr-${uid}-1`,
              role: "agent",
              text: `Welcome to ${agentName} support. How can I assist you with your account today?`,
              timestamp: start,
              latencyMs: 310,
            },
            {
              id: `tr-${uid}-2`,
              role: "user",
              text: "I was charged twice for my subscription this month and now there's an overdue notice! This is the third time this happened.",
              timestamp: new Date(new Date(start).getTime() + 20000).toISOString(),
            },
            {
              id: `tr-${uid}-3`,
              role: "agent",
              text: "I completely understand your frustration with these duplicate charges. Because this involves an ongoing billing dispute, I am immediately routing your case to our Senior Supervisor Queue so they can credit your account directly.",
              timestamp: new Date(new Date(start).getTime() + 45000).toISOString(),
              latencyMs: 370,
            },
            {
              id: `tr-${uid}-4`,
              role: "user",
              text: "Yes, please connect me immediately.",
              timestamp: new Date(new Date(start).getTime() + 60000).toISOString(),
            },
            {
              id: `tr-${uid}-5`,
              role: "system",
              text: `[ESCALATION_TRIGGERED] Handoff initiated to human_supervisor_queue with dispute context attached.`,
              timestamp: escTime,
            },
          ],
          createdAt: start,
        };
      }

      case "unresolved_request": {
        const start = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
        const end = new Date(now.getTime() - 58 * 60 * 1000).toISOString();
        return {
          id,
          agentId,
          agentName,
          source: "simulated",
          status: "completed",
          outcome: "unresolved",
          startedAt: start,
          endedAt: end,
          summary: "Caller requested custom enterprise contract pricing terms beyond autonomous scope without authorizing a sales callback.",
          isTestSession: true,
          metrics: {
            durationSeconds: 120,
            userTurns: 2,
            agentTurns: 2,
            totalMessages: 4,
            averageLatencyMs: 390,
            firstResponseLatencyMs: 380,
            interruptionCount: 0,
            sentiment: "neutral",
            isSimulatedMetrics: true,
          },
          transcript: [
            {
              id: `tr-${uid}-1`,
              role: "agent",
              text: `Hello, thanks for calling ${agentName}. How may I help you?`,
              timestamp: start,
              latencyMs: 380,
            },
            {
              id: `tr-${uid}-2`,
              role: "user",
              text: "Can you offer me a 40% volume discount if we onboard 500 enterprise seats today?",
              timestamp: new Date(new Date(start).getTime() + 15000).toISOString(),
            },
            {
              id: `tr-${uid}-3`,
              role: "agent",
              text: "I can share our standard published volume pricing tiers, but custom 40% enterprise discounts require custom approval from our sales director. Would you like me to connect you with an account executive?",
              timestamp: new Date(new Date(start).getTime() + 30000).toISOString(),
              latencyMs: 400,
            },
            {
              id: `tr-${uid}-4`,
              role: "user",
              text: "No, I needed an answer right now. I'll check back later.",
              timestamp: new Date(new Date(start).getTime() + 45000).toISOString(),
            },
          ],
          createdAt: start,
        };
      }

      case "abandoned_conversation": {
        const start = new Date(now.getTime() - 90 * 60 * 1000).toISOString();
        const end = new Date(now.getTime() - 89 * 60 * 1000).toISOString();
        return {
          id,
          agentId,
          agentName,
          source: "simulated",
          status: "abandoned",
          outcome: "abandoned",
          startedAt: start,
          endedAt: end,
          summary: "Caller disconnected early after the initial greeting before stating an inquiry.",
          isTestSession: true,
          metrics: {
            durationSeconds: 35,
            userTurns: 0,
            agentTurns: 1,
            totalMessages: 2,
            averageLatencyMs: 320,
            firstResponseLatencyMs: 320,
            interruptionCount: 0,
            sentiment: "neutral",
            isSimulatedMetrics: true,
          },
          transcript: [
            {
              id: `tr-${uid}-1`,
              role: "agent",
              text: `Hello, thank you for reaching ${agentName}. How can I assist you today?`,
              timestamp: start,
              latencyMs: 320,
            },
            {
              id: `tr-${uid}-2`,
              role: "system",
              text: "[CALL_DISCONNECTED] Caller terminated voice link without speaking.",
              timestamp: end,
            },
          ],
          createdAt: start,
        };
      }

      case "customer_enquiry":
      default: {
        const start = new Date(now.getTime() - 25 * 60 * 1000).toISOString();
        const end = new Date(now.getTime() - 22 * 60 * 1000).toISOString();
        return {
          id,
          agentId,
          agentName,
          source: "simulated",
          status: "completed",
          outcome: "resolved",
          startedAt: start,
          endedAt: end,
          summary: "Caller verified business hours, weekend support availability, and office location.",
          isTestSession: true,
          metrics: {
            durationSeconds: 180,
            userTurns: 2,
            agentTurns: 2,
            totalMessages: 4,
            averageLatencyMs: 395,
            firstResponseLatencyMs: 370,
            interruptionCount: 0,
            sentiment: "positive",
            isSimulatedMetrics: true,
          },
          transcript: [
            {
              id: `tr-${uid}-1`,
              role: "agent",
              text: `Good day! Thank you for calling ${agentName}. How can I help you today?`,
              timestamp: start,
              latencyMs: 370,
            },
            {
              id: `tr-${uid}-2`,
              role: "user",
              text: "Hi, what are your operating hours on weekends, and do you offer walk-in support?",
              timestamp: new Date(new Date(start).getTime() + 18000).toISOString(),
            },
            {
              id: `tr-${uid}-3`,
              role: "agent",
              text: "We are open on Saturdays from 9 AM to 3 PM for walk-ins, and our emergency support line is open 24/7. Sundays are reserved for pre-booked appointments.",
              timestamp: new Date(new Date(start).getTime() + 35000).toISOString(),
              latencyMs: 420,
            },
            {
              id: `tr-${uid}-4`,
              role: "user",
              text: "Perfect, that's exactly what I needed to know. Thank you!",
              timestamp: new Date(new Date(start).getTime() + 50000).toISOString(),
            },
          ],
          createdAt: start,
        };
      }
    }
  }
}

export const defaultMockSessionProvider = new MockSessionProvider();
