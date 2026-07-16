/**
 * Backend olmadığı için tüm feature data-service'leri bu yardımcıyla
 * gerçek bir API çağrısını simüle eder: gecikme + rastgele hata ihtimali.
 */
export function mockDelay<T>(value: T, ms = 350): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

/**
 * Rastgele hata olasılığı. Demo videosunun akıcı olması için 0'dır; hata
 * ekranını göstermek için rastgeleliğe güvenmek yerine `demoHataTetikle()`
 * ile bir sonraki istek bilerek başarısız kılınır.
 */
export const DEMO_ERROR_RATE = 0;

export class MockApiError extends Error {}

/**
 * Bir sonraki mock isteğinin (yalnızca bir kez) bilerek başarısız olmasını sağlar.
 * sessionStorage'da tutulur; böylece SPA gezinmesinde de, tam sayfa yenilemede (F5) de çalışır.
 */
const HATA_BAYRAK_KEY = 'staj2_demo_hata_tetikle';

/** Demo/sunum amaçlı: bir sonraki sayfa yüklemesinde error-state UI'sini tetikler. */
export function demoHataTetikle(): void {
  try {
    sessionStorage.setItem(HATA_BAYRAK_KEY, '1');
  } catch {
    /* sessionStorage erişilemezse sessizce yok say */
  }
}

/** Bayrağı okuyup tek seferlik tüketir. */
function hataBayraginiTuket(): boolean {
  try {
    if (sessionStorage.getItem(HATA_BAYRAK_KEY) === '1') {
      sessionStorage.removeItem(HATA_BAYRAK_KEY);
      return true;
    }
  } catch {
    /* yok say */
  }
  return false;
}

export async function mockRequest<T>(
  factory: () => T,
  options: { ms?: number; errorRate?: number; errorMessage?: string } = {}
): Promise<T> {
  const { ms = 350, errorRate = 0, errorMessage = 'İşlem sırasında beklenmeyen bir hata oluştu.' } = options;
  // Bayrağı beklemeden önce tüket: paralel isteklerde (Promise.all) yalnızca ilki başarısız olur.
  const zorunluHata = hataBayraginiTuket();

  await mockDelay(null, ms);

  if (zorunluHata) {
    throw new MockApiError('Sunucuya ulaşılamadı (demo hata simülasyonu).');
  }
  if (errorRate > 0 && Math.random() < errorRate) {
    throw new MockApiError(errorMessage);
  }
  return factory();
}
