import { fetchProfile, updateInfoUser } from "../services/userService.js";

const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    if (!userId) throw new Error("User not found");

    const profile = await fetchProfile(userId);

    res.status(200).json(profile);
  } catch (error) {
    next(error);
  };
};

const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const newData = req.body;

    if (!userId) throw new Error("User not found");

    if (!newData || Object.keys(newData).length === 0) {
      throw new Error("Profile data is required");
    }

    await updateInfoUser(userId, newData);

    res.status(200).json({ message: "Profile updated" });
  } catch (error) {
    next(error);
  };
};

export { getProfile, updateProfile };