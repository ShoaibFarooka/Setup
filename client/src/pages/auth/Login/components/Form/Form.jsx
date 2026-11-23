import { useState } from 'react';
import form from '@/styles/authForm.module.css';
import useLogin from '@/hooks/useLogin';
import { Button, FormField, Input, PasswordInput } from '@/components/ui';
import { loginSchema } from '@/validations/authValidations';
import { validateForm } from '@/utils/validationUtils';

// After a successful login GuestRoute sends the user on; a failed login shows the server's message
const Form = () => {
    // identifier: email or username
    const [credentials, setCredentials] = useState({ identifier: '', password: '' });
    const [errors, setErrors] = useState({});
    const login = useLogin();

    const handleChange = (event) => {
        const { name, value } = event.target;
        setCredentials({ ...credentials, [name]: value });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const newErrors = await validateForm(loginSchema, credentials);
        setErrors(newErrors);
        if (Object.keys(newErrors).length === 0) {
            login.mutate(credentials);
        }
    };

    return (
        <form className={form.form} onSubmit={handleSubmit} noValidate>
            <h1 className={form.title}>Log into your Account</h1>
            <p className={form.description}>Enter your credentials to continue</p>
            <div className={form.fields}>
                <FormField label="Email or Username" error={errors.identifier}>
                    <Input
                        name="identifier"
                        autoFocus
                        autoComplete="username"
                        placeholder="name@example.com or username"
                        size="lg"
                        value={credentials.identifier}
                        onChange={handleChange}
                    />
                </FormField>
                <FormField label="Password" error={errors.password}>
                    <PasswordInput
                        name="password"
                        autoComplete="current-password"
                        placeholder="Enter your password"
                        size="lg"
                        value={credentials.password}
                        onChange={handleChange}
                    />
                </FormField>
            </div>
            <Button type="submit" size="lg" fullWidth loading={login.isPending} className={form.submit}>
                Log In
            </Button>
        </form>
    );
};

export default Form;
