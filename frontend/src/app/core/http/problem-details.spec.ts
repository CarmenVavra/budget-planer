import { HttpErrorResponse } from '@angular/common/http';
import { extractErrorMessage } from './problem-details';

describe('extractErrorMessage', () => {
  it('returns the fallback for non-HTTP errors', () => {
    expect(extractErrorMessage(new Error('boom'), 'Fallback')).toBe('Fallback');
  });

  it('prefers the first field validation error', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: { title: 'Ungültige Eingabe', detail: 'x', errors: { Amount: ['Der Betrag muss größer als 0 sein.'] } },
    });

    expect(extractErrorMessage(error, 'Fallback')).toBe('Der Betrag muss größer als 0 sein.');
  });

  it('falls back to detail when there are no field errors', () => {
    const error = new HttpErrorResponse({ status: 409, error: { title: 'Konflikt', detail: 'Bereits vorhanden.' } });

    expect(extractErrorMessage(error, 'Fallback')).toBe('Bereits vorhanden.');
  });

  it('falls back to the provided fallback when the response body is empty', () => {
    const error = new HttpErrorResponse({ status: 500 });

    expect(extractErrorMessage(error, 'Fallback')).toBe('Fallback');
  });
});
