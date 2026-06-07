const stripVersion = (name) => String(name || '')
  .replace(/\s*\([^)]*(?:\d+\.)+\d+[^)]*\)\s*$/i, '')
  .replace(/\s+\d+(?:\.\d+)+(?:\s.*)?$/i, '')
  .trim();

const canonicalKey = (name) => stripVersion(name)
  .toLowerCase()
  .replace(/\s+/g, ' ')
  .trim();

const templateFor = (name) => {
  const value = canonicalKey(name);

  if (value.includes('javascript')) return 'const fs = require("fs");\nconst input = fs.readFileSync(0, "utf8").trim();\n\n// Escribe tu solución aquí usando input.\nconst result = input;\n\nconsole.log(result);\n';
  if (value.includes('typescript')) return 'const fs = require("fs");\nconst input: string = fs.readFileSync(0, "utf8").trim();\n\n// Escribe tu solución aquí usando input.\nconst result: string = input;\n\nconsole.log(result);\n';
  if (value.includes('dart')) return 'void main() {\n  // Escribe tu solución aquí\n  print("Hola, mundo");\n}\n';
  if (value.includes('python')) return 'import sys\n\ninput_data = sys.stdin.read().strip()\n\n# Escribe tu solución aquí usando input_data.\nresult = input_data\n\nprint(result)\n';
  if (value.includes('javafx')) return 'public class Main {\n    public static void main(String[] args) {\n        // Escribe tu solución aquí\n        System.out.println("Hola, mundo");\n    }\n}\n';
  if (value === 'java' || value.startsWith('java ')) return 'import java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws Exception {\n        String input = new String(System.in.readAllBytes()).trim();\n\n        // Escribe tu solución aquí usando input.\n        String result = input;\n\n        System.out.println(result);\n    }\n}\n';
  if (value.includes('c++')) return '#include <iostream>\n#include <sstream>\n#include <string>\n\nint main() {\n    std::ostringstream buffer;\n    buffer << std::cin.rdbuf();\n    std::string input = buffer.str();\n\n    // Escribe tu solución aquí usando input.\n    std::string result = input;\n\n    std::cout << result;\n    return 0;\n}\n';
  if (value === 'c' || value.startsWith('c ')) return '#include <stdio.h>\n\nint main(void) {\n    /* Escribe tu solución aquí */\n    printf("Hola, mundo\\n");\n    return 0;\n}\n';
  if (value.includes('c#')) return 'using System;\n\npublic class Program {\n    public static void Main() {\n        // Escribe tu solución aquí\n        Console.WriteLine("Hola, mundo");\n    }\n}\n';
  if (value === 'go' || value.startsWith('go ')) return 'package main\n\nimport "fmt"\n\nfunc main() {\n    // Escribe tu solución aquí\n    fmt.Println("Hola, mundo")\n}\n';
  if (value.includes('rust')) return 'fn main() {\n    // Escribe tu solución aquí\n    println!("Hola, mundo");\n}\n';
  if (value.includes('kotlin')) return 'fun main() {\n    // Escribe tu solución aquí\n    println("Hola, mundo")\n}\n';
  if (value.includes('swift')) return '// Escribe tu solución aquí\nprint("Hola, mundo")\n';
  if (value.includes('php')) return '<?php\n// Escribe tu solución aquí\necho "Hola, mundo\\n";\n';
  if (value.includes('ruby')) return '# Escribe tu solución aquí\nputs "Hola, mundo"\n';
  if (value.includes('scala')) return 'object Main extends App {\n  // Escribe tu solución aquí\n  println("Hola, mundo")\n}\n';
  if (value.includes('r (') || value === 'r') return '# Escribe tu solución aquí\ncat("Hola, mundo\\n")\n';
  if (value.includes('lua')) return '-- Escribe tu solución aquí\nprint("Hola, mundo")\n';
  if (value.includes('perl')) return '# Escribe tu solución aquí\nprint "Hola, mundo\\n";\n';
  if (value.includes('bash')) return '#!/usr/bin/env bash\n# Escribe tu solución aquí\necho "Hola, mundo"\n';
  if (value.includes('haskell')) return 'main :: IO ()\nmain = do\n  -- Escribe tu solución aquí\n  putStrLn "Hola, mundo"\n';
  if (value.includes('f#')) return '// Escribe tu solución aquí\nprintfn "Hola, mundo"\n';
  if (value.includes('visual basic')) return 'Module Main\n    Sub Main()\n        \' Escribe tu solución aquí\n        Console.WriteLine("Hola, mundo")\n    End Sub\nEnd Module\n';
  if (value.includes('pascal')) return 'program Main;\nbegin\n  { Escribe tu solución aquí }\n  writeln(\'Hola, mundo\');\nend.\n';
  if (value.includes('fortran')) return 'program main\n  implicit none\n  ! Escribe tu solución aquí\n  print *, "Hola, mundo"\nend program main\n';
  if (value.includes('objective-c')) return '#import <Foundation/Foundation.h>\n\nint main(void) {\n    @autoreleasepool {\n        // Escribe tu solución aquí\n        NSLog(@"Hola, mundo");\n    }\n    return 0;\n}\n';
  if (value.includes('groovy')) return '// Escribe tu solución aquí\nprintln "Hola, mundo"\n';
  if (value.includes('clojure')) return ';; Escribe tu solución aquí\n(println "Hola, mundo")\n';
  if (value.includes('common lisp')) return ';; Escribe tu solución aquí\n(format t "Hola, mundo~%")\n';
  if (value.includes('elixir')) return '# Escribe tu solución aquí\nIO.puts("Hola, mundo")\n';
  if (value.includes('erlang')) return '-module(main).\n-export([main/0]).\n\nmain() ->\n    % Escribe tu solución aquí\n    io:format("Hola, mundo~n").\n';
  if (value === 'd' || value.startsWith('d ')) return 'import std.stdio;\n\nvoid main() {\n    // Escribe tu solución aquí\n    writeln("Hola, mundo");\n}\n';
  if (value.includes('ocaml')) return '(* Escribe tu solución aquí *)\nprint_endline "Hola, mundo";;\n';
  if (value.includes('octave')) return '% Escribe tu solución aquí\ndisp("Hola, mundo");\n';
  if (value.includes('prolog')) return ':- initialization(main).\n\nmain :-\n    % Escribe tu solución aquí\n    writeln(\'Hola, mundo\'),\n    halt.\n';
  if (value.includes('sql')) return '-- Escribe tu consulta aquí\nSELECT \'Hola, mundo\';\n';
  if (value.includes('assembly')) return 'section .data\n    mensaje db "Hola, mundo", 10\n    longitud equ $ - mensaje\n\nsection .text\n    global _start\n\n_start:\n    ; Escribe tu solución aquí\n    mov rax, 1\n    mov rdi, 1\n    mov rsi, mensaje\n    mov rdx, longitud\n    syscall\n    mov rax, 60\n    xor rdi, rdi\n    syscall\n';
  if (value.includes('basic')) return '\' Escribe tu solución aquí\nPRINT "Hola, mundo"\n';
  if (value.includes('cobol')) return 'IDENTIFICATION DIVISION.\nPROGRAM-ID. MAIN.\nPROCEDURE DIVISION.\n    *> Escribe tu solución aquí\n    DISPLAY "Hola, mundo".\n    STOP RUN.\n';
  if (value.includes('brainfuck')) return '++++++++++[>+++++++>++++++++++>+++>+<<<<-]>++.>+.+++++++..+++.>++.<<+++++++++++++++.>.+++.------.--------.>+.>.\n';
  if (value.includes('plain text')) return 'Escribe tu respuesta aquí.\n';
  return '';
};

