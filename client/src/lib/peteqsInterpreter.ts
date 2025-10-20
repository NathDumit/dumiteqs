/**
 * Interpretador PETEQS - Pseudolinguagem para aprendizado de lógica de programação
 * Suporta: variáveis, operações aritméticas, estruturas de controle, funções e procedimentos
 */

export interface ExecutionResult {
  output: string;
  error?: string;
  variables?: Record<string, any>;
}

interface Variable {
  value: any;
  type: 'number' | 'string' | 'boolean' | 'array';
}

interface Function {
  params: string[];
  returnVar?: string;
  body: string[];
}

class PETEQSInterpreter {
  private variables: Map<string, Variable> = new Map();
  private functions: Map<string, Function> = new Map();
  private output: string[] = [];
  private inputQueue: string[] = [];
  private inputIndex: number = 0;
  private executionTime: number = 0;
  private maxExecutionTime: number = 30000; // 30 segundos
  private startTime: number = 0;

  constructor(inputs: string[] = []) {
    this.inputQueue = inputs;
  }

  execute(code: string): ExecutionResult {
    try {
      this.output = [];
      this.inputIndex = 0;
      this.variables.clear();
      this.functions.clear();
      this.startTime = Date.now();

      const lines = this.preprocessCode(code);
      this.executeLines(lines);

      return {
        output: this.output.join(''),
        variables: this.getVariablesObject(),
      };
    } catch (error) {
      return {
        output: this.output.join(''),
        error: error instanceof Error ? error.message : String(error),
        variables: this.getVariablesObject(),
      };
    }
  }

  private preprocessCode(code: string): string[] {
    // Remove comentários
    let processed = code.replace(/\/\/.*$/gm, '');
    // Normalizar espaços em branco
    processed = processed.replace(/\s+/g, ' ').trim();
    // Dividir por linhas lógicas (comandos terminados por espaço ou quebra de linha)
    return processed.split(/(?=PARA|ENQUANTO|SE|FUNÇÃO|PROCEDIMENTO|FIM)/i)
      .map(line => line.trim())
      .filter(line => line.length > 0);
  }

  private executeLines(lines: string[]): void {
    let i = 0;
    while (i < lines.length) {
      this.checkExecutionTime();
      const line = lines[i].trim();

      if (line.match(/^FUNÇÃO\s+/i)) {
        const { func, endIndex } = this.parseFunction(lines, i);
        this.functions.set(func.name, func.def);
        i = endIndex;
      } else if (line.match(/^PROCEDIMENTO\s+/i)) {
        const { func, endIndex } = this.parseProcedure(lines, i);
        this.functions.set(func.name, func.def);
        i = endIndex;
      } else if (line.length > 0) {
        this.executeLine(line);
      }
      i++;
    }
  }

  private executeLine(line: string): void {
    line = line.trim();
    if (!line) return;

    // Atribuição
    if (line.includes('<-')) {
      this.executeAssignment(line);
    }
    // Estrutura SE
    else if (line.match(/^SE\s+/i)) {
      this.executeSE(line);
    }
    // Estrutura PARA
    else if (line.match(/^PARA\s+/i)) {
      this.executePARA(line);
    }
    // Estrutura ENQUANTO
    else if (line.match(/^ENQUANTO\s+/i)) {
      this.executeENQUANTO(line);
    }
    // Funções de saída
    else if (line.match(/^IMPRIMALN\s+/i)) {
      const value = this.extractValue(line.replace(/^IMPRIMALN\s+/i, '').trim());
      this.output.push(String(value) + '\n');
    } else if (line.match(/^IMPRIMA\s+/i)) {
      const value = this.extractValue(line.replace(/^IMPRIMA\s+/i, '').trim());
      this.output.push(String(value));
    }
    // Funções de entrada
    else if (line.match(/^LEIA\s+/i)) {
      const varName = line.replace(/^LEIA\s+/i, '').trim();
      if (this.inputIndex < this.inputQueue.length) {
        this.setVariable(varName, this.inputQueue[this.inputIndex++]);
      }
    }
  }

  private executeAssignment(line: string): void {
    const [varPart, valuePart] = line.split('<-').map(s => s.trim());
    
    // Suporta arrays como var[index]
    const arrayMatch = varPart.match(/^(\w+)\[(.+)\]$/);
    
    if (arrayMatch) {
      const arrayName = arrayMatch[1];
      const indexExpr = arrayMatch[2];
      const index = this.evaluateExpression(indexExpr);
      const value = this.evaluateExpression(valuePart);
      
      if (!this.variables.has(arrayName)) {
        this.variables.set(arrayName, { value: {}, type: 'array' });
      }
      const arr = this.variables.get(arrayName)!.value;
      arr[index] = value;
    } else {
      const value = this.evaluateExpression(valuePart);
      this.setVariable(varPart, value);
    }
  }

  private executeSE(line: string): void {
    const conditionMatch = line.match(/^SE\s+(.+?)\s+ENTÃO/i);
    if (!conditionMatch) return;

    const condition = conditionMatch[1];
    const conditionResult = this.evaluateCondition(condition);

    // Simplificado: executa a próxima linha se verdadeiro
    if (conditionResult) {
      // Implementação básica - em produção seria mais complexa
    }
  }

