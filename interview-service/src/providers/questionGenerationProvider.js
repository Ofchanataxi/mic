const { env } = require("../config/env");
const { ApiError } = require("../utils/apiError");
const { createOpenAiClient } = require("./openaiClient");

function chooseQuestionType(planItem, attemptNumber) {
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

async function generateQuestion({ planItem, targetRole, level, attemptNumber }) {
  const openai = createOpenAiClient();
  const preferredQuestionType = chooseQuestionType(planItem, attemptNumber);

  const systemPrompt = [
    "You generate one concise technical interview question.",
    "Return only valid JSON with keys: questionType, prompt, language.",
    "Do not include answers, rubrics, grading criteria, starterCode or expectedOutput.",
    "The question must evaluate exactly one subtopic and be suitable for an oral interview or a coding exercise."
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
    rules: [
      "Focus exactly on topic/subtopic.",
      "Respect expectedLevel.",
      "Do not mix multiple subtopics.",
      "For CODING, ask for solving or explaining a solution with code, but do not include starter code or expected output.",
      "Use Spanish unless the topic requires English terminology."
    ]
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

  if (!["TECHNICAL", "SOFT_SKILL", "CODING"].includes(parsed.questionType)) {
    throw new ApiError(502, "OpenAI returned an invalid questionType", parsed);
  }

  if (typeof parsed.prompt !== "string" || parsed.prompt.trim() === "") {
    throw new ApiError(502, "OpenAI returned an empty prompt", parsed);
  }

  return {
    questionType: parsed.questionType,
    prompt: parsed.prompt.trim(),
    language: parsed.language || null,
    generatedByModel: env.openAiQuestionModel
  };
}

module.exports = {
  generateQuestion
};
