# Proceso B — Semana 1 y Semana 2 (Persona 2)

Este documento resume lo implementado para la parte de **Ejecución, Evaluación y Feedback**.

## Semana 1 (base)

- Esqueleto del orquestador multimodal.
- Modelo inicial de scoring por pregunta y global.
- Reporte estructurado para feedback.

## Semana 2 (integración básica)

Se completó una integración inicial con servicios externos (sin cola aún):

1. **Recolección multimodal real** desde servicios de audio, video, contenido y código.
2. **Ejecución en paralelo con tolerancia a fallas parciales** (`Promise.allSettled`).
3. **Request extendido** con `segments` para soportar transcripción/evaluación por pregunta.
4. **Warnings por servicio** para trazabilidad operativa.
5. **Validación básica de contrato de entrada** (`interviewId`, `segments[]`, `questionId`).

## Contrato actual

### POST `/orchestrator/evaluate-interview`

Request:

```json
{
  "interviewId": "uuid",
  "videoUrl": "s3://bucket/interview.mp4",
  "segments": [
    {
      "questionId": "q1",
      "start": 12.2,
      "end": 51.4,
      "questionText": "¿Qué es un índice en PostgreSQL?",
      "transcript": "Un índice mejora...",
      "sourceCode": "",
      "language": "javascript"
    }
  ]
}
```

Response (extracto):

```json
{
  "interviewId": "uuid",
  "globalScore": 0.71,
  "questionResults": [],
  "warnings": [
    "video_analysis_failed: ..."
  ],
  "report": {}
}
```

## Configuración por variables de entorno

- `USE_MOCKS=true|false`
- `HTTP_TIMEOUT_MS=8000`
- `AUDIO_SERVICE_URL=http://audio-analysis-service:3008`
- `VIDEO_SERVICE_URL=http://video-analysis-service:3009`
- `CONTENT_SERVICE_URL=http://content-evaluation-service:3010`
- `CODE_SERVICE_URL=http://code-evaluation-service:3011`

## Próximo paso (Semana 3)

- Consumir evento `INTERVIEW_FINISHED` por cola y disparar evaluación asíncrona.
- Persistir resultado en Feedback Service con contrato interno.
- Añadir pruebas de contrato HTTP entre servicios.
