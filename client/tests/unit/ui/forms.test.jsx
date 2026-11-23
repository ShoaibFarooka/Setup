import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Checkbox, FormField, Input, PasswordInput, RadioGroup, Select, Switch, Textarea } from '@/components/ui';

describe('FormField', () => {
    test('its label names the control', () => {
        render(<FormField label="Email"><Input /></FormField>);

        expect(screen.getByRole('textbox', { name: 'Email' })).toBeInTheDocument();
    });

    test('an error marks the control invalid and is announced with it', () => {
        render(<FormField label="Email" error="Email is required!"><Input /></FormField>);
        const input = screen.getByRole('textbox', { name: 'Email' });

        expect(input).toBeInvalid();
        expect(input).toHaveAccessibleDescription('Email is required!');
    });

    test('a hint is announced with the control, together with an error', () => {
        render(<FormField label="Username" hint="At least 3 characters" error="Too short!"><Input /></FormField>);

        expect(screen.getByRole('textbox', { name: 'Username' })).toHaveAccessibleDescription('At least 3 characters Too short!');
    });

    test('required marks the control as required', () => {
        render(<FormField label="Name" required><Input /></FormField>);

        expect(screen.getByRole('textbox', { name: /Name/ })).toBeRequired();
    });

    test('an explicit id is kept', () => {
        render(<FormField label="City" id="city"><Input /></FormField>);

        expect(screen.getByRole('textbox', { name: 'City' })).toHaveAttribute('id', 'city');
    });
});

describe('text controls', () => {
    test('Input passes its props to the <input>', async () => {
        const onChange = vi.fn();
        render(<Input aria-label="Search" placeholder="Search..." onChange={onChange} />);

        await userEvent.type(screen.getByRole('textbox', { name: 'Search' }), 'a');

        expect(onChange).toHaveBeenCalled();
        expect(screen.getByPlaceholderText('Search...')).toBeValid();
    });

    test('Textarea takes several lines and can be invalid', async () => {
        render(<Textarea aria-label="Notes" invalid />);
        const notes = screen.getByRole('textbox', { name: 'Notes' });

        await userEvent.type(notes, 'one{enter}two');

        expect(notes).toHaveValue('one\ntwo');
        expect(notes).toBeInvalid();
    });

    test('Select shows the options and a placeholder, and reports the choice', async () => {
        const onChange = vi.fn();
        render(
            <Select
                aria-label="Country"
                placeholder="Choose a country"
                options={[{ value: 'pk', label: 'Pakistan' }, { value: 'uk', label: 'United Kingdom', disabled: true }]}
                onChange={onChange}
            />,
        );

        await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Country' }), 'pk');

        expect(screen.getByRole('option', { name: 'Choose a country' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'United Kingdom' })).toBeDisabled();
        expect(onChange).toHaveBeenCalled();
    });

    test('Select can be invalid', () => {
        render(<Select aria-label="Size" invalid options={[]} />);

        expect(screen.getByRole('combobox', { name: 'Size' })).toBeInvalid();
    });

    test('PasswordInput hides the password until asked to show it', async () => {
        render(<FormField label="Password"><PasswordInput /></FormField>);
        const password = screen.getByLabelText('Password');
        expect(password).toHaveAttribute('type', 'password');

        await userEvent.click(screen.getByRole('button', { name: 'Show password' }));
        expect(password).toHaveAttribute('type', 'text');

        await userEvent.click(screen.getByRole('button', { name: 'Hide password' }));
        expect(password).toHaveAttribute('type', 'password');
    });
});

describe('choices', () => {
    test('Checkbox is named by its label and toggles', async () => {
        render(<Checkbox label="Remember me" />);
        const checkbox = screen.getByRole('checkbox', { name: 'Remember me' });

        await userEvent.click(checkbox);

        expect(checkbox).toBeChecked();
    });

    test('RadioGroup is a named group with one choice, reported by value', async () => {
        const Example = () => {
            const [plan, setPlan] = useState('free');
            return (
                <RadioGroup
                    label="Plan"
                    name="plan"
                    value={plan}
                    onChange={setPlan}
                    direction="horizontal"
                    options={[{ value: 'free', label: 'Free' }, { value: 'pro', label: 'Pro' }, { value: 'team', label: 'Team', disabled: true }]}
                />
            );
        };
        render(<Example />);

        await userEvent.click(screen.getByRole('radio', { name: 'Pro' }));

        expect(screen.getByRole('group', { name: 'Plan' })).toBeInTheDocument();
        expect(screen.getByRole('radio', { name: 'Pro' })).toBeChecked();
        expect(screen.getByRole('radio', { name: 'Free' })).not.toBeChecked();
        expect(screen.getByRole('radio', { name: 'Team' })).toBeDisabled();
    });

    test('RadioGroup works without a label or onChange', () => {
        render(<RadioGroup name="x" options={[{ value: 'a', label: 'A' }]} />);

        expect(screen.getByRole('radio', { name: 'A' })).not.toBeChecked();
    });

    test('Switch is a named on / off switch that reports the new value', async () => {
        const Example = () => {
            const [on, setOn] = useState(false);
            return <Switch label="Email notifications" checked={on} onChange={setOn} />;
        };
        render(<Example />);
        const toggle = screen.getByRole('switch', { name: 'Email notifications' });

        await userEvent.click(toggle);
        expect(toggle).toBeChecked();

        await userEvent.click(toggle);
        expect(toggle).not.toBeChecked();
    });

    test('a disabled Switch does not change', async () => {
        const onChange = vi.fn();
        render(<Switch label="Locked" disabled onChange={onChange} />);

        await userEvent.click(screen.getByRole('switch', { name: 'Locked' }));

        expect(onChange).not.toHaveBeenCalled();
    });
});
