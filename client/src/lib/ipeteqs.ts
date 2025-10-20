/**
 * DUMITEQS - Interpretador PETEQS completo baseado no ipeteqsJS original
 * Código original de Leon de França Nascimento
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

// Função de impressão global
function PQ_print(target: any, ...args: any[]): void {
  for (let arg of args) {
    if (arg !== undefined && arg !== null) {
      if (typeof arg === 'boolean') {
        arg = arg.toString();
      }
      target.innerHTML += arg;
    }
  }
}

// Núcleo da funcionalidade do PETEQS
const PeteqsCore = {
  /**
   * Função de impressão: Converte a expressão a ser imprimida pela função PQ_print
   */
  imprima: function (args: string = ''): string {
    let statement = PeteqsHelper.exp_converter(args.replace(/^imprimaln|^imprima/gi, ''));
    return `PQ_print(target,${statement});`;
  },

  /**
   * Função de impressão com nova linha
   */
  imprimaln: function (args: string = ''): string {
    return PeteqsCore.imprima(args) + "\nPQ_print(target,'<br>');";
  },

  /**
   * Função de entrada
   */
  leia: function (linha: string): string {
    let code = '';
    linha = linha.substring(4, linha.length); // Remove o leia

    // Verifica a existência de um vetor e o inicializa caso não exista
    code = PeteqsHelper.handle_vectors(linha) + '\n';
    code += PeteqsHelper.get_input(PeteqsHelper.has_vector(linha), linha);

    // Garante que os números sejam números
    return code + `\nif(!isNaN(${linha})){
      ${linha} = Number(${linha});
    }`;
  },

  /**
   * Função de atribuição
   */
  atribui: function (args: string): string {
    args = PeteqsHelper.exp_converter(args);

    if (PeteqsHelper.has_vector(args)) {
      args = PeteqsHelper.handle_vectors(args) + '\n' + args;
    }

    return args.replace(/<-/, '=');
  },

  /**
   * Função condicional SE
   */
  se: function (cond: string): string {
    cond = cond.replace(/se/gi, '');

    if (cond.match(/então|entao/gi)) {
      cond = cond.replace(/então|entao/gi, '');
    }

    cond = PeteqsHelper.exp_converter(cond.trim());
    return `if(${cond}){`;
  },

  /**
   * Função SENÃO
   */
  senao: function (linha: string): string {
    return '} else {';
  },

  /**
   * Função ENQUANTO
   */
  enquanto: function (variaveis: string[]): string {
    let condicao = variaveis[0].trim();
    condicao = PeteqsHelper.exp_converter(condicao);

    let code = `
      loopStart = Date.now();
      while(true){
        if(Date.now() - loopStart > 30000){
          PQ_print(target,'Erro no código - Loop demorou demais. Verifique se existe um loop infinito.');
          break;
        }
        if(!(${condicao})){
          break;
        }
    `;
    return code;
  },

  /**
   * Função PARA
   */
  para: function (variaveis: string[]): string {
    let variavel = variaveis[0];
    let comeco = variaveis[1].trim();
    let fim = variaveis[2].trim();

    // Converter expressões
    comeco = PeteqsHelper.exp_converter(comeco);
    fim = PeteqsHelper.exp_converter(fim);

    let code = `
      loopStart = Date.now();
      var ${variavel} = ${comeco};
      if(${fim}>${comeco}){
        increment = true;
        ${variavel}--;
        var condition_${variavel} = '${variavel} < ${fim}';
      }
      else{
        increment = false;
        ${variavel}++;
        var condition_${variavel} = '${variavel} > ${fim}';
      }
      while(true){
        if(Date.now() - loopStart > 30000){
          PQ_print(target,'Erro no código - Loop demorou demais. Verifique se existe um loop infinito.');
          break;
        }
        if(!eval(condition_${variavel})){
          break;
        }
        if(increment){
          ${variavel}++;
        }else{
          --${variavel};
        }
    `;
    return code;
  },

  /**
   * Função REPITA
   */
  repita: function (vezes: string): string {
    vezes = PeteqsHelper.exp_converter(vezes.trim());
    let code = `
      loopStart = Date.now();
      var repita_counter = 0;
      while(repita_counter < ${vezes}){
        if(Date.now() - loopStart > 30000){
          PQ_print(target,'Erro no código - Loop demorou demais. Verifique se existe um loop infinito.');
          break;
        }
        repita_counter++;
    `;
    return code;
  },

  /**
   * Função PRÓXIMO (fecha loops)
   */
  proximo: function (): string {
    return '}';
  },

  /**
   * Função FIM
   */
  fim: function (linha: string): string {
    if (PeteqsHelper.in_function && !linha.match(/para|se|enquanto|próximo|proximo/gi)) {
      if (PeteqsHelper.vars.length > 0) {
        let funcvar = PeteqsHelper.vars.peep();
        let conversion = `${funcvar}= typeof resultado != "undefined" ? resultado : ${funcvar};`;
        return `${conversion}\nreturn ${PeteqsHelper.vars.pop()}; \n}`;
      } else {
        return '}';
      }

      // Remove o flag da função atual da pilha de funções
      PeteqsHelper.in_function.pop();
    }
    return '}';
  },

  /**
   * Função FUNÇÃO
   */
  funcao: function (linha: string): string {
    // Ex.: FUNÇÃO somar(a, b)
    let funcName = linha.replace(/função|function/gi, '').trim();
    let params = funcName.match(/\((.*?)\)/);

    if (params) {
      funcName = funcName.replace(/\(.*?\)/gi, '').trim();
      let paramList = params[1];
      PeteqsHelper.vars.push(funcName);
      PeteqsHelper.in_function.push(funcName);
      return `function ${funcName}(${paramList}){`;
    }

    return `function ${funcName}(){`;
  },

  /**
   * Função PROCEDIMENTO
   */
  procedimento: function (linha: string): string {
    // Ex.: PROCEDIMENTO somar(a, b)
    let procName = linha.replace(/procedimento|procedure/gi, '').trim();
    let params = procName.match(/\((.*?)\)/);

    if (params) {
      procName = procName.replace(/\(.*?\)/gi, '').trim();
      let paramList = params[1];
      PeteqsHelper.in_function.push(procName);
      return `function ${procName}(${paramList}){`;
    }

    PeteqsHelper.in_function.push(procName);
    return `function ${procName}(){`;
  },

  /**
   * Função CHAMAR (chamada de procedimento/função)
   */
  chamar: function (linha: string): string {
    linha = linha.replace(/chamar/gi, '').trim();
    return `${linha};`;
  },

  /**
   * Função RETORNA
   */
  retorna: function (args: string): string {
    let statement = PeteqsHelper.exp_converter(args.replace(/retorna/gi, '').trim());
    return `resultado = ${statement}; return resultado;`;
  }
};

