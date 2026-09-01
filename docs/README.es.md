# AI Companion

【[English](../README.md) | [繁體中文](README.zh-TW.md) | [简体中文](README.zh-CN.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | Español | [Italiano](README.it.md) | [Português (BR)](README.pt-BR.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [हिन्दी](README.hi.md) | [Indonesia](README.id.md)】

Un plugin de Obsidian que convierte un diario en una relación de trabajo con una IA —
práctica y a escala humana, no un coach de bienestar.

Sigues escribiendo tu diario de la misma manera que ya lo haces, y compartes enlaces desde tu teléfono
de la misma manera que ya lo haces. El plugin lee ambos, responde con consejos concretos, resume los
enlaces en un boletín diario, y lentamente construye una imagen de quién eres para que su ayuda sea
más específica con el tiempo.

## Características

**Comentarios del diario** — Lee lo que escribiste y responde con la voz que el tema requiera:
🫂 un confidente para una pelea, 🎒 un maestro para algo sobre tu hijo, 🔧 un ingeniero
para un error. Cada respuesta comienza con el emoji y el nombre de esa voz, de modo que un día que contenga los tres
se lee como tres respuestas en lugar de un solo muro de texto. Qué voz se aplica a qué es una
tabla editable en la configuración, al igual que el emoji, el nombre y la instrucción de cada voz.

**Resumen de noticias** — Comparte una publicación de Threads, X o Facebook a tu vault desde tu teléfono,
y el plugin hace el resto: lista el enlace bajo el encabezado de compartidos, luego lo redacta
en tres partes fijas — fuente, conclusión, por qué importa. Con la investigación habilitada, obtiene cada página
y resume lo que realmente dice, en lugar de adivinar a partir del título. Las personas guardan cosas
para usar en el trabajo, para probar en sus propias creaciones, para alguien en la familia, o simplemente porque
eran buenas — así que la tercera línea dice qué puedes hacer con ello, y nunca lo califica.

**Informes completos** — Cuando un elemento merece más de un par de líneas, la IA lo marca y
le escribe una nota propia en la carpeta de ese día — qué es, cómo hacerlo, a qué prestar
atención — citando el método textualmente para que sea utilizable sin volver a abrir la fuente. La entrada del resumen
tiene un enlace hacia él. Con límite por ejecución, y se puede desactivar.

**Tabla de hechos** — La IA acumula hechos duraderos sobre ti (personas, proyectos, metas,
problemas recurrentes) en una nota ordinaria y editable. Todas las demás características la leen antes
de responder. Los hechos se declaran como son *ahora* y se reescriben a medida que cambian las cosas, de modo que el archivo
permanece legible después de meses en lugar de convertirse en un registro de cambios.

## Cómo funciona un día

1. Durante el día, comparte enlaces desde tu teléfono hacia la carpeta `landing`.
2. Escribe tu diario — solo la sección Diario; el resto se llena por ti.
3. Ejecuta **Generate Digest**. Tus enlaces compartidos aparecen bajo el encabezado de compartidos, los resúmenes
   bajo el encabezado del resumen, y las notas compartidas se mueven al archivo.
4. Ejecuta **Generate Journal Feedback** cuando quieras una respuesta a lo que escribiste.

O establece un horario y deja que los pasos 3 y 4 sucedan por sí solos.

## Diseño de la nota diaria

Tú eres el dueño de la primera y tercera sección; la IA escribe la segunda y la cuarta.

```markdown
## Diario
- lo que hiciste hoy

## Comentarios de la IA
- (La IA escribe aquí, con marca de tiempo)

## Compartido hoy
- (La IA lista tus enlaces compartidos aquí)

## Resumen de la IA
- (La IA escribe aquí, con marca de tiempo)
```

Los encabezados siguen la configuración de idioma de Obsidian, por lo que una interfaz en chino escribe
`## 日誌`, `## AI回饋`, y así sucesivamente. Las notas escritas bajo un idioma siguen funcionando
bajo otro: la coincidencia reconoce los encabezados de cada configuración regional, y una
sección existente conserva el encabezado que ya tenga en lugar de ser reescrita.

Las secciones se encuentran por su encabezado, por lo que su orden en tu archivo no importa. Volver a ejecutar un
comando añade un nuevo bloque con marca de tiempo en lugar de reemplazar lo que había antes, de modo que se acumulan varias
ejecuciones al día. Cualquier cosa fuera de estos cuatro encabezados nunca se toca.

## Estructura de carpetas

```
ai-companion/
  journal/              notas diarias; cada día puede tener una carpeta propia para informes
  news/
    landing/            ← comparte en esta carpeta desde tu teléfono
    archived/           los enlaces compartidos procesados se mueven aquí
  memory/
    facts.md            lo que la IA sabe sobre ti — edítalo libremente
    _log.md             registro de solo adición de cuándo fue actualizado
```

Cada carpeta es configurable en los ajustes. Se crean cuando se carga el plugin, por lo que la
carpeta `landing` existe antes de que vayas a buscarla en una hoja de compartir móvil.

## Instalación

Requiere Obsidian 1.5.0+ en escritorio.

1. Descarga `main.js`, `manifest.json`, y `styles.css` del último lanzamiento.
2. Ponlos en `<vault>/.obsidian/plugins/ai-companion/`.
3. Habilita **AI Companion** en Settings → Community plugins.
4. Configura la ruta de tu AI CLI en Settings → AI Companion.

### Configuración del CLI

El plugin envía tu prompt a un AI CLI local a través de stdin y lee su stdout, por lo que el comando
debe ejecutarse de forma no interactiva. Para Claude Code:

Elige tu CLI en el menú desplegable y sus banderas no interactivas se aplicarán automáticamente. Solo establece
una ruta si el ejecutable no está en tu `PATH`.

| CLI | Estado |
| --- | --- |
| Claude Code | Verificado; prompt enviado en stdin |
| Antigravity (`agy`) | Verificado; prompt pasado como argumento |
| Codex (ChatGPT) | Ofrecido pero no probado — por favor reporta lo que encuentres |

Si un comando informa que no hay salida, es probable que el CLI quisiera una sesión interactiva; revisa las
banderas bajo argumentos extra.

### Construcción desde el código fuente

```bash
npm install
npm run build
```

## Comandos

Todos estos están en la paleta de comandos, y en el menú detrás del icono de la cinta.

| Comando | Lo que hace |
| --- | --- |
| New Journal Note | Crea la nota de hoy a partir de la plantilla y la abre |
| Generate Journal Feedback | Responde a la entrada del día, con la voz que cada parte requiere |
| Generate Digest | Lista tus enlaces compartidos y los redacta cada uno |
| Accumulate Facts | Actualiza la tabla de hechos a partir de la entrada del día |
| Open Fact Table | Abre `facts.md` para leer o corregir |
| Archive Processed Shares | Barre cualquier enlace compartido procesado restante |

Los comandos que escriben en una nota de diario están deshabilitados mientras una nota que no sea de diario está abierta, por lo que
nunca actúan en un archivo que no tenías la intención de cambiar.

## Ajustes

- **IA** — elige tu CLI (Claude Code, Antigravity, Codex) y se rellenan las banderas que necesita;
  o elige Custom. Además, la ruta, argumentos extra, modelo, tiempo de espera.
- **Voces** — la tabla de situación → voz y la instrucción de cada voz. Cada entrada incorporada
  se restablece individualmente; añade tus propias situaciones y voces.
- **Diario** — carpeta, formato de fecha, ruta de plantilla (soporta `{{date}}` y `{{time}}`).
  Una plantilla personalizada debe mantener los cuatro encabezados; así es como la IA encuentra dónde escribir.
- **Noticias** — carpetas `landing` y de archivo, interruptor de investigación, retención de archivo en días
  (0 mantiene todo).
- **Programación** — manual (predeterminado), al abrir, o cada N horas, con interruptores separados para
  si un pase programado ejecuta el resumen, los comentarios, o ambos.
- **Hechos** — carpeta, y un interruptor de habilitación (desactivado por defecto).
- **Apariencia** — un estilo opcional para las propias secciones del plugin (tarjetas, silencioso, revista),
  desactivado por defecto y confinado a las notas de diario. Los estilos se aplican en la vista de Lectura; cada valor
  proviene de las variables CSS de Obsidian, por lo que tu tema sigue prevaleciendo.

### Programación

Las ejecuciones programadas solo suceden mientras Obsidian está abierto — un plugin respaldado por CLI no tiene proceso en
segundo plano, y una ventana perdida se retoma en el siguiente ciclo en lugar de ponerse al día.

El resumen se adapta a una programación, ya que cada ejecución maneja cualquier nuevo enlace compartido que haya llegado. Los
comentarios del diario están desactivados de forma predeterminada en las ejecuciones programadas: cada pase añade un nuevo bloque, por lo que ejecutarlo
seis veces al día llena la sección de consejos casi idénticos.

## Privacidad y seguridad

Lee esto antes de habilitar cualquier cosa.

- **Tu diario es enviado a un proveedor de IA.** El plugin genera un AI CLI local y envía tu
  texto de diario a través de una tubería hacia él. Lo que ese CLI envíe en adelante — y a quién — es regido por esa herramienta,
  no por este plugin. Los diarios contienen detalles de salud y asuntos familiares; decide deliberadamente.
- **La IA escribe directamente en tu vault.** No hay un paso de confirmación. Solo escribe
  las secciones listadas arriba, pero lo hace sin preguntar.
- **La procedencia se mantiene.** `memory/_log.md` es de solo adición y registra de qué día del diario
  proviene cada actualización de hechos, para que puedas separar lo que escribiste de lo que la IA dedujo.
- **La tabla de hechos es tuya para editar.** Si la IA registra algo incorrecto, ábrela y corrígelo;
  la siguiente ejecución lee tu versión corregida. Ten en cuenta que la IA reescribe todo el archivo cada
  vez, por lo que una línea sin respaldo en tu diario puede no sobrevivir.
- **La programación por defecto es manual.** Las ejecuciones desatendidas que escriben en tu vault deberían ser una
  decisión, no un ajuste por defecto.
- **La eliminación del archivo es opcional** y usa la papelera del sistema, por lo que es recuperable.
- **Solo para escritorio.** Iniciar un CLI necesita Node, por lo que esto no puede ejecutarse en móviles. Compartir *hacia*
  tu vault desde un teléfono funciona bien — eso es solo Obsidian Sync.

## Internacionalización

La interfaz se envía en 21 idiomas, siguiendo la propia configuración de idioma de Obsidian: Árabe,
Alemán, Inglés, Español, Persa, Francés, Indonesio, Italiano, Japonés, Coreano, Holandés,
Polaco, Portugués, Portugués (Brasil), Ruso, Tailandés, Turco, Ucraniano, Vietnamita,
Chino (Simplificado) y Chino (Tradicional).

Las traducciones viven en `src/i18n/locales/`. Cada configuración regional está tipada contra el Inglés, por lo que una
clave faltante es un error de compilación en lugar de una reserva silenciosa.

## Licencia

MIT
