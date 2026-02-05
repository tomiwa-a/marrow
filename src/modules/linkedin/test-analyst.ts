
import { LLMClient } from "../../core/llm";
import { Analyst } from "./analyst";
import * as dotenv from "dotenv";

dotenv.config();

async function testAnalyst() {
  if (!process.env.GEMINI_API_KEY) {
    console.error("No API Key found. Skipping live test. please set GEMINI_API_KEY in .env");
    return;
  }

  const llm = new LLMClient();
  const analyst = new Analyst(llm);

  const sampleJob = {
    title: "Senior Full Stack Engineer",
    description: `
    We are looking for a Senior Engineer with 5+ years of experience in TypeScript and React.
    You will be working on our core platform.
    
    Requirements:
    - Node.js, PostgreSQL
    - Remote (USA/Europe)
    - Salary: $160k - $200k
    `
  };

  console.log("Analyzing sample job...");
  const result = await analyst.evaluateJob(sampleJob.title, sampleJob.description);
  console.log("Result:", result);
}

testAnalyst();
