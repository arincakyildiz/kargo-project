/**
 * Backend olmadığı için tüm feature data-service'leri bu yardımcıyla
 * gerçek bir API çağrısını simüle eder: gecikme + rastgele hata ihtimali.
 */
export function mockDelay<T>(value: T, ms = 350): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export class MockApiError extends Error {}

export async function mockRequest<T>(
  factory: () => T,
  options: { ms?: number; errorRate?: number; errorMessage?: string } = {}
): Promise<T> {
  const { ms = 350, errorRate = 0, errorMessage = 'İşlem sırasında beklenmeyen bir hata oluştu.' } = options;
  await mockDelay(null, ms);
  if (errorRate > 0 && Math.random() < errorRate) {
    throw new MockApiError(errorMessage);
  }
  return factory();
}
