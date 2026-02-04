import { chromium } from "playwright";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("Launching Marrow...\n");

  const browser = await chromium.launch({
    headless: process.env.HEADLESS === "true",
    slowMo: 100,
  });

  console.log("Browser launched successfully");

  const page = await browser.newPage();
  console.log("New page created");

  await page.goto("https://example.com");
  console.log("Navigated to: https://example.com");

  await page.waitForTimeout(3000);

  console.log("\nPhase 1 Complete - Browser opens visibly!");

  await browser.close();
  console.log("Browser closed");
}

main().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
