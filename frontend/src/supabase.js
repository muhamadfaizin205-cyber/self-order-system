import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://lhcbbupqhpljhtcdrloy.supabase.co";
const SUPABASE_KEY = "sb_publishable_uc3y6YCR6wSKCCEajArRgQ_U-1g0f_q";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
