import { groupOfPath, isMenuGroup, menuPages } from '@/utils/menuUtils';

const dashboard = { path: '/dashboard', label: 'Dashboard' };
const orders = { path: '/orders', label: 'Orders' };
const invoices = { path: '/invoices', label: 'Invoices' };
const sales = { key: 'sales', label: 'Sales', items: [orders, invoices] };

describe('menuUtils', () => {
    test('isMenuGroup: an entry with items', () => {
        expect(isMenuGroup(sales)).toBe(true);
        expect(isMenuGroup(dashboard)).toBe(false);
        expect(isMenuGroup(undefined)).toBe(false);
    });

    test('menuPages: every page in order, groups opened up; a flat list stays as it is', () => {
        expect(menuPages([dashboard, sales])).toEqual([dashboard, orders, invoices]);
        expect(menuPages([dashboard, orders])).toEqual([dashboard, orders]);
        expect(menuPages(undefined)).toEqual([]);
    });

    test('groupOfPath: the group that holds a page', () => {
        expect(groupOfPath([dashboard, sales], '/invoices')).toBe(sales);
        expect(groupOfPath([dashboard, sales], '/dashboard')).toBeUndefined();
    });
});
