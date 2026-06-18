import express from "express";
import autenticateToken from "../middlewares/authMiddleware.js";
import { 
  getAddresses, 
  addAddress, 
  removeAddress, 
  setDefaultAddress 
} from "../controllers/addressController.js";

const router = express.Router();

router.get("/", autenticateToken, getAddresses);
router.post("/", autenticateToken, addAddress);
router.delete("/:id", autenticateToken, removeAddress);
router.put("/:id/default", autenticateToken, setDefaultAddress);

export default router;
