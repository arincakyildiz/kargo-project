import { StatusLabelPipe } from './status-label.pipe';

describe('StatusLabelPipe', () => {
  const pipe = new StatusLabelPipe();

  it('durum kodunu Türkçe etikete çevirir', () => {
    expect(pipe.transform('teslim-edildi')).toBe('Teslim Edildi');
    expect(pipe.transform('dagitimda')).toBe('Dağıtımda');
  });
});
