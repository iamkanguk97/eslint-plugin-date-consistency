import { describe, expect, it } from 'vitest';
import { lint } from '../src/utils/linter';

// no-new-date-with-lib scenarios are covered by the shared fixtures in
// linter.parity.test.ts. This file covers no-deprecated-date-lib, which
// isn't part of that fixture set.
describe('lint — no-deprecated-date-lib', () => {
  it('flags a deprecated library import with its suggested alternative', () => {
    const messages = lint(`import moment from 'moment';`, {});
    expect(messages[0].message).toBe(
      "'moment' is in maintenance mode. Consider migrating to dayjs or date-fns.",
    );
  });

  it('flags a deprecated library imported via require() (parity with the real rule)', () => {
    const messages = lint(`const moment = require('moment');`, {});
    expect(messages[0].message).toBe(
      "'moment' is in maintenance mode. Consider migrating to dayjs or date-fns.",
    );
  });

  it('does not flag a non-deprecated library', () => {
    expect(lint(`import dayjs from 'dayjs';`, {})).toEqual([]);
  });
});
