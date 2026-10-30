import { AgentConfig, AgentConfigSchema, ConversationStep, Guardrail, EscalationRule } from "@/types";
import {
  AgentRefinementInput,
  AgentRefinementProvider,
  AgentRefinementResult,
} from "@/types/providers";

/**
 * Deterministic rule-based mock provider for conversational agent configuration refinement.
 * Performs targeted updates while rigorously preserving unrelated fields.
 * Validates output against AgentConfigSchema before returning.
 */
export class MockAgentRefinementProvider implements AgentRefinementProvider {
  name = "MockAgentRefinementProvider";

  async refineAgent(input: AgentRefinementInput): Promise<AgentRefinementResult> {
    const { currentConfig, instruction } = input;
    const text = (instruction || "").trim();
    const lower = text.toLowerCase();

    // Start with a deep clone of currentConfig to guarantee preservation
    const proposed: AgentConfig = JSON.parse(JSON.stringify(currentConfig));
    const modifiedFields: (keyof AgentConfig)[] = [];
    const explanations: string[] = [];

    // Check for ambiguous or empty prompt
    if (
      lower === "make it better" ||
      lower === "improve it" ||
      lower === "fix this" ||
      lower === "update" ||
      lower === "optimize" ||
      lower === "help"
    ) {
      return {
        proposedConfig: currentConfig,
        modifiedFields: [],
        explanation:
          "Your request is broad or ambiguous. To refine the agent effectively, please specify what aspect to adjust—such as persona (e.g. 'more empathetic'), greeting ('shorter welcome message'), guardrails ('never ask for passwords'), or responsibilities ('add appointment booking').",
        clarificationsNeeded: [
          "Do you want to adjust the speaking tone/persona?",
          "Do you want to add or modify a safety guardrail?",
          "Do you want to update the welcome greeting or conversation steps?",
        ],
        source: "rule-based-mock",
      };
    }

    let handled = false;

    // 1. WELCOME MESSAGE REFINEMENTS
    // E.g. "make welcome message shorter", "change greeting to...", "more welcoming greeting"
    if (
      lower.includes("welcome message") ||
      lower.includes("welcome greeting") ||
      lower.includes("greeting") ||
      lower.includes("introduction") ||
      lower.includes("hello message")
    ) {
      if (lower.includes("short") || lower.includes("concise") || lower.includes("brief")) {
        // Shorten the existing welcome message
        const sentences = proposed.welcomeMessage.split(/[.?!]/).filter((s) => s.trim().length > 0);
        if (sentences.length > 1) {
          proposed.welcomeMessage = `${sentences[0].trim()}. How can I help you today?`;
        } else {
          proposed.welcomeMessage = `Hello! How can I assist you today?`;
        }
        modifiedFields.push("welcomeMessage");
        explanations.push("Shortened the welcome greeting to be more concise and direct.");
        handled = true;
      } else if (
        lower.includes("warm") ||
        lower.includes("welcoming") ||
        lower.includes("friendly")
      ) {
        proposed.welcomeMessage = `Hello and a warm welcome! My name is ${proposed.name}. I'm delighted to assist you today—how may I help you?`;
        modifiedFields.push("welcomeMessage");
        explanations.push("Enriched the welcome message with a warmer, more engaging tone.");
        handled = true;
      } else if (lower.includes("hindi") || lower.includes("हिंदी")) {
        proposed.welcomeMessage = `नमस्ते! कॉल करने के लिए धन्यवाद। मेरा नाम ${proposed.name} है। आज मैं आपकी क्या सहायता कर सकता हूँ?`;
        proposed.language = "hi-IN";
        if (!modifiedFields.includes("welcomeMessage")) modifiedFields.push("welcomeMessage");
        if (!modifiedFields.includes("language")) modifiedFields.push("language");
        explanations.push("Updated welcome message to authentic spoken Hindi and set language to hi-IN.");
        handled = true;
      } else if (lower.includes("spanish") || lower.includes("español")) {
        proposed.welcomeMessage = `¡Hola! Gracias por llamar. Mi nombre es ${proposed.name}. ¿En qué puedo ayudarle hoy?`;
        proposed.language = "es-ES";
        if (!modifiedFields.includes("welcomeMessage")) modifiedFields.push("welcomeMessage");
        if (!modifiedFields.includes("language")) modifiedFields.push("language");
        explanations.push("Updated welcome message to Spanish and set language to es-ES.");
        handled = true;
      }
    }

    // 2. PERSONA & COMMUNICATION TONE REFINEMENTS
    // E.g. "more empathetic", "less robotic", "more professional", "more casual", "concise"
    const toneTriggers = [
      { key: "empathetic", desc: "empathetic, active listener who acknowledges customer feelings with genuine warmth and patience" },
      { key: "compassionate", desc: "compassionate, reassuring, and understanding voice presence" },
      { key: "less robotic", desc: "natural conversational speaker using organic phrasing, smooth transitions, and warm intonation" },
      { key: "natural", desc: "relaxed, authentic conversational tone avoiding overly formal robotic scripts" },
      { key: "friendly", desc: "warm, approachable, cheerful, and encouraging assistant" },
      { key: "professional", desc: "polished, articulate, respectful, and authoritative voice representative" },
      { key: "formal", desc: "highly courteous, structured, and formally respectful enterprise representative" },
      { key: "concise", desc: "direct, crisp, and time-efficient voice communicator who delivers answers promptly without fluff" },
      { key: "energetic", desc: "dynamic, upbeat, and motivating conversational guide" },
      { key: "calm", desc: "grounded, calming, patient, and reassuring speaker who excels in de-escalating tense moments" },
    ];

    const matchedTone = toneTriggers.find((t) => lower.includes(t.key));
    if (matchedTone) {
      // Update persona
      proposed.persona = `${proposed.persona}. Tuned to be an exceptionally ${matchedTone.desc}.`;
      if (!modifiedFields.includes("persona")) modifiedFields.push("persona");

      // Complement system instructions with matching vocal guidelines
      const instructionAddendum = `\nVocal delivery guideline: Maintain a ${matchedTone.key} tone throughout. Keep responses conversational, acknowledge caller context empathetically, and adapt pacing smoothly.`;
      if (!proposed.systemInstructions.includes(matchedTone.key)) {
        proposed.systemInstructions = `${proposed.systemInstructions}${instructionAddendum}`;
        if (!modifiedFields.includes("systemInstructions")) modifiedFields.push("systemInstructions");
      }

      explanations.push(`Refined persona and vocal delivery instructions to be ${matchedTone.key}.`);
      handled = true;
    }

    // 3. GUARDRAILS AND RESTRICTIONS
    // E.g. "Never ask patients for passwords or OTPs", "Never promise refunds", "Do not provide medical diagnosis"
    if (
      lower.includes("guardrail") ||
      lower.includes("restriction") ||
      lower.includes("never ask") ||
      lower.includes("never provide") ||
      lower.includes("do not provide") ||
      lower.includes("do not disclose") ||
      lower.includes("never promise") ||
      lower.includes("prohibit") ||
      lower.includes("restrict")
    ) {
      if (
        lower.includes("password") ||
        lower.includes("otp") ||
        lower.includes("pin") ||
        lower.includes("credential")
      ) {
        const existing = proposed.guardrails.find((g) =>
          g.rule.toLowerCase().includes("password") || g.rule.toLowerCase().includes("otp")
        );
        if (!existing) {
          const newGuard: Guardrail = {
            id: `guard-auth-${Date.now().toString(36)}`,
            rule: "Never request, accept, or process caller account passwords, PINs, or one-time verification passwords (OTPs).",
            actionOnViolation: "refuse_politely",
            customResponse:
              "For your security and privacy, I never request or collect passwords, PINs, or OTP codes. Please keep those confidential.",
          };
          proposed.guardrails.push(newGuard);
          if (!modifiedFields.includes("guardrails")) modifiedFields.push("guardrails");
          explanations.push("Added credential protection guardrail prohibiting password and OTP requests.");
          handled = true;
        } else {
          explanations.push("Credential protection guardrail is already present in this agent.");
          handled = true;
        }
      } else if (
        lower.includes("medical") ||
        lower.includes("diagnosis") ||
        lower.includes("prescri") ||
        lower.includes("doctor advice")
      ) {
        const existing = proposed.guardrails.find(
          (g) => g.rule.toLowerCase().includes("medical") || g.rule.toLowerCase().includes("diagnos")
        );
        if (!existing) {
          const newGuard: Guardrail = {
            id: `guard-med-${Date.now().toString(36)}`,
            rule: "Never provide medical diagnosis, clinical evaluation, or prescribe medications.",
            actionOnViolation: "refuse_politely",
            customResponse:
              "I am not authorized to offer medical diagnosis or prescribe medications. Please consult our licensed doctor for a clinical evaluation.",
          };
          proposed.guardrails.push(newGuard);
          if (!modifiedFields.includes("guardrails")) modifiedFields.push("guardrails");
          explanations.push("Added clinical safety guardrail barring medical diagnoses or prescriptions.");
          handled = true;
        } else {
          explanations.push("Medical diagnosis restriction guardrail is already active.");
          handled = true;
        }
      } else if (lower.includes("refund") || lower.includes("money back")) {
        const existing = proposed.guardrails.find((g) => g.rule.toLowerCase().includes("refund"));
        if (!existing) {
          const newGuard: Guardrail = {
            id: `guard-ref-${Date.now().toString(36)}`,
            rule: "Never approve or promise unauthorized refunds or cash disbursements directly over voice.",
            actionOnViolation: "refuse_politely",
            customResponse:
              "I cannot authorize financial refunds directly over voice. I will document your inquiry and route it to our billing department.",
          };
          proposed.guardrails.push(newGuard);
          if (!modifiedFields.includes("guardrails")) modifiedFields.push("guardrails");
          explanations.push("Added financial guardrail prohibiting direct voice refunds.");
          handled = true;
        } else {
          explanations.push("Refund restriction guardrail is already present.");
          handled = true;
        }
      } else if (lower.includes("confidential") || lower.includes("internal") || lower.includes("private data")) {
        const existing = proposed.guardrails.find((g) => g.rule.toLowerCase().includes("confidential"));
        if (!existing) {
          const newGuard: Guardrail = {
            id: `guard-conf-${Date.now().toString(36)}`,
            rule: "Never disclose internal proprietary secrets, API keys, or confidential customer records.",
            actionOnViolation: "refuse_politely",
            customResponse:
              "I cannot share confidential internal records or proprietary system data.",
          };
          proposed.guardrails.push(newGuard);
          if (!modifiedFields.includes("guardrails")) modifiedFields.push("guardrails");
          explanations.push("Added data protection guardrail for confidential company and client data.");
          handled = true;
        }
      } else {
        // Generic custom guardrail extraction
        const newGuard: Guardrail = {
          id: `guard-cust-${Date.now().toString(36)}`,
          rule: text.replace(/^(add|create|please|ensure)\s+/i, ""),
          actionOnViolation: "refuse_politely",
          customResponse:
            "I cannot fulfill this request according to established workspace guidelines.",
        };
        proposed.guardrails.push(newGuard);
        if (!modifiedFields.includes("guardrails")) modifiedFields.push("guardrails");
        explanations.push(`Added custom guardrail: "${newGuard.rule}".`);
        handled = true;
      }
    }

    // 4. ESCALATION RULES
    // E.g. "Escalate unresolved complaints to human", "Transfer urgent cases immediately", "Escalate billing disputes"
    if (
      lower.includes("escalat") ||
      lower.includes("transfer") ||
      lower.includes("human supervisor") ||
      lower.includes("duty manager") ||
      lower.includes("live agent")
    ) {
      if (lower.includes("complaint") || lower.includes("dispute") || lower.includes("angry") || lower.includes("frustrat")) {
        const newRule: EscalationRule = {
          id: `esc-comp-${Date.now().toString(36)}`,
          condition: "Caller expresses unresolved frustration, files a dispute, or insists on speaking with management",
          target: "human_supervisor_queue",
          handoffSummaryPrompt: "Summarize caller issue, dispute details, and customer sentiment before transfer",
        };
        proposed.escalationRules.push(newRule);
        if (!modifiedFields.includes("escalationRules")) modifiedFields.push("escalationRules");
        explanations.push("Added escalation rule routing frustrated callers and disputes to human supervisor queue.");
        handled = true;
      } else if (lower.includes("urgent") || lower.includes("emergency") || lower.includes("immediate")) {
        const newRule: EscalationRule = {
          id: `esc-urg-${Date.now().toString(36)}`,
          condition: "Caller reports an acute emergency, urgent outage, or critical safety situation",
          target: "urgent_response_dispatcher",
          handoffSummaryPrompt: "Immediate emergency transfer with caller contact and emergency severity flag",
        };
        proposed.escalationRules.push(newRule);
        if (!modifiedFields.includes("escalationRules")) modifiedFields.push("escalationRules");
        explanations.push("Added urgent handoff rule prioritizing acute emergency or outage transfers.");
        handled = true;
      } else {
        const newRule: EscalationRule = {
          id: `esc-gen-${Date.now().toString(36)}`,
          condition: "Caller explicitly asks for a human representative or request exceeds autonomous scope",
          target: "human_agent_pool",
          handoffSummaryPrompt: "Provide full conversation transcript and identified caller goals",
        };
        proposed.escalationRules.push(newRule);
        if (!modifiedFields.includes("escalationRules")) modifiedFields.push("escalationRules");
        explanations.push("Added escalation rule transferring to human agent pool on request.");
        handled = true;
      }
    }

    // 5. GOALS AND RESPONSIBILITIES
    // E.g. "Add appointment scheduling", "Include refund enquiries", "Add placement eligibility", "Remove sales"
    if (
      lower.includes("add goal") ||
      lower.includes("add responsibility") ||
      lower.includes("include goal") ||
      lower.includes("handle appointment") ||
      lower.includes("add appointment") ||
      lower.includes("support refund") ||
      lower.includes("track placement") ||
      lower.includes("remove goal")
    ) {
      if (lower.includes("appointment") || lower.includes("scheduling") || lower.includes("booking")) {
        const goalStr = "Schedule, reschedule, and verify appointment dates with callers";
        if (!proposed.goals.includes(goalStr)) {
          proposed.goals.push(goalStr);
          if (!modifiedFields.includes("goals")) modifiedFields.push("goals");
          explanations.push("Added appointment scheduling to primary goals.");
          handled = true;
        }
      } else if (lower.includes("refund") || lower.includes("billing enquiry") || lower.includes("billing inquiry")) {
        const goalStr = "Record and verify billing inquiries and route refund claims to accounts";
        if (!proposed.goals.includes(goalStr)) {
          proposed.goals.push(goalStr);
          if (!modifiedFields.includes("goals")) modifiedFields.push("goals");
          explanations.push("Added billing inquiries handling to primary goals.");
          handled = true;
        }
      } else if (lower.includes("placement") || lower.includes("eligibility") || lower.includes("campus drive")) {
        const goalStr = "Assess student placement eligibility and answer company drive queries";
        if (!proposed.goals.includes(goalStr)) {
          proposed.goals.push(goalStr);
          if (!modifiedFields.includes("goals")) modifiedFields.push("goals");
          explanations.push("Added campus placement eligibility assessment to primary goals.");
          handled = true;
        }
      } else if (lower.includes("remove sales")) {
        proposed.goals = proposed.goals.filter((g) => !g.toLowerCase().includes("sale") && !g.toLowerCase().includes("sell"));
        if (!modifiedFields.includes("goals")) modifiedFields.push("goals");
        explanations.push("Removed sales-related responsibilities from primary goals.");
        handled = true;
      } else {
        const newGoal = text.replace(/^(add|include|please add|support)\s+/i, "");
        if (newGoal.length > 5) {
          proposed.goals.push(newGoal);
          if (!modifiedFields.includes("goals")) modifiedFields.push("goals");
          explanations.push(`Added new goal: "${newGoal}".`);
          handled = true;
        }
      }
    }

    // 6. CONVERSATION STEPS
    // E.g. "Add a verification step", "Ask for appointment date before confirming", "Add eligibility check"
    if (
      lower.includes("conversation step") ||
      lower.includes("verification step") ||
      lower.includes("add a step") ||
      lower.includes("add step") ||
      lower.includes("eligibility check") ||
      lower.includes("remove step")
    ) {
      if (lower.includes("verification") || lower.includes("verify identity") || lower.includes("verify caller")) {
        const newStep: ConversationStep = {
          id: `step-verif-${Date.now().toString(36)}`,
          name: "Caller Verification",
          instruction: "Verify the caller's registered name, phone number, or account identifier before proceeding.",
          order: 1, // Insert near beginning
          requiredInformation: ["caller_name", "contact_number"],
        };
        // Re-order existing steps
        const updatedSteps = [newStep, ...proposed.conversationSteps].map((s, idx) => ({
          ...s,
          order: idx + 1,
        }));
        proposed.conversationSteps = updatedSteps;
        if (!modifiedFields.includes("conversationSteps")) modifiedFields.push("conversationSteps");
        explanations.push("Inserted a caller verification step at the beginning of the conversation workflow.");
        handled = true;
      } else if (lower.includes("appointment date") || lower.includes("booking date")) {
        const newStep: ConversationStep = {
          id: `step-date-${Date.now().toString(36)}`,
          name: "Collect Date & Time",
          instruction: "Confirm the caller's preferred appointment date and time slot before reserving.",
          order: proposed.conversationSteps.length + 1,
          requiredInformation: ["preferred_date", "preferred_time"],
        };
        proposed.conversationSteps.push(newStep);
        if (!modifiedFields.includes("conversationSteps")) modifiedFields.push("conversationSteps");
        explanations.push("Added step to collect preferred appointment date and time before confirmation.");
        handled = true;
      } else if (lower.includes("eligibility")) {
        const newStep: ConversationStep = {
          id: `step-elig-${Date.now().toString(36)}`,
          name: "Eligibility Check",
          instruction: "Screen caller eligibility criteria, academic year, and prerequisite qualifications.",
          order: 2,
          requiredInformation: ["academic_branch", "cgpa_percentage"],
        };
        proposed.conversationSteps.splice(1, 0, newStep);
        proposed.conversationSteps = proposed.conversationSteps.map((s, idx) => ({ ...s, order: idx + 1 }));
        if (!modifiedFields.includes("conversationSteps")) modifiedFields.push("conversationSteps");
        explanations.push("Inserted eligibility check into the conversation workflow.");
        handled = true;
      } else if (lower.includes("remove step") || lower.includes("delete step")) {
        if (proposed.conversationSteps.length > 1) {
          const removed = proposed.conversationSteps.pop();
          if (!modifiedFields.includes("conversationSteps")) modifiedFields.push("conversationSteps");
          explanations.push(`Removed step "${removed?.name || "last step"}" from conversation workflow.`);
          handled = true;
        }
      }
    }

    // 7. LANGUAGE
    // E.g. "Change the agent to Hindi", "Use Spanish for all responses"
    if (lower.includes("hindi") && !modifiedFields.includes("language")) {
      proposed.language = "hi-IN";
      proposed.systemInstructions = `${proposed.systemInstructions}\n\nLanguage Guideline: Always interact using clear, respectful Hindi (हिंदी) with appropriate formal honorifics (आप).`;
      if (!modifiedFields.includes("language")) modifiedFields.push("language");
      if (!modifiedFields.includes("systemInstructions")) modifiedFields.push("systemInstructions");
      explanations.push("Set primary spoken language to Hindi (hi-IN) and added language directives.");
      handled = true;
    } else if (lower.includes("spanish") && !modifiedFields.includes("language")) {
      proposed.language = "es-ES";
      proposed.systemInstructions = `${proposed.systemInstructions}\n\nLanguage Guideline: Always interact using natural, clear Spanish (español).`;
      if (!modifiedFields.includes("language")) modifiedFields.push("language");
      if (!modifiedFields.includes("systemInstructions")) modifiedFields.push("systemInstructions");
      explanations.push("Set primary spoken language to Spanish (es-ES) and added language directives.");
      handled = true;
    } else if (lower.includes("english") && proposed.language !== "en-US") {
      proposed.language = "en-US";
      if (!modifiedFields.includes("language")) modifiedFields.push("language");
      explanations.push("Set primary spoken language to English (en-US).");
      handled = true;
    }

    // Fallback if not specifically caught
    if (!handled) {
      // Intelligently infer if it's general system instructions or description
      if (lower.includes("description") || lower.includes("summary")) {
        proposed.description = `${proposed.description} (${text})`.slice(0, 300);
        modifiedFields.push("description");
        explanations.push("Updated agent description with the specified details.");
      } else {
        proposed.systemInstructions = `${proposed.systemInstructions}\n\nAdditional Directive: ${text}`;
        modifiedFields.push("systemInstructions");
        explanations.push(`Appended instruction directive to system guidelines: "${text}".`);
      }
    }

    // Validate the proposed configuration against AgentConfigSchema
    const parseResult = AgentConfigSchema.safeParse(proposed);
    if (!parseResult.success) {
      console.error("[MockAgentRefinementProvider] Proposed config validation failed:", parseResult.error);
      return {
        proposedConfig: currentConfig,
        modifiedFields: [],
        explanation: "Unable to apply requested refinement safely: validation constraints would be violated.",
        clarificationsNeeded: ["Please provide a specific refinement directive for persona, greeting, or rules."],
        source: "rule-based-mock",
      };
    }

    return {
      proposedConfig: parseResult.data,
      modifiedFields,
      explanation: explanations.join(" "),
      source: "rule-based-mock",
    };
  }
}

export const defaultAgentRefinementProvider = new MockAgentRefinementProvider();
