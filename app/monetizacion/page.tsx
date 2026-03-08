'use client'

import { useState } from 'react'
import { DollarSign, ChevronDown, ChevronUp, ExternalLink, CheckCircle } from 'lucide-react'

const MODELS = [
  {
    id: 'afiliados',
    emoji: '🔗',
    title: 'Marketing de Afiliados',
    color: '#f59e0b',
    potencial: 'Pasivo',
    nivel: 'Principiante',
    desc: 'Recomienda productos relevantes a tu audiencia y gana comisiones por cada venta.',
    pasos: [
      'Identifica productos/servicios que usa tu audiencia ideal',
      'Únete a programas de afiliados: Amazon, ShareASale, Impact, Hotmart',
      'Crea artículos de review o comparación honesta',
      'Inserta links de afiliado contextualmente (no forzado)',
      'Divulga siempre que son links de afiliado (es ético y legal)',
    ],
    tips: [
      'Los reviews honestos convierten 5x más que los puramente promocionales',
      'Crea una página de "Recursos que uso" con todos tus afiliados',
      'Foco en productos con ticket alto y buenas comisiones (>20%)',
    ],
    herramientas: ['Amazon Associates', 'Hotmart', 'ShareASale', 'Impact', 'Partnerstack'],
  },
  {
    id: 'productos',
    emoji: '📦',
    title: 'Productos Digitales Propios',
    color: '#7c3aed',
    potencial: 'Alto',
    nivel: 'Intermedio',
    desc: 'Crea y vende ebooks, cursos, plantillas o workshops basados en tu expertise.',
    pasos: [
      'Identifica el problema más común de tu audiencia',
      'Crea un producto mínimo viable (ebook o mini-curso)',
      'Lanza primero a tu lista de email antes de hacer publicidad',
      'Usa Gumroad, Hotmart o Lemon Squeezy para vender',
      'Automatiza con email sequences para ventas pasivas',
    ],
    tips: [
      'Empieza con un producto de $27-$97 para validar el mercado',
      'Los artículos de tu blog son el mejor funnel hacia tus productos',
      'Un buen ebook de 50 páginas puede generar más que un libro publicado',
    ],
    herramientas: ['Gumroad', 'Hotmart', 'Lemon Squeezy', 'Teachable', 'Notion'],
  },
  {
    id: 'newsletter',
    emoji: '📧',
    title: 'Newsletter Monetizado',
    color: '#06b6d4',
    potencial: 'Recurrente',
    nivel: 'Principiante',
    desc: 'Convierte lectores en suscriptores y monetiza con patrocinios o contenido premium.',
    pasos: [
      'Configura tu newsletter en Substack, Beehiiv o ConvertKit',
      'Ofrece un lead magnet irresistible para capturar emails',
      'Publica consistente: 1-2 emails por semana de alto valor',
      'Con 1,000+ suscriptores, empieza a cobrar patrocinios',
      'Crea un tier de pago para contenido exclusivo',
    ],
    tips: [
      '1,000 suscriptores comprometidos valen más que 100,000 followers en redes',
      'El email tiene 40x más ROI que redes sociales para ventas',
      'Beehiiv te permite monetizar desde el día 1 con su marketplace de sponsors',
    ],
    herramientas: ['Beehiiv', 'Substack', 'ConvertKit', 'Mailerlite', 'Ghost'],
  },
  {
    id: 'patrocinios',
    emoji: '🤝',
    title: 'Patrocinios de Marcas',
    color: '#10b981',
    potencial: 'Alto',
    nivel: 'Intermedio',
    desc: 'Cuando tu audiencia crece, las marcas pagan para aparecer en tu contenido.',
    pasos: [
      'Construye un media kit con tus métricas (visitas, lectores, demografía)',
      'Identifica marcas que usan tu audiencia ideal',
      'Pitchea con datos concretos: "Mi audiencia son emprendedores de 25-40 años"',
      'Define tus tarifas: artículo patrocinado, banner, newsletter mention',
      'Usa plataformas como Paved o SponsordBy para conectar con marcas',
    ],
    tips: [
      'Crea una página "Trabaja conmigo" en tu blog con tarifas y métricas',
      'Un artículo patrocinado puede valer $200-$5,000 según tu audiencia',
      'La autenticidad es clave: solo patrocina lo que usarías tú mismo',
    ],
    herramientas: ['Paved', 'SponsordBy', 'Passionfroot', 'Creator.co'],
  },
  {
    id: 'consultoria',
    emoji: '💼',
    title: 'Consultoría y Servicios',
    color: '#f43f5e',
    potencial: 'Muy alto',
    nivel: 'Avanzado',
    desc: 'Usa tu blog como portafolio de expertise para atraer clientes de alto valor.',
    pasos: [
      'Define claramente tu servicio y el resultado que ofreces',
      'Crea una página "Trabaja conmigo" con tu proceso y precios',
      'Escribe artículos de caso de estudio que demuestren resultados reales',
      'Añade CTA sutiles al final de artículos relevantes',
      'Usa Calendly para que clientes puedan agendar una llamada inicial',
    ],
    tips: [
      'Un blog bien posicionado puede generte clientes que pagan $1,000-$10,000/mes',
      'Los artículos más largos y profundos atraen mejores clientes',
      'Muestra tu proceso de trabajo en el blog: genera confianza antes de la venta',
    ],
    herramientas: ['Calendly', 'Stripe', 'Notion', 'Loom', 'Typeform'],
  },
  {
    id: 'membresia',
    emoji: '⭐',
    title: 'Membresía / Contenido Premium',
    color: '#8b5cf6',
    potencial: 'Recurrente',
    nivel: 'Avanzado',
    desc: 'Crea un nivel de pago mensual con acceso a contenido exclusivo, comunidad o herramientas.',
    pasos: [
      'Valida que tu audiencia gratuita pediría "más" de tu contenido',
      'Define el beneficio claro de la membresía vs. contenido gratuito',
      'Lanza con precio early bird para los primeros 50 miembros',
      'Usa Patreon, Substack Paid o Ghost para gestionar suscripciones',
      'Crea ritual de entrega: newsletter semanal premium, Q&A mensual, etc.',
    ],
    tips: [
      'Incluso con 100 miembros a $10/mes = $1,000/mes recurrente',
      'El contenido exclusivo más valorado: acceso a ti directamente (Q&A, Discord)',
      'La clave es entregar más valor del que el miembro espera recibir',
    ],
    herramientas: ['Patreon', 'Ghost', 'Substack', 'Discord', 'Circle'],
  },
]

