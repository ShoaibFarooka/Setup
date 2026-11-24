import { useState } from 'react';
import form from '@/styles/authForm.module.css';
import useLogin from '@/hooks/useLogin';
import useLanguage from '@/hooks/useLanguage';
import { Button, FormField, Input, PasswordInput, TextLink } from '@/components/ui';
import { loginSchema } from '@/validations/authValidations';
import { validateForm } from '@/utils/validationUtils';

// After a successful login GuestRoute sends the user on; a failed login shows the server's message
const Form = () => {
    // identifier: email or username
    const [credentials, setCredentials] = useState({ identifier: '', password: '' });
    const [errors, setErrors] = useState({});
    const login = useLogin();
    const { t } = useLanguage();

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
            <h1 className={form.title}>{t('auth.login.title')}</h1>
            <p className={form.description}>{t('auth.login.description')}</p>
            <div className={form.fields}>
                <FormField label={t('auth.login.identifier')} error={errors.identifier && t(errors.identifier)}>
                    <Input
                        name="identifier"
                        autoFocus
                        autoComplete="username"
                        placeholder={t('auth.login.identifierPlaceholder')}
                        size="lg"
                        value={credentials.identifier}
                        onChange={handleChange}
                    />
                </FormField>
                <FormField label={t('auth.login.password')} error={errors.password && t(errors.password)}>
                    <PasswordInput
                        name="password"
                        autoComplete="current-password"
                        placeholder={t('auth.login.passwordPlaceholder')}
                        size="lg"
                        value={credentials.password}
                        onChange={handleChange}
                    />
                </FormField>
                <TextLink to="/forgot-password" className={form.fieldLink}>{t('auth.login.forgot')}</TextLink>
            </div>
            <Button type="submit" size="lg" fullWidth loading={login.isPending} className={form.submit}>
                {t('auth.login.submit')}
            </Button>
        </form>
    );
};

export default Form;
