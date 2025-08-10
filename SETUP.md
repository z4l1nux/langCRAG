# 🔧 Guia de Configuração - Sistema RAG CAPEC

## 📋 Passos para Configurar o Sistema

### 1. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```bash
cp env.example .env
```

Edite o arquivo `.env` e configure as variáveis de ambiente:

```env
# Ollama / Modelos
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=gpt-oss:20b
OLLAMA_EMBEDDINGS_MODEL=nomic-embed-text:latest

# LanceDB
LANCEDB_DIR=./lancedb
LANCEDB_BATCH_SIZE=100
```

### 2. Obter Chave da OpenAI

1. Acesse [OpenAI Platform](https://platform.openai.com/)
2. Faça login ou crie uma conta
3. Vá para "API Keys"
4. Clique em "Create new secret key"
5. Copie a chave e cole no arquivo `.env`

### 3. Criar a Base de Conhecimento

Execute o comando para processar o arquivo JSON e criar os embeddings:

```bash
npm run create-embeddings
```

Este processo pode demorar alguns minutos dependendo do tamanho do arquivo.

### 4. Testar o Sistema

Execute o sistema principal para verificar se tudo está funcionando:

```bash
npm run dev
```

### 5. Usar o Chat Interativo

Inicie o chat para fazer perguntas sobre ataques CAPEC:

```bash
npm run chat
```

## 🧪 Testando sem OpenAI (Modo Demo)

Se você não quiser usar a OpenAI imediatamente, pode testar a estrutura do projeto:

```bash
# Compilar o projeto
npm run build

# Verificar se não há erros de sintaxe
npm run dev
```

## 🔍 Verificando a Instalação

### Estrutura de Arquivos Esperada

```
langCRAG/
├── src/
│   ├── types/
│   ├── utils/
│   ├── services/
│   ├── examples/
│   ├── createEmbeddings.ts
│   ├── chat.ts
│   └── index.ts
├── capec-stride-mapping.json
├── package.json
├── tsconfig.json
├── env.example
├── .env (criar)
└── README.md
```

### Comandos Disponíveis

```bash
# Instalar dependências
npm install

# Compilar TypeScript
npm run build

# Executar arquivo principal
npm run dev

# Criar embeddings
npm run create-embeddings

# Chat interativo
npm run chat
```

## 🚨 Solução de Problemas

### Erro: "OpenAI API key not found"
- Verifique se o arquivo `.env` existe
- Confirme se a chave da OpenAI está correta
- Reinicie o terminal após criar o arquivo `.env`

### Erro: "Cannot find module"
- Execute `npm install` novamente
- Verifique se todas as dependências foram instaladas

### Erro: "LanceDB execution failed"
- Verifique se o diretório `./lancedb` pode ser criado
- Confirme permissões de escrita no diretório

## 📊 Monitoramento

Durante o processamento, você verá logs como:

```
🚀 Iniciando processamento do arquivo CAPEC...
✅ Arquivo JSON carregado com sucesso
📊 Estatísticas do processamento:
   - Total de chunks: 150
   - Categorias: 25
   - Ataques: 125
📝 Adicionando 150 chunks ao banco vetorial...
✅ Lote 1 processado
✅ Lote 2 processado
...
✅ Todos os 150 chunks foram adicionados com sucesso!
✅ Processamento concluído!
📈 Total de documentos no banco: 150
```

## 🎯 Próximos Passos

1. Configure a chave da OpenAI
2. Execute `npm run create-embeddings`
3. Teste com `npm run chat`
4. Faça perguntas sobre ataques CAPEC!

---

**💡 Dica**: O sistema funciona melhor com perguntas específicas sobre ataques de segurança, categorias CAPEC ou códigos de ataque específicos. 