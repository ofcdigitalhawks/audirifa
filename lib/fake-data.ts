// Utilitários para geração de dados falsos
// Inclui integração com API da 4Devs + geração local como fallback

export interface FakeCustomerData {
  name: string
  email: string
  cpf: string
  phone: string
  endereco?: string
  numero?: string
  bairro?: string
  cidade?: string
  estado?: string
  cep?: string
}

// === INTEGRAÇÃO COM API DA 4DEVS ===
export async function generateWith4Devs(): Promise<FakeCustomerData | null> {
  try {
    console.log('🔄 Gerando dados via API da 4Devs...')
    
    const formData = new URLSearchParams({
      acao: 'gerar_pessoa',
      sexo: 'I',
      pontuacao: 'S',
      idade: '0',
      cep_estado: '',
      cep_cidade: '',
      txt_qtde: '1'
    })

    const response = await fetch('https://www.4devs.com.br/ferramentas_online.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData
    })

    if (!response.ok) {
      console.warn('⚠️ Erro HTTP na API da 4Devs:', response.status)
      return null
    }

    const data = await response.json()
    
    if (!data || !data.nome) {
      console.warn('⚠️ Nenhum dado retornado pela API da 4Devs')
      return null
    }

    const pessoa = data
    
    console.log('✅ Dados gerados com sucesso via 4Devs')
    
    return {
      name: pessoa.nome || generateName(),
      email: pessoa.email || generateEmail(pessoa.nome || 'Usuario'),
      cpf: pessoa.cpf?.replace(/\D/g, '') || generateCPF(),
      phone: pessoa.telefone?.replace(/\D/g, '') || generatePhone(),
      endereco: pessoa.endereco || '',
      numero: pessoa.numero || '',
      bairro: pessoa.bairro || '',
      cidade: pessoa.cidade || '',
      estado: pessoa.estado_sigla || '',
      cep: pessoa.cep?.replace(/\D/g, '') || ''
    }
  } catch (error) {
    console.warn('⚠️ Erro ao conectar com API da 4Devs:', error)
    return null
  }
}

// === GERAÇÃO LOCAL (FALLBACK) ===
export function generateCPF(): string {
  let cpf = ''
  
  // Gerar os primeiros 9 dígitos
  for (let i = 0; i < 9; i++) {
    cpf += Math.floor(Math.random() * 10).toString()
  }
  
  // Calcular os dígitos verificadores
  for (let i = 9; i < 11; i++) {
    let soma = 0
    for (let j = 0; j < i; j++) {
      soma += parseInt(cpf[j]) * ((i + 1) - j)
    }
    const digito = soma % 11
    cpf += (digito < 2) ? '0' : (11 - digito).toString()
  }
  
  return cpf
}

export function generatePhone(): string {
  const ddd = Math.floor(Math.random() * 89) + 11 // DDD entre 11 e 99
  const numero = Math.floor(Math.random() * 900000000) + 100000000 // 9 dígitos
  return `${ddd}${numero}`
}

export function generateEmail(name: string): string {
  const domain = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com.br']
  const randomDomain = domain[Math.floor(Math.random() * domain.length)]
  const cleanName = name.toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, '.')
  return `${cleanName}@${randomDomain}`
}

export function generateName(): string {
  const nomes = [
    'Ana', 'Bruno', 'Carlos', 'Diana', 'Eduardo', 'Fernanda', 'Gabriel', 'Helena',
    'Igor', 'Julia', 'Kevin', 'Larissa', 'Marcelo', 'Natalia', 'Otavio', 'Patricia',
    'Rodrigo', 'Sabrina', 'Thiago', 'Vanessa', 'Wagner', 'Ximena', 'Yuri', 'Zoe'
  ]
  
  const sobrenomes = [
    'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira',
    'Lima', 'Gomes', 'Ribeiro', 'Carvalho', 'Almeida', 'Lopes', 'Monteiro', 'Araújo',
    'Cardoso', 'Nascimento', 'Correia', 'Martins', 'Rocha', 'Nunes', 'Moreira', 'Mendes'
  ]
  
  const nome = nomes[Math.floor(Math.random() * nomes.length)]
  const sobrenome = sobrenomes[Math.floor(Math.random() * sobrenomes.length)]
  
  return `${nome} ${sobrenome}`
}

function generateLocalData(): FakeCustomerData {
  const name = generateName()
  return {
    name,
    email: generateEmail(name),
    cpf: generateCPF(),
    phone: generatePhone()
  }
}

// === FUNÇÃO PRINCIPAL ===
export async function generateCustomerData(use4Devs: boolean = true): Promise<FakeCustomerData> {
  if (use4Devs) {
    const data4Devs = await generateWith4Devs()
    if (data4Devs) {
      return data4Devs
    }
    
    console.log('⚠️ Fallback para geração local')
  }
  
  // Usar geração local como fallback
  return generateLocalData()
}

// === FUNÇÕES DE FORMATAÇÃO ===
export function formatCPF(cpf: string): string {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

export function formatPhone(phone: string): string {
  if (phone.length === 11) {
    return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  } else if (phone.length === 10) {
    return phone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  }
  return phone
}

export function formatCEP(cep: string): string {
  return cep.replace(/(\d{5})(\d{3})/, '$1-$2')
} 