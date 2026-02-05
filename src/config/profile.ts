
export interface UserProfile {
  bio: string;
  topSkills: string[];
  blacklist: string[];
  preferences: {
    remote: boolean;
    minSalary?: number;
    locations: string[];
    titles: string[];
  };
}

export const defaultProfile: UserProfile = {
  bio: "Senior Full Stack Engineer with 6 years of experience in TypeScript, Node.js, and React. Passionate about building scalable systems and AI agents.",
  topSkills: ["TypeScript", "Node.js", "React", "PostgreSQL", "AWS", "AI/LLM"],
  blacklist: [
    "C#", 
    ".NET", 
    "Java", 
    "clearance", 
    "citizen", 
    "hybrid 4 days",
    "unpaid",
    "volunteer"
  ],
  preferences: {
    remote: true,
    minSalary: 120000,
    locations: ["United States", "Europe"],
    titles: ["Software Engineer", "Senior Software Engineer", "Full Stack Developer", "Backend Engineer"]
  }
};
