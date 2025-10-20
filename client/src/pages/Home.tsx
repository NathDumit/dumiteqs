import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { interpretPETEQS } from '@/lib/ipeteqs';
import { Play, Copy, RotateCcw, BookOpen } from 'lucide-react';

const EXAMPLES = {
  hello: `IMPRIMALN 'Olá, Mundo!'`,
  
  variables: `a <- 10
b <- 20
soma <- a + b
IMPRIMALN 'A soma é: '
IMPRIMA soma`,

  loop: `PARA i <- 1 ATÉ 5 FAÇA
  IMPRIMALN i
FIM PARA`,

  conditional: `numero <- 7
SE numero > 5 ENTÃO
  IMPRIMALN 'Número é maior que 5'
SENÃO
  IMPRIMALN 'Número é menor ou igual a 5'
FIM SE`,

  array: `PARA i <- 1 ATÉ 3 FAÇA
  vetor[i] <- i * 10
  IMPRIMALN vetor[i]
FIM PARA`,

  error: `a <- 10
IMPRIMALN 'Valor de a: '
IMPRIMA a
IMPRIMALN 'Valor de b: '
IMPRIMA b
c <- x + 5`,

  repita: `REPITA 5 VEZES
  IMPRIMALN 'Descasque uma batata'
FIM REPITA`,

  enquanto: `i <- 1
ENQUANTO i <= 5 FAÇA
  IMPRIMALN i
  i <- i + 1
FIM ENQUANTO`,

  operadores: `a <- 10
b <- 5
IMPRIMALN 'Soma: '
IMPRIMA a + b
IMPRIMALN ''
IMPRIMALN 'Subtração: '
IMPRIMA a - b
IMPRIMALN ''
IMPRIMALN 'Multiplicação: '
IMPRIMA a * b`,
};

