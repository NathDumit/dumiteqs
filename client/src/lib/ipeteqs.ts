export interface InterpretResult {
  output: string;
  translatedCode: string;
  error?: string;
}

export function interpretPETEQS(code: string): InterpretResult {
  let output = '';
  let translatedCode = '';
  const variables: { [key: string]: any } = {};

  try {
    const jsCode = translateToJavaScript(code, variables);
    translatedCode = jsCode;

    // Create a safer evaluation context
    const result = new Function('variables', `
      let output = '';
      
      function IMPRIMALN(value) {
        output += String(value) + '\\n';
      }
      
      function IMPRIMA(value) {
        output += String(value);
      }
      
      ${jsCode}
      
      return output;
    `)(variables);

    output = result || '';
  } catch (error: any) {
    const errorMessage = error.message || String(error);
    const lines = code.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // Try to identify which line caused the error
    let errorLine = 1;
    let errorCode = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      try {
        if (line.includes('IMPRIMALN') || line.includes('IMPRIMA') || 
            line.includes('LEIA') || line.includes('<-')) {
          new Function(`let variables = {}; ${translateToJavaScript(line, {})}`);
        }
      } catch (e) {
        errorLine = i + 1;
        errorCode = line;
        break;
      }
    }

    // Determine error type
    let errorType = 'Erro de Execução';
    let errorDetails = errorMessage;

    if (errorMessage.includes('is not defined')) {
      errorType = 'Variável não definida';
      const match = errorMessage.match(/(\w+) is not defined/);
      if (match) {
        errorDetails = `A variável "${match[1]}" não foi inicializada antes de ser usada`;
      }
    } else if (errorMessage.includes('Unexpected token')) {
      errorType = 'Erro de Sintaxe';
      errorDetails = 'Verifique a sintaxe do comando';
    } else if (errorMessage.includes('is not a function')) {
      errorType = 'Função não encontrada';
      errorDetails = 'O comando ou função não existe';
    } else if (errorMessage.includes('Cannot read')) {
      errorType = 'Acesso inválido';
      errorDetails = 'Tentativa de acessar um valor inválido';
    }

    return {
      output: '',
      translatedCode: '',
      error: `❌ ${errorType}\n📍 Linha ${errorLine}\n📝 Código: ${errorCode}\n💬 Detalhes: ${errorDetails}`
    };
  }

  return {
    output: output.trimEnd(),
    translatedCode,
    error: undefined
  };
}

function translateToJavaScript(code: string, variables: { [key: string]: any }): string {
  let jsCode = '';
  const lines = code.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    
    // IMPRIMALN (print with newline)
    if (line.match(/^IMPRIMALN\s+/i)) {
      const content = line.replace(/^IMPRIMALN\s+/i, '').trim();
      jsCode += `IMPRIMALN(${parseExpression(content)});\n`;
    }
    // IMPRIMA (print without newline)
    else if (line.match(/^IMPRIMA\s+/i)) {
      const content = line.replace(/^IMPRIMA\s+/i, '').trim();
      jsCode += `IMPRIMA(${parseExpression(content)});\n`;
    }
    // Variable assignment
    else if (line.includes('<-')) {
      const [varName, expression] = line.split('<-').map(s => s.trim());
      const varKey = varName.split('[')[0];
      variables[varKey] = null;
      
      if (varName.includes('[')) {
        // Array assignment
        const arrayMatch = varName.match(/(\w+)\[(.+)\]/);
        if (arrayMatch) {
          const [, arrayName, index] = arrayMatch;
          jsCode += `if (!${arrayName}) ${arrayName} = {};\n`;
          jsCode += `${arrayName}[${parseExpression(index)}] = ${parseExpression(expression)};\n`;
        }
      } else {
        jsCode += `${varName} = ${parseExpression(expression)};\n`;
      }
    }
    // PARA loop
    else if (line.match(/^PARA\s+/i)) {
      const forMatch = line.match(/^PARA\s+(\w+)\s*<-\s*(.+?)\s+ATÉ\s+(.+?)\s+FAÇA/i);
      if (forMatch) {
        const [, variable, start, end] = forMatch;
        jsCode += `for (let ${variable} = ${parseExpression(start)}; ${variable} <= ${parseExpression(end)}; ${variable}++) {\n`;
        
        // Find the matching FIM PARA
        let loopDepth = 1;
        let j = i + 1;
        while (j < lines.length && loopDepth > 0) {
          const loopLine = lines[j];
          if (loopLine.match(/^PARA\s+/i)) loopDepth++;
          if (loopLine.match(/^FIM\s+PARA/i)) loopDepth--;
          if (loopDepth > 0) {
            jsCode += translateLineToJS(loopLine) + '\n';
          }
          j++;
        }
        jsCode += '}\n';
        i = j - 1;
      }
    }
    // ENQUANTO loop
    else if (line.match(/^ENQUANTO\s+/i)) {
      const whileMatch = line.match(/^ENQUANTO\s+(.+?)\s+FAÇA/i);
      if (whileMatch) {
        const [, condition] = whileMatch;
        jsCode += `while (${parseCondition(condition)}) {\n`;
        
        // Find the matching FIM ENQUANTO
        let loopDepth = 1;
        let j = i + 1;
        while (j < lines.length && loopDepth > 0) {
          const loopLine = lines[j];
          if (loopLine.match(/^ENQUANTO\s+/i)) loopDepth++;
          if (loopLine.match(/^FIM\s+ENQUANTO/i)) loopDepth--;
          if (loopDepth > 0) {
            jsCode += translateLineToJS(loopLine) + '\n';
          }
          j++;
        }
        jsCode += '}\n';
        i = j - 1;
      }
    }
    // REPITA N VEZES
    else if (line.match(/^REPITA\s+/i)) {
      const repeatMatch = line.match(/^REPITA\s+(\d+)\s+VEZES/i);
      if (repeatMatch) {
        const [, times] = repeatMatch;
        jsCode += `for (let _i = 0; _i < ${times}; _i++) {\n`;
        
        // Find the matching FIM REPITA
        let loopDepth = 1;
        let j = i + 1;
        while (j < lines.length && loopDepth > 0) {
          const loopLine = lines[j];
          if (loopLine.match(/^REPITA\s+/i)) loopDepth++;
          if (loopLine.match(/^FIM\s+REPITA/i)) loopDepth--;
          if (loopDepth > 0) {
            jsCode += translateLineToJS(loopLine) + '\n';
          }
          j++;
        }
        jsCode += '}\n';
        i = j - 1;
      }
    }
    // SE/SENÃO/FIM SE
    else if (line.match(/^SE\s+/i)) {
      const seMatch = line.match(/^SE\s+(.+?)\s+ENTÃO/i);
      if (seMatch) {
        const [, condition] = seMatch;
        jsCode += `if (${parseCondition(condition)}) {\n`;
        
        // Find the matching FIM SE or SENÃO
        let condDepth = 1;
        let j = i + 1;
        let hasElse = false;
        
        while (j < lines.length && condDepth > 0) {
          const condLine = lines[j];
          
          if (condLine.match(/^SE\s+/i)) condDepth++;
          if (condLine.match(/^FIM\s+SE/i)) {
            condDepth--;
            if (condDepth === 0) break;
          }
          
          if (condLine.match(/^SENÃO/i) && condDepth === 1) {
            jsCode += '} else {\n';
            hasElse = true;
            j++;
            continue;
          }
          
          if (condDepth > 0) {
            jsCode += translateLineToJS(condLine) + '\n';
          }
          j++;
        }
        jsCode += '}\n';
        i = j;
      }
    }
    // PRÓXIMO (increment in loop)
    else if (line.match(/^PRÓXIMO\s+/i)) {
      const nextMatch = line.match(/^PRÓXIMO\s+(\w+)/i);
      if (nextMatch) {
        const [, variable] = nextMatch;
        jsCode += `${variable}++;\n`;
      }
    }
    else if (!line.match(/^FIM\s+(PARA|ENQUANTO|SE|REPITA)/i)) {
      // Skip FIM statements as they're handled in loop/conditional parsing
      jsCode += translateLineToJS(line) + '\n';
    }

    i++;
  }

  return jsCode;
}

