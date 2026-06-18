import sdb from "./src/services/database.js";
async function run() {
  const { data, error } = await sdb.from("PharmacyLayout").select("id, name, is_preset, is_active").eq("is_preset", true);
  console.log(data, error);
}
run();