const monacoLanguageFor = (name) => {
  const value = canonicalKey(name);
  if (value.includes('javascript')) return 'javascript';
  if (value.includes('typescript')) return 'typescript';
  if (value.includes('dart')) return 'dart';
  if (value.includes('python')) return 'python';
  if (value === 'java' || value.startsWith('java ')) return 'java';
  if (value.includes('c++')) return 'cpp';
  if (value === 'c' || value.startsWith('c ')) return 'c';
  if (value.includes('c#')) return 'csharp';
  if (value === 'go' || value.startsWith('go ')) return 'go';
  if (value.includes('rust')) return 'rust';
  if (value.includes('kotlin')) return 'kotlin';
  if (value.includes('swift')) return 'swift';
  if (value.includes('php')) return 'php';
  if (value.includes('ruby')) return 'ruby';
  if (value.includes('scala')) return 'scala';
  if (value === 'r') return 'r';
  if (value.includes('lua')) return 'lua';
  if (value.includes('perl')) return 'perl';
  if (value.includes('bash')) return 'shell';
  if (value.includes('sql')) return 'sql';
  return 'plaintext';
};

const buildLanguageCatalog = (languages) => {
  const deduplicated = new Map();

  for (const language of languages || []) {
    if (!Number.isInteger(language.id) || !language.name) continue;
    const key = canonicalKey(language.name);
    if (key === 'executable' || key === 'multi-file program') continue;
    const current = deduplicated.get(key);
    if (!current || language.id > current.id) {
      deduplicated.set(key, language);
    }
  }

  return [...deduplicated.values()]
    .map((language) => ({
      id: language.id,
      name: stripVersion(language.name),
      judge0Name: language.name,
      monacoLanguage: monacoLanguageFor(language.name),
      template: templateFor(language.name),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
};

module.exports = {
  buildLanguageCatalog,
};
