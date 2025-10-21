# DUMITEQS - Documentação Completa

Bem-vindo à documentação do **DUMITEQS**, um interpretador web interativo para PETEQS (Português Estruturado para Ensino de Técnicas de Engenharia de Software).

## 📖 Índice

1. [Introdução](#introdução)
2. [Instalação](#instalação)
3. [Guia Rápido](#guia-rápido)
4. [Referência de Sintaxe](#referência-de-sintaxe)
5. [Exemplos Práticos](#exemplos-práticos)
6. [Tratamento de Erros](#tratamento-de-erros)
7. [FAQ](#faq)

## Introdução

PETEQS é uma pseudolinguagem educacional que utiliza palavras-chave em português para ensinar conceitos fundamentais de programação. O DUMITEQS é um interpretador web que permite escrever e executar código PETEQS diretamente no navegador.

### Por que PETEQS?

- ✅ **Português**: Palavras-chave em português brasileiro
- ✅ **Intuitivo**: Sintaxe simples e fácil de aprender
- ✅ **Educacional**: Focado no ensino de lógica de programação
- ✅ **Prático**: Exemplos reais e exercícios práticos

## Instalação

### Via Web (Recomendado)

Acesse diretamente em: **https://dumiteqs.manus.space**

### Instalação Local

```bash
# Clone o repositório
git clone https://github.com/NathDumit/dumiteqs.git
cd dumiteqs

# Instale as dependências
pnpm install

# Inicie o servidor
pnpm dev

# Acesse em http://localhost:5173
```

## Guia Rápido

### Seu Primeiro Programa

```peteqs
IMPRIMALN 'Olá, Mundo!'
```

Execute este código e você verá:
```
Olá, Mundo!
```

### Variáveis

```peteqs
nome ← 'João'
idade ← 25
altura ← 1.75

IMPRIMALN 'Nome: ' + nome
IMPRIMALN 'Idade: ' + idade
IMPRIMALN 'Altura: ' + altura
```

### Operações Matemáticas

```peteqs
a ← 10
b ← 3

IMPRIMALN 'Soma: ' + (a + b)
IMPRIMALN 'Subtração: ' + (a - b)
IMPRIMALN 'Multiplicação: ' + (a * b)
IMPRIMALN 'Divisão: ' + (a / b)
IMPRIMALN 'Resto: ' + (a MOD b)
```

## Referência de Sintaxe

### Operadores Aritméticos

| Operador | Descrição | Exemplo |
|----------|-----------|---------|
| `+` | Adição | `a + b` |
| `-` | Subtração | `a - b` |
| `*` | Multiplicação | `a * b` |
| `/` | Divisão | `a / b` |
| `MOD` ou `%` | Resto da divisão | `a MOD b` |

### Operadores de Comparação

| Operador | Descrição | Exemplo |
|----------|-----------|---------|
| `=` ou `==` | Igual | `a = b` |
| `<>` | Diferente | `a <> b` |
| `<` | Menor que | `a < b` |
| `>` | Maior que | `a > b` |
| `<=` | Menor ou igual | `a <= b` |
| `>=` | Maior ou igual | `a >= b` |

### Operadores Lógicos

| Operador | Descrição | Exemplo |
|----------|-----------|---------|
| `e` | E lógico | `(a > 5) e (b < 10)` |
| `ou` | OU lógico | `(x = 1) ou (x = 2)` |
| `não` | NÃO lógico | `não (valor = 0)` |

### Estruturas de Controle

#### Condicional SE/ENTÃO/SENÃO

```peteqs
SE condição ENTÃO
  // código se verdadeiro
SENÃO
  // código se falso
FIM SE
```

#### Loop PARA

```peteqs
PARA variavel ← inicio ATÉ fim FAÇA
  // código a repetir
FIM PARA
```

#### Loop ENQUANTO

```peteqs
ENQUANTO condição FAÇA
  // código a repetir
FIM ENQUANTO
```

#### Loop REPITA

```peteqs
REPITA n VEZES
  // código a repetir
FIM REPITA
```

### Funções e Procedimentos

#### Função com Retorno

```peteqs
FUNCAO nome(parametro1, parametro2)
  // código
  RETORNA resultado
FIM FUNCAO
```

#### Procedimento sem Retorno

```peteqs
PROCEDIMENTO nome(parametro1, parametro2)
  // código
FIM PROCEDIMENTO

CHAMAR nome(valor1, valor2)
```

### Entrada e Saída

```peteqs
IMPRIMALN 'Texto com quebra de linha'
IMPRIMA 'Texto sem quebra de linha'
LEIA variavel
```

### Comentários

```peteqs
// Comentário de linha única
a ← 10  // Comentário inline
```

## Exemplos Práticos

### Exemplo 1: Tabuada

```peteqs
numero ← 5

IMPRIMALN 'Tabuada do ' + numero

PARA i ← 1 ATÉ 10 FAÇA
  resultado ← numero * i
  IMPRIMALN numero + ' x ' + i + ' = ' + resultado
FIM PARA
```

### Exemplo 2: Números Pares

```peteqs
IMPRIMALN 'Números pares de 1 a 20:'

PARA i ← 1 ATÉ 20 FAÇA
  SE i MOD 2 = 0 ENTÃO
    IMPRIMA i
    IMPRIMA ' '
  FIM SE
FIM PARA
```

### Exemplo 3: Validação de Idade

```peteqs
idade ← 17

SE idade >= 18 ENTÃO
  IMPRIMALN 'Você é maior de idade'
SENÃO
  IMPRIMALN 'Você é menor de idade'
FIM SE
```

### Exemplo 4: Soma de Números

```peteqs
FUNCAO somaNumeros(n)
  soma ← 0
  PARA i ← 1 ATÉ n FAÇA
    soma ← soma + i
  FIM PARA
  RETORNA soma
FIM FUNCAO

resultado ← somaNumeros(10)
IMPRIMALN 'Soma de 1 a 10: ' + resultado
```

### Exemplo 5: Fibonacci

```peteqs
n ← 10
a ← 0
b ← 1

IMPRIMALN 'Sequência de Fibonacci:'
IMPRIMALN a

PARA i ← 1 ATÉ n FAÇA
  proximo ← a + b
  IMPRIMALN proximo
  a ← b
  b ← proximo
FIM PARA
```

## Tratamento de Erros

O DUMITEQS fornece mensagens de erro detalhadas para ajudar na correção de problemas.

### Tipos de Erro Comuns

#### Erro: Variável não definida

```
Erro na linha 3: Variável 'x' não foi definida
```

**Solução**: Certifique-se de que a variável foi atribuída antes de ser usada.

#### Erro: Sintaxe inválida

```
Erro na linha 5: Sintaxe inválida
```

**Solução**: Verifique se você usou as palavras-chave corretas (PARA, SE, ENTÃO, etc.).

#### Erro: Fim de bloco não encontrado

```
Erro na linha 8: FIM PARA esperado
```

**Solução**: Certifique-se de que cada estrutura (PARA, SE, ENQUANTO) tem um FIM correspondente.

## FAQ

### P: Qual é a diferença entre `=` e `←`?

**R**: 
- `←` é usado para **atribuição** (guardar um valor em uma variável)
- `=` é usado para **comparação** (verificar se dois valores são iguais)

Exemplo:
```peteqs
a ← 10      // Atribuição: guarda 10 em 'a'
SE a = 10   // Comparação: verifica se 'a' é igual a 10
```

### P: Posso usar `==` em vez de `=` para comparação?

**R**: Sim! Ambos funcionam:
```peteqs
SE a = 10 ENTÃO      // Funciona
SE a == 10 ENTÃO     // Também funciona
```

### P: Como faço um loop infinito?

**R**: Use `ENQUANTO` com uma condição sempre verdadeira:
```peteqs
ENQUANTO 1 = 1 FAÇA
  IMPRIMALN 'Repetindo...'
FIM ENQUANTO
```

### P: Posso usar funções dentro de funções?

**R**: Sim! Você pode chamar uma função dentro de outra:
```peteqs
FUNCAO quadrado(x)
  RETORNA x * x
FIM FUNCAO

FUNCAO cubo(x)
  RETORNA quadrado(x) * x
FIM FUNCAO
```

### P: Como faço para ler entrada do usuário?

**R**: Use o comando `LEIA`:
```peteqs
IMPRIMALN 'Digite seu nome:'
LEIA nome
IMPRIMALN 'Olá, ' + nome + '!'
```

### P: Qual é o tamanho máximo de um vetor?

**R**: Não há limite teórico, mas depende da memória disponível no navegador.

### P: Posso usar números negativos?

**R**: Sim! Você pode usar números negativos normalmente:
```peteqs
a ← -10
b ← -5
resultado ← a + b
IMPRIMALN resultado  // Imprime -15
```

## Recursos Adicionais

- **Repositório GitHub**: https://github.com/NathDumit/dumiteqs
- **Issues e Discussões**: https://github.com/NathDumit/dumiteqs/issues
- **Licença**: MIT

---

**Desenvolvido com ❤️ para educação em programação**

Última atualização: 2025

