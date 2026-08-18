import { Context } from '@deepseek-ai/cordis'
import fs from 'node:fs'
import path from 'node:path'
import yaml from 'js-yaml'

interface Patch {
  insert?: ProfileEntry[]
  delete?: string[]
  update?: Array<{ name: string; config?: any; disabled?: boolean }>
}

interface ProfileEntry {
  id?: string
  name: string
  config?: any
  disabled?: boolean
}

function expandProfileEntries(filePath: string): ProfileEntry[] {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Profile file not found: ${filePath}`)
  }
  const content = fs.readFileSync(filePath, 'utf8')
  const rawEntries = yaml.load(content) as ProfileEntry[]
  if (!Array.isArray(rawEntries)) {
    throw new Error(`Invalid profile structure in ${filePath}. Expected a list of entries.`)
  }

  const result: ProfileEntry[] = []

  for (const entry of rawEntries) {
    const isInclude = entry.name === '@mini-dsh/plugin-include' || entry.name === '@deepseek-ai/cordis-plugin-include'
    if (isInclude && entry.config?.path) {
      const targetPath = path.resolve(path.dirname(filePath), entry.config.path)
      console.log(`\x1b[35m[Include & Patch]\x1b[0m 📦 Including base profile: "${entry.config.path}"`)
      let baseEntries = expandProfileEntries(targetPath)

      // Apply patches if any
      const patches: Patch[] = entry.config.patches || []
      for (const patch of patches) {
        if (patch.insert) {
          console.log(`\x1b[35m[Include & Patch]\x1b[0m ➕ [Insert Patch] Injected ${patch.insert.length} plugin(s): ${patch.insert.map(e => e.name).join(', ')}`)
          baseEntries.push(...patch.insert)
        }
        if (patch.delete) {
          console.log(`\x1b[35m[Include & Patch]\x1b[0m ➖ [Delete Patch] Removed plugin(s): ${patch.delete.join(', ')}`)
          baseEntries = baseEntries.filter(e => !patch.delete!.includes(e.name) && (!e.id || !patch.delete!.includes(e.id)))
        }
        if (patch.update) {
          for (const upd of patch.update) {
            console.log(`\x1b[35m[Include & Patch]\x1b[0m 🔄 [Update Patch] Updated config for: ${upd.name}`)
            baseEntries = baseEntries.map(e => {
              if (e.name === upd.name || (e.id && e.id === upd.name)) {
                return { ...e, ...upd }
              }
              return e
            })
          }
        }
      }
      result.push(...baseEntries)
    } else {
      result.push(entry)
    }
  }

  return result
}

function parseArgs() {
  const args = process.argv.slice(2)
  let profile = 'web'
  let task = ''
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--profile' && args[i + 1]) {
      profile = args[i + 1]
      i++
    } else if (args[i] === '--task' && args[i + 1]) {
      task = args[i + 1]
      i++
    } else if (!args[i].startsWith('-') && !task) {
      task = args[i]
    }
  }
  return { profile, task }
}

async function resolvePlugin(name: string) {
  try {
    return await import(name)
  } catch (err: any) {
    throw new Error(`Failed to resolve plugin "${name}": ${err.message}`)
  }
}

async function main() {
  const { profile, task } = parseArgs()
  const profilePath = path.resolve(process.cwd(), `profiles/${profile}.yml`)

  console.log('='.repeat(60))
  console.log(`\x1b[1m\x1b[36m🚀 Mini-DSH Starting with Profile: "${profile}"\x1b[0m`)
  if (task) {
    console.log(`\x1b[1m\x1b[32m🎯 Custom Task:\x1b[0m "${task}"`)
  }
  console.log(`📂 Profile Config: ${profilePath}`)
  console.log('='.repeat(60))

  if (!fs.existsSync(profilePath)) {
    console.error(`\x1b[31m[Error] Profile file not found: ${profilePath}\x1b[0m`)
    process.exit(1)
  }

  const entries = expandProfileEntries(profilePath)

  // 1. Initialize root Cordis Context
  const ctx = new Context()

  // 2. Load plugins declared in profile
  for (const entry of entries) {
    if (entry.disabled) {
      console.log(`[Cordis Loader] Skipping disabled plugin: ${entry.name}`)
      continue
    }

    let config = entry.config
    if (task && entry.name === '@mini-dsh/plugin-task-runner') {
      config = { ...config, taskName: task }
    }

    console.log(`\x1b[33m[Cordis Loader]\x1b[0m Applying plugin: ${entry.name}`)
    try {
      const pluginMod = await resolvePlugin(entry.name)
      await ctx.plugin(pluginMod, config)
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
