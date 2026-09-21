import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://zdlnabhmhtavpftekwmf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkbG5hYmhtaHRhdnBmdGVrd21mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxMzI1ODcsImV4cCI6MjA3MTcwODU4N30.XaC5UUv2qTOvhjVmRTxbGSfJ7gSI9-NWa1rLMrwY6e4";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);