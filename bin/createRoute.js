const fs = require('fs')
const { join } = require('path')

let routeName = process.argv.slice(2)

if (routeName.length === 0) {
  console.log('Please provide a name for the new route. It may not contain spaces.')
  process.exit()
}
if (routeName.length > 1) {
  console.log('Please provide only one name for the new route. It may not contain spaces.')
  process.exit()
}

routeName = routeName[0]
let routeTemplate = fs.readFileSync(`${__dirname}/routeTemplate.js`).toString()
routeTemplate = routeTemplate.replace(/:name/g, routeName)

let cwd = process.cwd()

let folders = fs.readdirSync(cwd).filter(f => {
  if (fs.statSync(join(cwd, f)).isDirectory()) return f
})

if (folders.indexOf('routes') > -1) {
  let newFile = join(cwd, 'routes', `${routeName}.js`)

  if (fs.existsSync(newFile)) {
    console.log(`The route ${routeName} already exists and was not created`)
    process.exit()
  }
  fs.writeFileSync(newFile, routeTemplate)
  console.log(`Created new route /${routeName} as ${newFile} `)
  process.exit()
}

let newFile = join(cwd, `${routeName}.js`)

if (fs.existsSync(newFile)) {
  console.log(`The route ${routeName} already exists and was not created`)
  process.exit()
}
fs.writeFileSync(newFile, routeTemplate)
console.log(`Created new route /${routeName} as ${newFile} `)
process.exit()
