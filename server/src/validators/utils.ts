import { either } from 'fp-ts';
import { z } from 'zod';
import { ValidationException } from '../exceptions/ValidationException';

export const validate = <I, O>(result: z.SafeParseReturnType<I, O>) => {
  if (!result.success) {
    const message = result.error.issues
      .map((i) => `Path: ${i.path.join('.')} Code: ${i.code} Message: ${i.message}`)
      .join('\n');
    return either.left(new ValidationException(message, result.error.issues));
  }
  return either.right(result.data);
};

export function nullable<TSchema extends z.AnyZodObject>(schema: TSchema) {
  const entries = Object.entries(schema.shape) as [keyof TSchema['shape'], z.ZodTypeAny][];

  const newProps = entries.reduce(
    (acc, [key, value]) => {
      acc[key] = value.nullable();
      return acc;
    },
    {} as {
      [key in keyof TSchema['shape']]: z.ZodNullable<TSchema['shape'][key]>;
    }
  );

  return z.object(newProps);
}
