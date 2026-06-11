import sdb from "./database.js";
import { saveBannerImage } from "./bannerUploadService.js";

const listActiveBanners = async ({ category, limit = 10, pharmacyId = null } = {}) => {
  const now = new Date().toISOString();

  let query = sdb
    .from("InstitutionalBanner")
    .select("*")
    .eq("active", true)
    .order("priority", { ascending: false })
    .limit(Math.min(limit, 20));

  if (pharmacyId) {
    query = query.or(`pharmacy_id.is.null,pharmacy_id.eq.${pharmacyId}`);
  } else {
    query = query.is("pharmacy_id", null);
  }

  if (category) query = query.eq("category", category);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data || []).filter((banner) => {
    if (banner.starts_at && banner.starts_at > now) return false;
    if (banner.ends_at && banner.ends_at < now) return false;
    return true;
  });
};

const listAllBanners = async (pharmacyId = null) => {
  let query = sdb
    .from("InstitutionalBanner")
    .select("*")
    .order("priority", { ascending: false });

  if (pharmacyId) {
    query = query.eq("pharmacy_id", pharmacyId);
  } else {
    query = query.is("pharmacy_id", null);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);
  return data || [];
};

const createBanner = async (payload) => {
  const insertPayload = { ...payload };
  delete insertPayload.file_data;
  delete insertPayload.file_name;

  if (payload.file_data) {
    insertPayload.image_url = saveBannerImage({
      fileName: payload.file_name,
      fileData: payload.file_data
    });
  }

  const { data, error } = await sdb
    .from("InstitutionalBanner")
    .insert(insertPayload)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};

const updateBanner = async (id, payload) => {
  const { data, error } = await sdb
    .from("InstitutionalBanner")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};

const deleteBanner = async (id) => {
  const { error } = await sdb.from("InstitutionalBanner").delete().eq("id", id);
  if (error) throw new Error(error.message);
};

export { listActiveBanners, listAllBanners, createBanner, updateBanner, deleteBanner };
