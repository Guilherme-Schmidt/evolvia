// Migrado do Supabase para API própria com PostgreSQL
import { apiClient } from '@/lib/api-client';

// Import the client like this:
// import { supabase } from "@/integrations/supabase/client";
// Este arquivo mantém o mesmo nome para compatibilidade com o código existente

export const supabase = apiClient;