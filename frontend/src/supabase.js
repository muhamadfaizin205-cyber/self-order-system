import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://lhcbbupqhpljhtcdrloy.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxoY2JidXBxaHBsamh0Y2RybG95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwMTM4MDksImV4cCI6MjA5NjU4OTgwOX0.V5SuBRkV0lTjTtC2sZ5siCXOT8Zpapv2YGKbFAgTSLs";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
