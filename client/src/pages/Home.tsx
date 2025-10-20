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
};

export default function Home() {
  const [code, setCode] = useState(EXAMPLES.hello);
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [translatedCode, setTranslatedCode] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [showTranslated, setShowTranslated] = useState(false);

  const handleExecute = () => {
    setIsRunning(true);
    setError('');
    setOutput('');
    setTranslatedCode('');

    try {
      const result = interpretPETEQS(code);
      
      if (result.error) {
        setError(result.error);
      } else {
        setOutput(result.output || '(Nenhuma saída)');
      }
      
      if (result.translatedCode) {
        setTranslatedCode(result.translatedCode);
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
    setTranslatedCode('');
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
    setTranslatedCode('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">P</span>
                </div>
                Interpretador PETEQS
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Pseudolinguagem para aprendizado de lógica de programação
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="border-slate-600 hover:bg-slate-700"
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
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-400" />
                  Editor de Código
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Escreva seu código PETEQS abaixo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full h-64 p-4 bg-slate-900 text-white font-mono text-sm border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Digite seu código PETEQS aqui..."
                  spellCheck="false"
                />
              </CardContent>
            </Card>

            {/* Examples */}
            <Card className="bg-slate-800 border-slate-700">
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
                      className="border-slate-600 hover:bg-slate-700 text-slate-300 capitalize"
                    >
                      {key === 'hello' && 'Olá Mundo'}
                      {key === 'variables' && 'Variáveis'}
                      {key === 'loop' && 'Loop PARA'}
                      {key === 'conditional' && 'Condicional'}
                      {key === 'array' && 'Vetores'}
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
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-6 text-lg"
            >
              <Play className="w-5 h-5 mr-2" />
              {isRunning ? 'Executando...' : 'Executar'}
            </Button>

            {/* Output */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-sm">Saída</CardTitle>
                  {output && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyOutput}
                      className="text-slate-400 hover:text-white"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-900 rounded-lg p-4 min-h-32 max-h-48 overflow-y-auto font-mono text-sm text-slate-300 whitespace-pre-wrap break-words">
                  {error ? (
                    <div className="text-red-400">{error}</div>
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
                    <div className="text-slate-500">Nenhuma saída ainda</div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Translated Code Toggle */}
            {translatedCode && (
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowTranslated(!showTranslated)}
                    className="w-full justify-start text-white hover:bg-slate-700"
                  >
                    <span className="text-xs">
                      {showTranslated ? '▼' : '▶'} Código JavaScript Traduzido
                    </span>
                  </Button>
                </CardHeader>
                {showTranslated && (
                  <CardContent>
                    <div className="bg-slate-900 rounded-lg p-3 max-h-48 overflow-y-auto font-mono text-xs text-slate-400 whitespace-pre-wrap break-words">
                      {translatedCode}
                    </div>
                  </CardContent>
                )}
              </Card>
            )}
          </div>
        </div>

        {/* Documentation */}
        <Card className="mt-8 bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Guia Rápido de Sintaxe</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-slate-300 text-sm">
              <div>
                <h3 className="font-semibold text-white mb-3">Operações Básicas</h3>
                <ul className="space-y-2 font-mono text-xs">
                  <li><span className="text-blue-400">a &lt;- 10</span> Atribuição</li>
                  <li><span className="text-blue-400">a + b, a - b</span> Soma e Subtração</li>
                  <li><span className="text-blue-400">a * b, a / b</span> Multiplicação e Divisão</li>
                  <li><span className="text-blue-400">a MOD b</span> Módulo</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-3">Estruturas de Controle</h3>
                <ul className="space-y-2 font-mono text-xs">
                  <li><span className="text-blue-400">SE ... ENTÃO ... FIM SE</span> Condicional</li>
                  <li><span className="text-blue-400">PARA i &lt;- 1 ATÉ 10 FAÇA ... FIM PARA</span> Loop</li>
                  <li><span className="text-blue-400">ENQUANTO ... FAÇA ... FIM ENQUANTO</span> Loop Condicional</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-3">Entrada e Saída</h3>
                <ul className="space-y-2 font-mono text-xs">
                  <li><span className="text-blue-400">IMPRIMA valor</span> Imprime sem quebra</li>
                  <li><span className="text-blue-400">IMPRIMALN valor</span> Imprime com quebra</li>
                  <li><span className="text-blue-400">LEIA variavel</span> Lê entrada</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-3">Operadores Lógicos</h3>
                <ul className="space-y-2 font-mono text-xs">
                  <li><span className="text-blue-400">=</span> Igual</li>
                  <li><span className="text-blue-400">&lt;&gt;</span> Diferente</li>
                  <li><span className="text-blue-400">&lt;, &gt;, &lt;=, &gt;=</span> Comparação</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

