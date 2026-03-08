/**
 * BlogOS — Motor de IA simulada
 * Respuestas inteligentes y contextualizadas sin necesidad de API key
 */

export function mockGenerateIdeas(niche: string, audience: string, prompt?: string): object[] {
  const topic = prompt || niche || 'emprendimiento'

  const templates = [
    {
      titulo: `Los 7 errores que cometen los ${getActor(niche)} al empezar (y cómo evitarlos)`,
      gancho: `El 80% de los que empiezan en ${topic} cometen los mismos errores. La buena noticia: son completamente evitables si los conoces antes de tiempo.`,
      tipo: 'lista', potencial: 'alto',
      keywords: [topic, 'errores comunes', 'guía práctica'],
    },
    {
      titulo: `Por qué la consistencia importa más que el talento en ${topic}`,
      gancho: `¿Conoces a alguien más talentoso que tú pero menos exitoso? Este artículo explica exactamente por qué, con datos que te van a sorprender.`,
      tipo: 'opinion', potencial: 'alto',
      keywords: ['consistencia', 'hábitos', 'éxito'],
    },
    {
      titulo: `Cómo pasé de ${getStartPoint(niche)} a resultados reales en 90 días`,
      gancho: `No te voy a mentir: los primeros meses fueron frustrantes. Pero hay un momento donde todo hace clic. Esto es lo que aprendí en ese proceso.`,
      tipo: 'inspiracional', potencial: 'alto',
      keywords: [topic, 'caso de estudio', 'resultados'],
    },
    {
      titulo: `El método de 3 pasos para ${getResult(niche)} que nadie te dice`,
      gancho: `Hay una fórmula detrás de cada éxito en ${topic}. Después de analizar 100 casos, encontré el patrón que se repite siempre.`,
      tipo: 'educativo', potencial: 'alto',
      keywords: ['método', 'sistema', topic],
    },
    {
      titulo: `Lo que los expertos en ${topic} no te cuentan (y deberían)`,
      gancho: `La industria de ${topic} está llena de consejos genéricos que funcionan para todos... y para nadie. Aquí está la verdad que pocos dicen.`,
      tipo: 'opinion', potencial: 'alto',
      keywords: [topic, 'perspectiva', 'expertos'],
    },
    {
      titulo: `${topic} en 2026: Lo que cambia y cómo prepararte`,
      gancho: `El juego está cambiando rápido. Lo que funcionaba hace 2 años ya no aplica. Esto es lo que necesitas saber para no quedarte atrás.`,
      tipo: 'educativo', potencial: 'medio',
      keywords: [topic, '2026', 'tendencias'],
    },
    {
      titulo: `Mini guía: Cómo empezar en ${topic} con 0 experiencia y $0`,
      gancho: `La mayor barrera de entrada es mental, no económica. Te voy a demostrar que puedes arrancar con lo que ya tienes hoy.`,
      tipo: 'lista', potencial: 'alto',
      keywords: ['principiantes', topic, 'recursos'],
    },
    {
      titulo: `Entrevista imaginaria: ¿Qué me diría mi yo de hace 5 años sobre ${topic}?`,
      gancho: `Si pudiera viajar en el tiempo y hablar con la versión de mí que estaba empezando, esto es exactamente lo que le diría. Y lo que no diría.`,
      tipo: 'inspiracional', potencial: 'medio',
      keywords: ['reflexión', 'aprendizajes', topic],
    },
  ]

  return templates.map((t, i) => ({
    id: `idea-mock-${Date.now()}-${i}`,
    ...t,
    createdAt: new Date().toISOString(),
  }))
}

function getActor(niche: string): string {
  const map: Record<string, string> = {
    'Negocios y Emprendimiento': 'emprendedores',
    'Marketing Digital': 'marketeros',
    'Finanzas Personales': 'inversores novatos',
    'Salud y Bienestar': 'personas que quieren mejorar su salud',
    'Tecnología e IA': 'creadores tech',
    'Desarrollo Personal': 'personas en crecimiento',
  }
  return map[niche] || 'creadores de contenido'
}

function getStartPoint(niche: string): string {
  const map: Record<string, string> = {
    'Negocios y Emprendimiento': '0 clientes',
    'Marketing Digital': '0 seguidores',
    'Finanzas Personales': 'deudas',
    'Salud y Bienestar': '10 kilos de más',
    'Tecnología e IA': 'no saber programar',
    'Desarrollo Personal': 'la parálisis total',
  }
  return map[niche] || '0'
}

