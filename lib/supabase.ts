import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://yvthxrkvqlbeqrxfymyt.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_2Wm2BbPHzeP0usN8y5YuzQ_sw-QSnNx";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
