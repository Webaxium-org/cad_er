import { Router } from "express";
import * as userController from "../controllers/userController.js";

const router = Router();

router.get("/", userController.getAllUsers);
router.get("/:id", userController.getUserById);
router.post("/", userController.createUser);
router.put("/:id", userController.updateUser);
router.delete("/:id", userController.deleteUser);

router.post("quiz", userController.submitQuiz);

export default router;
