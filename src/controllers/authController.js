import { userLogin, userRegistration } from "../services/authService.js";

const signIn = async (req, res, next) => {
  try {
    const { email, pass } = req.body;

    if (!email || !pass) throw new Error("Email and password are required");

    const userToken = await userLogin({ email, pass })

    res.status(200).json({ message: "Login Successfully", token: userToken })
  } catch (error) {
    next(error);
  }
};

const register = async (req, res) => {
  try {
    const { email, pass } = req.body;

    if (!email || !pass) throw new Error("Email and password are required");

    const userToken = await userRegistration({ email, pass });

    res.status(201).json({ message: "Successful registration", token: userToken });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { signIn, register };