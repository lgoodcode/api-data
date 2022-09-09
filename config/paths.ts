import { realpathSync } from 'fs'
import { resolve } from 'path'

const appDirectory = realpathSync(process.cwd())
const resolveApp = (relativePath: string) => resolve(appDirectory, relativePath)

const env = {
	dotenv: resolveApp('.env'),
	appPath: resolveApp('.'),
	appBuild: resolveApp('build'),
	appEntry: resolveApp('src/server.ts'),
	appSrc: resolveApp('src'),
}

export default env
