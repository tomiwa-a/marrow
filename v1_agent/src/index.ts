import dotenv from "dotenv";
import { run } from "./app";

dotenv.config();

run().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
