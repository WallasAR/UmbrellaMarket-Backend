import { 
  fetchAddresses, 
  insertAddress, 
  deleteAddress, 
  setAddressAsDefault 
} from "../services/addressService.js";

export const getAddresses = async (req, res, next) => {
  try {
    const userId = req.user.id;
    if (!userId) throw new Error("User not found");

    const addresses = await fetchAddresses(userId);
    res.status(200).json(addresses);
  } catch (error) {
    next(error);
  }
};

export const addAddress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    if (!userId) throw new Error("User not found");

    const addressData = req.body;
    if (!addressData || !addressData.name || !addressData.address || !addressData.cep) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const newAddress = await insertAddress(userId, addressData);
    res.status(201).json(newAddress);
  } catch (error) {
    next(error);
  }
};

export const removeAddress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const addressId = req.params.id;

    if (!userId) throw new Error("User not found");
    if (!addressId) return res.status(400).json({ message: "Address ID is required" });

    await deleteAddress(userId, addressId);
    res.status(200).json({ message: "Address deleted successfully" });
  } catch (error) {
    next(error);
  }
};

export const setDefaultAddress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const addressId = req.params.id;

    if (!userId) throw new Error("User not found");
    if (!addressId) return res.status(400).json({ message: "Address ID is required" });

    await setAddressAsDefault(userId, addressId);
    res.status(200).json({ message: "Address set as default" });
  } catch (error) {
    next(error);
  }
};
