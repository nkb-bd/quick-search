import { execFileSync } from "node:child_process"
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join, relative } from "node:path"

const BUILD = "dist/chrome"
const pkg = JSON.parse(readFileSync("package.json", "utf8"))
const zip = `dist/chrome-${pkg.version}.zip`
const manifest = JSON.parse(readFileSync(join(BUILD, "manifest.json"), "utf8"))

function fail(message) {
  console.error(`✖ ${message}`)
  process.exit(1)
}

function filesIn(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory()
      ? filesIn(path)
      : [relative(BUILD, path)]
  })
}

if (manifest.version_name !== pkg.version)
  fail(`manifest ${manifest.version_name} ≠ package.json ${pkg.version}`)

const tag =
  process.env.GITHUB_REF_TYPE === "tag" ? process.env.GITHUB_REF_NAME : null
if (tag && tag !== `v${pkg.version}`)
  fail(`tag ${tag} ≠ package.json v${pkg.version}`)

const built = new Set(filesIn(BUILD).filter((f) => !f.startsWith(".vite/")))
const zipped = execFileSync("unzip", ["-Z1", zip], { encoding: "utf8" })
  .split("\n")
  .filter((f) => f && !f.endsWith("/"))
const extra = zipped.filter((f) => !built.has(f))
const missing = [...built].filter((f) => !zipped.includes(f))
if (extra.length) fail(`zip has files not in the build: ${extra.join(", ")}`)
if (missing.length) fail(`zip is missing built files: ${missing.join(", ")}`)

console.log(
  `✔ ${zip}: v${pkg.version}, ${zipped.length} files match the fresh build`,
)
