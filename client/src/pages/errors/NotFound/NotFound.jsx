import { useNavigate } from 'react-router-dom';
import { FiCompass } from 'react-icons/fi';
import styles from './NotFound.module.css';
import { Button, EmptyState } from '@/components/ui';

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <div className={styles.page}>
            <EmptyState
                icon={<FiCompass />}
                title="Page not found"
                titleAs="h1"
                description="Sorry, the page you visited does not exist."
                actions={<Button onClick={() => navigate('/')}>Back Home</Button>}
            />
        </div>
    );
};

export default NotFound;
