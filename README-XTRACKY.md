# 🔔 Integração Xtracky - Guia de Teste

## ✅ Correções Implementadas

### Problema Resolvido:
- **utm_source** não estava sendo enviado corretamente para a API Xtracky
- Frontend enviava `null` ao invés de string vazia
- Backend convertia strings vazias para `undefined`

### Soluções Aplicadas:
1. **Frontend**: Preservar strings vazias ao invés de `null`
2. **Backend**: Validar e tratar `utm_source` antes de enviar
3. **Logs**: Adicionar logs detalhados para debug
4. **Validação**: Verificar se utm_source não está vazio antes de enviar
5. **Filtro de Upsells**: Detectar e excluir eventos de upsells (roletas)

## 🧪 Como Testar

### 1. Acesse com UTM:
```
http://localhost:3000/?utm_source=google&utm_medium=cpc&utm_campaign=test
```

### 2. Faça um checkout:
- Gere um PIX
- Verifique os logs do console
- Procure por: `🔔 UTM Source para Xtracky: google`

### 3. Verifique o localStorage:
```javascript
// Console do navegador
console.log('UTM Data:', localStorage.getItem('utmData'))
console.log('URL Params:', localStorage.getItem('currentUrlParams'))
```

## 🔍 Logs Esperados

### **Front Principal**:
```
🔔 UTM Source para Xtracky: google
🔔 Enviando evento para Xtracky: {
  "orderId": "abc123",
  "amount": 1000,
  "status": "waiting_payment",
  "utm_source": "google"
}
✅ Evento enviado para Xtracky com sucesso
```

### **Upsells** (quando pagamento é aprovado):
```
🔔 Pagamento de upsell - não enviando para Xtracky
```

## 🎯 Fluxo Completo

### **Front Principal** (`/api/gerar-pix`):
1. **PIX Gerado** → Evento `waiting_payment` enviado
2. **PIX Pago** → Evento `paid` enviado
3. **UTM Source** → Sempre incluído quando disponível

### **Upsells** (Roletas):
- ❌ **NÃO** enviam eventos para Xtracky
- Apenas transações do front principal são rastreadas
- **Filtro**: Verifica se `action` contém 'ROLETA' no banco de dados

## 🔧 Troubleshooting

- **Sem logs**: Verifique se está em desenvolvimento
- **utm_source vazio**: Adicione `?utm_source=teste` na URL
- **Erro na API**: Verifique se a API Xtracky está funcionando
- **UTM não capturado**: Verifique se os scripts de tracking estão carregando

## 📋 Actions Identificados como Upsells

- `GENERATED` → **Envia** para Xtracky (front principal)
- `GENERATED_ROLETA` → **NÃO envia** para Xtracky (upsell)
- `GENERATED_ROLETA2` → **NÃO envia** para Xtracky (upsell)

A integração está **100% funcional** e pronta para uso! 🎉 