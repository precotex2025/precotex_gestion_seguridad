### Skills que estan Instaladas

---

### 1. Documentos y Ofimática
Skills para procesar, crear, extraer datos y manipular archivos de oficina:
- **`docx`**: Creación, lectura y edición de documentos Word (`.docx`, `.dotx`).
- **`xlsx`**: Manipulación avanzada, fórmulas, limpieza y generación de hojas de cálculo Excel (`.xlsx`, `.csv`).
- **`pptx`**: Creación, lectura y diseño de presentaciones en PowerPoint (`.pptx`).
- **`pdf`**: Extracción de tablas, texto, combinación, firmado, OCR y división de PDFs.
- **`doc-coauthoring`**: Flujos guiados para co-escribir documentación técnica, propuestas y especificaciones.

---

### 2. Frontend y Diseño UI/UX
- **`frontend-design`**: Diseño visual moderno, sistemas de tipografía y paletas de colores.
- **`web-artifacts-builder`**: Creación de artefactos y componentes interactivos (React, Tailwind, etc.).
- **`theme-factory`**: Generación y aplicación de temas visuales y paletas de estilos.
- **`brand-guidelines`**: Directrices de marca y diseño corporativo.
- **`canvas-design`**: Creación y composición de arte visual y pósteres.
- **`algorithmic-art`**: Creación de arte generativo con código (`p5.js`).

---

### 3. Video, Animación y Motion Graphics (HyperFrames / Remotion)
Un conjunto amplio de herramientas multimedia:
- **`hyperframes`** y su suite (`hyperframes-animation`, `hyperframes-audio`, `hyperframes-cli`, `hyperframes-core`, `hyperframes-creative`, `hyperframes-keyframes`, `hyperframes-registry`): Creación y renderizado de videos en código HTML/GSAP.
- **`motion-graphics`**: Gráficos en movimiento, tipografía cinética y animación UI.
- **`product-launch-video`**: Generación de videos promocionales para productos o demos.
- **`pr-to-video`**: Conversión de pull requests o cambios de código a video explicativo.
- **`faceless-explainer`**: Videos explicativos a partir de artículos o notas.
- **`music-to-video`**: Sincronización de video al ritmo de música.
- **`talking-head-recut` / `embedded-captions`**: Edición de subtítulos cinemáticos y overlays para videos hablados.
- **`remotion-to-hyperframes`**: Migración de componentes de video Remotion (React) a HyperFrames.
- **`slideshow`**: Decks interactivos de diapositivas y presentaciones.
- **`slack-gif-creator`**: Creación de animaciones GIF optimizadas.
- **`media-use`**: Búsqueda, gestión y transformación de recursos multimedia (audio, voz TTS, efectos).
- **`figma`**: Integración e importación de diseños desde Figma hacia componentes de animación.

---

### 4. Desarrollo, Testing y Extensiones
- **`webapp-testing`**: Pruebas automáticas e interacción con aplicaciones web locales mediante Playwright.
- **`mcp-builder`**: Creación y desarrollo de servidores MCP (Model Context Protocol) en Python y TypeScript.
- **`claude-api`**: Referencia para integraciones y consumo de APIs de LLM.
- **`skill-creator`**: Herramienta para crear, probar y optimizar nuevos skills.
- **`find-skills`**: Descubrimiento y recomendación de nuevos skills.

---

### 5. Comunicación y Guías
- **`internal-comms`**: Redacción de reportes de estado, comunicados de liderazgo y newsletters internos.
- **`academy-guide`**: Recomendaciones de tutoriales y recursos formativos.
- **`discernment-nudge`**: Validación de razonamiento crítico y verificación de supuestos en respuestas clave.

---

### Estado de los Skills
 Todos los 40 skills están **correctamente indexados** por Antigravity. Funcionan bajo el modelo *Progressive Disclosure*, lo que significa que el sistema conoce sus capacidades y los activa automáticamente en cualquier proyecto en cuanto una de tus solicitudes los requiera.

