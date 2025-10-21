# DUMITEQS - Interpretador de PETEQS

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub](https://img.shields.io/badge/GitHub-NathDumit%2Fdumiteqs-blue)](https://github.com/NathDumit/dumiteqs)

**DUMITEQS** é um interpretador web interativo para **PETEQS** (Português Estruturado para Ensino de Técnicas de Engenharia de Software), uma pseudolinguagem criada para ensinar lógica de programação de forma simples e intuitiva em português.

## 🎯 O que é PETEQS?

PETEQS é uma pseudolinguagem educacional que utiliza palavras-chave em português para ensinar conceitos fundamentais de programação sem a complexidade da sintaxe de linguagens reais. É amplamente utilizada em cursos de introdução à programação em instituições educacionais brasileiras.

## ✨ Características

- **Editor de Código Interativo**: Escreva e execute código PETEQS diretamente no navegador
- **Sintaxe em Português**: Palavras-chave intuitivas em português brasileiro
- **Execução em Tempo Real**: Veja os resultados imediatamente após executar o código
- **Mensagens de Erro Detalhadas**: Erros claros com número da linha e tipo de problema
- **Formatação Automática**: Indentação e formatação de código automáticas
- **Exemplos Práticos**: Múltiplos exemplos para aprender rapidamente
- **Tutorial Interativo**: Guia passo a passo para iniciantes
- **Design Responsivo**: Funciona em desktop, tablet e celular
- **Tema Verde Elegante**: Interface visual agradável e profissional

## 🚀 Recursos Suportados

### Variáveis e Atribuição
```peteqs
a ← 10
nome ← 'João'
resultado ← a + 5
```

### Operações Aritméticas
```peteqs
soma ← a + b
diferenca ← a - b
produto ← a * b
quociente ← a / b
resto ← a MOD b
potencia ← pow(a, 2)
```

### Estruturas de Controle

#### Condicional (SE/ENTÃO/SENÃO)
```peteqs
SE numero > 5 ENTÃO
  IMPRIMALN 'Número é grande'
SENÃO
  IMPRIMALN 'Número é pequeno'
FIM SE
```

#### Loop PARA
```peteqs
PARA i ← 1 ATÉ 10 FAÇA
  IMPRIMALN i
FIM PARA
```

#### Loop ENQUANTO
```peteqs
i ← 1
ENQUANTO i <= 10 FAÇA
  IMPRIMALN i
  i ← i + 1
FIM ENQUANTO
```

#### Loop REPITA
```peteqs
REPITA 5 VEZES
  IMPRIMALN 'Olá!'
FIM REPITA
```

### Funções e Procedimentos

#### Função com Retorno
```peteqs
FUNCAO soma(a, b)
  RETORNA a + b
FIM FUNCAO

resultado ← soma(10, 20)
IMPRIMALN resultado
```

#### Procedimento sem Retorno
```peteqs
PROCEDIMENTO saudacao(nome)
  IMPRIMALN 'Olá, ' + nome + '!'
FIM PROCEDIMENTO

CHAMAR saudacao('Maria')
```

### Entrada e Saída

```peteqs
IMPRIMALN 'Texto com quebra de linha'
IMPRIMA 'Texto sem quebra de linha'
LEIA variavel
```

### Operadores Lógicos

```peteqs
SE (a > 5) e (b < 10) ENTÃO
  IMPRIMALN 'Ambas as condições são verdadeiras'
FIM SE

SE (x = 1) ou (x = 2) ENTÃO
  IMPRIMALN 'x é 1 ou 2'
FIM SE

SE não (valor = 0) ENTÃO
  IMPRIMALN 'Valor não é zero'
FIM SE
```

### Vetores (Arrays)

```peteqs
PARA i ← 1 ATÉ 5 FAÇA
  vetor[i] ← i * 10
FIM PARA

IMPRIMALN vetor[3]
```

### Funções Matemáticas Integradas

- `abs(x)` - Valor absoluto
- `sqrt(x)` - Raiz quadrada
- `pow(x, y)` - Potência
- `floor(x)` - Arredonda para baixo
- `ceil(x)` - Arredonda para cima
- `round(x)` - Arredonda para o inteiro mais próximo
- `max(a, b)` - Máximo entre dois valores
- `min(a, b)` - Mínimo entre dois valores
- `mod(a, b)` - Resto da divisão

### Comentários

```peteqs
// Este é um comentário
a ← 10  // Comentário inline
```

## 📦 Instalação

### Pré-requisitos

- Node.js 18+ ou superior
- pnpm (gerenciador de pacotes)

### Passos para Instalar

1. **Clone o repositório**
   ```bash
   git clone https://github.com/NathDumit/dumiteqs.git
   cd dumiteqs
   ```

2. **Instale as dependências**
   ```bash
   pnpm install
   ```

3. **Inicie o servidor de desenvolvimento**
   ```bash
   pnpm dev
   ```

4. **Acesse no navegador**
   ```
   http://localhost:5173
   ```

## 🏗️ Estrutura do Projeto

```
dumiteqs/
├── client/                 # Frontend React + TypeScript
│   ├── src/
│   │   ├── pages/
│   │   │   └── Home.tsx   # Componente principal da aplicação
│   │   ├── lib/
│   │   │   └── ipeteqs.ts # Interpretador PETEQS
│   │   └── index.css      # Estilos globais
│   └── package.json
├── server/                 # Backend (se necessário)
├── shared/                 # Código compartilhado
├── package.json
├── vite.config.ts         # Configuração do Vite
└── tsconfig.json          # Configuração do TypeScript
```

## 🎓 Como Usar

### Via Interface Web

1. Acesse o site (quando publicado em dumiteqs.manus.space)
2. Escreva seu código PETEQS no editor
3. Clique em **"Executar"** para ver os resultados
4. Use os exemplos fornecidos para aprender
5. Consulte o tutorial para conceitos básicos

### Exemplos Práticos

#### Exemplo 1: Números Pares
```peteqs
PARA i ← 1 ATÉ 10 FAÇA
  SE i MOD 2 = 0 ENTÃO
    IMPRIMALN i
  FIM SE
FIM PARA
```

#### Exemplo 2: Tabuada
```peteqs
numero ← 5
PARA i ← 1 ATÉ 10 FAÇA
  resultado ← numero * i
  IMPRIMALN numero + ' x ' + i + ' = ' + resultado
FIM PARA
```

#### Exemplo 3: Validação de Entrada
```peteqs
idade ← 25
SE idade >= 18 ENTÃO
  IMPRIMALN 'Você é maior de idade'
SENÃO
  IMPRIMALN 'Você é menor de idade'
FIM SE
```

## 🛠️ Tecnologias Utilizadas

| Tecnologia | Versão | Propósito |
|-----------|--------|----------|
| React | 18+ | Framework frontend |
| TypeScript | 5+ | Tipagem estática |
| Vite | 5+ | Build tool e dev server |
| Tailwind CSS | 3+ | Estilização |
| shadcn/ui | Latest | Componentes UI |

## 📚 Documentação Completa

A documentação completa está disponível na aplicação:

- **Guia Rápido de Sintaxe**: Referência rápida de todos os operadores e estruturas
- **Tutorial para Leigos**: Guia passo a passo para iniciantes
- **Exemplos Práticos**: Código pronto para usar e modificar
- **Mensagens de Erro**: Ajuda clara quando algo não funciona

## 🐛 Tratamento de Erros

O interpretador fornece mensagens de erro detalhadas incluindo:

- **Número da linha** onde o erro ocorreu
- **Tipo de erro** (sintaxe, variável não definida, etc.)
- **Descrição clara** do problema
- **Sugestões** para correção quando possível

Exemplo de erro:
```
Erro na linha 5: Variável 'x' não foi definida
```

## 🎨 Tema Visual

DUMITEQS utiliza uma paleta de cores verde elegante:

- **Verde Escuro (green-950)**: Fundo principal
- **Verde Médio (green-800)**: Cartões e seções
- **Verde Claro (green-300)**: Texto destacado
- **Esmeralda (emerald-600)**: Acentos e botões

## 📱 Responsividade

A aplicação é totalmente responsiva e funciona em:

- ✅ Desktop (1920px+)
- ✅ Tablet (768px - 1024px)
- ✅ Celular (320px - 767px)

## 🚀 Deployment

### Publicar no Manus

1. Clique no botão **"Publish"** na interface do Manus
2. Configure o domínio como `dumiteqs.manus.space`
3. Clique em **"Deploy"**

### Publicar em Outro Host

A aplicação pode ser publicada em qualquer host que suporte Node.js:

```bash
pnpm build
# Os arquivos estão em dist/
```

## 🤝 Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 👨‍💻 Autor

**Willian** - Desenvolvedor do DUMITEQS

## 🙏 Agradecimentos

- Comunidade educacional brasileira por inspirar este projeto
- PETEQS original por fornecer a base da pseudolinguagem
- Todos os contribuidores e usuários

## 📞 Suporte

Se encontrar problemas ou tiver dúvidas:

1. Consulte a seção **"Tutorial para Leigos"** na aplicação
2. Verifique os **exemplos práticos** fornecidos
3. Leia as **mensagens de erro** cuidadosamente
4. Abra uma [Issue](https://github.com/NathDumit/dumiteqs/issues) no GitHub

## 🔗 Links Úteis

- **Site Oficial**: https://dumiteqs.manus.space (quando publicado)
- **Repositório**: https://github.com/NathDumit/dumiteqs
- **Issues**: https://github.com/NathDumit/dumiteqs/issues
- **Discussões**: https://github.com/NathDumit/dumiteqs/discussions

## 📊 Status do Projeto

- ✅ Interpretador PETEQS funcional
- ✅ Interface web completa
- ✅ Exemplos e tutoriais
- ✅ Tratamento de erros
- ✅ Repositório GitHub
- 🔄 GitHub Pages (em configuração)
- 📋 Documentação adicional (planejado)

---

**Desenvolvido com ❤️ para educação em programação**

