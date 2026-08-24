import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const source = await readFile(
  new URL('../src/components/DishItemCard/SmallContent.jsx', import.meta.url),
  'utf8'
)

assert.match(
  source,
  /\{\(showCombinationIcon\s*\|\|\s*displayTextLabels\.length\s*>\s*0\)\s*&&\s*\(\s*<div className=\{styles\.textTagsWrapper\}>/,
  'SmallContent should omit the entire tag row when it has no icon or text labels'
)

assert.match(
  source,
  /<TextTags allTextLabel=\{displayTextLabels\}\s*\/>/,
  'SmallContent should keep rendering real text labels when they exist'
)

console.log('smallContentOptionalTags: ok')
