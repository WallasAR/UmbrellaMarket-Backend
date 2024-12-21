import dotenv from 'dotenv';
import { createClient } from "@supabase/supabase-js";
dotenv.config();

// ambient variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_API_KEY;

// Create Supabase Client
const supabase = createClient(supabaseUrl, supabaseKey);

// Instance export
export default supabase;
