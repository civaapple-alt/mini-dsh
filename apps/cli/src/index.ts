import { Context } from '@deepseek-ai/cordis'
import fs from 'node:fs'
import path from 'node:path'
import yaml from 'js-yaml'

interface ProfileEntry {
  name: string
  config?: any
  disabled?: boolean
}

function parseArgs() {
  const args = process.argv.slice(2)
  let profile = 'web'
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--profile' && args[i + 1]) {
      profile = args[i + 1]
      i++
    }
  }
  return { profile }
}

async function resolvePlugin(name: string) {
  try {
    return await import(name)
  } catch (err: any) {
    throw new Error(`Failed to resolve plugin "${name}": ${err.message}`)
  }
}

async function main() {
  const { profile } = parseArgs()
  const profilePath = path.resolve(process.cwd(), `profiles/${profile}.yml`)

  console.log('='.repeat(60))
  console.log(`\x1b[1m\x1b[36m🚀 Mini-DSH Starting with Profile: "${profile}"\x1b[0m`)
  console.log(`📂 Profile Config: ${profilePath}`)
  console.log('='.repeat(60))

  if (!fs.existsSync(profilePath)) {
    console.error(`\x1b[31m[Error] Profile file not found: ${profilePath}\x1b[0m`)
    process.exit(1)
  }

  const profileContent = fs.readFileSync(profilePath, 'utf8')
  const entries = yaml.load(profileContent) as ProfileEntry[]

  if (!Array.isArray(entries)) {
    console.error(`\x1b[31m[Error] Invalid profile structure in ${profilePath}. Expected a list of entries.\x1b[0m`)
    process.exit(1)
  }

  // 1. Initialize root Cordis Context
  const ctx = new Context()

  // 2. Load plugins declared in profile
  for (const entry of entries) {
    if (entry.disabled) {
      console.log(`[Cordis Loader] Skipping disabled plugin: ${entry.name}`)
      continue
    }

    console.log(`\x1b[33m[Cordis Loader]\x1b[0m Applying plugin: ${entry.name}`)
    try {
      const pluginMod = await resolvePlugin(entry.name)
      await ctx.plugin(pluginMod, entry.config)
    } catch (err: any) {
      console.error(`\x1b[31m[Cordis Loader] Error applying ${entry.name}:\x1b[0m`, err)
    }
  }

  console.log('='.repeat(60))
  console.log('\x1b[32m✨ All Cordis plugins initialized successfully!\x1b[0m')
  console.log('='.repeat(60))

  // Graceful shutdown
  const handleShutdown = async (signal: string) => {
    console.log(`\n[Mini-DSH] Received ${signal}. Disposing Cordis context...`)
    await ctx.fiber.dispose()
    console.log('[Mini-DSH] Graceful shutdown complete.')
    process.exit(0)
  }

  process.on('SIGINT', () => handleShutdown('SIGINT'))
  process.on('SIGTERM', () => handleShutdown('SIGTERM'))
}

main().catch((err) => {
  console.error('\x1b[31m[Fatal Error]\x1b[0m', err)
  process.exit(1)
})
