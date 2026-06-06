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
      minItems: 3,
      maxItems: 8,
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
            minItems: 2,
            maxItems: 5,
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
    this.client = null;
  }

  getClient() {
    if (!env.openAiApiKey) {
      throw new ApiError(500, "OPENAI_API_KEY is required to analyze CVs");
    }

    if (!this.client) {
      this.client = new OpenAI({
        apiKey: env.openAiApiKey
      });
    }

    return this.client;
  }

  async analyzeCvPdf({ pdfBuffer, mediaId, targetRole, level }) {
    let uploadedFile;
    const client = this.getClient();

    try {
      uploadedFile = await client.files.create({
        file: await toFile(pdfBuffer, `cv-${mediaId}.pdf`, { type: "application/pdf" }),
        purpose: "user_data"
      });

      const firstProfile = await this.requestStructuredProfile(client, {
        fileId: uploadedFile.id,
        targetRole,
        level,
        recovery: false
      });
      const qualityIssues = this.getTaxonomyIssues(firstProfile);

      if (qualityIssues.length === 0) {
        return firstProfile;
      }

      return this.requestStructuredProfile(client, {
        fileId: uploadedFile.id,
        targetRole,
        level,
        recovery: true,
        qualityIssues
      });
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(502, "OpenAI CV analysis failed", error.message);
    } finally {
      if (uploadedFile && uploadedFile.id) {
        try {
          await client.files.del(uploadedFile.id);
        } catch (error) {
          // File cleanup failure should not fail profile creation.
        }
      }
    }
  }

  async requestStructuredProfile(client, { fileId, targetRole, level, recovery, qualityIssues = [] }) {
    const response = await client.responses.create({
      model: env.openAiModel,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: this.buildPrompt({ targetRole, level, recovery, qualityIssues })
            },
            {
              type: "input_file",
              file_id: fileId
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

    const parsed = JSON.parse(this.extractOutputText(response));
    this.validateStructuredProfile(parsed);
    return parsed;
  }

  buildPrompt({ targetRole, level, recovery = false, qualityIssues = [] }) {
    return [
      "Analiza este CV en PDF y devuelve exclusivamente JSON valido segun el schema solicitado.",
      "Objetivo: crear un perfil estructurado para planificar una entrevista tecnica adaptativa.",
      targetRole ? `Rol objetivo indicado por el sistema: ${targetRole}.` : "No hay rol objetivo indicado por el sistema.",
      level ? `Nivel indicado por el sistema: ${level}.` : "No hay nivel indicado por el sistema.",
      recovery
        ? `Este es un segundo intento porque la taxonomia anterior fue demasiado general: ${qualityIssues.join("; ")}. Corrige esos problemas.`
        : "Construye una taxonomia tecnica concreta desde el primer intento.",
      "Reglas:",
      "- No inventes experiencia no sustentada por el CV.",
      "- Genera entre 3 y 8 topics tecnicos. Cada topic debe ser una tecnologia concreta: lenguaje, framework, runtime, base de datos, plataforma o herramienta.",
      "- Ejemplos validos de topic: Python, Node.js, Java, React, PostgreSQL, Docker y AWS.",
      "- No uses como topic categorias generales como Desarrollo de software, Programacion, Backend, Frontend, Bases de datos, Tecnologias o Ingenieria de software.",
      "- Cada topic debe contener entre 2 y 5 subtopics pequenos, concretos y evaluables sobre esa tecnologia.",
      "- Ejemplo: topic Node.js; subtopics event loop, asincronia con Promises, streams y manejo de errores.",
      "- No repitas una tecnologia con nombres equivalentes ni agrupes varias tecnologias en un mismo topic.",
      "- Si el CV es corto, pobre o no enumera suficientes tecnologias, infiere un conjunto minimo de 3 topics coherentes con proyectos, estudios, experiencia o rol sugerido.",
      "- Todo topic inferido debe usar source LLM_INFERRED y no debe presentarse como experiencia comprobada.",
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

  getTaxonomyIssues(profile) {
    const genericNames = new Set([
      "desarrollo-de-software",
      "ingenieria-de-software",
      "programacion",
      "desarrollo-backend",
      "backend",
      "desarrollo-frontend",
      "frontend",
      "bases-de-datos",
      "tecnologias",
      "herramientas",
      "desarrollo-web"
    ]);
    const normalize = (value) => String(value || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const issues = [];

    if (profile.topics.length < 3) {
      issues.push("se generaron menos de 3 topics tecnicos");
    }

    const genericTopics = profile.topics
      .filter((topic) => genericNames.has(normalize(topic.name)))
      .map((topic) => topic.name);
    if (genericTopics.length > 0) {
      issues.push(`topics demasiado generales: ${genericTopics.join(", ")}`);
    }

    const incompleteTopics = profile.topics
      .filter((topic) => !Array.isArray(topic.subtopics) || topic.subtopics.length < 2)
      .map((topic) => topic.name);
    if (incompleteTopics.length > 0) {
      issues.push(`topics sin suficientes subtopics: ${incompleteTopics.join(", ")}`);
    }

    return issues;
  }
}

const openAiProvider = new OpenAiProvider();

module.exports = {
  openAiProvider
};
