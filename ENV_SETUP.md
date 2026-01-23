# Configuração de Variáveis de Ambiente

Este projeto utiliza variáveis de ambiente para armazenar informações sensíveis de forma segura.

## Setup Inicial

1. **Copie o arquivo de exemplo:**

   ```bash
   cp .env.example .env.local
   ```

2. **Configure suas credenciais no arquivo `.env.local`:**

### Variáveis Obrigatórias

#### HorsePay API

```env
HORSEPAY_CLIENT_KEY=sua_chave_aqui
HORSEPAY_CLIENT_SECRET=seu_secret_aqui
HORSEPAY_BASE_URL=https://api.horsepay.io
```

#### Banco de Dados Turso

```env
TURSO_DATABASE_URL=libsql://seu-database.turso.io
TURSO_AUTH_TOKEN=seu_token_aqui
```

#### Painel Admin

```env
ADMIN_PASSWORD=sua_senha_segura_aqui
```

#### Configuração do App

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Segurança

- ⚠️ **NUNCA** commite o arquivo `.env.local` no Git
- O arquivo `.env.local` já está listado no `.gitignore`
- Use senhas fortes para o painel admin
- Em produção, configure as variáveis no seu provedor de hospedagem (Vercel, etc)

## Verificação

Para verificar se as variáveis estão configuradas corretamente:

1. Reinicie o servidor de desenvolvimento após criar/editar `.env.local`
2. Acesse `http://localhost:3000/api/test-turso` para testar a conexão com o banco
3. Tente fazer login no painel admin em `http://localhost:3000/admin`

## Erros Comuns

**Erro: "TURSO_DATABASE_URL e TURSO_AUTH_TOKEN devem estar configurados"**

- Certifique-se de que criou o arquivo `.env.local` na raiz do projeto
- Verifique se as variáveis estão escritas corretamente (sem espaços extras)

**Erro: "HORSEPAY_CLIENT_KEY... devem estar configurados"**

- Configure as credenciais do HorsePay no `.env.local`
- Obtenha as credenciais no painel do HorsePay

**Senha do admin não funciona:**

- Verifique se configurou `ADMIN_PASSWORD` no `.env.local`
- Reinicie o servidor após alterar o arquivo