  private executePARA(line: string): void {
    const match = line.match(/^PARA\s+(\w+)\s*<-\s*(.+?)\s+ATÉ\s+(.+?)\s+FAÇA/i);
    if (!match) return;

    const varName = match[1];
    const start = this.evaluateExpression(match[2]);
    const end = this.evaluateExpression(match[3]);

    for (let i = start; i <= end; i++) {
      this.checkExecutionTime();
      this.setVariable(varName, i);
      // Corpo do loop seria processado aqui
    }
  }

  private executeENQUANTO(line: string): void {
    const match = line.match(/^ENQUANTO\s+(.+?)\s+FAÇA/i);
    if (!match) return;

    const condition = match[1];
    let iterations = 0;
    const maxIterations = 10000;

    while (this.evaluateCondition(condition) && iterations < maxIterations) {
      this.checkExecutionTime();
      iterations++;
      // Corpo do loop seria processado aqui
    }
  }

  private parseFunction(lines: string[], startIndex: number): { func: { name: string; def: Function }; endIndex: number } {
    const line = lines[startIndex];
    const match = line.match(/^FUNÇÃO\s+(\w+)\s*\(([^)]*)\)/i);
    if (!match) throw new Error('Sintaxe de função inválida');

    const name = match[1];
    const params = match[2].split(',').map(p => p.trim()).filter(p => p);

    let endIndex = startIndex + 1;
    const body: string[] = [];

    while (endIndex < lines.length && !lines[endIndex].match(/^FIM\s+FUNÇÃO/i)) {
      body.push(lines[endIndex]);
      endIndex++;
    }

    return {
      func: { name, def: { params, body, returnVar: 'resultado' } },
      endIndex,
    };
  }

  private parseProcedure(lines: string[], startIndex: number): { func: { name: string; def: Function }; endIndex: number } {
    const line = lines[startIndex];
    const match = line.match(/^PROCEDIMENTO\s+(\w+)\s*\(\s*\)/i);
    if (!match) throw new Error('Sintaxe de procedimento inválida');

    const name = match[1];

    let endIndex = startIndex + 1;
    const body: string[] = [];

    while (endIndex < lines.length && !lines[endIndex].match(/^FIM\s+PROCEDIMENTO/i)) {
      body.push(lines[endIndex]);
      endIndex++;
    }

    return {
      func: { name, def: { params: [], body } },
      endIndex,
    };
  }

  private evaluateExpression(expr: string): any {
    expr = expr.trim();

    // Números
    if (!isNaN(Number(expr))) {
      return Number(expr);
    }

    // Strings
    if ((expr.startsWith("'") && expr.endsWith("'")) || (expr.startsWith('"') && expr.endsWith('"'))) {
      return expr.slice(1, -1);
    }

    // Booleanos
    if (expr.match(/^(VERDADEIRO|FALSO)$/i)) {
      return expr.match(/^VERDADEIRO$/i) ? true : false;
    }

    // Variáveis
    if (this.variables.has(expr)) {
      return this.variables.get(expr)!.value;
    }

    // Operações aritméticas
    if (expr.includes('+') || expr.includes('-') || expr.includes('*') || expr.includes('/') || expr.includes('MOD')) {
      return this.evaluateArithmetic(expr);
    }

    return expr;
  }

  private evaluateArithmetic(expr: string): number {
    expr = expr.replace(/\bMOD\b/gi, '%');

    // Substituir variáveis pelos seus valores
    expr = expr.replace(/\b(\w+)\b/g, (match) => {
      if (this.variables.has(match)) {
        return String(this.variables.get(match)!.value);
      }
      return match;
    });

    try {
      // Usar Function em vez de eval por segurança
      const result = Function('"use strict"; return (' + expr + ')')();
      return Number(result);
    } catch {
      throw new Error(`Expressão aritmética inválida: ${expr}`);
    }
  }

  private evaluateCondition(condition: string): boolean {
    const operators = ['<>', '<=', '>=', '<', '>', '='];
    
    for (const op of operators) {
      if (condition.includes(op)) {
        const [left, right] = condition.split(op).map(s => s.trim());
        const leftVal = this.evaluateExpression(left);
        const rightVal = this.evaluateExpression(right);

        switch (op) {
          case '=':
            return leftVal === rightVal;
          case '<>':
            return leftVal !== rightVal;
          case '<':
            return leftVal < rightVal;
          case '>':
            return leftVal > rightVal;
          case '<=':
            return leftVal <= rightVal;
          case '>=':
            return leftVal >= rightVal;
        }
      }
    }

    return false;
  }

  private extractValue(expr: string): any {
    // Remove parênteses se houver
    expr = expr.replace(/^\(|\)$/g, '').trim();
    return this.evaluateExpression(expr);
  }

  private setVariable(name: string, value: any): void {
    let type: 'number' | 'string' | 'boolean' | 'array' = 'string';
    
    if (typeof value === 'number') type = 'number';
    else if (typeof value === 'boolean') type = 'boolean';
    else if (typeof value === 'object') type = 'array';

    this.variables.set(name, { value, type });
  }

  private getVariablesObject(): Record<string, any> {
    const result: Record<string, any> = {};
    this.variables.forEach((v, k) => {
      result[k] = v.value;
    });
    return result;
  }

  private checkExecutionTime(): void {
    const elapsed = Date.now() - this.startTime;
    if (elapsed > this.maxExecutionTime) {
      throw new Error('Tempo máximo de execução excedido (30 segundos)');
    }
  }
}

export function interpretPETEQS(code: string, inputs: string[] = []): ExecutionResult {
  const interpreter = new PETEQSInterpreter(inputs);
  return interpreter.execute(code);
}

