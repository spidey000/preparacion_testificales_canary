# Testificales

## Especificacion funcional compacta

## 1. Vision del producto

Testificales es una aplicacion para ayudar a abogados a preparar testificales, interrogatorios y contraexamenes mediante un sistema visual basado en nodos.

La idea central del producto no es almacenar preguntas aisladas, sino construir una narrativa probatoria. El sistema debe permitir ordenar hechos, testigos, preguntas, respuestas esperadas, riesgos, documentos y rutas alternativas dentro de un mismo flujo de trabajo.

El valor principal del producto es convertir una preparacion normalmente dispersa en un mapa visible, editable, recuperable y utilizable tanto en fase de preparacion como en audiencia.

## 2. Objetivos del producto

El producto debe permitir:

1. Preparar testificales de forma visual.
2. Construir flujos narrativos y no solo listas de preguntas.
3. Organizar el caso por testigo, tema, hecho y estrategia.
4. Anticipar respuestas, riesgos, contradicciones y repreguntas.
5. Mantener visible la cobertura probatoria del caso.
6. Guardar y recuperar el trabajo sin perdida de contexto.
7. Pasar de la preparacion visual a un guion utilizable en sala.
8. Reducir la friccion de entrada con modo invitado.

## 3. Problema que resuelve

La preparacion de declaraciones e interrogatorios suele dispersarse entre notas, documentos, esquemas lineales y memoria personal. Eso dificulta:

- ver la relacion entre preguntas
- detectar huecos en la narrativa
- separar el trabajo por testigo
- anticipar bifurcaciones de respuesta
- retomar un caso mas adelante sin reconstruirlo mentalmente

Testificales resuelve esto con un canvas de nodos que actua como mapa de estrategia y como fuente de verdad del flujo.

## 4. Principios de producto

- visual antes que lineal
- edicion directa sobre el objeto
- organizacion por contexto
- persistencia continua del trabajo
- foco sin perdida de panorama
- utilidad real para litigacion
- diferencia clara entre preparacion y ejecucion

## 5. Unidad principal: el flujo

El `flujo` es la unidad central del producto. Representa una preparacion concreta de un caso, un testigo, un bloque narrativo o una estrategia de interrogatorio.

Cada flujo contiene:

- el estado completo del canvas
- sus nodos y conexiones
- los testigos del flujo
- los hechos a probar
- los documentos vinculados
- notas de preparacion y, cuando aplique, estado de audiencia

El flujo debe ser autocontenido, de forma que pueda guardarse, recuperarse y seguir trabajandose sin reconstrucciones manuales.

## 6. Interfaz principal

La interfaz principal es un editor visual basado en nodos.

La persona usuaria no trabaja sobre formularios largos ni sobre documentos lineales. Trabaja sobre un lienzo donde cada pieza del caso aparece como un nodo conectable dentro de una estructura mayor.

El canvas es el centro real del producto. El resto de la interfaz existe para apoyarlo.

## 7. Zonas de interfaz

### 7.1 Barra superior

Debe mostrar:

- identidad del producto
- estado de sesion
- entrada o salida del sistema
- diferencia entre modo invitado y modo autenticado

### 7.2 Vista de entrada

Debe permitir:

- entrar como invitado
- iniciar sesion o registrarse

### 7.3 Panel lateral de testigos

Debe permitir:

- listar testigos del flujo
- seleccionar testigo activo
- crear testigos
- editar ficha del testigo
- ver numero de preguntas asociadas
- ver riesgos y hechos cubiertos
- impedir borrado incoherente si sigue habiendo preguntas vinculadas

### 7.4 Barra de acciones del flujo

Debe incluir:

- nuevo flujo
- nueva pregunta o nuevo nodo
- guardar
- eliminar flujo
- selector de flujo

### 7.5 Canvas principal

Debe permitir:

- crear nodos
- mover nodos
- conectar nodos
- editar contenido dentro del nodo
- ver el mapa completo del caso
- atenuar nodos de otros testigos cuando haya foco activo

## 8. Vistas complementarias

Ademas del canvas, el producto deberia ofrecer varias formas de consumir el mismo contenido:

- vista de mapa
- vista de esquema
- vista por testigo
- vista por tema
- vista por hecho
- vista de audiencia
- vista de impresion o exportacion

La vista de audiencia deberia incluir:

- modo lectura rapida
- modo solo siguiente pregunta
- foco en preguntas prioritarias
- posibilidad de ocultar nodos secundarios o tacticos

## 9. Modelo conceptual

Los objetos principales del producto son:

1. Usuario
2. Flujo
3. Nodo
4. Conexion
5. Testigo
6. Hecho a probar
7. Respuesta esperada
8. Documento o evidencia
9. Riesgo u objecion

## 10. Nodos

El nodo es la unidad operativa central del sistema.

Un nodo puede representar:

- una pregunta
- una respuesta esperada
- un hecho
- un tema
- un objetivo probatorio
- un documento
- un riesgo
- una objecion
- un recordatorio estrategico
- un cierre

