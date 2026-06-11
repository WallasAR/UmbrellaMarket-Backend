-- Adicionando suporte a domínios / URLs para multi-tenant
ALTER TABLE "Pharmacy" ADD COLUMN IF NOT EXISTS tenant_domain TEXT UNIQUE;

-- Atualizar farmácia teste "Umbrella Corporation" com o domínio solicitado
UPDATE "Pharmacy" 
SET tenant_domain = 'umbrella-marketplace.vercel.app' 
WHERE name ILIKE '%Umbrella Corporation%';
