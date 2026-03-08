#!/usr/bin/env node
/**
 * tunnel-manager.mjs
 *
 * Arranca cloudflared, captura la URL pública y actualiza
 * automáticamente la variable PROXY_TARGET_URL en Vercel.
 * Luego hace redeploy para que tome efecto de inmediato.
 */

import { spawn } from 'child_process'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ── Config ────────────────────────────────────────────────────────
const VERCEL_TOKEN   = JSON.parse(readFileSync(
  `${process.env.HOME}/.local/share/com.vercel.cli/auth.json`, 'utf8'
)).token
const PROJECT_INFO   = JSON.parse(readFileSync(
  join(__dirname, '..', '.vercel', 'project.json'), 'utf8'
))
const PROJECT_ID     = PROJECT_INFO.projectId
const TEAM_ID        = PROJECT_INFO.orgId
const LOCAL_PORT     = 3200
const ENV_VAR_NAME   = 'PROXY_TARGET_URL'

// ── Vercel API ────────────────────────────────────────────────────
async function getEnvVarId() {
  const res = await fetch(
    `https://api.vercel.com/v9/projects/${PROJECT_ID}/env?teamId=${TEAM_ID}`,
    { headers: { Authorization: `Bearer ${VERCEL_TOKEN}` } }
  )
  const data = await res.json()
  const env = (data.envs || []).find(e => e.key === ENV_VAR_NAME && e.target?.includes('production'))
  return env?.id || null
}

async function updateVercelEnv(tunnelUrl) {
  const envId = await getEnvVarId()

  if (envId) {
    // Actualizar existente
    await fetch(
      `https://api.vercel.com/v9/projects/${PROJECT_ID}/env/${envId}?teamId=${TEAM_ID}`,
      {
        method:  'PATCH',
        headers: { Authorization: `Bearer ${VERCEL_TOKEN}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify({ value: tunnelUrl }),
      }
    )
    console.log(`[tunnel-manager] ✅ Env var actualizada: ${ENV_VAR_NAME}=${tunnelUrl}`)
  } else {
    // Crear nueva
    await fetch(
      `https://api.vercel.com/v9/projects/${PROJECT_ID}/env?teamId=${TEAM_ID}`,
      {
        method:  'POST',
        headers: { Authorization: `Bearer ${VERCEL_TOKEN}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          key:    ENV_VAR_NAME,
          value:  tunnelUrl,
          type:   'plain',
          target: ['production', 'preview'],
        }),
      }
    )
    console.log(`[tunnel-manager] ✅ Env var creada: ${ENV_VAR_NAME}=${tunnelUrl}`)
  }
}

async function redeployVercel() {
  // Obtener último deployment y hacer redeploy
  const res = await fetch(
    `https://api.vercel.com/v6/deployments?projectId=${PROJECT_ID}&teamId=${TEAM_ID}&limit=1&target=production`,
    { headers: { Authorization: `Bearer ${VERCEL_TOKEN}` } }
  )
  const data = await res.json()
  const lastDeploy = data.deployments?.[0]

  if (!lastDeploy) {
    console.log('[tunnel-manager] ⚠️  No se encontró deployment anterior')
    return
  }

  const redeploy = await fetch(
    `https://api.vercel.com/v13/deployments?teamId=${TEAM_ID}`,
    {
      method:  'POST',
      headers: { Authorization: `Bearer ${VERCEL_TOKEN}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        name:       'blogos',
        deploymentId: lastDeploy.uid,
        target:     'production',
      }),
    }
  )
  const result = await redeploy.json()
  console.log('[tunnel-manager] 🚀 Redeploy iniciado:', result.url || result.id || JSON.stringify(result).slice(0, 80))
}

// ── Main ──────────────────────────────────────────────────────────
function startTunnel() {
  console.log(`[tunnel-manager] 🔧 Iniciando cloudflared → localhost:${LOCAL_PORT}`)

  const proc = spawn('cloudflared', ['tunnel', '--url', `http://localhost:${LOCAL_PORT}`], {
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  let urlCaptured = false

  const onData = async (data) => {
    const line = data.toString()
    process.stdout.write(line)

    if (!urlCaptured) {
      const match = line.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/)
      if (match) {
        const tunnelUrl = match[0]
        urlCaptured = true
        console.log(`\n[tunnel-manager] 🌐 URL capturada: ${tunnelUrl}`)

        try {
          await updateVercelEnv(tunnelUrl)
          // Esperar 2s para que Vercel procese el cambio de env
          await new Promise(r => setTimeout(r, 2000))
          await redeployVercel()
        } catch (err) {
          console.error('[tunnel-manager] ❌ Error actualizando Vercel:', err.message)
        }
      }
    }
  }

  proc.stdout.on('data', onData)
  proc.stderr.on('data', onData)

  proc.on('close', (code) => {
    console.log(`[tunnel-manager] Túnel cerrado (código ${code}). Reiniciando en 5s...`)
    urlCaptured = false
    setTimeout(startTunnel, 5000)
  })

  proc.on('error', (err) => {
    console.error('[tunnel-manager] Error:', err.message)
    setTimeout(startTunnel, 5000)
  })
}

startTunnel()
