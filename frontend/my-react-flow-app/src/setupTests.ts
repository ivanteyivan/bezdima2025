import { expect as vitestExpect } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';

const extendedExpect = vitestExpect ?? (globalThis as any).expect;
if (extendedExpect) {
  extendedExpect.extend(matchers as any);
}
