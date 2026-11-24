// The sidebar's entries (constants/menuItems.jsx) are pages { path, label, icon } or groups
// { key, label, icon?, items: [pages] }. These helpers treat both the same way.

export const isMenuGroup = (entry) => Array.isArray(entry?.items);

// Every page of a menu, in order, with groups opened up: [page, group{a, b}, page] → [page, a, b, page]
export const menuPages = (entries = []) => entries.flatMap((entry) => (isMenuGroup(entry) ? entry.items : [entry]));

// The group that holds a path (for opening it when its page is shown), or undefined
export const groupOfPath = (entries = [], path) =>
    entries.find((entry) => isMenuGroup(entry) && entry.items.some((page) => page.path === path));
