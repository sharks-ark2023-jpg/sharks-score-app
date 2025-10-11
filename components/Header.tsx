import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { MenuIcon, XIcon, DashboardIcon, ListIcon, PlusCircleIcon, ClockIcon, UsersIcon, CogIcon } from './icons';

const Header: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);

    const navItems = [
        { to: "/dashboard", icon: <DashboardIcon />, text: "ダッシュボード" },
        { to: "/matches", icon: <ListIcon />, text: "試合一覧" },
        { to: "/record", icon: <PlusCircleIcon />, text: "試合記録" },
        { to: "/live", icon: <ClockIcon />, text: "リアルタイム記録" },
        { to: "/players", icon: <UsersIcon />, text: "選手一覧" },
        { to: "/settings", icon: <CogIcon />, text: "設定" },
    ];

    const linkClasses = "flex items-center px-3 py-2 rounded-md text-sm font-medium text-text-secondary hover:bg-accent hover:text-text-primary transition-colors";
    const activeLinkClasses = "bg-highlight text-white";

    return (
        <header className="bg-secondary shadow-lg sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <span className="font-bold text-xl text-highlight">サッカー記録</span>
                    </div>
                    <div className="hidden md:block">
                        <div className="ml-10 flex items-baseline space-x-4">
                            {navItems.map(item => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    className={({ isActive }) => `${linkClasses} ${isActive ? activeLinkClasses : ''}`}
                                >
                                    {item.icon}
                                    <span className="ml-2">{item.text}</span>
                                </NavLink>
                            ))}
                        </div>
                    </div>
                    <div className="-mr-2 flex md:hidden">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-text-secondary hover:text-white hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-secondary focus:ring-white"
                        >
                            <span className="sr-only">メインメニューを開く</span>
                            {isOpen ? <XIcon /> : <MenuIcon />}
                        </button>
                    </div>
                </div>
            </div>
            {isOpen && (
                <div className="md:hidden">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        {navItems.map(item => (
                             <NavLink
                                key={item.to}
                                to={item.to}
                                className={({ isActive }) => `block ${linkClasses} ${isActive ? activeLinkClasses : ''}`}
                                onClick={() => setIsOpen(false)}
                            >
                                {item.icon}
                                <span className="ml-3">{item.text}</span>
                            </NavLink>
                        ))}
                    </div>
                </div>
            )}
        </header>
    );
};

export default Header;