export default function Home() {
  const [code, setCode] = useState(EXAMPLES.hello);
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');

  const [isRunning, setIsRunning] = useState(false);

  const handleExecute = () => {
    setIsRunning(true);
    setError('');
    setOutput('');


    try {
      const result = interpretPETEQS(code);
      
      if (result.error) {
        setError(result.error);
      } else {
        setOutput(result.output || '(Nenhuma saída)');
      }
      

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsRunning(false);
    }
  };

  const handleLoadExample = (exampleKey: keyof typeof EXAMPLES) => {
    setCode(EXAMPLES[exampleKey]);
    setOutput('');
    setError('');

  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
  };

  const handleCopyOutput = () => {
    navigator.clipboard.writeText(output);
  };

  const handleReset = () => {
    setCode(EXAMPLES.hello);
    setOutput('');
    setError('');

  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-950 via-green-900 to-emerald-950">
      {/* Header */}
      <header className="border-b border-green-700 bg-green-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">D</span>
              </div>
              DUMITEQS
            </h1>
            <p className="text-green-300 text-sm mt-1">
              Pseudolinguagem para aprendizado de lógica de programação
            </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="border-green-600 hover:bg-green-700 text-white"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Resetar
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Editor */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="bg-green-800 border-green-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-green-300" />
                  Editor de Código
                </CardTitle>
                <CardDescription className="text-green-300">
                  Escreva seu código DUMITEQS abaixo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full h-64 p-4 bg-green-950 text-green-100 font-mono text-sm border border-green-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent resize-none"
                  placeholder="Digite seu código DUMITEQS aqui..."
                  spellCheck="false"
                />
              </CardContent>
            </Card>

            {/* Examples */}
            <Card className="bg-green-800 border-green-700">
              <CardHeader>
                <CardTitle className="text-white text-sm">Exemplos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(EXAMPLES).map(([key, _]) => (
                    <Button
                      key={key}
                      variant="outline"
                      size="sm"
                      onClick={() => handleLoadExample(key as keyof typeof EXAMPLES)}
                      className="border-green-600 hover:bg-green-700 text-green-100 capitalize"
                    >
                      {key === 'hello' && 'Olá Mundo'}
                      {key === 'variables' && 'Variáveis'}
                      {key === 'loop' && 'Loop PARA'}
                      {key === 'conditional' && 'Condicional'}
                      {key === 'array' && 'Vetores'}
                      {key === 'repita' && 'Repita'}
                      {key === 'enquanto' && 'Enquanto'}
                      {key === 'operadores' && 'Operadores'}
                      {key === 'error' && 'Com Erro'}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Execute Button */}
            <Button
              onClick={handleExecute}
              disabled={isRunning}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-6 text-lg"
            >
              <Play className="w-5 h-5 mr-2" />
              {isRunning ? 'Executando...' : 'Executar'}
            </Button>

            {/* Output */}
            <Card className="bg-green-800 border-green-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-sm">Saída</CardTitle>
                  {output && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyOutput}
                      className="text-green-300 hover:text-white"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-green-950 rounded-lg p-4 min-h-32 max-h-48 overflow-y-auto font-mono text-sm text-green-300 whitespace-pre-wrap break-words">
                  {error ? (
                    <div className="text-red-300 whitespace-pre-line">{error}</div>
                  ) : output ? (
                    <div
                      dangerouslySetInnerHTML={{
                        __html: output
                          .replace(/</g, '&lt;')
                          .replace(/>/g, '&gt;')
                          .replace(/<br>/g, '<br>')
                          .replace(/&lt;br&gt;/g, '<br>'),
                      }}
                    />
                  ) : (
                    <div className="text-green-700">Nenhuma saída ainda</div>
                  )}
                </div>
              </CardContent>
            </Card>


          </div>
        </div>

        {/* Documentation */}
        <Card className="mt-8 bg-green-800 border-green-700">
          <CardHeader>
            <CardTitle className="text-white">Guia Rápido de Sintaxe</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-green-100 text-sm">
              <div>
                <h3 className="font-semibold text-white mb-3">Operações Básicas</h3>
                <ul className="space-y-2 font-mono text-xs">
                  <li><span className="text-green-300">a &lt;- 10</span> Atribuição</li>
                  <li><span className="text-green-300">a + b, a - b</span> Soma e Subtração</li>
                  <li><span className="text-green-300">a * b, a / b</span> Multiplicação e Divisão</li>
                  <li><span className="text-green-300">a MOD b</span> Módulo</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-3">Estruturas de Controle</h3>
                <ul className="space-y-2 font-mono text-xs">
                  <li><span className="text-green-300">SE ... ENTÃO ... FIM SE</span> Condicional</li>
                  <li><span className="text-green-300">PARA i &lt;- 1 ATÉ 10 FAÇA ... FIM PARA</span> Loop</li>
                  <li><span className="text-green-300">ENQUANTO ... FAÇA ... FIM ENQUANTO</span> Loop Condicional</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-3">Entrada e Saída</h3>
                <ul className="space-y-2 font-mono text-xs">
                  <li><span className="text-green-300">IMPRIMA valor</span> Imprime sem quebra</li>
                  <li><span className="text-green-300">IMPRIMALN valor</span> Imprime com quebra</li>
                  <li><span className="text-green-300">LEIA variavel</span> Lê entrada</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-3">Operadores Lógicos</h3>
                <ul className="space-y-2 font-mono text-xs">
                  <li><span className="text-green-300">=</span> Igual</li>
                  <li><span className="text-green-300">&lt;&gt;</span> Diferente</li>
                  <li><span className="text-green-300">&lt;, &gt;, &lt;=, &gt;=</span> Comparação</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tutorial para Leigos */}
        <Card className="mt-8 bg-green-800 border-green-700">
          <CardHeader>
            <CardTitle className="text-white">📚 Tutorial para Leigos - Começando com PETEQS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6 text-green-100 text-sm">
              {/* Seção 1: O que é PETEQS */}
              <div>
                <h3 className="font-semibold text-white text-base mb-2">1️⃣ O que é PETEQS?</h3>
                <p className="mb-3">
                  PETEQS é uma <strong>pseudolinguagem</strong> criada para ensinar lógica de programação de forma simples e intuitiva. 
                  Ela usa palavras em português para que você entenda o que está fazendo, sem precisar aprender sintaxe complicada.
                </p>
                <p className="text-green-300 bg-green-950 p-3 rounded font-mono text-xs">
                  Exemplo: <strong>IMPRIMALN 'Olá, Mundo!'</strong> imprime "Olá, Mundo!" na tela
                </p>
              </div>

              {/* Seção 2: Conceitos Básicos */}
              <div>
                <h3 className="font-semibold text-white text-base mb-2">2️⃣ Conceitos Básicos</h3>
                <div className="space-y-3">
                  <div>
                    <p className="font-semibold text-green-300">Variáveis (caixas para guardar valores)</p>
                    <p className="text-green-200 mb-2">Uma variável é como uma caixa onde você guarda um valor. Para criar uma:</p>
                    <p className="text-green-300 bg-green-950 p-2 rounded font-mono text-xs">a &lt;- 10</p>
                    <p className="text-xs mt-1">Isso cria uma variável chamada "a" e coloca o número 10 dentro dela.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-green-300">Operações Matemáticas</p>
                    <p className="text-green-200 mb-2">Você pode fazer contas com as variáveis:</p>
                    <p className="text-green-300 bg-green-950 p-2 rounded font-mono text-xs">b &lt;- a + 5</p>
                    <p className="text-xs mt-1">Isso pega o valor de "a" (10), soma 5 e guarda o resultado (15) em "b".</p>
                  </div>
                </div>
              </div>

              {/* Seção 3: Imprimindo Resultados */}
              <div>
                <h3 className="font-semibold text-white text-base mb-2">3️⃣ Imprimindo Resultados na Tela</h3>
                <p className="mb-3">Para ver o resultado do seu programa, use:</p>
                <div className="space-y-2">
                  <div>
                    <p className="text-green-300 bg-green-950 p-2 rounded font-mono text-xs">IMPRIMALN 'Texto aqui'</p>
                    <p className="text-xs mt-1">Imprime o texto e pula para a próxima linha</p>
                  </div>
                  <div>
                    <p className="text-green-300 bg-green-950 p-2 rounded font-mono text-xs">IMPRIMA valor</p>
                    <p className="text-xs mt-1">Imprime o valor SEM pular linha (continua na mesma linha)</p>
                  </div>
                </div>
              </div>

              {/* Seção 4: Loops (Repetição) */}
              <div>
                <h3 className="font-semibold text-white text-base mb-2">4️⃣ Repetindo Ações (Loops)</h3>
                <p className="mb-3">Às vezes você quer fazer a mesma coisa várias vezes. Existem dois tipos:</p>
                <div className="space-y-3">
                  <div>
                    <p className="font-semibold text-green-300">PARA - Quando você sabe quantas vezes repetir</p>
                    <p className="text-green-300 bg-green-950 p-2 rounded font-mono text-xs mb-2">
                      PARA i &lt;- 1 ATÉ 5 FAÇA<br/>
                      &nbsp;&nbsp;IMPRIMALN i<br/>
                      FIM PARA
                    </p>
                    <p className="text-xs">Isso imprime os números de 1 a 5, um em cada linha.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-green-300">REPITA N VEZES - Repetir um número fixo de vezes</p>
                    <p className="text-green-300 bg-green-950 p-2 rounded font-mono text-xs mb-2">
                      REPITA 3 VEZES<br/>
                      &nbsp;&nbsp;IMPRIMALN 'Olá!'<br/>
                      FIM REPITA
                    </p>
                    <p className="text-xs">Isso imprime "Olá!" exatamente 3 vezes.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-green-300">ENQUANTO - Repetir enquanto uma condição for verdadeira</p>
                    <p className="text-green-300 bg-green-950 p-2 rounded font-mono text-xs mb-2">
                      i &lt;- 1<br/>
                      ENQUANTO i &lt;= 5 FAÇA<br/>
                      &nbsp;&nbsp;IMPRIMALN i<br/>
                      &nbsp;&nbsp;i &lt;- i + 1<br/>
                      FIM ENQUANTO
                    </p>
                    <p className="text-xs">Repete enquanto "i" for menor ou igual a 5.</p>
                  </div>
                </div>
              </div>

              {/* Seção 5: Decisões */}
              <div>
                <h3 className="font-semibold text-white text-base mb-2">5️⃣ Tomando Decisões (SE/ENTÃO)</h3>
                <p className="mb-3">Use SE quando você quer fazer algo APENAS se uma condição for verdadeira:</p>
                <p className="text-green-300 bg-green-950 p-2 rounded font-mono text-xs mb-2">
                  numero &lt;- 10<br/>
                  SE numero &gt; 5 ENTÃO<br/>
                  &nbsp;&nbsp;IMPRIMALN 'Número é grande!'<br/>
                  SENÃO<br/>
                  &nbsp;&nbsp;IMPRIMALN 'Número é pequeno!'<br/>
                  FIM SE
                </p>
                <p className="text-xs">Se o número for maior que 5, imprime "Número é grande!", caso contrário imprime "Número é pequeno!"</p>
              </div>

              {/* Seção 6: Dicas Práticas */}
              <div>
                <h3 className="font-semibold text-white text-base mb-2">💡 Dicas Práticas</h3>
                <ul className="space-y-2 text-xs">
                  <li>✅ <strong>Comece simples:</strong> Teste primeiro um IMPRIMALN para ver se funciona</li>
                  <li>✅ <strong>Use nomes claros:</strong> Use "idade" em vez de "a" para variáveis</li>
                  <li>✅ <strong>Indente o código:</strong> Coloque espaços antes de linhas dentro de loops e SE</li>
                  <li>✅ <strong>Teste os exemplos:</strong> Clique nos botões de exemplo para ver como funcionam</li>
                  <li>✅ <strong>Leia os erros:</strong> Se der erro, leia a mensagem - ela te ajuda a corrigir</li>
                </ul>
              </div>

              {/* Seção 7: Próximos Passos */}
              <div>
                <h3 className="font-semibold text-white text-base mb-2">🚀 Próximos Passos</h3>
                <p className="mb-3">Agora que você conhece o básico:</p>
                <ol className="space-y-2 text-xs list-decimal list-inside">
                  <li>Clique em um dos exemplos acima para ver como funciona</li>
                  <li>Modifique o código e veja o que muda</li>
                  <li>Crie seu próprio programa do zero</li>
                  <li>Combine loops, decisões e variáveis para criar programas mais complexos</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

