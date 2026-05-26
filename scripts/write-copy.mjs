import fs from 'fs';
import path from 'path';

const content = `export const HOME_COPY = {
  badge: 'Super Agent \u00b7 \u5468\u672b\u51fa\u884c\u667a\u80fd\u4f53',
  title: '\u4e00\u53e5\u8bdd\uff0c\u89c4\u5212\u4f60\u7684',
  titleHighlight: '\u5b8c\u7f8e\u5468\u672b',
  subtitle:
    '\u7f8e\u56e2\u5468\u672b\u7ba1\u5bb6 \u2014 \u57fa\u4e8e AI \u5927\u6a21\u578b\u7684\u672c\u5730\u77ed\u65f6\u6d3b\u52a8\u89c4\u5212\u5e73\u53f0\u3002\u4ece\u81ea\u7136\u8bed\u8a00\u7406\u89e3\u5230\u8def\u7ebf\u89c4\u5212\u3001\u4e00\u952e\u4e0b\u5355\uff0c\u8ba9\u6bcf\u6b21\u966a\u4f34\u66f4\u6e29\u99a8\u7b80\u5355\u3002',
  ctaPrimary: '\u5f00\u59cb\u667a\u80fd\u89c4\u5212',
  ctaDemo: '\u4f53\u9a8c\u4eb2\u5b50 Demo',
  trust: ['\u6beb\u79d2\u7ea7\u672c\u5730\u5339\u914d', '\u753b\u50cf\u5b89\u5168\u8fc7\u6ee4', '\u9ad8\u5fb7 3D \u5730\u56fe'],
  featuresTitle: '\u56db\u5927\u6838\u5fc3\u80fd\u529b',
  featuresSubtitle: '\u4ece\u7406\u89e3\u5230\u6267\u884c\uff0c\u5168\u94fe\u8def\u95ed\u73af',
  scenariosTitle: '\u70ed\u95e8\u51fa\u884c\u573a\u666f',
  scenariosSubtitle: '\u4e00\u952e\u4f53\u9a8c\u4e0d\u540c\u753b\u50cf\u4e0b\u7684\u667a\u80fd\u89c4\u5212',
  stepsTitle: '\u4e09\u6b65\u641e\u5b9a\u5468\u672b',
  recentTitle: '\u6700\u8fd1\u89c4\u5212',
  ctaBannerTitle: '\u51c6\u5907\u597d\u89c4\u5212\u4e0b\u4e00\u4e2a\u5468\u672b\u4e86\u5417\uff1f',
  ctaBannerDesc: '\u8ba9\u5c0f\u7f8e\u5e2e\u4f60\u628a\u60f3\u6cd5\u53d8\u6210\u53ef\u6267\u884c\u7684\u5b8c\u7f8e\u884c\u7a0b',
  ctaBannerBtn: '\u7acb\u5373\u5f00\u59cb\u89c4\u5212',
  viewAll: '\u67e5\u770b\u5168\u90e8',
  tryNow: '\u7acb\u5373\u4f53\u9a8c',
  preview: {
    assistant: '\u7ba1\u5bb6\u5c0f\u7f8e',
    role: '\u60a8\u7684 AI \u5468\u672b\u51fa\u884c\u987e\u95ee',
    emoji: '\uD83D\uDC69\u200D\uD83D\uDCBC',
    online: '\u5728\u7ebf',
    quote: '\u5e265\u5c81\u5a03\u548c\u51cf\u80a5\u8001\u5a46\uff0c\u5468\u516d\u4e0b\u53483\u516c\u91cc\u5185\uff0c\u5e2e\u6211\u5b89\u6392\u5403\u559d\u73a9\u4e50\uff0c\u907f\u5f00\u6392\u961f\u9ad8\u5cf0...',
    venues: [
      { icon: '\uD83C\uDFAA', label: '\u5948\u5c14\u5b9d\u4e50\u56ed', price: '\u00a5198' },
      { icon: '\uD83E\uDD57', label: 'Wagas \u8f7b\u98df', price: '\u00a585' },
      { icon: '\uD83D\uDE87', label: '\u5730\u94c1 14 \u53f7\u7ebf', price: '\u00a56' },
    ],
    totalLabel: '\u9884\u4f30\u5168\u5305',
    total: '\u00a5269',
  },
  steps: [
    { step: '01', title: '\u8bf4\u51fa\u5fc3\u613f', desc: '\u81ea\u7136\u8bed\u8a00\u63cf\u8ff0\u51fa\u884c\u5fc3\u613f\uff0cAI \u81ea\u52a8\u8bc6\u522b\u753b\u50cf\u7ea6\u675f' },
    { step: '02', title: '\u67e5\u770b\u65b9\u6848', desc: '\u9ad8\u5fb7 3D \u5730\u56fe\u8fde\u7ebf + \u65f6\u95f4\u8f74\u884c\u7a0b\uff0c\u968f\u65f6\u8c03\u6574\u987a\u5e8f' },
    { step: '03', title: '\u4e00\u952e\u4e0b\u5355', desc: '\u95e8\u7968\u3001\u8ba2\u5ea7\u3001\u95ea\u8d2d\u3001\u6253\u8f66\u5168\u5305\uff0c\u7ba1\u5bb6\u5e2e\u4f60\u641e\u5b9a' },
  ],
  stats: [
    { value: '3km', label: '\u667a\u80fd\u534a\u5f84\u8fc7\u6ee4' },
    { value: '<1s', label: '\u672c\u5730\u6781\u901f\u5339\u914d' },
    { value: '\u5168\u5305', label: '\u95e8\u7968\u8ba2\u5ea7\u95ea\u9001' },
  ],
} as const;
`;

const fp = path.join(import.meta.dirname, '..', 'src', 'constants', 'copy.ts');
fs.writeFileSync(fp, content, 'utf8');

let hp = fs.readFileSync(path.join(import.meta.dirname, '..', 'src', 'pages', 'HomePage.tsx'), 'utf8');
hp = hp.replace(/\s+\?\?\?\?\s*\n\s+<\/button>/g, '\n                {c.viewAll}\n              </button>');
// Fix scenario tryNow if still wrong
hp = hp.replace(/\{c\.viewAll\} <ArrowRight className="w-4 h-4" \/>\s*\n\s*<\/span>/,
  '{c.tryNow} <ArrowRight className="w-4 h-4" />\n                </span>');
fs.writeFileSync(path.join(import.meta.dirname, '..', 'src', 'pages', 'HomePage.tsx'), hp, 'utf8');
console.log('OK');
