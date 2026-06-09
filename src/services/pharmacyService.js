import sdb from "./database.js";

const listPharmacies = async () => {
  const { data, error } = await sdb
    .from("Pharmacy")
    .select("*")
    .eq("active", true)
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
};

const getPharmacyById = async (id) => {
  const { data, error } = await sdb
    .from("Pharmacy")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) throw new Error("Pharmacy not found");
  return data;
};

const createPharmacy = async (payload) => {
  const { data, error } = await sdb
    .from("Pharmacy")
    .insert(payload)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};

export { listPharmacies, getPharmacyById, createPharmacy };
