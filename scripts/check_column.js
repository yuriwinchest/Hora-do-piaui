
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

// Carregar variáveis de ambiente manualmente ou via dotenv padrão
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Erro: Variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são necessárias.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumn() {
  console.log('Verificando coluna is_urgent na tabela horapiaui_news...');

  // Tenta selecionar a coluna is_urgent de um registro
  const { data, error } = await supabase
    .from('horapiaui_news')
    .select('id, is_urgent')
    .limit(1);

  if (error) {
    console.error('Erro ao acessar coluna:', error);
    if (error.message.includes('does not exist') || error.code === 'PGRST204') {
      console.log('A coluna ou tabela parece não existir ou não está acessível.');
    }
  } else {
    console.log('Sucesso! Coluna is_urgent acessada corretamente.');
    console.log('Dados retornados:', data);
  }
}

checkColumn();
