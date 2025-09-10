import { ExocortexSettings, DEFAULT_SETTINGS } from '../../../src/domain/entities/ExocortexSettings';

describe('ExocortexSettings snapshots', () => {
  test('defaults snapshot', () => {
    const settings = new ExocortexSettings();
    expect(settings.getData()).toMatchSnapshot();
  });

  test('update merges overrides and remains valid', () => {
    const settings = new ExocortexSettings();
    const result = settings.update({ enableDebugMode: true, queryCacheMaxSize: 123 });
    expect(result.isSuccess).toBe(true);
    expect(settings.getData()).toMatchSnapshot('after-update');
  });

  test('DEFAULT_SETTINGS stable snapshot', () => {
    expect(DEFAULT_SETTINGS).toMatchSnapshot('DEFAULT_SETTINGS');
  });
});