function translateLineToJS(line: string): string {
  // IMPRIMALN
  if (line.match(/^IMPRIMALN\s+/i)) {
    const content = line.replace(/^IMPRIMALN\s+/i, '').trim();
    return `IMPRIMALN(${parseExpression(content)});`;
  }
  // IMPRIMA
  if (line.match(/^IMPRIMA\s+/i)) {
    const content = line.replace(/^IMPRIMA\s+/i, '').trim();
    return `IMPRIMA(${parseExpression(content)});`;
  }
  // Variable assignment
  if (line.includes('<-')) {
    const [varName, expression] = line.split('<-').map(s => s.trim());
    if (varName.includes('[')) {
      const arrayMatch = varName.match(/(\w+)\[(.+)\]/);
      if (arrayMatch) {
        const [, arrayName, index] = arrayMatch;
        return `if (!${arrayName}) ${arrayName} = {}; ${arrayName}[${parseExpression(index)}] = ${parseExpression(expression)};`;
      }
    }
    return `${varName} = ${parseExpression(expression)};`;
  }
  // PRÓXIMO
  if (line.match(/^PRÓXIMO\s+/i)) {
    const nextMatch = line.match(/^PRÓXIMO\s+(\w+)/i);
    if (nextMatch) {
      return `${nextMatch[1]}++;`;
    }
  }
  return '';
}

function parseExpression(expr: string): string {
  expr = expr.trim();
  
  // Handle string literals
  if ((expr.startsWith("'") && expr.endsWith("'")) || 
      (expr.startsWith('"') && expr.endsWith('"'))) {
    return expr;
  }
  
  // Handle numbers
  if (/^-?\d+(\.\d+)?$/.test(expr)) {
    return expr;
  }
  
  // Handle arithmetic operations
  expr = expr.replace(/\s+/g, ' ');
  expr = expr.replace(/\bMOD\b/gi, '%');
  expr = expr.replace(/\bDIV\b/gi, 'Math.floor');
  
  // Handle function calls like LEIA
  if (expr.match(/^LEIA\s*\(/i)) {
    return `prompt('Digite um valor:')`;
  }
  
  return expr;
}

function parseCondition(condition: string): string {
  condition = condition.trim();
  
  // Replace PETEQS operators with JavaScript operators (order matters!)
  // Do <= and >= first to avoid replacing them with < and >
  condition = condition.replace(/<=\s*/g, ' <= ');
  condition = condition.replace(/>=\s*/g, ' >= ');
  condition = condition.replace(/<>\s*/g, ' !== ');
  
  // Now handle single character operators
  condition = condition.replace(/\s*=\s*/g, ' === ');
  condition = condition.replace(/\s*<\s*/g, ' < ');
  condition = condition.replace(/\s*>\s*/g, ' > ');
  
  // Handle logical operators
  condition = condition.replace(/\bE\b/gi, '&&');
  condition = condition.replace(/\bOU\b/gi, '||');
  condition = condition.replace(/\bNÃO\b/gi, '!');
  
  return condition;
}

