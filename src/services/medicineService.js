import sdb from "./database.js";

const fetchProducts = async ({ discount, stock }) => {
 let query = sdb
  .from("Medicine")
  .select(`
    *,
    Images(thumb_img)
    `);

  if (discount) {
    query = query.gt("discount", 0); // method ".gt" == "greater than"
  }
  
  if (stock) {
    query = query.gt("stock", 0);
  }
  
  // Execute the query
  const { data, error } = await query;
  
  if (error) {
    throw new Error(error.message);
  }

  return data;
};

const fetchProduct = async (id) => {  
  const { data, error } = await sdb
  .from("Medicine")
  .select(`
    *,
    Images(thumb_img, primary_img, secondary_img, tertiary_img)`)
  .eq("id", id)
  .single();

  if (data == null) {
    throw new Error("Product not found")
  }

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export { fetchProducts, fetchProduct };