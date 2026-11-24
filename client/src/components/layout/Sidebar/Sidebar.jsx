import { cloneElement, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import styles from './Sidebar.module.css';
import { Link, useLocation } from 'react-router-dom';
import { FiLogOut, FiMenu, FiX } from 'react-icons/fi';
import { menuItems } from '@/constants/menuItems';
import BrandLogo from '@/components/BrandLogo/BrandLogo';
import ThemeToggle from '@/components/ThemeToggle/ThemeToggle';
import LanguageSwitch from '@/components/LanguageSwitch/LanguageSwitch';
import { Avatar, IconButton } from '@/components/ui';
import Loader from '@/components/Loader/Loader';
import useMe from '@/hooks/useMe';
import useLogout from '@/hooks/useLogout';
import useLanguage from '@/hooks/useLanguage';

const Sidebar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const sidebarRef = useRef(null);
    const { data: user } = useMe();
    const logout = useLogout();
    const { t } = useLanguage();
    const location = useLocation();
    const items = menuItems[user?.role] || [];

    // On small screens the sidebar slides in; a click outside closes it
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div className={styles.wrapper}>
            {logout.isPending && <Loader />}
            {!isOpen &&
                <div className={styles.topBar}>
                    <IconButton label={t('nav.openMenu')} icon={<FiMenu size={20} />} onClick={() => setIsOpen(true)} />
                    <BrandLogo compact />
                </div>
            }
            {isOpen && <div className={styles.backdrop} aria-hidden="true" />}
            <nav ref={sidebarRef} className={clsx(styles.sidebar, isOpen ? styles.open : styles.closed)}>
                <div className={styles.closeBar}>
                    <IconButton label={t('nav.closeMenu')} icon={<FiX size={20} />} onClick={() => setIsOpen(false)} />
                </div>
                <div className={styles.logo}>
                    <BrandLogo />
                </div>
                <div className={styles.menu}>
                    {items.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={clsx(styles.item, location.pathname === item.path && styles.active)}
                            onClick={() => setIsOpen(false)}
                        >
                            {cloneElement(item.icon, { width: 26, height: 26 })}
                            <div className={styles.label}>{t(item.labelKey)}</div>
                        </Link>
                    ))}
                    <button type="button" className={clsx(styles.item, styles.itemButton)} onClick={() => logout.mutate()}>
                        <FiLogOut size={24} strokeWidth={1.5} aria-hidden="true" className={styles.directionalIcon} />
                        <div className={styles.label}>{t('nav.logout')}</div>
                    </button>
                </div>
                <div className={styles.footer}>
                    <div className={styles.footerActions}>
                        <LanguageSwitch />
                        <ThemeToggle />
                    </div>
                    {user &&
                        <div className={styles.userCard}>
                            <Avatar name={user.name} size="sm" />
                            <div className={styles.userText}>
                                <div className={styles.userName}>{user.name}</div>
                                <div className={styles.userRole}>{t(`roles.${user.role}`)}</div>
                            </div>
                        </div>
                    }
                </div>
            </nav>
        </div>
    );
};

export default Sidebar;
