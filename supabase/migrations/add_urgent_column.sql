-- Adiciona coluna is_urgent na tabela de notícias
ALTER TABLE horapiaui_news ADD COLUMN IF NOT EXISTS is_urgent BOOLEAN DEFAULT FALSE;

-- Atualiza políticas se necessário (geralmente não precisa se for apenas coluna nova em tabela existente)