function getResult(niche: string): string {
  const map: Record<string, string> = {
    'Negocios y Emprendimiento': 'escalar tu negocio',
    'Marketing Digital': 'generar leads en piloto automático',
    'Finanzas Personales': 'construir libertad financiera',
    'Salud y Bienestar': 'mantener hábitos saludables',
    'Tecnología e IA': 'implementar IA en tu negocio',
    'Desarrollo Personal': 'lograr tus metas',
  }
  return map[niche] || 'lograr tus objetivos'
}

export function mockGenerateSection(sectionId: string, titulo: string, niche: string): string {
  const sections: Record<string, string[]> = {
    gancho: [
      `Hay algo que nadie te dijo cuando empezaste a explorar ${niche}. Y es que la diferencia entre los que triunfan y los que se rinden no está en el talento, ni en los recursos. Está en una sola cosa que hoy vas a descubrir.`,
      `Si llevas tiempo en ${niche} y sientes que algo no está funcionando, este artículo es para ti. Voy a contarte algo que me costó años entender, y que cambió completamente mi perspectiva.`,
      `Seré directo: lo que estás a punto de leer va en contra de lo que "todos dicen" sobre ${niche}. Pero los números no mienten, y los datos que voy a compartirte van a hacer que lo veas de otra forma.`,
    ],
    subtitulos: [
      `## El problema que nadie nombra\n\n## Por qué la mayoría falla en este punto\n\n## El cambio de perspectiva que lo cambia todo\n\n## El sistema paso a paso\n\n## Cómo empezar hoy mismo`,
      `## Lo que dicen los expertos (y lo que no dicen)\n\n## Los 3 pilares fundamentales\n\n## Caso real: de cero a resultados\n\n## Errores que debes evitar\n\n## Tu próximo paso`,
      `## La raíz del problema\n\n## El método que funciona\n\n## Implementación práctica\n\n## Resultados esperados\n\n## Llamado a la acción`,
    ],
    ejemplos: [
      `**Caso real:** Ana llevaba 6 meses intentando avanzar en ${niche} sin resultados concretos. Su error era claro: estaba priorizando la cantidad sobre la calidad. Cuando cambió ese parámetro, sus resultados se triplicaron en 45 días.\n\n**Lo que aprendió:** No es sobre hacer más. Es sobre hacer lo correcto con consistencia. Cada semana, sin excusas.`,
      `Imagina esto: Carlos, emprendedor de 32 años, llevaba 1 año en ${niche} con resultados mediocres. Un día decidió cambiar una sola variable en su estrategia. Nada más. En 30 días, sus resultados se duplicaron.\n\n¿Qué cambió? Pasó de reaccionar al mercado a anticiparse. Esa diferencia lo es todo.`,
      `**El experimento:** Tomé dos enfoques distintos durante 90 días. El primero era el convencional — lo que todos recomiendan. El segundo era contraintuitivo. Los resultados fueron contundentes: el enfoque contraintuitivo ganó por el doble.\n\nTe cuento exactamente qué hice y por qué funcionó.`,
    ],
    reflexion: [
      `Al final, todo en ${niche} se reduce a una pregunta: ¿estás dispuesto a hacer lo que otros no hacen? La consistencia, la paciencia y la claridad de propósito no son opcionales. Son el juego.\n\nLo que te llevas de este artículo no es información nueva. Es un recordatorio de lo que ya sabes pero quizás no estás aplicando. Empieza hoy.`,
      `Después de todo lo que exploramos hoy, hay una verdad que emerge con claridad: el éxito en ${niche} no es una línea recta. Es un proceso de iteración constante, de aprender, ajustar y seguir.\n\nEl mejor momento para empezar fue hace un año. El segundo mejor momento es ahora mismo.`,
      `Si hay algo que me gustaría que te llevaras de este artículo es esto: la complejidad es opcional. Los resultados extraordinarios vienen de ejecutar cosas ordinarias extraordinariamente bien.\n\nAplica uno de los puntos de hoy. Solo uno. Eso es todo lo que necesitas para empezar a ver la diferencia.`,
    ],
    cta: [
      `¿Te identificaste con alguno de estos puntos? Comparte este artículo con alguien que lo necesite. Y si quieres profundizar más, suscríbete a mi newsletter — cada semana envío contenido como este, sin filtros.`,
      `Este es tu momento de actuar. Elige UN punto de este artículo e impleméntalo esta semana. Luego cuéntame en los comentarios cómo te fue. Eso es todo lo que necesitas para empezar.`,
      `Si este artículo te generó valor, hay dos cosas que puedes hacer: compartirlo con alguien que lo necesite, o suscribirte para recibir más contenido así cada semana. Tú decides cuál de las dos vale más para ti.`,
    ],
  }

  const opts = sections[sectionId]
  if (!opts) return ''
  return opts[Math.floor(Math.random() * opts.length)]
}