El sistema no debe limitarse a “nodo igual a pregunta”. Debe permitir distintos tipos de nodo para reflejar mejor el trabajo juridico real.

### 10.1 Operaciones sobre nodos

La persona usuaria debe poder:

1. Crear un nodo.
2. Editarlo.
3. Asociarlo a un testigo.
4. Asociarlo a un hecho.
5. Vincularle documentos o riesgos.
6. Moverlo en el canvas.
7. Conectarlo con otros nodos.
8. Eliminarlo.

### 10.2 Contenido recomendado de un nodo de pregunta

Un nodo de pregunta deberia poder incluir:

- texto de la pregunta
- finalidad
- respuesta esperada
- respuesta peligrosa
- repregunta sugerida
- hecho que pretende acreditar
- nivel de riesgo
- prioridad
- tipo de pregunta
- notas tacticas

### 10.3 Tipos de pregunta recomendados

- abierta
- cerrada
- de fijacion
- de impugnacion
- de cierre

## 11. Conexiones

Las conexiones representan relaciones narrativas o tacticas entre nodos.

No son decorativas. Son parte estructural del flujo.

Tipos de enlace recomendados:

- `sigue`
- `depende_de`
- `si_responde_si`
- `si_responde_no`
- `si_evita`
- `si_contradice`
- `refuerza`
- `contradice`
- `abre_alternativa`
- `conecta_documento`
- `conecta_hecho`
- `conecta_riesgo`

Estas conexiones permiten construir:

- recorridos principales
- rutas secundarias
- bifurcaciones de respuesta
- enlaces entre preguntas y hechos
- enlaces entre preguntas y documentos

## 12. Hechos a probar

El sistema debe permitir trabajar con `hechos a probar` como entidad visible.

Un hecho a probar es una afirmacion concreta que la estrategia quiere acreditar o impugnar.

El producto debe permitir:

- definir hechos
- asociarlos a testigos
- asociarlos a preguntas
- asociarlos a documentos
- medir su nivel de cobertura

Estados de cobertura recomendados:

- no cubierto
- debil
- cubierto
- muy cubierto

## 13. Testigos

El testigo no debe ser solo un contenedor nominal. Debe ser una ficha estrategica.

La ficha del testigo deberia incluir:

- nombre
- rol procesal
- parte que lo propone
- credibilidad estimada
- puntos fuertes
- puntos debiles
- contradicciones conocidas
- hechos que puede acreditar
- hechos no suficientemente cubiertos
- documentos asociados
- riesgos asociados
- mapa de temas

## 14. Documentos y evidencias

El sistema debe permitir vincular documentos o evidencias a hechos, nodos y testigos.

Un documento puede servir para:

- reforzar una pregunta
- sostener un hecho
- impugnar una declaracion
- activar una ruta alternativa
- contextualizar una contradiccion

## 15. Riesgos y objeciones

El sistema debe permitir modelar riesgos tacticos y procesales.

Ejemplos:

- posible objecion
- riesgo de evasiva
- riesgo de perdida de control
- contradiccion esperable
- respuesta peligrosa

Cada riesgo deberia poder vincularse a nodos, testigos o bloques del flujo y contener una medida de mitigacion.

## 16. Modos de uso

### 16.1 Modo preparacion

Debe permitir trabajo amplio, analitico y visual, con visibilidad de estrategia, alternativas, riesgos y documentos.

### 16.2 Modo audiencia

Debe ofrecer una lectura mas limpia y operativa.

Debe permitir:

- marcar preguntas ya formuladas
- registrar respuesta real
- comparar respuesta real con respuesta esperada
- activar rutas alternativas
- ocultar nodos secundarios
- seguir el progreso de la declaracion

## 17. Persistencia del canvas

El canvas debe ser la fuente de verdad del flujo.

Cualquier cambio relevante en el canvas debe actualizar el almacenamiento persistente. No debe depender de que la persona usuaria recuerde guardar manualmente tras cada accion.

Esto incluye:

1. Crear nodos.
2. Editar nodos.
3. Mover nodos.
4. Cambiar tipo de nodo.
5. Cambiar asociaciones con testigos o hechos.
6. Crear conexiones.
7. Eliminar conexiones.
8. Actualizar respuestas esperadas.
9. Actualizar riesgos, documentos o notas.
10. Registrar cambios operativos de audiencia.

## 18. UX esperada

La experiencia debe ser:

- clara
- incremental
- contextual
- orientada a trabajo real
- valida tanto para explorar como para ejecutar

Principios UX clave:

- baja friccion inicial
- claridad del estado actual
- foco sin perder panorama
- edicion cerca del objeto
- persistencia comprensible
- separacion entre preparacion y audiencia

## 19. Validaciones de calidad recomendadas

El sistema deberia detectar y avisar sobre:

