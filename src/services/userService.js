import sdb from "./database.js";

const fetchProfile = async (userId) => {
  const { data, error } = await sdb
  .from("User")
  .select("*")
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
  const { error } = await sdb
  .from("User")
  .update(profile)
  .eq("id", userId);

  if (error) {
    throw new Error(error.message);
  };

  return;
};

export { fetchProfile, updateInfoUser };