import { Router } from "express";
import { HealthController } from "../controllers/HealthController";
import { ValidateController } from "../controllers/ValidateController";
import { ExtractController } from "../controllers/ExtractController";
import { RegistryController } from "../controllers/RegistryController";

export const createRouter = (convexUrl: string) => {
  const router = Router();

  const healthController = new HealthController();
  const validateController = new ValidateController();
  const extractController = new ExtractController();
  const registryController = new RegistryController(convexUrl);

  router.get("/", healthController.info.bind(healthController));
  router.get("/health", healthController.health.bind(healthController));

  router.get("/v1/map", registryController.getMap.bind(registryController));
  router.get("/v1/manifest", registryController.getManifest.bind(registryController));
  router.get("/v1/stats", registryController.getStats.bind(registryController));

  router.post("/v1/validate", validateController.validate.bind(validateController));
  router.post("/v1/extract", extractController.extract.bind(extractController));

  return router;
};
