import { z } from 'zod';
import { either } from 'fp-ts';
import { validate, nullable } from '../utils';

describe('validators/utils', () => {
  describe('validate', () => {
    const schema = z.object({ name: z.string(), age: z.number() });

    it('returns Right with data on success', () => {
      const result = validate(schema.safeParse({ name: 'John', age: 30 }));
      expect(either.isRight(result)).toBe(true);
      if (either.isRight(result)) {
        expect(result.right).toEqual({ name: 'John', age: 30 });
      }
    });

    it('returns Left with ValidationException on failure', () => {
      const result = validate(schema.safeParse({ name: 123 }));
      expect(either.isLeft(result)).toBe(true);
      if (either.isLeft(result)) {
        expect(result.left.message).toContain('name');
        expect(result.left.issues).toBeDefined();
        expect(result.left.issues.length).toBeGreaterThan(0);
      }
    });
  });

  describe('nullable', () => {
    it('makes all fields nullable', () => {
      const schema = z.object({ name: z.string(), age: z.number() });
      const nullableSchema = nullable(schema);

      const result = nullableSchema.safeParse({ name: null, age: null });
      expect(result.success).toBe(true);
    });

    it('still accepts original values', () => {
      const schema = z.object({ a: z.string(), b: z.number() });
      const nullableSchema = nullable(schema);

      const result = nullableSchema.safeParse({ a: 'test', b: 42 });
      expect(result.success).toBe(true);
    });

    it('preserves schema structure', () => {
      const schema = z.object({ x: z.boolean() });
      const nullableSchema = nullable(schema);

      expect(nullableSchema.safeParse({ x: null }).success).toBe(true);
      expect(nullableSchema.safeParse({ x: true }).success).toBe(true);
      expect(nullableSchema.safeParse({ x: 'nope' }).success).toBe(false);
    });
  });
});
