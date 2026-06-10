import express from "express";
import { list } from "../controllers/bannerController.js";

const router = express.Router();

router.get("/", list);

export default router;
