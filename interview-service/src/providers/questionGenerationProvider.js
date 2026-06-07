const { env } = require("../config/env");
const { ApiError } = require("../utils/apiError");
const { createOpenAiClient } = require("./openaiClient");

function chooseQuestionType(planItem, attemptNumber) {
  if (planItem.forcedQuestionType) {
    return planItem.forcedQuestionType;
  }

  if (planItem.skillType === "SOFT") {
    return "SOFT_SKILL";
  }

  if (attemptNumber % 3 === 0) {
    return "CODING";
  }

  return "TECHNICAL";
}

function extractJson(content) {
  const trimmed = String(content || "").trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const jsonText = fenced ? fenced[1].trim() : trimmed;
  return JSON.parse(jsonText);
}

const CODE_REQUEST_PATTERNS = [
  /\b(?:escribe|implementa|programa|codifica|desarrolla)\b/iu,
  /\bcrea\s+(?:una?|el|la)\s+(?:funci[oó]n|clase|servicio|microservicio|api|endpoint|programa|algoritmo|script)\b/iu,
  /\b(?:completa|corrige|depura|refactoriza)\s+(?:el|este|la|esta)?\s*c[oó]digo\b/iu,
  /\b(?:write|implement|code|develop)\s+(?:a|an|the)?\s*(?:function|class|service|microservice|api|endpoint|program|algorithm|script)\b/iu,
  /\b(?:fragmento|bloque|soluci[oó]n)\s+de\s+c[oó]digo\b/iu,
  /\butiliza\s+(?:javascript|typescript|python|java|c\+\+|c#|go|rust|php|ruby)\s+para\b/iu,
];

const UNSUPPORTED_CODING_PATTERNS = [
  /\b(?:angular|react|vue|svelte|next\.?js|nestjs)\b/iu,
  /\b(?:flask|fastapi|django|spring|express)\b/iu,
  /\b(?:endpoint|microservicio|api\s+rest|solicitud\s+http|servidor\s+web)\b/iu,
  /\b(?:base\s+de\s+datos|sql|mongodb|postgresql|redis)\b/iu,
  /\b(?:interfaz\s+gr[aá]fica|bot[oó]n|componente\s+visual|html|css)\b/iu,
  /\b(?:librer[ií]a|paquete|framework)\s+extern/iu,
];

function requestsWrittenCode(prompt) {
  return CODE_REQUEST_PATTERNS.some((pattern) => pattern.test(String(prompt || "")));
}

function validateQuestionModality(question) {
  if (question.questionType === "TECHNICAL" && requestsWrittenCode(question.prompt)) {
    throw new ApiError(422, "Generated TECHNICAL question requires written code", {
      code: "TECHNICAL_QUESTION_REQUIRES_CODE",
      prompt: question.prompt
    });
  }

  if (question.questionType !== "CODING") {
    question.language = null;
    question.codingTestCases = null;
    return;
  }

  if (UNSUPPORTED_CODING_PATTERNS.some((pattern) => pattern.test(question.prompt))) {
    throw new ApiError(422, "Generated CODING question is not compatible with Judge0", {
      code: "CODING_QUESTION_NOT_JUDGE0_COMPATIBLE",
      prompt: question.prompt
    });
  }

  if (!Array.isArray(question.codingTestCases) || question.codingTestCases.length < 3) {
    throw new ApiError(422, "Generated CODING question has insufficient test cases", {
      code: "CODING_QUESTION_MISSING_TEST_CASES",
      prompt: question.prompt
    });
  }

  question.codingTestCases = question.codingTestCases.slice(0, 5).map((testCase, index) => {
    if (typeof testCase?.stdin !== "string" || typeof testCase?.expectedOutput !== "string") {
      throw new ApiError(422, "Generated CODING question has invalid test cases", {
        code: "CODING_QUESTION_INVALID_TEST_CASES",
        prompt: question.prompt
      });
    }
    return {
      name: String(testCase.name || `Caso ${index + 1}`),
      stdin: testCase.stdin,
      expectedOutput: testCase.expectedOutput
    };
  });

  const example = question.codingTestCases[0];
  question.prompt = [
    question.prompt.replace(/\s+/g, " ").trim(),
    "La solución debe ser un programa completo compatible con Judge0, usar únicamente la biblioteca estándar, leer los datos desde la entrada estándar (stdin) y escribir solamente el resultado solicitado en la salida estándar (stdout).",
    `Ejemplo de entrada:\n${example.stdin || "(sin entrada)"}`,
    `Ejemplo de salida:\n${example.expectedOutput}`
  ].join("\n\n");
}

const PROGRAMMING_LANGUAGE_ALIASES = [
  ['javascript', 'JavaScript'],
  ['typescript', 'TypeScript'],
  ['python', 'Python'],
  ['java', 'Java'],
  ['c++', 'C++'],
  ['c#', 'C#'],
  ['golang', 'Go'],
  ['go', 'Go'],
  ['rust', 'Rust'],
  ['kotlin', 'Kotlin'],
  ['swift', 'Swift'],
  ['php', 'PHP'],
  ['ruby', 'Ruby'],
  ['dart', 'Dart'],
];

function inferProgrammingLanguage(planItem, suggestedLanguage) {
  const sources = [
    `${planItem.topic || ""} ${planItem.subtopic || ""}`,
    suggestedLanguage || "",
  ];
  for (const source of sources) {
    const normalized = String(source).toLowerCase();
    const match = PROGRAMMING_LANGUAGE_ALIASES.find(([alias]) => normalized.includes(alias));
    if (match) return match[1];
  }
  return null;
}

function normalizeQuestionPayload(parsed, planItem) {
  return {
    questionType: parsed.questionType,
    prompt: parsed.prompt.trim(),
    language: parsed.questionType === "CODING"
      ? inferProgrammingLanguage(planItem, parsed.language)
      : null,
    codingTestCases: Array.isArray(parsed.testCases) ? parsed.testCases : null,
    generatedByModel: env.openAiQuestionModel
  };
}

function isRecoverableGenerationError(error) {
  return error.statusCode === 422 && (
    String(error.details?.code || "").startsWith("CODING_QUESTION_")
    || error.details?.code === "TECHNICAL_QUESTION_REQUIRES_CODE"
  );
}

function generationErrorDetails(error) {
  return {
    code: error.details?.code || "INVALID_GENERATED_QUESTION",
    prompt: error.details?.prompt || ""
  };
}

function codingRules() {
  return [
    "For CODING, generate a small deterministic algorithmic or data-processing exercise that Judge0 can compile and execute as one source file.",
    "For CODING, require a complete console program that reads stdin and writes stdout.",
    "For CODING, use only the language standard library.",
    "For CODING, never request web frameworks, HTTP servers, endpoints, UI components, databases, files, network access or external packages.",
    "If topic/subtopic names a framework, use only the underlying programming language fundamentals and do not require that framework.",
    "For CODING, include at least 3 deterministic testCases with string fields name, stdin and expectedOutput.",
    "Each expectedOutput must exactly match the required stdout, without explanations or labels."
  ];
}

function baseRules() {
  return [
    "Focus exactly on topic/subtopic.",
    "Respect expectedLevel.",
    "Do not mix multiple subtopics.",
    "For TECHNICAL, ask the candidate to explain a concept, compare alternatives, reason about a scenario, diagnose a problem verbally, or describe a design decision.",
    "For TECHNICAL, the complete answer must be possible by speaking; never request written code, pseudocode, commands, configuration files, functions, services, APIs or implementations.",
    "Use Spanish unless the topic requires English terminology."
  ];
}

function requiredShape(preferredQuestionType) {
  return preferredQuestionType === "CODING"
    ? "Return only JSON with keys questionType, prompt, language and testCases."
    : "Return only JSON with keys questionType, prompt and language.";
}

function assertParsedQuestion(parsed) {
  if (!["TECHNICAL", "SOFT_SKILL", "CODING"].includes(parsed.questionType)) {
    throw new ApiError(502, "OpenAI returned an invalid questionType", parsed);
  }

  if (typeof parsed.prompt !== "string" || parsed.prompt.trim() === "") {
    throw new ApiError(502, "OpenAI returned an empty prompt", parsed);
  }
}

async function generateQuestion({ planItem, targetRole, level, attemptNumber }) {
  const openai = createOpenAiClient();
  const preferredQuestionType = chooseQuestionType(planItem, attemptNumber);

  const systemPrompt = [
    "You generate one concise interview question in Spanish.",
    requiredShape(preferredQuestionType),
    "Do not include answers, rubrics, grading criteria or starterCode.",
    "The preferredQuestionType supplied by the user is mandatory.",
    "TECHNICAL questions are answered only by speaking while audio and video are recorded.",
    "A TECHNICAL question must be conceptual, explanatory, diagnostic, comparative or architectural.",
    "A TECHNICAL question must never ask to write, implement, code, create, complete, correct or refactor source code, functions, APIs, services or programs.",
    "Only CODING questions may request source code.",
    "CODING exercises must run in Judge0 without frameworks, services, network access or external dependencies."
  ].join(" ");

  const userPrompt = {
    targetRole: targetRole || null,
    seniorityLevel: level || null,
    topic: planItem.topic,
    subtopic: planItem.subtopic,
    expectedLevel: planItem.expectedLevel || null,
    skillType: planItem.skillType,
    preferredQuestionType,
    attemptNumber,
    rules: preferredQuestionType === "CODING"
      ? [...baseRules(), ...codingRules()]
      : baseRules()
  };

  const completion = await openai.chat.completions.create({
    model: env.openAiQuestionModel,
    temperature: 0.75,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: JSON.stringify(userPrompt) }
    ]
  });

  const content = completion.choices?.[0]?.message?.content;
  let parsed;

  try {
    parsed = extractJson(content);
  } catch (error) {
    throw new ApiError(502, "OpenAI returned invalid question JSON", {
      content
    });
  }

  assertParsedQuestion(parsed);
  parsed.questionType = preferredQuestionType;
  const question = normalizeQuestionPayload(parsed, planItem);
  validateQuestionModality(question);
  return question;
}

module.exports = {
  generateQuestion,
  requestsWrittenCode,
  validateQuestionModality,
  isRecoverableGenerationError,
  generationErrorDetails,
  inferProgrammingLanguage
};
