/**
 * Ipeteqs.js -> Implementação do interpretador de PETEQS em javascript
 * Baseado em: https://github.com/LeonNasc/ipeteqsJS
 * @author Leon de França Nascimento
 * Adaptado para TypeScript
 */

export interface ExecutionResult {
  output: string;
  error?: string;
  errorDetails?: {
    message: string;
    line: number;
    type: string;
    code?: string;
  };
  translatedCode?: string;
}

// Função de impressão
function PQ_print(target: string[], ...args: any[]): void {
  for (let i = 0; i < args.length; i++) {
    if (args[i] || args[i] === 0) {
      if (typeof args[i] === 'boolean') {
        args[i] = args[i].toString();
      }
      target.push(String(args[i]));
    }
  }
}

const PeteqsHelper = {
  in_function: [] as string[],
  in_loop: [] as string[],

  // Converte expressões PETEQS para JavaScript
  exp_converter(expr: string): string {
    expr = expr.trim();

    // Substituir operadores lógicos
    expr = expr.replace(/\s*=\s*/g, ' == ');
    expr = expr.replace(/\s*<>\s*/g, ' != ');
    expr = expr.replace(/\s+E\s+/gi, ' && ');
    expr = expr.replace(/\s+OU\s+/gi, ' || ');
    expr = expr.replace(/\s+NÃO\s+/gi, ' !');
    expr = expr.replace(/\s+MOD\s+/gi, ' % ');

    // Substituir valores booleanos
    expr = expr.replace(/\bVERDADEIRO\b/gi, 'true');
    expr = expr.replace(/\bFALSO\b/gi, 'false');

    // Substituir operador de atribuição
    expr = expr.replace(/<-/g, '=');

    return expr;
  },

  // Verifica se há vetores na expressão
  has_vector(expr: string): boolean {
    return /\[.*?\]/.test(expr);
  },

  // Trata vetores
  handle_vectors(expr: string): string {
    const vectorMatches = expr.match(/(\w+)\s*\[/g);
    let code = '';

    if (vectorMatches) {
      const vectors = new Set(vectorMatches.map(m => m.replace(/\[/, '').trim()));
      vectors.forEach(vector => {
        code += `if(typeof ${vector} === 'undefined') ${vector} = {};\n`;
      });
    }

    return code;
  },

  // Obtém entrada do usuário
  get_input(hasVector: boolean, varName: string): string {
    if (hasVector) {
      const match = varName.match(/(\w+)\[(.+?)\]/);
      if (match) {
        const arrayName = match[1];
        const index = match[2];
        return `${arrayName}[${index}] = prompt("Digite um valor:");`;
      }
    }
    return `${varName} = prompt("Digite um valor para ${varName}:");`;
  },

  // Remove comentários
  remove_comments(code: string): string {
    return code.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
  },

  // Limpa código PETEQS
  clean_PTQ_code(code: string): string[] {
    code = code.replace(/→/g, '<-');
    code = code.replace(/←/g, '<-');

    const procs = (code.match(/procedimento/gi) || []).length;
    const funcs = (code.match(/função/gi) || []).length;
    const inicios = (code.match(/in[íi]cio/gi) || []).length;
    const fins = (code.match(/fim/gi) || []).length;

    if ((procs + funcs) * 2 !== inicios + fins) {
      const n = code.lastIndexOf('fim');
      code = code.slice(0, n) + code.slice(n).replace(/fim$/i, '');
    }

    return code.split('\n');
  },
};

const PeteqsCore = {
  // Função de impressão
  imprima(args: string = ''): string {
    const statement = PeteqsHelper.exp_converter(
      args.replace(/^imprimaln|^imprima/gi, '')
    );
    return `PQ_print(target,${statement});`;
  },

  // Função de impressão com nova linha
  imprimaln(args: string = ''): string {
    return PeteqsCore.imprima(args) + "\nPQ_print(target,'\\n');";
  },

  // Função de entrada
  leia(linha: string): string {
    let code = '';
    linha = linha.substring(4, linha.length);

    code = PeteqsHelper.handle_vectors(linha) + '\n';
    code += PeteqsHelper.get_input(
      PeteqsHelper.has_vector(linha),
      linha
    );

    return (
      code +
      `\nif(!isNaN(${linha})){${linha} = Number(${linha})}`
    );
  },

  // Função de atribuição
  atribui(args: string): string {
    args = PeteqsHelper.exp_converter(args);

    if (PeteqsHelper.has_vector(args)) {
      args = PeteqsHelper.handle_vectors(args) + '\n' + args;
    }

    return args.replace(/<-/, '=');
  },

  // Função condicional SE
  se(cond: string): string {
    cond = cond.replace(/se/gi, '');

    if (cond.match(/então/gi)) {
      cond = cond.replace(/então/gi, '');
    }

    cond = PeteqsHelper.exp_converter(cond.trim());
    return `if(${cond}){`;
  },

  // Função condicional SENÃO
  senao(cond: string = ''): string {
    cond = cond.replace(/senão/gi, '');

    if (cond.match(/se/gi)) {
      cond = PeteqsCore.se(cond);
    }

    return cond ? `}else ${cond}` : '}else{';
  },

  // Função PARA
  para(args: string): string {
    // PARA i <- 1 ATÉ 10 FAÇA
    const match = args.match(
      /para\s+(\w+)\s*<-\s*(.+?)\s+até\s+(.+?)\s+faça/i
    );
    if (!match) return '';

    const varName = match[1];
    const start = PeteqsHelper.exp_converter(match[2].trim());
    const end = PeteqsHelper.exp_converter(match[3].trim());

    PeteqsHelper.in_loop.push('para');

    return `for(${varName} = ${start}; ${varName} <= ${end}; ${varName}++){`;
  },

  // Função ENQUANTO
  enquanto(args: string): string {
    // ENQUANTO condição FAÇA
    const match = args.match(/enquanto\s+(.+?)\s+faça/i);
    if (!match) return '';

    const condition = PeteqsHelper.exp_converter(match[1].trim());

    PeteqsHelper.in_loop.push('enquanto');

    return `let loopStart = Date.now(); while(${condition}){ if(Date.now() - loopStart > 30000) break;`;
  },

  // Função FIM
  fim(args: string = ''): string {
    if (PeteqsHelper.in_loop.length > 0) {
      PeteqsHelper.in_loop.pop();
      return '}';
    }
    if (PeteqsHelper.in_function.length > 0) {
      PeteqsHelper.in_function.pop();
      return '}';
    }
    return '}';
  },

  // Função FUNÇÃO
  funcao(args: string): string {
    const regex = /(\S+ ?(?=\())(\(.*\))/;
    args = args.replace(/\[\]/g, '');

    const assinatura = args.match(regex);
    if (!assinatura) return '';

    const nome = assinatura[1];
    PeteqsHelper.in_function.push(nome);

    return `function ${nome}${assinatura[2]}{`;
  },

  // Função PROCEDIMENTO
  procedimento(args: string): string {
    const match = args.match(/procedimento\s+(\w+)\s*\(/i);
    if (!match) return '';

    const nome = match[1];
    PeteqsHelper.in_function.push(nome);

    return `function ${nome}(){`;
  },

  // Traduz código PETEQS para JavaScript
  translate(code: string): string {
    code = PeteqsHelper.remove_comments(code);
    const lines = PeteqsHelper.clean_PTQ_code(code);

    let jsCode = 'let target = [];\n';
    jsCode += 'function PQ_print(...args) { for(let arg of args) { target.push(arg === true ? "verdadeiro" : arg === false ? "falso" : String(arg)); } }\n';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const lowerLine = trimmed.toLowerCase();

      if (lowerLine.match(/^imprimaln\s+/)) {
        jsCode += PeteqsCore.imprimaln(trimmed) + '\n';
      } else if (lowerLine.match(/^imprima\s+/)) {
        jsCode += PeteqsCore.imprima(trimmed) + '\n';
      } else if (lowerLine.match(/^leia\s+/)) {
        jsCode += PeteqsCore.leia(trimmed) + '\n';
      } else if (lowerLine.match(/^se\s+/)) {
        jsCode += PeteqsCore.se(trimmed) + '\n';
      } else if (lowerLine.match(/^senão/)) {
        jsCode += PeteqsCore.senao(trimmed) + '\n';
      } else if (lowerLine.match(/^para\s+/)) {
        jsCode += PeteqsCore.para(trimmed) + '\n';
      } else if (lowerLine.match(/^enquanto\s+/)) {
        jsCode += PeteqsCore.enquanto(trimmed) + '\n';
      } else if (lowerLine.match(/^função\s+/)) {
        jsCode += PeteqsCore.funcao(trimmed) + '\n';
      } else if (lowerLine.match(/^procedimento\s+/)) {
        jsCode += PeteqsCore.procedimento(trimmed) + '\n';
      } else if (lowerLine.match(/^fim/)) {
        jsCode += PeteqsCore.fim(trimmed) + '\n';
      } else if (lowerLine.match(/<-/)) {
        jsCode += PeteqsCore.atribui(trimmed) + '\n';
      } else if (trimmed.match(/^\w+\s*\(/)) {
        // Chamada de função
        jsCode += trimmed + ';\n';
      }
    }

    jsCode += 'return target.join("").replace(/\\n/g, "<br>");';

    return jsCode;
  },
};

function parseError(code: string, error: any): {
  message: string;
  line: number;
  type: string;
  code?: string;
} {
  const lines = code.split('\n');
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  let errorType = 'Erro Desconhecido';
  let lineNumber = 1;
  let problemCode = '';

  // Detectar tipo de erro
  if (errorMessage.includes('Unexpected token')) {
    errorType = 'Erro de Sintaxe';
  } else if (errorMessage.includes('is not defined')) {
    errorType = 'Variável não definida';
    const match = errorMessage.match(/(\w+) is not defined/);
    if (match) {
      const varName = match[1];
      // Encontrar a linha onde a variável é usada
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(varName)) {
          lineNumber = i + 1;
          problemCode = lines[i].trim();
          break;
        }
      }
    }
  } else if (errorMessage.includes('is not a function')) {
    errorType = 'Função não encontrada';
    const match = errorMessage.match(/(\w+) is not a function/);
    if (match) {
      const funcName = match[1];
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(funcName)) {
          lineNumber = i + 1;
          problemCode = lines[i].trim();
          break;
        }
      }
    }
  } else if (errorMessage.includes('Invalid or unexpected token')) {
    errorType = 'Token Inválido';
  } else if (errorMessage.includes('Missing')) {
    errorType = 'Sintaxe Incompleta';
  } else if (errorMessage.includes('Tempo máximo')) {
    errorType = 'Loop Infinito';
  }

  // Tentar encontrar a linha do erro no stack trace
  if (error instanceof Error && error.stack) {
    const stackMatch = error.stack.match(/:([0-9]+):/);
    if (stackMatch) {
      const stackLine = parseInt(stackMatch[1]);
      // Ajustar para a linha original do código PETEQS
      if (stackLine > 0 && stackLine <= lines.length) {
        lineNumber = stackLine;
        problemCode = lines[stackLine - 1]?.trim() || '';
      }
    }
  }

  return {
    message: errorMessage,
    line: lineNumber,
    type: errorType,
    code: problemCode,
  };
}

function formatErrorMessage(errorDetails: {
  message: string;
  line: number;
  type: string;
  code?: string;
}): string {
  let formatted = `❌ ${errorDetails.type}\n`;
  formatted += `📍 Linha ${errorDetails.line}\n`;
  
  if (errorDetails.code) {
    formatted += `📝 Código: ${errorDetails.code}\n`;
  }
  
  formatted += `💬 Detalhes: ${errorDetails.message}`;
  
  return formatted;
}

export function interpretPETEQS(code: string): ExecutionResult {
  try {
    const translatedCode = PeteqsCore.translate(code);

    // Criar função executável
    const executionFunction = new Function(translatedCode);
    const output = executionFunction();

    return {
      output: output || '',
      translatedCode,
    };
  } catch (error) {
    // Analisar o erro para extrair informações detalhadas
    const errorDetails = parseError(code, error);

    return {
      output: '',
      error: formatErrorMessage(errorDetails),
      errorDetails,
      translatedCode: '',
    };
  }
}

