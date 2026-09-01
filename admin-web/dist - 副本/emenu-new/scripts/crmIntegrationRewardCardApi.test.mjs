import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const cardSource = readFileSync(
  'src/components/CrmIntegrationRewardCard/index.jsx',
  'utf8'
)
const rightContentSource = readFileSync(
  'src/components/RightContent/index.jsx',
  'utf8'
)
const oldRightContentSource = readFileSync(
  'src/components/OldOrderPage/RightContent.jsx',
  'utf8'
)

assert.ok(
  /const\s*{\s*benefit,\s*onClick,\s*onSelect,\s*selected\s*=\s*false,\s*disabled\s*=\s*false,\s*}\s*=\s*props/.test(
    cardSource
  ),
  'CrmIntegrationRewardCard should receive benefit, callbacks, and visual state separately'
)
assert.equal(
  cardSource.includes('sanitizeBenefitProps'),
  false,
  'CrmIntegrationRewardCard should not sanitize mixed props'
)
assert.equal(
  cardSource.includes('onSelect?.(props)'),
  false,
  'CrmIntegrationRewardCard should not send component props to selection'
)
assert.equal(
  cardSource.includes('onClick?.(props)'),
  false,
  'CrmIntegrationRewardCard should not send component props to dialog'
)

for (const [name, source] of [
  ['RightContent', rightContentSource],
  ['OldOrderPage RightContent', oldRightContentSource],
]) {
  assert.ok(
    source.includes('<CrmIntegrationRewardCard') &&
      source.includes('benefit={d}'),
    `${name} should pass reward data through the benefit prop`
  )
  assert.ok(
    /selected={\s*selectedCrmIntegrationBenefitId\s*===\s*d\.id\s*}/.test(
      source
    ),
    `${name} should pass selected state into CrmIntegrationRewardCard`
  )
  assert.ok(
    /disabled={\s*!!selectedCrmIntegrationBenefitId\s*&&\s*selectedCrmIntegrationBenefitId\s*!==\s*d\.id\s*}/.test(
      source
    ),
    `${name} should pass disabled state into CrmIntegrationRewardCard`
  )
  assert.equal(
    source.includes('<CrmIntegrationRewardCard\n                      {...d}'),
    false,
    `${name} should not spread reward data into CrmIntegrationRewardCard`
  )
  assert.equal(
    source.includes(
      '<CrmIntegrationRewardCard\n                            {...d}'
    ),
    false,
    `${name} should not spread reward data into CrmIntegrationRewardCard`
  )
}

const dialogSource = readFileSync(
  'src/components/CrmIntegrationRewardItemsDialog/index.jsx',
  'utf8'
)

assert.ok(
  dialogSource.includes('onSelect'),
  'CrmIntegrationRewardItemsDialog should expose a confirm selection callback'
)
assert.ok(
  dialogSource.includes("t('crmIntegration.confirm')"),
  'CrmIntegrationRewardItemsDialog should render a confirm button'
)

console.log('crmIntegrationRewardCardApi tests passed')
