import sdb from "./database.js";

const fetchAddresses = async (userId) => {
  const { data, error } = await sdb
    .from("UserAddress")
    .select("*")
    .eq("user_id", userId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

const insertAddress = async (userId, addressData) => {
  const { name, cep, address, city, state, is_default } = addressData;
  
  if (is_default) {
    // If setting as default, unset others first
    await sdb.from("UserAddress").update({ is_default: false }).eq("user_id", userId);
  } else {
    // If this is the first address, make it default
    const existing = await fetchAddresses(userId);
    if (!existing || existing.length === 0) {
      addressData.is_default = true;
    }
  }

  const { data, error } = await sdb
    .from("UserAddress")
    .insert([{
      user_id: userId,
      name,
      cep,
      address,
      city,
      state,
      is_default: addressData.is_default || false
    }])
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

const deleteAddress = async (userId, addressId) => {
  const { data: addressToDel, error: fetchErr } = await sdb
    .from("UserAddress")
    .select("is_default")
    .eq("id", addressId)
    .eq("user_id", userId)
    .single();

  if (fetchErr) throw new Error(fetchErr.message);

  const { error } = await sdb
    .from("UserAddress")
    .delete()
    .eq("id", addressId)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);

  // If the deleted address was default, make the most recent one default if any exist
  if (addressToDel.is_default) {
    const { data: remaining } = await sdb
      .from("UserAddress")
      .select("id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (remaining && remaining.length > 0) {
      await sdb.from("UserAddress").update({ is_default: true }).eq("id", remaining[0].id);
    }
  }

  return;
};

const setAddressAsDefault = async (userId, addressId) => {
  // Unset all first
  const { error: resetErr } = await sdb
    .from("UserAddress")
    .update({ is_default: false })
    .eq("user_id", userId);

  if (resetErr) throw new Error(resetErr.message);

  // Set the specific one
  const { error: setErr } = await sdb
    .from("UserAddress")
    .update({ is_default: true })
    .eq("id", addressId)
    .eq("user_id", userId);

  if (setErr) throw new Error(setErr.message);

  return;
};

export { fetchAddresses, insertAddress, deleteAddress, setAddressAsDefault };
