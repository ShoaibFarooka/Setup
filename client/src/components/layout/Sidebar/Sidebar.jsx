import { cloneElement, useEffect, useId, useRef, useState } from 'react';
import clsx from 'clsx';
import styles from './Sidebar.module.css';
import { Link, useLocation } from 'react-router-dom';
import { FiChevronDown, FiLogOut, FiMenu, FiX } from 'react-icons/fi';
import { menuItems } from '@/constants/menuItems';
import { ROLE_LABELS } from '@/constants/appConstants';
import BrandLogo from '@/components/BrandLogo/BrandLogo';
import ThemeToggle from '@/components/ThemeToggle/ThemeToggle';
import { Avatar, IconButton } from '@/components/ui';
import Loader from '@/components/Loader/Loader';
import useMe from '@/hooks/useMe';
import useLogout from '@/hooks/useLogout';
import { groupOfPath, isMenuGroup } from '@/utils/menuUtils';

// A page of the menu. The current one is marked for screen readers too (aria-current).
const MenuLink = ({ page, active, nested = false, onNavigate }) => (
    <Link
        to={page.path}
        className={clsx(styles.item, nested && styles.nested, active && styles.active)}
        aria-current={active ? 'page' : undefined}
        onClick={onNavigate}
    >
        {page.icon && cloneElement(page.icon, { width: nested ? 22 : 26, height: nested ? 22 : 26, 'aria-hidden': true })}
        <div className={styles.label}>{page.label}</div>
    </Link>
);

// A group of pages (constants/menuItems.jsx): a button that folds its pages in and out
const MenuGroup = ({ group, open, onToggle, currentPath, onNavigate }) => {
    const listId = useId();
    const holdsCurrent = group.items.some((page) => page.path === currentPath);

    return (
        <div className={styles.group}>
            <button
                type="button"
                className={clsx(styles.item, styles.itemButton, holdsCurrent && !open && styles.activeGroup)}
                aria-expanded={open}
                aria-controls={listId}
                onClick={onToggle}
            >
                {group.icon && cloneElement(group.icon, { width: 26, height: 26, 'aria-hidden': true })}
                <div className={styles.label}>{group.label}</div>
                <FiChevronDown size={18} aria-hidden="true" className={clsx(styles.chevron, !open && styles.chevronClosed)} />
            </button>
            <div id={listId} className={styles.groupItems} hidden={!open}>
                {group.items.map((page) => (
                    <MenuLink key={page.path} page={page} nested active={currentPath === page.path} onNavigate={onNavigate} />
                ))}
            </div>
        </div>
    );
};

// The app's navigation. The logo and the footer (user, theme) stay in place; only the menu scrolls, so with many
// pages the footer is always reachable. The current page is scrolled into view, and its group opened.
const Sidebar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const sidebarRef = useRef(null);
    const menuRef = useRef(null);
    const { data: user } = useMe();
    const logout = useLogout();
    const location = useLocation();
    const entries = menuItems[user?.role] || [];
    const groupKey = (group) => group.key ?? group.label;

    // Groups start folded, except the one holding the current page
    const [openGroups, setOpenGroups] = useState(() => {
        const current = groupOfPath(entries, location.pathname);
        return new Set(current ? [groupKey(current)] : []);
    });

    // Moving to a page inside a folded group opens it (adjusting state while rendering: no extra render pass)
    const [shownPath, setShownPath] = useState(location.pathname);
    if (shownPath !== location.pathname) {
        setShownPath(location.pathname);
        const current = groupOfPath(entries, location.pathname);
        if (current && !openGroups.has(groupKey(current))) {
            setOpenGroups(new Set([...openGroups, groupKey(current)]));
        }
    }

    const toggleGroup = (key) => {
        const next = new Set(openGroups);
        if (next.has(key)) {
            next.delete(key);
        } else {
            next.add(key);
        }
        setOpenGroups(next);
    };

    // The current page's link stays visible in a long menu (after a navigation, and when the phone drawer opens)
    useEffect(() => {
        menuRef.current?.querySelector('[aria-current="page"]')?.scrollIntoView?.({ block: 'nearest' });
    }, [location.pathname, isOpen]);

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

    const closeDrawer = () => setIsOpen(false);

    return (
        <div className={styles.wrapper}>
            {logout.isPending && <Loader />}
            {!isOpen &&
                <div className={styles.topBar}>
                    <IconButton label="Open menu" icon={<FiMenu size={20} />} onClick={() => setIsOpen(true)} />
                    <BrandLogo compact />
                </div>
            }
            {isOpen && <div className={styles.backdrop} aria-hidden="true" />}
            <nav ref={sidebarRef} className={clsx(styles.sidebar, isOpen ? styles.open : styles.closed)}>
                <div className={styles.closeBar}>
                    <IconButton label="Close menu" icon={<FiX size={20} />} onClick={closeDrawer} />
                </div>
                <div className={styles.logo}>
                    <BrandLogo />
                </div>
                <div ref={menuRef} className={styles.menu}>
                    {entries.map((entry) => (isMenuGroup(entry) ? (
                        <MenuGroup
                            key={groupKey(entry)}
                            group={entry}
                            open={openGroups.has(groupKey(entry))}
                            onToggle={() => toggleGroup(groupKey(entry))}
                            currentPath={location.pathname}
                            onNavigate={closeDrawer}
                        />
                    ) : (
                        <MenuLink key={entry.path} page={entry} active={location.pathname === entry.path} onNavigate={closeDrawer} />
                    )))}
                    <button type="button" className={clsx(styles.item, styles.itemButton)} onClick={() => logout.mutate()}>
                        <FiLogOut size={24} strokeWidth={1.5} aria-hidden="true" />
                        <div className={styles.label}>Log out</div>
                    </button>
                </div>
                <div className={styles.footer}>
                    {user &&
                        <div className={styles.userCard}>
                            <Avatar name={user.name} size="sm" />
                            <div className={styles.userText}>
                                <div className={styles.userName}>{user.name}</div>
                                <div className={styles.userRole}>{ROLE_LABELS[user.role] || user.role}</div>
                            </div>
                        </div>
                    }
                    <ThemeToggle />
                </div>
            </nav>
        </div>
    );
};

export default Sidebar;
