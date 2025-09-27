import { createClient } from '@supabase/supabase-js'

// 👇 replace these with your actual Supabase values
const supabaseUrl = "https://uokgjjtqnvfgggfcjfnz.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVva2dqanRxbnZmZ2dnZmNqZm56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MTExNjQsImV4cCI6MjA3NDQ4NzE2NH0.40ekszYWhGUtAzZNB-479XKFmBBKmTCjTocRiUMB9-g"

export const supabase = createClient(supabaseUrl, supabaseKey)
