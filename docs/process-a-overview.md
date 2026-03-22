# Process A (Persona 1) - Estado actual

Implementación backend simple para la preparación de entrevistas:

- `profile-service`: recibe texto del CV, detecta dominios/tecnologías de forma heurística y construye un perfil persistido en memoria.
- `question-bank-service`: expone un catálogo base de preguntas técnicas, blandas y ejercicios de código.
- `adaptability-service`: genera un plan simple de priorización de dominios usando plantillas de rol e historial simulado.
- `interview-service`: arma el guion de entrevista, bloques y contrato de salida para el orquestador.

## Flujo soportado

1. `POST /profiles/cv`
2. `POST /adaptability/generate-plan`
3. `POST /interviews`
4. Salida `orchestrationContract` lista para el Proceso B.
