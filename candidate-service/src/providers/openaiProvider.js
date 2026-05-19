const OpenAI = require("openai");
const { toFile } = require("openai/uploads");
const { env } = require("../config/env");
const { ApiError } = require("../utils/apiError");
const { ExpectedLevel, SeniorityLevel, TopicSource } = require("../utils/constants");

const candidateProfileSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "fullName",
    "professionalSummary",
    "estimatedSeniority",
    "suggestedTargetRoles",
    "yearsOfExperience",
    "technicalSkills",
    "technologies",
    "technicalDomains",
    "topics"
  ],
  properties: {
    fullName: { type: ["string", "null"] },
    professionalSummary: { type: ["string", "null"] },
    estimatedSeniority: { type: ["string", "null"], enum: [...Object.values(SeniorityLevel), null] },
    suggestedTargetRoles: { type: "array", items: { type: "string" } },
    yearsOfExperience: { type: ["number", "null"] },
    technicalSkills: { type: "array", items: { type: "string" } },
    technologies: { type: "array", items: { type: "string" } },
    technicalDomains: { type: "array", items: { type: "string" } },
    topics: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "category", "expectedLevel", "source", "priority", "evidence", "subtopics"],
        properties: {
          name: { type: "string" },
          category: { type: ["string", "null"] },
          expectedLevel: { type: ["string", "null"], enum: [...Object.values(ExpectedLevel), null] },
          source: { type: "string", enum: [TopicSource.CV_EXPLICIT, TopicSource.LLM_INFERRED] },
          priority: { type: "integer", minimum: 0, maximum: 100 },
          evidence: { type: ["string", "null"] },
          subtopics: {
            type: "array",
            minItems: 1,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["name", "expectedLevel", "source", "priority", "evidence"],
              properties: {
                name: { type: "string" },
                expectedLevel: { type: ["string", "null"], enum: [...Object.values(ExpectedLevel), null] },
                source: { type: "string", enum: [TopicSource.CV_EXPLICIT, TopicSource.LLM_INFERRED] },
                priority: { type: "integer", minimum: 0, maximum: 100 },
                evidence: { type: ["string", "null"] }
              }
            }
          }
        }
      }
    }
  }
};

class OpenAiProvider {
  constructor() {
    this.client = new OpenAI({
      apiKey: env.openAiApiKey
    });
  }

  async analyzeCvPdf({ pdfBuffer, mediaId, targetRole, level }) {
    let uploadedFile;

    try {
      uploadedFile = await this.client.files.create({
        file: await toFile(pdfBuffer, `cv-${mediaId}.pdf`, { type: "application/pdf" }),
        purpose: "user_data"
      });

      const response = await this.client.responses.create({
        model: env.openAiModel,
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: this.buildPrompt({ targetRole, level })
              },
              {
                type: "input_file",
                file_id: uploadedFile.id
              }
            ]
          }
        ],
        text: {
          format: {
            type: "json_schema",
            name: "candidate_cv_profile",
            strict: true,
            schema: candidateProfileSchema
          }
        }
      });

      const outputText = this.extractOutputText(response);
      const parsed = JSON.parse(outputText);
      this.validateStructuredProfile(parsed);
      return parsed;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(502, "OpenAI CV analysis failed", error.message);
    } finally {
      if (uploadedFile && uploadedFile.id) {
        try {
          await this.client.files.del(uploadedFile.id);
        } catch (error) {
          // File cleanup failure should not fail profile creation.
        }
      }
    }
  }

  buildPrompt({ targetRole, level }) {
    return [
      "Analiza este CV en PDF y devuelve exclusivamente JSON valido segun el schema solicitado.",
      "Objetivo: crear un perfil estructurado para planificar una entrevista tecnica adaptativa.",
      targetRole ? `Rol objetivo indicado por el sistema: ${targetRole}.` : "No hay rol objetivo indicado por el sistema.",
      level ? `Nivel indicado por el sistema: ${level}.` : "No hay nivel indicado por el sistema.",
      "Reglas:",
      "- No inventes experiencia no sustentada por el CV.",
      "- Si una tecnologia aparece de forma general, puedes proponer subtematicas evaluables basicas o intermedias coherentes con el seniority.",
      "- Usa source CV_EXPLICIT cuando la evidencia aparece directamente en el CV.",
      "- Usa source LLM_INFERRED cuando la subtematica es una inferencia razonable desde tecnologias, rol o seniority.",
      "- No generes habilidades blandas; el sistema las crea desde catalogo fijo.",
      "- La evidencia debe ser breve y basada en el CV.",
      "- Prioridad 0 a 100, mayor significa mas relevante para evaluar.",
      "Incluye nombre completo si esta disponible, resumen profesional, seniority estimado, roles objetivo sugeridos, anos aproximados de experiencia, habilidades tecnicas, tecnologias, dominios tecnicos, tematicas y subtematicas evaluables."
    ].join("\n");
  }

  extractOutputText(response) {
    if (response.output_text) {
      return response.output_text;
    }

    const chunks = [];

    for (const item of response.output || []) {
      for (const content of item.content || []) {
        if (content.type === "output_text" && content.text) {
          chunks.push(content.text);
        }
      }
    }

    if (chunks.length === 0) {
      throw new ApiError(502, "OpenAI response did not include JSON output");
    }

    return chunks.join("");
  }

  validateStructuredProfile(profile) {
    if (!profile || !Array.isArray(profile.topics) || profile.topics.length === 0) {
      throw new ApiError(502, "OpenAI response has an invalid candidate profile format");
    }
  }
}

const openAiProvider = new OpenAiProvider();

module.exports = {
  openAiProvider
};
