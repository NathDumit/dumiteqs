/**
 * DUMITEQS - Interpretador PETEQS completo
 * Baseado no ipeteqsJS original de Leon de França Nascimento
 * Adaptado para TypeScript/React
 */

export interface InterpretResult {
  output: string;
  error?: string;
}

export function interpretPETEQS(code: string): InterpretResult {
  try {
    const interpreter = new PETEQSInterpreter();
    const result = interpreter.interpret(code);
    return result;
  } catch (error: any) {
    return {
      output: '',
      error: `Erro: ${error.message}`
    };
  }
}

class PETEQSInterpreter {
  private output: string = '';
  private target: any = { innerHTML: '' };

  interpret(code: string): InterpretResult {
    try {
      this.output = '';
      this.target = { innerHTML: '' };

      // Usar o núcleo de interpretação
      PeteqsHelper.execute(code, this.target);
      
      return { output: this.target.innerHTML.trimEnd() };
    } catch (error: any) {
      return {
        output: '',
        error: `Erro: ${error.message}`
      };
    }
  }
}

// Helper do PETEQS
const PeteqsHelper = {
  purge: function (): void {
    // Limpar estado se necessário
  },

  /**
   * Converte operadores PETEQS para JavaScript
   */
  convertExpression: function (expr: string): string {
    // Normalizar operadores
    expr = expr.replace(/←/g, '<-');
    expr = expr.replace(/→/g, '<-');
    expr = expr.replace(/–/g, '-');
    
    // Converter operadores PETEQS para JavaScript
    expr = expr.replace(/\s+mod\s+/gi, ' % ');
    expr = expr.replace(/<>/g, ' != ');
    expr = expr.replace(/([^<>!])=/g, '$1 == ');
    expr = expr.replace(/\s+E\s+/gi, ' && ');
    expr = expr.replace(/\s+OU\s+/gi, ' || ');
    expr = expr.replace(/\s+NÃO\s+/gi, ' !');
    expr = expr.replace(/verdadeiro/gi, 'true');
    expr = expr.replace(/falso/gi, 'false');
    
    return expr;
  },

  /**
   * Limpa o código PETEQS
   */
  cleanCode: function (code: string): string[] {
    code = code.replace(/\r\n/g, '\n');
    return code.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('//'));
  },

  /**
   * Executa o código PETEQS
   */
  execute: function (PQ_code: string, target: any): void {
    this.purge();

    const lines = this.cleanCode(PQ_code);
    let jsCode = `
(function(target) {
  let loopStart = Date.now();
  let pq_resultado = undefined;
  
  function PQ_print(t, ...args) {
    for (let arg of args) {
      if (arg !== undefined && arg !== null) {
        if (typeof arg === 'boolean') {
          arg = arg.toString();
        }
        t.innerHTML += arg;
      }
    }
  }
  
`;

    // Processar linhas
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const processed = this.processLine(line, lines, i);
      if (processed.code) {
        jsCode += '  ' + processed.code + '\n';
      }
      if (processed.skipLines) {
        i += processed.skipLines;
      }
    }

    jsCode += `
})(target);
`;

    try {
      eval(jsCode);
    } catch (e: any) {
      target.innerHTML = `Erro ao executar código: ${e.message}`;
    }
  },

  /**
   * Processa uma linha de código PETEQS
   */
  processLine: function (line: string, allLines: string[], lineIndex: number): { code: string; skipLines: number } {
    line = line.trim();

    if (!line || line.startsWith('//')) {
      return { code: '', skipLines: 0 };
    }

    // IMPRIMALN - imprime com quebra de linha
    if (line.match(/^imprimaln\s+/i)) {
      const expr = line.replace(/^imprimaln\s+/i, '').trim();
      const converted = this.convertExpression(expr);
      return { code: `PQ_print(target, ${converted}); PQ_print(target, '<br>');`, skipLines: 0 };
    }

    // IMPRIMA - imprime sem quebra de linha
    if (line.match(/^imprima\s+/i)) {
      const expr = line.replace(/^imprima\s+/i, '').trim();
      const converted = this.convertExpression(expr);
      return { code: `PQ_print(target, ${converted});`, skipLines: 0 };
    }

    // LEIA - lê entrada do usuário
    if (line.match(/^leia\s+/i)) {
      const varname = line.replace(/^leia\s+/i, '').trim();
      return { code: `${varname} = prompt('Insira o valor da variável ${varname}'); if(!isNaN(${varname})) { ${varname} = Number(${varname}); }`, skipLines: 0 };
    }

    // PARA - loop com contador
    if (line.match(/^para\s+/i)) {
      const match = line.match(/para\s+(\w+)\s*<-\s*([^\s]+)\s+(?:até|ate)\s+([^\s]+)\s+(?:faça|faca)/i);
      if (match) {
        const varname = match[1];
        const start = this.convertExpression(match[2]);
        const end = this.convertExpression(match[3]);
        
        let loopCode = `
var ${varname} = ${start};
var pq_para_end_${varname} = ${end};
if (pq_para_end_${varname} >= ${start}) {
  while (${varname} <= pq_para_end_${varname}) {
    if (Date.now() - loopStart > 30000) {
      PQ_print(target, 'Erro: Loop infinito detectado');
      break;
    }
`;
        
        // Encontrar FIM PARA
        let endIndex = lineIndex + 1;
        while (endIndex < allLines.length && !allLines[endIndex].match(/^fim\s+para/i)) {
          endIndex++;
        }
        
        // Processar linhas dentro do loop
        for (let i = lineIndex + 1; i < endIndex; i++) {
          const innerLine = allLines[i].trim();
          if (innerLine && !innerLine.startsWith('//')) {
            const processed = this.processLine(innerLine, allLines, i);
            if (processed.code) {
              loopCode += '    ' + processed.code + '\n';
            }
          }
        }
        
        loopCode += `
    ${varname}++;
  }
} else {
  while (${varname} >= pq_para_end_${varname}) {
    if (Date.now() - loopStart > 30000) {
      PQ_print(target, 'Erro: Loop infinito detectado');
      break;
    }
`;
        
        // Processar linhas dentro do loop (decrescente)
        for (let i = lineIndex + 1; i < endIndex; i++) {
          const innerLine = allLines[i].trim();
          if (innerLine && !innerLine.startsWith('//')) {
            const processed = this.processLine(innerLine, allLines, i);
            if (processed.code) {
              loopCode += '    ' + processed.code + '\n';
            }
          }
        }
        
        loopCode += `
    ${varname}--;
  }
}
`;
        
        return { code: loopCode, skipLines: endIndex - lineIndex };
      }
    }

    // ENQUANTO - loop condicional
    if (line.match(/^enquanto\s+/i)) {
      const match = line.match(/enquanto\s+(.*?)\s+(?:faça|faca)/i);
      if (match) {
        const condition = this.convertExpression(match[1]);
        
        let loopCode = `
while (${condition}) {
  if (Date.now() - loopStart > 30000) {
    PQ_print(target, 'Erro: Loop infinito detectado');
    break;
  }
`;
        
        // Encontrar FIM ENQUANTO
        let endIndex = lineIndex + 1;
        while (endIndex < allLines.length && !allLines[endIndex].match(/^fim\s+enquanto/i)) {
          endIndex++;
        }
        
        // Processar linhas dentro do loop
        for (let i = lineIndex + 1; i < endIndex; i++) {
          const innerLine = allLines[i].trim();
          if (innerLine && !innerLine.startsWith('//')) {
            const processed = this.processLine(innerLine, allLines, i);
            if (processed.code) {
              loopCode += '  ' + processed.code + '\n';
            }
          }
        }
        
        loopCode += '}';
        
        return { code: loopCode, skipLines: endIndex - lineIndex };
      }
    }

    // REPITA - loop com número fixo de iterações
    if (line.match(/^repita\s+/i)) {
      const match = line.match(/repita\s+([^\s]+)\s+vezes/i);
      if (match) {
        const times = this.convertExpression(match[1]);
        
        let loopCode = `
for (let pq_repita_i = 0; pq_repita_i < ${times}; pq_repita_i++) {
  if (Date.now() - loopStart > 30000) {
    PQ_print(target, 'Erro: Loop infinito detectado');
    break;
  }
`;
        
        // Encontrar FIM REPITA
        let endIndex = lineIndex + 1;
        while (endIndex < allLines.length && !allLines[endIndex].match(/^fim\s+repita/i)) {
          endIndex++;
        }
        
        // Processar linhas dentro do loop
        for (let i = lineIndex + 1; i < endIndex; i++) {
          const innerLine = allLines[i].trim();
          if (innerLine && !innerLine.startsWith('//')) {
            const processed = this.processLine(innerLine, allLines, i);
            if (processed.code) {
              loopCode += '  ' + processed.code + '\n';
            }
          }
        }
        
        loopCode += '}';
        
        return { code: loopCode, skipLines: endIndex - lineIndex };
      }
    }

    // SE - condicional
    if (line.match(/^se\s+/i)) {
      const match = line.match(/se\s+(.*?)\s+(?:então|entao)/i);
      if (match) {
        const condition = this.convertExpression(match[1]);
        
        let ifCode = `if (${condition}) {`;
        
        // Encontrar FIM SE ou SENÃO
        let endIndex = lineIndex + 1;
        let elseIndex = -1;
        while (endIndex < allLines.length && !allLines[endIndex].match(/^fim\s+se/i)) {
          if (allLines[endIndex].match(/^senão|^senao/i)) {
            elseIndex = endIndex;
            break;
          }
          endIndex++;
        }
        
        // Processar linhas dentro do SE
        const startBlock = lineIndex + 1;
        const endBlock = elseIndex >= 0 ? elseIndex : endIndex;
        
        for (let i = startBlock; i < endBlock; i++) {
          const innerLine = allLines[i].trim();
          if (innerLine && !innerLine.startsWith('//')) {
            const processed = this.processLine(innerLine, allLines, i);
            if (processed.code) {
              ifCode += '\n  ' + processed.code;
            }
          }
        }
        
        // Se houver SENÃO
        if (elseIndex >= 0) {
          ifCode += '\n} else {';
          
          // Encontrar FIM SE
          endIndex = elseIndex + 1;
          while (endIndex < allLines.length && !allLines[endIndex].match(/^fim\s+se/i)) {
            endIndex++;
          }
          
          // Processar linhas dentro do SENÃO
          for (let i = elseIndex + 1; i < endIndex; i++) {
            const innerLine = allLines[i].trim();
            if (innerLine && !innerLine.startsWith('//')) {
              const processed = this.processLine(innerLine, allLines, i);
              if (processed.code) {
                ifCode += '\n  ' + processed.code;
              }
            }
          }
        }
        
        ifCode += '\n}';
        
        return { code: ifCode, skipLines: endIndex - lineIndex };
      }
    }

    // Atribuição de variável
    if (line.match(/<-/)) {
      const converted = this.convertExpression(line);
      const varName = converted.split('=')[0].trim();
      return { code: `var ${converted.replace(/<-/, '=')};`, skipLines: 0 };
    }

    // Ignorar linhas de controle (FIM, SENÃO, etc)
    if (line.match(/^fim|^senão|^senao|^próximo|^proximo/i)) {
      return { code: '', skipLines: 0 };
    }

    return { code: '', skipLines: 0 };
  }
};

