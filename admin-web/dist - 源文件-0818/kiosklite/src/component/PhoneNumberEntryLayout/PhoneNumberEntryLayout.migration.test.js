import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SRC_ROOT = path.resolve(__dirname, '..', '..');

const TARGET_FILES = [
  'container/phoneInput/index.js',
  'component/CRM/LoginCRM/components/LoginModal.js',
  'component/GiftCardPayment/QueryGiftCard.js',
  'container/orderPage/bannerPro/components/buyGiftCard.js',
];

const readSource = (relativePath) =>
  fs.readFileSync(path.join(SRC_ROOT, relativePath), 'utf8');

describe('PhoneNumberEntryLayout migrations', () => {
  test.each(TARGET_FILES)(
    '%s uses PhoneNumberEntryLayout for phone number entry',
    (relativePath) => {
      const source = readSource(relativePath);

      expect(source).toContain(
        "import PhoneNumberEntryLayout from '@/component/PhoneNumberEntryLayout';"
      );
      expect(source).toContain('<PhoneNumberEntryLayout');
      expect(source).not.toContain(
        "import PhoneNumberField from '@/component/PhoneNumberField';"
      );
      expect(source).not.toMatch(
        /import\s+Policy\s+from\s+['"]@\/component\/CRM\/LoginCRM\/components\/Policy['"];/
      );
      expect(source).not.toMatch(
        /import\s+Policy\s+from\s+['"]\.\/Policy['"];?/
      );
      expect(source).not.toContain(
        "import jingleBell from '@/assets/images/jingleBell.png';"
      );
    }
  );

  test('QueryGiftCard keeps query method options wrapped after migration', () => {
    const source = readSource('component/GiftCardPayment/QueryGiftCard.js');

    expect(source).toMatch(
      /afterField=\{\s*<div className=\{styles\.queryMethodWrapper\}>\s*\{this\.renderQueryMethodOptions\(\)\}\s*<\/div>\s*\}/
    );
  });
});