- testigos sin preguntas
- hechos sin cobertura suficiente
- nodos aislados
- preguntas sin finalidad
- riesgos sin mitigacion
- documentos no vinculados
- contradicciones entre respuestas esperadas

## 20. User flows principales

### 20.1 Preparacion basica

1. Entrar en la aplicacion.
2. Crear o abrir un flujo.
3. Crear testigos.
4. Crear nodos de preguntas.
5. Conectarlos.
6. Guardar y seguir trabajando.

### 20.2 Construccion narrativa

1. Definir hechos a probar.
2. Vincular testigos.
3. Crear preguntas para acreditar cada hecho.
4. Anadir respuestas esperadas, riesgos y repreguntas.
5. Revisar cobertura probatoria.

### 20.3 Contraexamen

1. Seleccionar testigo.
2. Marcar contradicciones y puntos de control.
3. Construir preguntas cerradas o de impugnacion.
4. Vincular documentos y rutas alternativas.

### 20.4 Audiencia

1. Abrir el flujo preparado.
2. Cambiar a modo audiencia.
3. Seguir preguntas prioritarias.
4. Registrar respuestas reales.
5. Adaptar el recorrido segun lo que ocurra.

## 21. Modelo de datos funcional

### 21.1 Usuario

Campos funcionales:

- `id`
- `email`
- `created_at`
- `updated_at`

### 21.2 Flujo

Campos funcionales:

- `id`
- `user_id`
- `title`
- `drawflow_json`
- `testigos`
- `hechos`
- `documentos`
- `categorias`
- `tags`
- `cronologia`
- `mode`
- `version`
- `audience_notes`
- `hearing_state`
- `created_at`
- `updated_at`

### 21.3 Nodo

Campos funcionales:

- `id`
- `type`
- `texto`
- `witnessId`
- `factId`
- `categoria`
- `tags`
- `purpose`
- `expected_answer`
- `dangerous_answer`
- `follow_up_strategy`
- `question_style`
- `risk_level`
- `priority`
- `asked_in_hearing`
- `actual_answer`
- `audience_status`
- `is_secondary`
- `collapsed`
- `position_x`
- `position_y`
- `connections`
- `document_refs`
- `notes`
- `created_at`
- `updated_at`

### 21.4 Conexion

Campos funcionales:

- `id`
- `source_node_id`
- `target_node_id`
- `source_port`
- `target_port`
- `tipo`
- `label`
- `condition`
- `priority`
- `created_at`
- `updated_at`

### 21.5 Testigo

Campos funcionales:

- `id`
- `nombre`
- `cargo`
- `notas`
- `color`
- `rol_procesal`
- `parte_que_lo_propone`
- `credibilidad_estimada`
- `puntos_fuertes`
- `puntos_debiles`
- `contradicciones_conocidas`
- `hechos_ref`
- `hechos_no_cubiertos_ref`
- `documentos_ref`
- `risk_count`
- `topic_map`
- `created_at`
- `updated_at`

### 21.6 Hecho a probar

Campos funcionales:

- `id`
- `title`
- `description`
- `legal_relevance`
- `status`
- `witness_refs`
- `node_refs`
- `document_refs`
- `priority`
- `created_at`
- `updated_at`

### 21.7 Respuesta esperada

Campos funcionales:

- `id`
- `node_id`
- `text`
- `answer_type`
- `next_node_id`
- `fallback_node_id`
- `risk_note`
- `created_at`
- `updated_at`

### 21.8 Documento o evidencia

Campos funcionales:

- `id`
- `title`
- `description`
- `type`
- `source`
- `date`
- `witness_refs`
- `fact_refs`
- `node_refs`
- `priority`
- `created_at`
- `updated_at`

### 21.9 Riesgo u objecion

Campos funcionales:

- `id`
- `title`
- `description`
- `type`
- `severity`
- `node_ref`
- `witness_ref`
- `mitigation`
- `created_at`
- `updated_at`

## 22. Relaciones entre objetos

- un usuario puede tener varios flujos
- un flujo pertenece a un usuario
- un flujo contiene nodos, conexiones, testigos, hechos y documentos
- un nodo puede vincularse a un testigo, a un hecho, a un documento o a un riesgo
- un hecho puede apoyarse en varios testigos, nodos y documentos
- un testigo puede cubrir varios hechos

## 23. Evolucion recomendada

Capacidades futuras de alto valor:

- cobertura probatoria automatizada
- cronologia conectada con nodos
- exportacion de guion por testigo, tema o hecho
- trabajo colaborativo
- comentarios internos
- historial de versiones estrategicas
- comparacion entre versiones del flujo

## 24. Resumen

Testificales debe ser una herramienta de construccion de narrativa probatoria basada en nodos. Su funcion no es solo guardar preguntas, sino ayudar a abogados a ordenar hechos, testigos, respuestas, riesgos, documentos y recorridos de interrogatorio en un sistema visual persistente, reutilizable y operativo tanto en preparacion como en audiencia.