const NIVEL_COLORS: Record<string, string> = {
  Principiante: '#10b981',
  Intermedio: '#f59e0b',
  Avanzado: '#ef4444',
}

export default function MonetizacionPage() {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [checked, setChecked] = useState<Record<string, boolean[]>>({})

  const toggleCheck = (modelId: string, idx: number) => {
    const current = checked[modelId] || []
    const updated = [...current]
    updated[idx] = !updated[idx]
    setChecked(prev => ({ ...prev, [modelId]: updated }))
  }

  const getProgress = (modelId: string, total: number) => {
    const c = checked[modelId] || []
    return c.filter(Boolean).length
  }

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)' }}>💰 Monetización</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 6 }}>
          6 modelos probados para convertir tu blog en ingresos. Elige los que van con tu etapa.
        </p>
      </div>

      {/* Resumen */}
      <div style={{
        padding: '16px 20px', marginBottom: 24,
        background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
        borderRadius: 10
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#fbbf24', marginBottom: 6 }}>
          🗺️ Tu hoja de ruta de monetización
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {['🔗 Afiliados', '📧 Newsletter', '📦 Producto propio', '🤝 Patrocinios', '💼 Consultoría', '⭐ Membresía'].map((step, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{step}</span>
              {i < 5 && <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>→</span>}
            </div>
          ))}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
          No tienes que hacer todo a la vez. Empieza por 2 modelos y domínalos antes de agregar más.
        </div>
      </div>

      {/* Models */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {MODELS.map(model => {
          const isExpanded = expanded === model.id
          const progress = getProgress(model.id, model.pasos.length)

          return (
            <div key={model.id} className="card" style={{
              border: isExpanded ? `1px solid ${model.color}40` : '1px solid var(--border)',
              transition: 'all 0.2s'
            }}>
              {/* Header */}
              <div
                style={{ padding: '18px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}
                onClick={() => setExpanded(isExpanded ? null : model.id)}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  background: `${model.color}15`, border: `1px solid ${model.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22
                }}>
                  {model.emoji}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{model.title}</span>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: `${model.color}15`, color: model.color, fontWeight: 600 }}>
                      {model.potencial}
                    </span>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: `${NIVEL_COLORS[model.nivel]}15`, color: NIVEL_COLORS[model.nivel], fontWeight: 600 }}>
                      {model.nivel}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{model.desc}</div>
                  {progress > 0 && (
                    <div style={{ marginTop: 6 }}>
                      <div className="progress-bar" style={{ maxWidth: 200 }}>
                        <div className="progress-bar-fill" style={{ width: `${(progress / model.pasos.length) * 100}%`, background: model.color }} />
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>{progress}/{model.pasos.length} pasos completados</div>
                    </div>
                  )}
                </div>
                {isExpanded ? <ChevronUp size={18} color="var(--text-muted)" /> : <ChevronDown size={18} color="var(--text-muted)" />}
              </div>

              {/* Expanded */}
              {isExpanded && (
                <div style={{ padding: '0 20px 20px' }}>
                  <div style={{ height: 1, background: 'var(--border)', marginBottom: 16 }} />

                  {/* Steps */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>
                      📋 Plan de acción paso a paso
                    </div>
                    {model.pasos.map((paso, i) => (
                      <div
                        key={i}
                        onClick={() => toggleCheck(model.id, i)}
                        style={{
                          display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8,
                          cursor: 'pointer', padding: '8px 10px', borderRadius: 8,
                          background: (checked[model.id]?.[i]) ? `${model.color}08` : 'var(--bg-base)',
                          border: `1px solid ${(checked[model.id]?.[i]) ? model.color + '30' : 'var(--border)'}`,
                          transition: 'all 0.2s'
                        }}
                      >
                        <div style={{
                          width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                          border: `2px solid ${(checked[model.id]?.[i]) ? model.color : 'var(--border-light)'}`,
                          background: (checked[model.id]?.[i]) ? model.color : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.2s'
                        }}>
                          {(checked[model.id]?.[i]) && <CheckCircle size={12} color="white" />}
                        </div>
                        <span style={{
                          fontSize: 13, color: (checked[model.id]?.[i]) ? 'var(--text-muted)' : 'var(--text)',
                          lineHeight: 1.5,
                          textDecoration: (checked[model.id]?.[i]) ? 'line-through' : 'none'
                        }}>
                          {paso}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Tips */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#fbbf24', marginBottom: 10 }}>
                      💡 Tips de experto
                    </div>
                    {model.tips.map((tip, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'flex-start' }}>
                        <span style={{ color: model.color, fontSize: 14, flexShrink: 0 }}>→</span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{tip}</span>
                      </div>
                    ))}
                  </div>

                  {/* Tools */}
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
                      🛠 Herramientas recomendadas
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {model.herramientas.map(h => (
                        <span key={h} style={{
                          fontSize: 12, padding: '4px 12px', borderRadius: 20,
                          background: `${model.color}12`, border: `1px solid ${model.color}25`,
                          color: model.color, display: 'flex', alignItems: 'center', gap: 4
                        }}>
                          <ExternalLink size={10} />
                          {h}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Final CTA */}
      <div style={{ marginTop: 24, padding: '20px', background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 12, textAlign: 'center' }}>
        <div style={{ fontSize: 22, marginBottom: 8 }}>🚀</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
          La regla del juego de los blogs exitosos
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 480, margin: '0 auto' }}>
          Primero construye audiencia con contenido de calidad. Luego monetiza. 
          El orden importa. Los blogs que intentan monetizar antes de dar valor, fracasan.
          Los que dan valor primero, monetizan fácil.
        </div>
      </div>
    </div>
  )
}