// Helper do PETEQS
const PeteqsHelper = {
  vars: [] as string[],
  vectors: [] as string[],
  in_function: [] as string[],
  in_programa: false,
  operators: [' + ', ' - ', ' * ', '/', ' mod ', ' <> ', '=', ' E ', ' OU ', ' NÃO ', 'VERDADEIRO', 'FALSO'],
  reserved_words: [/^início|^inicio/gi, /^fim/gi, /^próximo|^proximo/gi, /^senão|^senao/gi, /^função|^funcao/gi, /^programa/gi],

  purge: function (): void {
    this.vars = [];
    this.vectors = [];
    this.in_function = [];
  },

  /**
   * Converte operadores PETEQS para JavaScript
   */
  exp_converter: function (linha: string): string {
    this.operators.forEach((operator) => {
      switch (operator) {
        case '/':
          if (linha.match(/(?!^).\/./)) {
            if (!linha.match(/(?!^)\d\.\d/g)) {
              let divisoes = linha.match(/(?!^)[^\w\<\-](\b.*\/.*\b)/g);
              if (divisoes && Array.isArray(divisoes)) {
                divisoes.forEach((match: string) => {
                  if (divisoes && divisoes.length === 1 && divisoes[0] === linha) {
                    linha = linha.replace(match, '$&>>0');
                    return;
                  }
                  linha = linha.replace(match, '($&>>0)');
                });
              }
            }
          }
          break;
        case ' - ':
          linha = linha.replace(/–/g, '-');
          break;
        case ' mod ':
          linha = linha.replace(/[^\w]mod[^\w]/gi, '%');
          break;
        case '=':
          linha = linha.replace(/[^<>!]=+/g, ' == ');
          break;
        case ' <> ':
          linha = linha.replace(/<>/g, ' != ');
          break;
        case ' E ':
          linha = linha.replace(/ E /gi, ' && ');
          break;
        case ' OU ':
          linha = linha.replace(/ OU /gi, ' || ');
          break;
        case ' NÃO ':
          linha = linha.replace(/ NÃO /gi, '!');
          break;
        case 'VERDADEIRO':
          linha = linha.replace(/verdadeiro/gi, 'true');
          break;
        case 'FALSO':
          linha = linha.replace(/falso/gi, 'false');
          break;
      }
    });

    return linha;
  },

  /**
   * Verifica se a linha contém um vetor
   */
  has_vector: function (linha: string): boolean {
    return /\[.*\]/.test(linha);
  },

  /**
   * Verifica se a linha contém uma atribuição
   */
  has_atribution: function (linha: string): boolean {
    return /<-/.test(linha);
  },

  /**
   * Trata vetores na linha
   */
  handle_vectors: function (linha: string): string {
    let code = '';
    let vectors = linha.match(/(\w+)\[/g);

    if (vectors) {
      vectors.forEach((vector) => {
        vector = vector.trim().replace('[', '');
        let flag = this.vectors.includes(vector);
        if (!flag) {
          this.vectors.push(vector);
          code += `if(typeof ${vector} === 'undefined' || !${vector}){${vector} = Array("null");}\n`;
        }
      });
    }

    return code;
  },

  /**
   * Obtém entrada do usuário
   */
  get_input: function (flag: boolean, varname: string): string {
    if (flag) {
      return `${varname} = prompt('Insira o valor da variável do vetor');`;
    } else {
      return `${varname} = prompt('Insira o valor da variável ${varname}');`;
    }
  },

  /**
   * Analisa uma linha de código PETEQS
   */
  analyze: function (linha: string): string {
    linha = linha.trim();

    if (linha === '' || linha.startsWith('//')) {
      return '';
    }

    if (this.has_atribution(linha)) {
      if (linha.match(/^para|^PARA/i)) {
        // Extrair variável, começo e fim
        let match = linha.match(/para\s+(\w+)\s*<-\s*(.*?)\s+até|ate\s+(.*?)\s+faça|faca/i);
        if (match) {
          return PeteqsCore.para([match[1], match[2], match[3]]);
        }
      } else {
        return PeteqsCore.atribui(linha);
      }
    } else if (linha.match(/^imprimaln/i)) {
      return PeteqsCore.imprimaln(linha);
    } else if (linha.match(/^imprima/i)) {
      return PeteqsCore.imprima(linha);
    } else if (linha.match(/^leia/i)) {
      return PeteqsCore.leia(linha);
    } else if (linha.match(/^senão|^senao/i)) {
      return PeteqsCore.senao(linha);
    } else if (linha.match(/^se/i)) {
      return PeteqsCore.se(linha);
    } else if (linha.match(/^enquanto/i)) {
      // Extrair condição
      let match = linha.match(/enquanto\s+(.*?)\s+faça|faca/i);
      if (match) {
        return PeteqsCore.enquanto([match[1]]);
      }
    } else if (linha.match(/^repita/i)) {
      // Extrair número de vezes
      let match = linha.match(/repita\s+(.*?)\s+vezes|VEZES/i);
      if (match) {
        return PeteqsCore.repita(match[1]);
      }
    } else if (linha.match(/^função|^funcao/i)) {
      return PeteqsCore.funcao(linha);
    } else if (linha.match(/^procedimento/i)) {
      return PeteqsCore.procedimento(linha);
    } else if (linha.match(/^chamar/i)) {
      return PeteqsCore.chamar(linha);
    } else if (linha.match(/^retorna|^return/i)) {
      return PeteqsCore.retorna(linha);
    } else if (linha.match(/^fim|^FIM/i)) {
      return PeteqsCore.fim(linha);
    } else if (linha.match(/^próximo|^proximo/i)) {
      return PeteqsCore.proximo();
    } else if (linha.match(/^programa/i)) {
      this.in_programa = true;
      return `/*** ${linha} ***/`;
    } else if (linha.match(/\(.*\)/)) {
      // Chamada de função/procedimento
      let f_name = linha.replace(/\(.*\)/gi, '');
      return `if (typeof ${f_name} === 'function') {
        ${linha};
      }`;
    }

    return linha;
  },

  /**
   * Limpa o código PETEQS
   */
  clean_PTQ_code: function (code: string): string[] {
    code = code.replace(/←/g, '<-');
    code = code.replace(/→/g, '<-');

    // Normalizar quebras de linha e espaços
    code = code.replace(/\r\n/g, '\n');

    return code.split('\n');
  },

  /**
   * Executa o código PETEQS
   */
  execute: function (PQ_code: string, target: any): void {
    // Limpa as variáveis da execução anterior
    this.purge();

    let code = `
(function(target) {
  let loopStart = Date.now();
  let increment = true;
  let condition_i = '';
  let resultado = undefined;
  
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

    let lines = this.clean_PTQ_code(PQ_code);

    for (let i = 0; i < lines.length; i++) {
      let analyzed = this.analyze(lines[i]);
      if (analyzed) {
        code += '  ' + analyzed + '\n';
      }
    }

    code += `
})(target);
`;

    try {
      // Executar o código gerado usando eval com contexto apropriado
      // Usar eval direto para ter acesso ao escopo local
      eval(code);
    } catch (e: any) {
      target.innerHTML = `Erro ao executar código: ${e.message}`;
    }
  }
};

// Adicionar método peep ao Array
declare global {
  interface Array<T> {
    peep(): T | undefined;
  }
}

if (!Array.prototype.peep) {
  Array.prototype.peep = function () {
    return this[this.length - 1];
  };
}

