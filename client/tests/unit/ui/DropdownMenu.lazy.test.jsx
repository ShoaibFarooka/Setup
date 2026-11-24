import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ThemeProvider from '@/contexts/ThemeProvider';
import { Button, DropdownMenu, UiProvider } from '@/components/ui';

// Its own file, so Ant Design's dropdown has not been loaded yet when the test clicks: DropdownMenu loads it on
// demand, and a click in that moment must not be lost
test('a click before the menu code has loaded opens the menu once it has', async () => {
    const onPick = vi.fn();
    render(
        <ThemeProvider>
            <UiProvider>
                <DropdownMenu items={[{ key: 'pick', label: 'Pick me', onClick: onPick }]}>
                    <Button>More</Button>
                </DropdownMenu>
            </UiProvider>
        </ThemeProvider>,
    );

    // Right away, while the dropdown code is still loading
    await userEvent.click(screen.getByRole('button', { name: 'More' }));

    await userEvent.click(await screen.findByRole('menuitem', { name: 'Pick me' }));
    expect(onPick).toHaveBeenCalledTimes(1);
});