export function mockSeoAnalysis(article: string, keyword: string) {
  const wordCount = article.split(/\s+/).length
  const hasKeyword = keyword && article.toLowerCase().includes(keyword.toLowerCase())
  const hasNumbers = /\d+/.test(article)
  const hasList = article.includes('-') || article.includes('•') || article.includes('\n')
  const titleLength = article.split('\n')[0]?.length || 0

  let score = 50
  if (hasKeyword) score += 15
  if (wordCount > 500) score += 10
  if (wordCount > 1000) score += 5
  if (hasNumbers) score += 5
  if (hasList) score += 5
  if (titleLength > 30 && titleLength < 70) score += 5
  score = Math.min(score, 96)

  const kw = keyword || 'blog de contenido'

  return {
    score,
    keyword: kw,
    metaDesc: `Descubre cómo ${kw} puede transformar tu estrategia de contenido. Guía completa con ejemplos prácticos, estrategias probadas y resultados reales.`.slice(0, 155),
    titulo_alternativo: [
      `7 formas de usar ${kw} para conseguir resultados reales en 2026`,
      `Guía definitiva de ${kw}: Todo lo que necesitas saber (con ejemplos)`,
      `Cómo ${kw} cambió mi estrategia — y lo que aprendí en el proceso`,
    ],
    fortalezas: [
      wordCount > 300 ? 'Longitud adecuada del artículo' : 'Artículo conciso y directo',
      hasKeyword ? 'Keyword presente en el contenido' : 'Contenido bien estructurado',
      hasList ? 'Uso de listas que mejoran la legibilidad' : 'Texto fluido y natural',
    ],
    mejoras: [
      !hasKeyword ? `Incluir "${kw}" al menos 3 veces en el texto` : 'Diversificar con keywords long-tail relacionadas',
      wordCount < 800 ? 'Expandir el artículo a 800+ palabras para mejor posicionamiento' : 'Añadir sección de FAQs para featured snippets',
      'Incluir meta description personalizada con la keyword principal',
    ],
    densidadKw: hasKeyword ? +(((article.match(new RegExp(keyword, 'gi'))?.length || 0) / (wordCount / 100))).toFixed(1) : 0,
    legibilidad: wordCount > 200 && hasList ? 'Buena' : wordCount > 100 ? 'Regular' : 'Mejorable',
  }
}

export function mockReflexiveQuestion(topic: string, questionIndex: number): string {
  const questions = [
    `¿Quién es exactamente la persona que más necesita leer este artículo sobre "${topic}"? Descríbela con detalles: su edad, su frustración principal, qué ha intentado antes sin éxito.`,
    `¿Cuál es la perspectiva sobre "${topic}" que SOLO tú puedes dar? ¿Qué has vivido, experimentado o descubierto que te da una visión única que otros no tienen?`,
    `¿Qué cree la mayoría de personas sobre "${topic}" que está completamente equivocado? ¿Cuál es la idea convencional que te gustaría desafiar con este artículo?`,
    `Cuéntame una historia real o anécdota personal que ilustre perfectamente el punto central de tu artículo sobre "${topic}". Sé específico con los detalles.`,
    `¿Qué cambia en la vida del lector después de leer tu artículo? ¿Qué piensa diferente, qué hace diferente, qué siente diferente sobre "${topic}"?`,
    `Si este artículo sobre "${topic}" fuera una conversación honesta con un amigo, ¿qué le dirías que normalmente no dices en público? ¿Qué verdad incómoda incluirías?`,
    `¿Por qué "${topic}" importa AHORA, en este momento específico de 2026? ¿Qué está pasando en el mundo que hace urgente este artículo?`,
    `¿Cómo es diferente tu artículo de los 10 primeros resultados de Google sobre "${topic}"? ¿Qué ángulo, qué dato, qué historia hace el tuyo único?`,
    `Si tuvieras que resumir el insight más poderoso de tu artículo sobre "${topic}" en una sola oración, ¿cuál sería? Esa es tu tesis central.`,
    `¿Cuál es el mayor obstáculo que tiene tu lector para implementar lo que propones sobre "${topic}"? ¿Cómo lo aborda tu artículo?`,
  ]

  return questions[questionIndex % questions.length]
}

