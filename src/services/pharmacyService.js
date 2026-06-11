import sdb from "./database.js";
import { haversineKm } from "../utils/geo.js";

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

const resolveByDomain = async (domain) => {
  const { data, error } = await sdb
    .from("Pharmacy")
    .select("*")
    .eq("tenant_domain", domain)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // no rows found
    }
    throw new Error(error.message);
  }
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

const listNearbyPharmacies = async ({ lat, lng, radiusKm = 10 }) => {
  const pharmacies = await listPharmacies();

  return pharmacies
    .filter((pharmacy) => pharmacy.latitude != null && pharmacy.longitude != null)
    .map((pharmacy) => ({
      ...pharmacy,
      distance_km: Number(
        haversineKm(lat, lng, Number(pharmacy.latitude), Number(pharmacy.longitude)).toFixed(2)
      )
    }))
    .filter((pharmacy) => pharmacy.distance_km <= radiusKm)
    .sort((a, b) => a.distance_km - b.distance_km);
};

export { listPharmacies, getPharmacyById, resolveByDomain, createPharmacy, listNearbyPharmacies };
