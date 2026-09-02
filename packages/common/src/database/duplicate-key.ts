import { ConflictException } from '@nestjs/common';

export function isDuplicateKey(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: number }).code === 11000
  );
}

export function isVersionError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    (error as { name: string }).name === 'VersionError'
  );
}

export function throwDuplicate(error: unknown, message: string): never {
  if (isDuplicateKey(error)) {
    throw new ConflictException(message);
  }
  throw error;
}

export async function mongoWrite<T>(
  work: Promise<T>,
  duplicateMessage: string,
): Promise<T> {
  try {
    return await work;
  } catch (error) {
    throwDuplicate(error, duplicateMessage);
  }
}
