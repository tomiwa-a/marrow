
import { LLMClient } from "../../core/llm";
import { defaultProfile, UserProfile } from "../../config/profile";

export interface JobEvaluation {
  decision: "APPLY" | "SKIP";
  reason: string;
  relevancyScore: number; // 0-100
}

export class Analyst {
  private llm: LLMClient;
  private profile: UserProfile;

  constructor(llm: LLMClient, profile: UserProfile = defaultProfile) {
    this.llm = llm;
    this.profile = profile;
  }

  async evaluateJob(jobTitle: string, jobDescription: string): Promise<JobEvaluation> {
    const systemPrompt = `
    You are a career strategist for a Senior Software Engineer.
    Your goal is to evaluate job descriptions against the candidate's profile.

    **Candidate Profile:**
    - TOP SKILLS: ${this.profile.topSkills.join(", ")}
    - BLACKLIST: ${this.profile.blacklist.join(", ")} (Reject if heavily emphasized)
    - PREFERENCES: Remote=${this.profile.preferences.remote}, Min Salary=$${this.profile.preferences.minSalary}

    **Evaluation Rules:**
    1. REJECT if the tech stack is completely incompatible (e.g. requires 5+ years of Java/C# when candidate knows TypeScript).
    2. REJECT if user requires Remote and job is On-site.
    3. REJECT if salary is significantly below target (if stated).
    4. ACCEPT if stack matches TypeScript/Node.js/React and seems high quality.

    You must return a valid JSON object:
    {
      "decision": "APPLY" | "SKIP",
      "reason": "Short explanation (max 1 sentence)",
      "relevancyScore": number
    }
    `;

    const userMessage = `
    **Job Title:** ${jobTitle}
    
    **Job Description:**
    ${jobDescription}
    `;

    try {
      const response = await this.llm.chat(systemPrompt, userMessage);
      const content = response.content || "";
      
      const cleaned = content.replace(/```json/g, "").replace(/```/g, "").trim();
      
      return JSON.parse(cleaned) as JobEvaluation;
    } catch (e) {
      console.error("Analyst Error:", e);
      return {
        decision: "SKIP",
        reason: "Failed to evaluate due to LLM error.",
        relevancyScore: 0
      };
    }
  }
}
