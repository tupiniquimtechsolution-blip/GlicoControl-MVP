import fs from 'node:fs'

const app = JSON.parse(fs.readFileSync('app.json', 'utf8'))
const flow = fs.readFileSync('e2e/canonical-flow.yaml', 'utf8')

const androidPackage = app?.expo?.android?.package
const match = flow.match(/^appId:\s*([^\s#]+)\s*$/m)
const maestroAppId = match?.[1]

if (!androidPackage) {
  console.error('APP-ID AUDIT: FAIL — expo.android.package ausente em app.json')
  process.exit(1)
}

if (!maestroAppId) {
  console.error('APP-ID AUDIT: FAIL — appId ausente em e2e/canonical-flow.yaml')
  process.exit(1)
}

if (androidPackage !== maestroAppId) {
  console.error(`APP-ID AUDIT: FAIL — Android=${androidPackage} Maestro=${maestroAppId}`)
  process.exit(1)
}

console.log(`APP-ID AUDIT: PASS (${androidPackage})`)
