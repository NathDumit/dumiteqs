/**
 * DUMITEQS - Interpretador PETEQS completo
 * Baseado no ipeteqsJS original de Leon de França Nascimento
 * Adaptado para TypeScript/React com suporte a PROCEDIMENTO e FUNCAO
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

  cleanCode: function (code: string): string[] {
    return code
      .split('\n')
      .map(line => {
        // Remover comentarios
        if (line.includes('//')) {
          line = line.substring(0, line.indexOf('//')).trim();
        }
        // Converter RETORNA para resultado <-
        line = line.replace(/^\s*retorna\s+/i, 'resultado <- ');
        // Converter CHAMAR para chamada direta
        line = line.replace(/^\s*chamar\s+/i, '');
        // Remover anotacoes de tipo
        line = line.replace(/\s*saidas\s*:\s*/gi, '');
        line = line.replace(/\s*entradas\s*:\s*/gi, '');
        return line.trim();
      })
      .filter(line => line && !line.startsWith('//'));
  },

  convertExpression: function (expr: string): string {
    if (!expr) return '""';
    
    expr = expr.trim();
    
    // Se for uma string entre aspas, manter como está
    if (expr.match(/^['"`]/)) {
      return expr;
    }
    
    // Converter operadores PETEQS para JavaScript
    expr = expr.replace(/\s+e\s+/gi, ' && ');
    expr = expr.replace(/\s+ou\s+/gi, ' || ');
    expr = expr.replace(/\s+não\s+/gi, ' !');
    expr = expr.replace(/\s+nao\s+/gi, ' !');
    expr = expr.replace(/\s+=\s+/g, ' === ');
    expr = expr.replace(/\s+<>\s+/g, ' !== ');
    expr = expr.replace(/\bMOD\b/gi, '%');
    expr = expr.replace(/\bmod\b/gi, '%');
    expr = expr.replace(/\babs\(/gi, 'Math.abs(');
    expr = expr.replace(/\bsqrt\(/gi, 'Math.sqrt(');
    expr = expr.replace(/\bpow\(/gi, 'Math.pow(');
    expr = expr.replace(/\bfloor\(/gi, 'Math.floor(');
    expr = expr.replace(/\bceil\(/gi, 'Math.ceil(');
    expr = expr.replace(/\bround\(/gi, 'Math.round(');
    expr = expr.replace(/\bmax\(/gi, 'Math.max(');
    expr = expr.replace(/\bmin\(/gi, 'Math.min(');
    
    return expr;
  },

  execute: function (PQ_code: string, target: any): void {
    this.purge();

    const lines = this.cleanCode(PQ_code);
    
    // Primeiro, extrair procedimentos e funções
    const procedures: { [key: string]: { params: string[]; lines: string[] } } = {};
    const functions: { [key: string]: { params: string[]; lines: string[] } } = {};
    const mainLines: string[] = [];
    
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      
      // Detectar PROCEDIMENTO (ou PROCEDIMENTO)
      if (line.match(/^(?:procedimento|procedimento)\s+/i)) {
        const match = line.match(/^(?:procedimento|procedimento)\s+(\w+)\s*\(\s*([^)]*)\s*\)/i);
        if (match) {
          const procName = match[1];
          const params = match[2] ? match[2].split(',').map(p => p.trim()) : [];
          const procLines: string[] = [];
          
          i++;
          while (i < lines.length && !lines[i].match(/^fim\s*$/i)) {
            procLines.push(lines[i]);
            i++;
          }
          
          procedures[procName] = { params, lines: procLines };
        }
      }
      // Detectar FUNCAO (ou FUNCAO)
      else if (line.match(/^(?:funcao|funcao)\s+/i)) {
        const match = line.match(/^(?:funcao|funcao)\s+(\w+)\s*\(\s*([^)]*)\s*\)/i);
        if (match) {
          const funcName = match[1];
          const params = match[2] ? match[2].split(',').map(p => p.trim()) : [];
          const funcLines: string[] = [];
          
          i++;
          while (i < lines.length && !lines[i].match(/^fim\s*$/i)) {
            funcLines.push(lines[i]);
            i++;
          }
          
          functions[funcName] = { params, lines: funcLines };
        }
      }
      // Linhas do programa principal
      else if (!line.match(/^inicio\s*$/i) && !line.match(/^fim\s*$/i)) {
        mainLines.push(line);
      }
      
      i++;
    }

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

    // Gerar código para procedimentos
    for (const [procName, procDef] of Object.entries(procedures)) {
      jsCode += `  function ${procName}(${procDef.params.join(', ')}) {\n`;
      
      for (let j = 0; j < procDef.lines.length; j++) {
        const processed = this.processLine(procDef.lines[j], procDef.lines, j);
        if (processed.code) {
          jsCode += '    ' + processed.code + '\n';
        }
      }
      
      jsCode += '  }\n\n';
    }

    // Gerar código para funções
    for (const [funcName, funcDef] of Object.entries(functions)) {
      jsCode += `  function ${funcName}(${funcDef.params.join(', ')}) {\n`;
      jsCode += `    let pq_func_resultado = undefined;\n`;
      
      for (let j = 0; j < funcDef.lines.length; j++) {
        const line = funcDef.lines[j];
        const processed = this.processLine(line, funcDef.lines, j);
        if (processed.code) {
          jsCode += '    ' + processed.code + '\n';
        }
      }
      
      jsCode += `    return pq_func_resultado;\n`;
      jsCode += '  }\n\n';
    }

    // Processar linhas do programa principal
    for (let i = 0; i < mainLines.length; i++) {
      const line = mainLines[i];
      const processed = this.processLine(line, mainLines, i);
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
      console.error('JS Error:', e, 'Code:', jsCode);
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
      // Se tiver + para concatenação, tratar como uma única expressão
      if (expr.includes('+')) {
        const converted = this.convertExpression(expr);
        return { code: `PQ_print(target, ${converted}); PQ_print(target, '<br>');`, skipLines: 0 };
      }
      // Parse os argumentos respeitando strings
      const args = this.parseImprimitArgs(expr);
      const jsArgs = args.map((arg) => this.convertExpression(arg));
      return { code: `PQ_print(target, ${jsArgs.join(', ')}); PQ_print(target, '<br>');`, skipLines: 0 };
    }

    // IMPRIMA - imprime sem quebra de linha
    if (line.match(/^imprima\s+/i)) {
      const expr = line.replace(/^imprima\s+/i, '').trim();
      // Se tiver + para concatenacao ou [ para array, tratar como uma unica expressao
      if (expr.includes('+') || expr.includes('[')) {
        const converted = this.convertExpression(expr);
        return { code: `PQ_print(target, ${converted});`, skipLines: 0 };
      }
      const args = this.parseImprimitArgs(expr);
      const jsArgs = args.map((arg) => this.convertExpression(arg));
      return { code: `PQ_print(target, ${jsArgs.join(', ')});`, skipLines: 0 };
    }

    // LEIA - lê entrada do usuário
    if (line.match(/^leia\s+/i)) {
      const varname = line.replace(/^leia\s+/i, '').trim();
      return { code: `if (typeof ${varname} === 'undefined') { var ${varname}; } ${varname} = prompt('Insira o valor da variável ${varname}'); if(!isNaN(${varname})) { ${varname} = Number(${varname}); }`, skipLines: 0 };
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
        while (endIndex < allLines.length && !allLines[endIndex].match(/^(?:fim\s+para|próximo|proximo)/i)) {
          endIndex++;
        }
        
        // Processar linhas dentro do loop
        let i = lineIndex + 1;
        while (i < endIndex) {
          const innerLine = allLines[i].trim();
          if (innerLine && !innerLine.startsWith('//')) {
            const processed = this.processLine(innerLine, allLines, i);
            if (processed.code) {
              loopCode += '    ' + processed.code + '\n';
            }
            // Pular linhas que foram processadas como parte de blocos aninhados
            i += processed.skipLines;
          }
          i++;
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
        
        // Processar linhas dentro do loop (decremento)
        let j = lineIndex + 1;
        while (j < endIndex) {
          const innerLine = allLines[j].trim();
          if (innerLine && !innerLine.startsWith('//')) {
            const processed = this.processLine(innerLine, allLines, j);
            if (processed.code) {
              loopCode += '    ' + processed.code + '\n';
            }
            // Pular linhas que foram processadas como parte de blocos aninhados
            j += processed.skipLines;
          }
          j++;
        }
        
        loopCode += `
    ${varname}--;
  }
}`;
        
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
      const match = line.match(/repita\s+(\d+)\s+vezes/i);
      if (match) {
        const times = parseInt(match[1]);
        
        let loopCode = `
for (let pq_repita_i = 0; pq_repita_i < ${times}; pq_repita_i++) {
  if (Date.now() - loopStart > 30000) {
    PQ_print(target, 'Erro: Loop infinito detectado');
    break;
  }
`;
        
        // Encontrar FIM REPITA
        let endIndex = lineIndex + 1;
        while (endIndex < allLines.length && !allLines[endIndex].match(/^(?:fim\s+repita|fim)/i)) {
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
        
        // Encontrar FIM SE
        let endIndex = lineIndex + 1;
        let senaoIndex = -1;
        let depth = 0;
        
        while (endIndex < allLines.length) {
          const currentLine = allLines[endIndex].trim().toLowerCase();
          
          // Rastrear profundidade de blocos aninhados
          if (currentLine.match(/^se\s+/i)) {
            depth++;
          } else if (currentLine.match(/^fim\s+se/i)) {
            if (depth === 0) {
              break;
            }
            depth--;
          } else if (currentLine.match(/^senão|^senao/i) && depth === 0) {
            senaoIndex = endIndex;
          }
          
          endIndex++;
        }
        
        // Processar linhas do SE
        const endSenao = senaoIndex >= 0 ? senaoIndex : endIndex;
        for (let i = lineIndex + 1; i < endSenao; i++) {
          const innerLine = allLines[i].trim();
          if (innerLine && !innerLine.startsWith('//')) {
            const processed = this.processLine(innerLine, allLines, i);
            if (processed.code) {
              ifCode += '\n  ' + processed.code;
            }
          }
        }
        
        // Processar SENÃO se existir
        if (senaoIndex >= 0) {
          ifCode += '\n} else {';
          
          for (let i = senaoIndex + 1; i < endIndex; i++) {
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

    // Chamada de procedimento
    if (line.match(/^\w+\s*\(/) && !line.match(/<-/)) {
      const match = line.match(/^(\w+)\s*\((.*)\)/);
      if (match) {
        const procName = match[1];
        const argsStr = match[2];
        const args = [];
        
        if (argsStr) {
          const parts = argsStr.split(',');
          for (const part of parts) {
            args.push(this.convertExpression(part.trim()));
          }
        }
        
        return { code: `${procName}(${args.join(', ')});`, skipLines: 0 };
      }
    }

    // Atribuição de variável (incluindo resultado de função)
    if (line.match(/<-/)) {
      const parts = line.split('<-');
      const varPart = parts[0].trim();
      const exprPart = parts[1].trim();
      
      // Verificar se é atribuição de resultado de função
      if (exprPart.match(/^\w+\s*\(/)) {
        const match = exprPart.match(/^(\w+)\s*\((.*)\)/);
        if (match) {
          const funcName = match[1];
          const args = [];
          if (match[2]) {
            const funcArgs = match[2].split(',');
            for (const arg of funcArgs) {
              args.push(this.convertExpression(arg.trim()));
            }
          }
          return { code: `var ${varPart} = ${funcName}(${args.join(', ')});`, skipLines: 0 };
        }
      }
      
      // Se for atribuição de 'resultado', usar pq_func_resultado em funções
      if (varPart === 'resultado') {
        const converted = this.convertExpression(exprPart);
        return { code: `pq_func_resultado = ${converted};`, skipLines: 0 };
      }
      
      // Verificar se eh atribuicao de array
      if (varPart.includes('[')) {
        const arrayMatch = varPart.match(/(\w+)/);
        const arrayName = arrayMatch ? arrayMatch[1] : '';
        const converted = this.convertExpression(exprPart);
        return { code: `if (typeof ${arrayName} === 'undefined') { var ${arrayName} = []; } ${varPart} = ${converted};`, skipLines: 0 };
      }
      
      const converted = this.convertExpression(exprPart);
      return { code: `var ${varPart} = ${converted};`, skipLines: 0 };
    }

    // Ignorar linhas de controle (FIM, SENÃO, etc)
    if (line.match(/^(?:fim|senão|senao|próximo|proximo|inicio)/i)) {
      return { code: '', skipLines: 0 };
    }

    return { code: '', skipLines: 0 };
  },

  /**
   * Parse argumentos de IMPRIMA/IMPRIMALN respeitando strings
   */
  parseImprimitArgs: function (expr: string): string[] {
    const args: string[] = [];
    let current = '';
    let inString = false;
    let stringChar = '';
    
    for (let i = 0; i < expr.length; i++) {
      const char = expr[i];
      
      if ((char === '"' || char === "'") && (i === 0 || expr[i-1] !== '\\')) {
        if (!inString) {
          inString = true;
          stringChar = char;
          current += char;
        } else if (char === stringChar) {
          inString = false;
          current += char;
        } else {
          current += char;
        }
      } else if (char === ',' && !inString) {
        if (current.trim()) {
          args.push(current.trim());
        }
        current = '';
      } else {
        current += char;
      }
    }
    
    if (current.trim()) {
      args.push(current.trim());
    }
    
    // Se não houver vírgulas, dividir por espaços respeitando strings
    if (args.length === 0) {
      args.push(expr);
    } else if (args.length === 1 && !expr.includes(',')) {
      // Se for uma única string sem vírgulas, tentar dividir por espaços
      const parts: string[] = [];
      let part = '';
      let inStr = false;
      let strChar = '';
      
      for (let i = 0; i < expr.length; i++) {
        const ch = expr[i];
        
        if ((ch === '"' || ch === "'") && (i === 0 || expr[i-1] !== '\\')) {
          if (!inStr) {
            inStr = true;
            strChar = ch;
            part += ch;
          } else if (ch === strChar) {
            inStr = false;
            part += ch;
          } else {
            part += ch;
          }
        } else if (ch === ' ' && !inStr && part.trim()) {
          parts.push(part.trim());
          part = '';
        } else {
          part += ch;
        }
      }
      
      if (part.trim()) {
        parts.push(part.trim());
      }
      
      return parts.length > 1 ? parts : args;
    }
    
    return args;
  }
};

