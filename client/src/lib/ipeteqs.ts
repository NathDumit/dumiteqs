/**
 * DUMITEQS - Interpretador PETEQS 100% Compatível
 * Baseado no código original do ipeteqsJS
 * https://github.com/LeonNasc/ipeteqsJS
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
  private loopStart: number = 0;

  interpret(code: string): InterpretResult {
    try {
      this.output = '';
      
      // Normalizar código
      code = this.normalize(code);
      
      // Converter PETEQS para JavaScript
      const jsCode = this.convert(code);
      
      // Executar código JavaScript
      this.execute(jsCode);
      
      return { output: this.output.trimEnd() };
    } catch (error: any) {
      return {
        output: '',
        error: `Erro: ${error.message}`
      };
    }
  }

  private normalize(code: string): string {
    // Remover comentários
    code = code.replace(/\{.*?\}/g, '');
    
    // Normalizar quebras de linha
    code = code.replace(/\r\n/g, '\n');
    
    // Remover espaços em branco desnecessários
    code = code.replace(/^\s+/gm, '');
    code = code.replace(/\s+$/gm, '');
    
    return code;
  }

  private convert(code: string): string {
    let jsCode = '';
    let lines = code.split('\n').filter(line => line.trim().length > 0);
    
    jsCode += `
let loopStart = Date.now();
let PQ_output = '';

function PQ_print(value) {
  PQ_output += String(value);
}

function PQ_println(value) {
  PQ_output += String(value) + '\\n';
}

`;

    let i = 0;
    while (i < lines.length) {
      const line = lines[i].trim();
      
      // IMPRIMALN
      if (line.match(/^IMPRIMALN\b/i)) {
        const expr = line.replace(/^IMPRIMALN\s+/i, '').trim();
        jsCode += `PQ_println(${this.convertExpression(expr)});\n`;
      }
      // IMPRIMA
      else if (line.match(/^IMPRIMA\b/i)) {
        const expr = line.replace(/^IMPRIMA\s+/i, '').trim();
        jsCode += `PQ_print(${this.convertExpression(expr)});\n`;
      }
      // LEIA
      else if (line.match(/^LEIA\b/i)) {
        const varName = line.replace(/^LEIA\s+/i, '').trim();
        jsCode += `${varName} = prompt("Digite um valor para ${varName}:") || "";\n`;
        jsCode += `if(!isNaN(${varName})) ${varName} = Number(${varName});\n`;
      }
      // Atribuição
      else if (line.includes('<-')) {
        jsCode += this.convertAssignment(line) + ';\n';
      }
      // PARA loop
      else if (line.match(/^PARA\s+/i)) {
        const forMatch = line.match(/^PARA\s+(\w+)\s*<-\s*(.+?)\s+ATE\s+(.+?)\s+FACA/i);
        if (forMatch) {
          const [, loopVar, startExpr, endExpr] = forMatch;
          jsCode += `for(let ${loopVar} = ${this.convertExpression(startExpr)}; ${loopVar} <= ${this.convertExpression(endExpr)}; ${loopVar}++) {\n`;
          
          // Find matching FIM PARA
          let loopDepth = 1;
          let j = i + 1;
          while (j < lines.length && loopDepth > 0) {
            const currentLine = lines[j].trim();
            if (currentLine.match(/^PARA\s+/i)) loopDepth++;
            if (currentLine.match(/^FIM\s+PARA/i) || currentLine.match(/^PROXIMO/i)) {
              loopDepth--;
              if (loopDepth === 0) break;
            }
            j++;
          }
          
          // Process loop body
          for (let k = i + 1; k < j; k++) {
            const bodyLine = lines[k].trim();
            if (!bodyLine.match(/^FIM\s+PARA/i) && !bodyLine.match(/^PROXIMO/i)) {
              jsCode += this.convertLine(bodyLine) + '\n';
            }
          }
          
          jsCode += '}\n';
          i = j;
        }
      }
      // SE/ENTAO
      else if (line.match(/^SE\s+/i)) {
        const seMatch = line.match(/^SE\s+(.+?)\s+ENTAO/i);
        if (seMatch) {
          const [, cond] = seMatch;
          jsCode += `if(${this.convertCondition(cond)}) {\n`;
          
          // Find matching FIM SE or SENAO
          let condDepth = 1;
          let j = i + 1;
          let elseStart = -1;
          
          while (j < lines.length && condDepth > 0) {
            const condLine = lines[j].trim();
            if (condLine.match(/^SE\s+/i)) condDepth++;
            if (condLine.match(/^FIM\s+SE/i)) {
              condDepth--;
              if (condDepth === 0) break;
            }
            if (condLine.match(/^SENAO/i) && condDepth === 1) {
              elseStart = j;
            }
            j++;
          }
          
          // Process IF body
          for (let k = i + 1; k < (elseStart > 0 ? elseStart : j); k++) {
            const bodyLine = lines[k].trim();
            if (!bodyLine.match(/^SENAO/i) && !bodyLine.match(/^FIM\s+SE/i)) {
              jsCode += this.convertLine(bodyLine) + '\n';
            }
          }
          
          // Process ELSE if exists
          if (elseStart > 0) {
            jsCode += '} else {\n';
            for (let k = elseStart + 1; k < j; k++) {
              const bodyLine = lines[k].trim();
              if (!bodyLine.match(/^FIM\s+SE/i)) {
                jsCode += this.convertLine(bodyLine) + '\n';
              }
            }
          }
          
          jsCode += '}\n';
          i = j;
        }
      }
      // ENQUANTO loop
      else if (line.match(/^ENQUANTO\s+/i)) {
        const whileMatch = line.match(/^ENQUANTO\s+(.+?)\s+FACA/i);
        if (whileMatch) {
          const [, cond] = whileMatch;
          jsCode += `while(${this.convertCondition(cond)}) {\n`;
          jsCode += `if(Date.now() - loopStart > 30000) { throw new Error('Loop infinito detectado'); break; }\n`;
          
          // Find matching FIM ENQUANTO
          let loopDepth = 1;
          let j = i + 1;
          while (j < lines.length && loopDepth > 0) {
            const currentLine = lines[j].trim();
            if (currentLine.match(/^ENQUANTO\s+/i)) loopDepth++;
            if (currentLine.match(/^FIM\s+ENQUANTO/i)) {
              loopDepth--;
              if (loopDepth === 0) break;
            }
            j++;
          }
          
          // Process loop body
          for (let k = i + 1; k < j; k++) {
            const bodyLine = lines[k].trim();
            if (!bodyLine.match(/^FIM\s+ENQUANTO/i)) {
              jsCode += this.convertLine(bodyLine) + '\n';
            }
          }
          
          jsCode += '}\n';
          i = j;
        }
      }
      // REPITA
      else if (line.match(/^REPITA\s+/i)) {
        const repMatch = line.match(/^REPITA\s+(\d+)\s+VEZES/i);
        if (repMatch) {
          const [, times] = repMatch;
          jsCode += `for(let _rep = 0; _rep < ${times}; _rep++) {\n`;
          
          // Find matching FIM REPITA
          let repDepth = 1;
          let j = i + 1;
          while (j < lines.length && repDepth > 0) {
            const currentLine = lines[j].trim();
            if (currentLine.match(/^REPITA\s+/i)) repDepth++;
            if (currentLine.match(/^FIM\s+REPITA/i)) {
              repDepth--;
              if (repDepth === 0) break;
            }
            j++;
          }
          
          // Process loop body
          for (let k = i + 1; k < j; k++) {
            const bodyLine = lines[k].trim();
            if (!bodyLine.match(/^FIM\s+REPITA/i)) {
              jsCode += this.convertLine(bodyLine) + '\n';
            }
          }
          
          jsCode += '}\n';
          i = j;
        }
      }
      
      i++;
    }
    
    jsCode += `\nreturn PQ_output;`;
    
    return jsCode;
  }

  private convertLine(line: string): string {
    if (line.match(/^IMPRIMALN\b/i)) {
      const expr = line.replace(/^IMPRIMALN\s+/i, '').trim();
      return `PQ_println(${this.convertExpression(expr)})`;
    } else if (line.match(/^IMPRIMA\b/i)) {
      const expr = line.replace(/^IMPRIMA\s+/i, '').trim();
      return `PQ_print(${this.convertExpression(expr)})`;
    } else if (line.match(/^LEIA\b/i)) {
      const varName = line.replace(/^LEIA\s+/i, '').trim();
      return `${varName} = prompt("Digite um valor para ${varName}:") || ""; if(!isNaN(${varName})) ${varName} = Number(${varName})`;
    } else if (line.includes('<-')) {
      return this.convertAssignment(line);
    }
    return '';
  }

  private convertAssignment(line: string): string {
    const [varPart, exprPart] = line.split('<-').map(s => s.trim());
    const expr = this.convertExpression(exprPart);
    return `${varPart} = ${expr}`;
  }

  private convertExpression(expr: string): string {
    expr = expr.trim();
    
    // String literals
    if ((expr.startsWith("'") && expr.endsWith("'")) || (expr.startsWith('"') && expr.endsWith('"'))) {
      return expr;
    }
    
    // Replace PETEQS operators
    expr = expr.replace(/\bMOD\b/gi, '%');
    expr = expr.replace(/\bDIV\b/gi, 'Math.floor');
    expr = expr.replace(/\babs\s*\(/gi, 'Math.abs(');
    expr = expr.replace(/\bsqrt\s*\(/gi, 'Math.sqrt(');
    expr = expr.replace(/\bfloor\s*\(/gi, 'Math.floor(');
    expr = expr.replace(/\bceil\s*\(/gi, 'Math.ceil(');
    expr = expr.replace(/\bround\s*\(/gi, 'Math.round(');
    expr = expr.replace(/\bVERDADEIRO\b/gi, 'true');
    expr = expr.replace(/\bFALSO\b/gi, 'false');
    
    return expr;
  }

  private convertCondition(cond: string): string {
    cond = cond.trim();
    
    // Remove parentheses first
    cond = cond.replace(/^\(|\)$/g, '');
    
    // Replace logical operators BEFORE comparison operators
    cond = cond.replace(/\s+E\s+/gi, ' && ');
    cond = cond.replace(/\s+OU\s+/gi, ' || ');
    cond = cond.replace(/\bNAO\b/gi, '!');
    
    // Replace comparison operators
    cond = cond.replace(/\s*<>\s*/g, ' !== ');
    cond = cond.replace(/\s*=\s*/g, ' === ');
    cond = cond.replace(/\s*<=\s*/g, ' <= ');
    cond = cond.replace(/\s*>=\s*/g, ' >= ');
    cond = cond.replace(/\s*<\s*/g, ' < ');
    cond = cond.replace(/\s*>\s*/g, ' > ');
    
    // Replace boolean constants
    cond = cond.replace(/\bVERDADEIRO\b/gi, 'true');
    cond = cond.replace(/\bFALSO\b/gi, 'false');
    
    return `(${cond})`;
  }

  private execute(jsCode: string): void {
    try {
      const func = new Function(jsCode);
      this.output = func() || '';
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
}

