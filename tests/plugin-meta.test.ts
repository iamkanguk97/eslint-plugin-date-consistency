import { describe, expect, it } from 'vitest';
import plugin from '../src/index';
import pkg from '../package.json';

// plugin.meta.version은 src/index.ts에 하드코딩되어 있다 — tsconfig의
// rootDir: './src' 제약 때문에 src에서 package.json을 직접 import할 수 없다.
// prepublishOnly가 npm test를 실행하므로, package.json 버전만 올리고
// plugin.meta.version을 함께 올리지 않으면 배포가 여기서 실패한다.
describe('plugin meta', () => {
  it('meta.version이 package.json의 version과 일치한다', () => {
    expect(plugin.meta.version).toBe(pkg.version);
  });

  it('meta.name이 package.json의 name과 일치한다', () => {
    expect(plugin.meta.name).toBe(pkg.name);
  });
});
