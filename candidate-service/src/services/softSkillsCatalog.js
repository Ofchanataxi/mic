const { ExpectedLevel, TopicSource } = require("../utils/constants");

const SOFT_SKILLS_CATALOG = [
  {
    name: "Comunicacion",
    category: "communication",
    expectedLevel: ExpectedLevel.INTERMEDIATE,
    source: TopicSource.SYSTEM_DEFAULT,
    priority: 50,
    subtopics: [
      "claridad al explicar",
      "estructura de respuesta",
      "precision del lenguaje",
      "escucha activa"
    ]
  },
  {
    name: "Resolucion de problemas / pensamiento critico",
    category: "problem_solving",
    expectedLevel: ExpectedLevel.INTERMEDIATE,
    source: TopicSource.SYSTEM_DEFAULT,
    priority: 50,
    subtopics: [
      "analisis del problema",
      "descomposicion",
      "justificacion de decisiones",
      "manejo de trade-offs"
    ]
  },
  {
    name: "Trabajo en equipo / colaboracion",
    category: "teamwork",
    expectedLevel: ExpectedLevel.INTERMEDIATE,
    source: TopicSource.SYSTEM_DEFAULT,
    priority: 45,
    subtopics: [
      "colaboracion",
      "manejo de desacuerdos",
      "comunicacion con perfiles no tecnicos"
    ]
  },
  {
    name: "Adaptabilidad",
    category: "adaptability",
    expectedLevel: ExpectedLevel.INTERMEDIATE,
    source: TopicSource.SYSTEM_DEFAULT,
    priority: 40,
    subtopics: [
      "aprendizaje ante cambios",
      "manejo de incertidumbre",
      "respuesta ante feedback"
    ]
  },
  {
    name: "Profesionalismo / responsabilidad",
    category: "professionalism",
    expectedLevel: ExpectedLevel.INTERMEDIATE,
    source: TopicSource.SYSTEM_DEFAULT,
    priority: 40,
    subtopics: [
      "responsabilidad",
      "reconocimiento de errores",
      "criterio etico",
      "compromiso con calidad"
    ]
  }
];

function getSoftSkills(limit) {
  return SOFT_SKILLS_CATALOG.slice(0, Math.max(0, limit));
}

module.exports = {
  getSoftSkills
};
