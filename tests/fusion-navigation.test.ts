import { describe, expect, test } from 'bun:test';
import { fusionViewPath, parseFusionView } from '../src/features/fusion/fusion-navigation';

describe('Fusion workspace navigation', () => {
  test('defaults to Workbench for empty or unsupported modes', () => {
    expect(parseFusionView('')).toBe('workbench');
    expect(parseFusionView('?mode=workbench')).toBe('workbench');
    expect(parseFusionView('?mode=invalid&card=024')).toBe('workbench');
  });

  test('resolves Find Recipes deep links', () => {
    expect(parseFusionView('?mode=recipes&card=024')).toBe('recipes');
  });

  test('keeps recipe and handoff parameters intact through mode changes', () => {
    expect(fusionViewPath('recipes', '?hand=0%2C7&from=simulator')).toBe(
      '/fusion/?hand=0%2C7&from=simulator&mode=recipes',
    );
    expect(fusionViewPath('workbench', '?mode=recipes&card=024')).toBe(
      '/fusion/?card=024',
    );
    expect(fusionViewPath('workbench', '')).toBe('/fusion/');
  });
});