export function mockTrends(niche: string) {
  const nicho = niche || 'marketing digital'
  return {
    articulos: [
      {
        titulo: `La IA está redefiniendo cómo se crea contenido en ${nicho}`,
        descripcion: 'Nuevas herramientas permiten a creadores producir contenido de calidad en la mitad del tiempo, sin perder autenticidad.',
        fuente: 'Entrepreneur', fecha: 'Hoy',
      },
      {
        titulo: `El boom del contenido de nicho: por qué menos es más en 2026`,
        descripcion: 'Los blogs especializados generan 3x más tráfico orgánico que los portales generalistas. Los números hablan solos.',
        fuente: 'Content Marketing Institute', fecha: 'Hoy',
      },
      {
        titulo: `Cómo los newsletters están superando a las redes sociales en ${nicho}`,
        descripcion: 'Creadores latinoamericanos reportan tasas de apertura del 45-60% frente al 2% de alcance orgánico en Instagram.',
        fuente: 'Forbes Latam', fecha: 'Ayer',
      },
      {
        titulo: `SEO en la era de la búsqueda por IA: lo que cambia para bloggers`,
        descripcion: 'Google SGE está transformando los rankings. Los blogs con E-E-A-T fuerte son los grandes ganadores.',
        fuente: 'Search Engine Journal', fecha: 'Ayer',
      },
      {
        titulo: `Por qué el storytelling supera al contenido informativo en engagement`,
        descripcion: 'Estudio con 10,000 artículos demuestra que las historias generan 7x más tiempo de lectura y 4x más shares.',
        fuente: 'HubSpot Research', fecha: 'Esta semana',
      },
      {
        titulo: `Monetización de blogs en Latinoamérica: el mercado está madurando`,
        descripcion: 'Ingresos promedio de bloggers LATAM crecieron 180% en 2025. El momento de entrar es ahora.',
        fuente: 'Marketing News', fecha: 'Esta semana',
      },
    ],
    ideas_sugeridas: [
      { titulo: `Cómo la IA está cambiando el juego en ${nicho} (y cómo aprovecharlo)`, fuente_noticia: 'IA y contenido' },
      { titulo: `Por qué tu newsletter de ${nicho} puede valer más que tu Instagram`, fuente_noticia: 'Newsletters vs redes' },
      { titulo: `SEO en 2026: La guía para bloggers de ${nicho} que no quieren quedarse atrás`, fuente_noticia: 'SEO con IA' },
      { titulo: `El arte del storytelling en ${nicho}: cómo contar historias que convierten`, fuente_noticia: 'Storytelling research' },
    ],
    total: 6,
    fuente: 'demo',
  }
}

export function mockSerperData(keyword: string) {
  const kw = keyword || 'blog marketing'
  return {
    keyword: kw,
    dificultad: 'Media',
    top_resultados: [
      { titulo: `Guía completa de ${kw} en 2026 — Todo lo que necesitas saber`, url: '#', snippet: `Aprende todo sobre ${kw} con esta guía actualizada. Incluye estrategias, herramientas y casos de éxito reales.`, posicion: 1 },
      { titulo: `${kw}: Los 10 mejores consejos de expertos`, url: '#', snippet: `Recopilamos los mejores consejos de 50 expertos en ${kw}. Resultados probados y aplicables desde hoy.`, posicion: 2 },
      { titulo: `Cómo usar ${kw} para hacer crecer tu negocio`, url: '#', snippet: `Descubre cómo empresas líderes usan ${kw} para escalar. Con ejemplos reales y pasos accionables.`, posicion: 3 },
      { titulo: `${kw} para principiantes: empieza desde cero`, url: '#', snippet: `Si eres nuevo en ${kw}, esta es la guía perfecta. Sin tecnicismos, con resultados desde la primera semana.`, posicion: 4 },
      { titulo: `Los errores más comunes en ${kw} (y cómo evitarlos)`, url: '#', snippet: `Analizamos 500 casos fallidos de ${kw} y encontramos los 7 errores que se repiten siempre.`, posicion: 5 },
    ],
    noticias_recientes: [
      { titulo: `Tendencias de ${kw} para 2026`, url: '#', fuente: 'Industry News', fecha: 'Hace 2 días' },
      { titulo: `Por qué ${kw} será clave en la próxima década`, url: '#', fuente: 'Business Insider', fecha: 'Esta semana' },
    ],
    keywords_relacionadas: [kw.split(' ')[0], 'estrategia', 'herramientas', 'guía', 'resultados', 'ejemplos', 'blog', 'contenido'],
    total_resultados: '~4,200,000',
    fuente: 'demo',
  }
}
