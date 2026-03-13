# BlogOS — Agente Founder 🚀

Tu plataforma de blogging impulsada por IA para crear, optimizar y monetizar tu contenido.

🌐 **Live:** [blogos-mu.vercel.app](https://blogos-mu.vercel.app)

---

## ¿Qué es BlogOS?

BlogOS es una app de productividad para bloggers y creadores de contenido que combina:

- **Editor de artículos** con IA generativa (Claude, Groq, Gemini)
- **Generador de ideas** con clustering inteligente por nicho
- **Optimización SEO** con research de keywords
- **Distribución** a Twitter/X, LinkedIn, newsletters
- **Mi Blog** — biblioteca de artículos + preguntas motivacionales

---

## Stack Tecnológico

- **Framework:** Next.js 16 + React 19
- **Lenguaje:** TypeScript
- **Estilos:** CSS custom (variables)
- **IA:** Anthropic Claude (Haiku + Opus), Groq, Gemini
- **Deploy:** Vercel
- **Imágenes:** Unsplash API
- **Email:** Resend + ConvertKit

---

## Inicio Rápido

```bash
# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env.local

# Agregar tu ANTHROPIC_API_KEY en .env.local

# Correr en desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

---

## Variables de Entorno

```env
ANTHROPIC_API_KEY=       # Claude API (requerida para IA)
GROQ_API_KEY=            # Groq API (opcional, gratis)
GEMINI_API_KEY=          # Gemini API (opcional, gratis)
UNSPLASH_ACCESS_KEY=     # Imágenes de portada
RESEND_API_KEY=          # Envío de newsletters
CONVERTKIT_API_KEY=      # Gestión de suscriptores
TWITTER_BEARER_TOKEN=    # Publicación en Twitter/X
SERPAPI_KEY=             # Research de keywords
```

---

## Estructura del Proyecto

```
app/
├── articulo/         # Editor de artículos con IA
├── ideas/            # Generador de ideas por nicho
├── mi-blog/          # Biblioteca + preguntas motivacionales
├── seo/              # Research de keywords y optimización
├── distribucion/     # Publicación en redes sociales
├── monetizacion/     # Estrategias de monetización
├── configuracion/    # API keys y perfil del blogger
├── api/              # Endpoints de IA y servicios externos
│   ├── chat/         # Streaming con Claude
│   ├── pregunta-ambiciosa/  # Motor de preguntas
│   ├── tendencias/   # Tendencias y keywords
│   └── ...
└── components/       # Componentes compartidos
```

---

## Deploy

### Vercel (Recomendado)

El proyecto hace auto-deploy en cada push a `main` via **GitHub Actions**.

Para el primer deploy manual:

```bash
npm i -g vercel
vercel --prod
```

### Variables de entorno en Vercel

Agrega las variables en **Vercel Dashboard → Settings → Environment Variables**.

---

## CI/CD

GitHub Actions despliega automáticamente:
- **Push a `main`** → Deploy a producción
- **Pull Request** → Deploy de preview con URL comentada en el PR

Secrets requeridos en GitHub:
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

---

## Contribuir

1. Fork el repo
2. Crea un branch: `git checkout -b feature/mi-feature`
3. Haz tus cambios y commit
4. Abre un Pull Request → se desplegará un preview automático

---

## Licencia

MIT
