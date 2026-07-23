import { TestBed } from '@angular/core/testing';
import { TransactionSummary } from '../../core/models/transaction.model';
import { TransactionsService } from '../transactions/transactions.service';
import { Dashboard } from './dashboard';

const summary: TransactionSummary = {
  einnahmen: 2770,
  einnahmenCount: 2,
  ausgaben: 1363.59,
  ausgabenCount: 9,
  ausgabenFix: 951.89,
  ausgabenVariabel: 411.7,
  saldo: 1406.41,
  stand: '2026-07-22',
  letzteTransaktionen: [],
};

describe('Dashboard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: TransactionsService, useValue: { getSummary: () => Promise.resolve(summary) } }],
    });
  });

  it('computes the Fix/Variabel bar split as percentages of total Ausgaben', async () => {
    const fixture = TestBed.createComponent(Dashboard);
    fixture.detectChanges();
    await fixture.whenStable();

    const component = fixture.componentInstance as unknown as {
      fixPercent: () => number;
      variabelPercent: () => number;
    };

    expect(component.fixPercent()).toBeCloseTo((951.89 / 1363.59) * 100, 5);
    expect(component.variabelPercent()).toBeCloseTo((411.7 / 1363.59) * 100, 5);
  });

  it('formats the period label as German month + year for Month mode', async () => {
    const fixture = TestBed.createComponent(Dashboard);
    fixture.detectChanges();
    await fixture.whenStable();

    const component = fixture.componentInstance as unknown as {
      referenceDate: { set: (d: Date) => void };
      periodLabel: () => string;
    };
    component.referenceDate.set(new Date(2026, 6, 22));

    expect(component.periodLabel()).toBe('Juli 2026');
  });
});