---

### Entre todas las skills que tienes instaladas, hay varias que destacan por su gran impacto y utilidad en el día a día del desarrollo y la productividad.

---

1. webapp-testing (Pruebas y Verificación Web Automatizada)
Por qué resalta: Le da a la IA la capacidad de abrir un navegador real (mediante Playwright) para interactuar con tus aplicaciones web locales (como tu proyecto Angular corriendo en ng serve).
Qué puede hacer:
Probar flujos de usuario (hacer clic en botones, rellenar formularios, validar login).
Tomar capturas de pantalla de la interfaz para verificar que el diseño quedó bien.
Leer la consola del navegador para detectar errores de JavaScript o respuestas de red fallidas.
Cuándo usarlo: "Prueba en el navegador si el formulario de No Conformidades guarda los datos correctamente".

---

2. La Suite de Documentos (xlsx, docx, pdf, pptx)
Por qué resalta: Te permite crear y manipular archivos reales de oficina sin tener que hacer conversiones manuales.
xlsx: Limpia datos desordenados, genera reportes con fórmulas, tablas dinámicas y gráficos automáticos.
docx: Redacta y formatea manuales técnicos, reportes de incidentes y plantillas con estilos corporativos.
pdf: Extrae tablas o texto de PDFs escaneados, une/divide documentos y completa formularios.
pptx: Crea diapositivas estructuradas y presentaciones ejecutivas listas para exponer.
Cuándo usarlo: "Genera un Excel con el resumen de incidencias del mes" o "Extrae las tablas de este PDF técnico a un archivo Word".

---

3. frontend-design y web-artifacts-builder (Diseño UI/UX y Componentes Modernos)
Por qué resalta: Evita interfaces genéricas y aburridas, aplicando principios de diseño modernos (paletas de colores armónicas, micro-animaciones, modo oscuro/claro y tipografía profesional).
Qué puede hacer:
Diseñar interfaces y dashboards profesionales en Angular, React o HTML/CSS.
Crear maquetas funcionales interactivas para validar antes de implementar en el backend.
Cuándo usarlo: "Diseña una interfaz moderna con filtros avanzados y tarjetas para el módulo de seguridad".

---

4. mcp-builder (Model Context Protocol - Conexión con Sistemas Externos)
Por qué resalta: Permite crear servidores MCP para conectar a Antigravity directamente con tus bases de datos (SQL Server, PostgreSQL), APIs internas, ERP o herramientas corporativas.
Qué puede hacer:
Construir conectores en Python o Node.js/TypeScript para que la IA consulte datos en vivo de tu empresa de forma segura.
Cuándo usarlo: "Crea un servidor MCP en Python para que puedas consultar la tabla de no-conformidades en SQL Server".

---

5. skill-creator (El Creador de Skills)
Por qué resalta: Es un meta-skill. Te permite diseñar, estructurar y optimizar nuevos skills a medida para los procesos específicos de tu empresa o equipo.
Qué puede hacer:
Estandarizar cómo se programan los servicios en tu proyecto Angular.
Crear guías automáticas de despliegue, testing o auditoría de código.
Cuándo usarlo: "Ayúdame a crear un nuevo skill que aplique las reglas de arquitectura de nuestro equipo cada vez que creemos un componente".

---

6. doc-coauthoring e internal-comms (Documentación Técnica y Reportes)
Por qué resalta: Asiste en la redacción estructurada de especificaciones funcionales, diagramas de arquitectura, minutas de reunión y correos de actualización para gerencia/equipo.
Cuándo usarlo: "Escribe la especificación técnica y el diagrama de flujo para la integración de JWT en el sistema".
Resumen de cómo aprovecharlas
No necesitas memorizar nombres de comandos. Con solo pedir una tarea en lenguaje natural (ej: "Prueba la pantalla de login con un navegador", "Crea un reporte en Excel", o "Escribe un documento Word con el plan de migración"), Antigravity identificará automáticamente el skill correspondiente y lo ejecutará.