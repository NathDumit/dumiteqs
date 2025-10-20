/**
 * DUMITEQS - Interpretador PETEQS
 * Baseado no ipeteqsJS de Leon de França Nascimento
 * Adaptado para funcionar em React/TypeScript
 */

export interface InterpretResult {
  output: string;
  error?: string;
  translatedCode?: string;
}

export function interpretPETEQS(code: string): InterpretResult {
  try {
    let output = '';
    let variables: { [key: string]: any } = {};
    let loopStart = 0;

    // Normalizar quebras de linha
    code = code.replace(/\r\n/g, '\n').trim();
    
    // Se o código está em uma única linha, tentar dividir por palavras-chave
    if (!code.includes('\n')) {
      code = code.replace(/\bFIM\s+(PARA|SE|ENQUANTO|REPITA)/gi, 'FIM $1\n');
      code = code.replace(/\bPARA\s+/gi, '\nPARA ');
      code = code.replace(/\bSE\s+/gi, '\nSE ');
      code = code.replace(/\bENQUANTO\s+/gi, '\nENQUANTO ');
      code = code.replace(/\bREPITA\s+/gi, '\nREPITA ');
      code = code.replace(/\bSENÃO/gi, '\nSENÃO');
      code = code.replace(/\bIMPRIMA/gi, '\nIMPRIMA');
    }
    
    // Dividir em linhas e processar
    const lines = code.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      
      // IMPRIMALN
      if (line.match(/^IMPRIMALN/i)) {
        const expr = line.replace(/^IMPRIMALN\s+/i, '').trim();
        const value = evaluateExpression(expr, variables);
        output += String(value) + '\n';
      }
      // IMPRIMA
      else if (line.match(/^IMPRIMA/i)) {
        const expr = line.replace(/^IMPRIMA\s+/i, '').trim();
        const value = evaluateExpression(expr, variables);
        output += String(value);
      }
      // Atribuição
      else if (line.includes('<-')) {
        const [varPart, exprPart] = line.split('<-').map(s => s.trim());
        const value = evaluateExpression(exprPart, variables);
        
        if (varPart.includes('[')) {
          // Array assignment
          const match = varPart.match(/(\w+)\[(.+)\]/);
          if (match) {
            const [, arrayName, indexExpr] = match;
            if (!variables[arrayName]) variables[arrayName] = {};
            const index = evaluateExpression(indexExpr, variables);
            variables[arrayName][index] = value;
          }
        } else {
          variables[varPart] = value;
        }
      }
      // PARA loop
      else if (line.match(/^PARA\s+/i)) {
        const forMatch = line.match(/^PARA\s+(\w+)\s*<-\s*(.+?)\s+ATÉ\s+(.+?)\s+FAÇA/i);
        if (forMatch) {
          const [, loopVar, startExpr, endExpr] = forMatch;
          const start = evaluateExpression(startExpr, variables);
          const end = evaluateExpression(endExpr, variables);
          
          // Find matching FIM PARA
          let loopDepth = 1;
          let j = i + 1;
          const loopBody: string[] = [];
          
          while (j < lines.length && loopDepth > 0) {
            if (lines[j].match(/^PARA\s+/i)) loopDepth++;
            if (lines[j].match(/^FIM\s+PARA/i)) loopDepth--;
            
            if (loopDepth > 0) {
              loopBody.push(lines[j]);
            }
            j++;
          }
          
          // Execute loop
          if (start <= end) {
            for (let loopVal = start; loopVal <= end; loopVal++) {
              variables[loopVar] = loopVal;
              const loopResult = executeLinesWithVariables(loopBody, variables);
              output += loopResult.output;
              variables = loopResult.variables;
            }
          } else {
            for (let loopVal = start; loopVal >= end; loopVal--) {
              variables[loopVar] = loopVal;
              const loopResult = executeLinesWithVariables(loopBody, variables);
              output += loopResult.output;
              variables = loopResult.variables;
            }
          }
          
          i = j - 1;
        }
      }
      // SE/ENTÃO
      else if (line.match(/^SE\s+/i)) {
        const seMatch = line.match(/^SE\s+(.+?)\s+ENTÃO/i);
        if (seMatch) {
          const [, condExpr] = seMatch;
          const condition = evaluateCondition(condExpr, variables);
          
          // Find matching FIM SE or SENÃO
          let condDepth = 1;
          let j = i + 1;
          const ifBody: string[] = [];
          const elseBody: string[] = [];
          let inElse = false;
          
          while (j < lines.length && condDepth > 0) {
            const condLine = lines[j];
            
            if (condLine.match(/^SE\s+/i)) condDepth++;
            if (condLine.match(/^FIM\s+SE/i)) {
              condDepth--;
              if (condDepth === 0) break;
            }
            
            if (condLine.match(/^SENÃO/i) && condDepth === 1) {
              inElse = true;
              j++;
              continue;
            }
            
            if (condDepth > 0) {
              if (inElse) {
                elseBody.push(condLine);
              } else {
                ifBody.push(condLine);
              }
            }
            j++;
          }
          
          // Execute appropriate branch
          if (condition) {
            const result = executeLinesWithVariables(ifBody, variables);
            output += result.output;
            variables = result.variables;
          } else if (elseBody.length > 0) {
            const result = executeLinesWithVariables(elseBody, variables);
            output += result.output;
            variables = result.variables;
          }
          
          i = j;
        }
      }
      // ENQUANTO loop
      else if (line.match(/^ENQUANTO\s+/i)) {
        const whileMatch = line.match(/^ENQUANTO\s+(.+?)\s+FAÇA/i);
        if (whileMatch) {
          const [, condExpr] = whileMatch;
          
          // Find matching FIM ENQUANTO
          let loopDepth = 1;
          let j = i + 1;
          const loopBody: string[] = [];
          
          while (j < lines.length && loopDepth > 0) {
            if (lines[j].match(/^ENQUANTO\s+/i)) loopDepth++;
            if (lines[j].match(/^FIM\s+ENQUANTO/i)) loopDepth--;
            
            if (loopDepth > 0) {
              loopBody.push(lines[j]);
            }
            j++;
          }
          
          // Execute loop
          loopStart = Date.now();
          while (evaluateCondition(condExpr, variables)) {
            if (Date.now() - loopStart > 30000) {
              throw new Error('Loop infinito detectado');
            }
            const loopResult = executeLinesWithVariables(loopBody, variables);
            output += loopResult.output;
            variables = loopResult.variables;
          }
          
          i = j - 1;
        }
      }
      
      i++;
    }
    
    return { output: output.trimEnd() };
  } catch (error: any) {
    return {
      output: '',
      error: `Erro de Execução: ${error.message}`
    };
  }
}

