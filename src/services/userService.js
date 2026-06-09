import sdb from "./database.js";

const fetchProfile = async (userId) => {
  const { data, error } = await sdb
  .from("User")
  .select("id, email, avatar, name, phone, cep, address, role, created_at")
  .eq("id" ,userId)
  .single();

  if (error) {
    throw new Error(error.message);
  };

  if (!data) {
    throw new Error("User not found");
  };

  return data;
};  

const updateInfoUser = async (userId, profile) => {
  const allowed = (({ name, phone, cep, address, avatar }) => ({ name, phone, cep, address, avatar }))(profile);
  const { error } = await sdb
  .from("User")
  .update(allowed)
  .eq("id", userId);

  if (error) {
    throw new Error(error.message);
  };

  return;
};

export { fetchProfile, updateInfoUser };