function executeLinesWithVariables(lines: string[], variables: { [key: string]: any }): { output: string; variables: { [key: string]: any } } {
  let output = '';
  
  for (const line of lines) {
    if (!line || line.match(/^FIM/i)) continue;
    
    // IMPRIMALN
    if (line.match(/^IMPRIMALN/i)) {
      const expr = line.replace(/^IMPRIMALN\s+/i, '').trim();
      const value = evaluateExpression(expr, variables);
      output += String(value) + '\n';
    }
    // IMPRIMA
    else if (line.match(/^IMPRIMA/i)) {
      const expr = line.replace(/^IMPRIMA\s+/i, '').trim();
      const value = evaluateExpression(expr, variables);
      output += String(value);
    }
    // Atribuição
    else if (line.includes('<-')) {
      const [varPart, exprPart] = line.split('<-').map(s => s.trim());
      const value = evaluateExpression(exprPart, variables);
      
      if (varPart.includes('[')) {
        const match = varPart.match(/(\w+)\[(.+)\]/);
        if (match) {
          const [, arrayName, indexExpr] = match;
          if (!variables[arrayName]) variables[arrayName] = {};
          const index = evaluateExpression(indexExpr, variables);
          variables[arrayName][index] = value;
        }
      } else {
        variables[varPart] = value;
      }
    }
  }
  
  return { output, variables };
}

function evaluateExpression(expr: string, variables: { [key: string]: any }): any {
  expr = expr.trim();
  
  // String literals
  if ((expr.startsWith("'") && expr.endsWith("'")) || (expr.startsWith('"') && expr.endsWith('"'))) {
    return expr.slice(1, -1);
  }
  
  // Numbers
  if (/^-?\d+(\.\d+)?$/.test(expr)) {
    return Number(expr);
  }
  
  // Boolean
  if (expr.match(/^(VERDADEIRO|FALSO)$/i)) {
    return expr.match(/^VERDADEIRO$/i) ? true : false;
  }
  
  // Array access
  if (expr.includes('[')) {
    const match = expr.match(/(\w+)\[(.+)\]/);
    if (match) {
      const [, arrayName, indexExpr] = match;
      const index = evaluateExpression(indexExpr, variables);
      return variables[arrayName]?.[index];
    }
  }
  
  // Replace variables and operators
  let code = expr;
  
  // Operators
  code = code.replace(/\bMOD\b/gi, '%');
  code = code.replace(/\bDIV\b/gi, 'Math.floor');
  code = code.replace(/\bE\b/gi, '&&');
  code = code.replace(/\bOU\b/gi, '||');
  code = code.replace(/\bNÃO\b/gi, '!');
  
  // Replace variable names with their values
  code = code.replace(/\b([a-zA-Z_]\w*)\b/g, (match) => {
    if (variables.hasOwnProperty(match)) {
      const val = variables[match];
      return typeof val === 'string' ? `"${val}"` : String(val);
    }
    return match;
  });
  
  try {
    return eval(code);
  } catch (e) {
    return undefined;
  }
}

function evaluateCondition(cond: string, variables: { [key: string]: any }): boolean {
  cond = cond.trim();
  
  // Replace operators
  cond = cond.replace(/\s*<>\s*/g, ' !== ');
  cond = cond.replace(/\s*=\s*/g, ' === ');
  cond = cond.replace(/\s*<=\s*/g, ' <= ');
  cond = cond.replace(/\s*>=\s*/g, ' >= ');
  cond = cond.replace(/\s*<\s*/g, ' < ');
  cond = cond.replace(/\s*>\s*/g, ' > ');
  cond = cond.replace(/\bE\b/gi, '&&');
  cond = cond.replace(/\bOU\b/gi, '||');
  cond = cond.replace(/\bNÃO\b/gi, '!');
  
  // Replace variable names
  cond = cond.replace(/\b([a-zA-Z_]\w*)\b/g, (match) => {
    if (variables.hasOwnProperty(match)) {
      const val = variables[match];
      return typeof val === 'string' ? `"${val}"` : String(val);
    }
    return match;
  });
  
  try {
    return !!eval(cond);
  } catch (e) {
    return false;
  }
}

