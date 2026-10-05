import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import {
  BoxCubeIcon,
  CalenderIcon,
  ChevronDownIcon,
  GridIcon,
  HorizontaLDots,
  ListIcon,
  PieChartIcon,
  TableIcon,
  UserCircleIcon,
  UserIcon,
  PlusIcon,
  CheckCircleIcon,
  ChatIcon,
} from "../icons";
import { useSidebar } from "../context/SidebarContext";
import { useAuth } from "../context/AuthContext";
import SidebarWidget from "./SidebarWidget";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  badge?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

export const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const { role } = useAuth();
  const location = useLocation();

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback(
    (path?: string) => {
      if (!path) return false;
      return location.pathname === path;
    },
    [location.pathname]
  );

  // Role-specific main navigation items
  const getNavItems = useCallback((): NavItem[] => {
    if (role === "admin") {
      return [
        {
          name: "Dashboard",
          icon: <GridIcon />,
          path: "/admin/dashboard",
        },
        {
          name: "Students",
          icon: <UserIcon />,
          path: "/admin/students",
        },
        {
          name: "Organizers",
          icon: <UserCircleIcon />,
          path: "/admin/organizers",
        },
        {
          name: "Events",
          icon: <CalenderIcon />,
          path: "/admin/events",
        },
        {
          name: "Venues & Locations",
          icon: <BoxCubeIcon />,
          path: "/admin/locations",
        },
        {
          name: "Registrations",
          icon: <TableIcon />,
          path: "/admin/registrations",
        },
        {
          name: "Attendance",
          icon: <CheckCircleIcon />,
          path: "/admin/attendance",
        },
        {
          name: "Analytics",
          icon: <PieChartIcon />,
          path: "/admin/analytics",
        },
        {
          name: "Database Insights",
          icon: <BoxCubeIcon />,
          path: "/admin/database-insights",
          badge: "ADBMS",
        },
      ];
    }

    if (role === "organizer") {
      return [
        {
          name: "Dashboard",
          icon: <GridIcon />,
          path: "/organizer/dashboard",
        },
        {
          name: "My Events",
          icon: <CalenderIcon />,
          path: "/organizer/events",
        },
        {
          name: "Create Event",
          icon: <PlusIcon />,
          path: "/organizer/events/create",
        },
        {
          name: "Participants",
          icon: <UserIcon />,
          path: "/organizer/participants",
        },
        {
          name: "Attendance",
          icon: <CheckCircleIcon />,
          path: "/organizer/attendance",
        },
        {
          name: "Feedback",
          icon: <ChatIcon />,
          path: "/organizer/feedback",
        },
        {
          name: "Analytics",
          icon: <PieChartIcon />,
          path: "/organizer/analytics",
        },
      ];
    }

    // Default to Student
    return [
      {
        name: "Dashboard",
        icon: <GridIcon />,
        path: "/student/dashboard",
      },
      {
        name: "Browse Events",
        icon: <CalenderIcon />,
        path: "/student/events",
      },
      {
        name: "My Registrations",
        icon: <ListIcon />,
        path: "/student/registrations",
      },
      {
        name: "Attendance",
        icon: <CheckCircleIcon />,
        path: "/student/attendance",
      },
      {
        name: "Feedback",
        icon: <ChatIcon />,
        path: "/student/feedback",
      },
    ];
  }, [role]);

  const navItems = useMemo(() => getNavItems(), [getNavItems]);

  const othersItems: NavItem[] = useMemo(
    () => [
      {
        name: "My Profile",
        icon: <UserCircleIcon />,
        path: "/profile",
      },
      {
        name: "Settings",
        icon: <BoxCubeIcon />,
        path: "/settings",
      },
    ],
    []
  );

  useEffect(() => {
    let submenuMatched = false;
    ["main", "others"].forEach((menuType) => {
      const items = menuType === "main" ? navItems : othersItems;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({
                type: menuType as "main" | "others",
                index,
              });
              submenuMatched = true;
            }
          });
        }
      });
    });

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [location, isActive, navItems, othersItems]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  const renderMenuItems = (items: NavItem[], menuType: "main" | "others") => (
    <ul className="flex flex-col gap-2">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group ${
                openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-active"
                  : "menu-item-inactive"
              } cursor-pointer ${
                !isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
              }`}
            >
              <span
                className={`menu-item-icon-size ${
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="menu-item-text">{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                    openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                      ? "rotate-180 text-brand-500"
                      : ""
                  }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                to={nav.path}
                className={`menu-item group ${
                  isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                }`}
              >
                <span
                  className={`menu-item-icon-size ${
                    isActive(nav.path)
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text flex items-center justify-between w-full">
                    {nav.name}
                    {nav.badge && (
                      <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                        {nav.badge}
                      </span>
                    )}
                  </span>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      to={subItem.path}
                      className={`menu-dropdown-item ${
                        isActive(subItem.path)
                          ? "menu-dropdown-item-active"
                          : "menu-dropdown-item-inactive"
                      }`}
                    >
                      {subItem.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Brand Header */}
      <div
        className={`py-6 flex items-center ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link to="/" className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white font-black text-lg shadow-md shadow-brand-500/20">
            C
          </div>
          {(isExpanded || isHovered || isMobileOpen) && (
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white leading-tight">
                CEMS
              </span>
              <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                College Events Platform
              </span>
            </div>
          )}
        </Link>
      </div>

      <div className="flex flex-col flex-1 overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6 flex-1">
          <div className="flex flex-col gap-6">
            <div>
              <h2
                className={`mb-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 flex leading-[20px] ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  `${role.toUpperCase()} PORTAL`
                ) : (
                  <HorizontaLDots className="size-6" />
                )}
              </h2>
              {renderMenuItems(navItems, "main")}
            </div>

            <div>
              <h2
                className={`mb-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 flex leading-[20px] ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "GENERAL"
                ) : (
                  <HorizontaLDots />
                )}
              </h2>
              {renderMenuItems(othersItems, "others")}
            </div>
          </div>
        </nav>

        {(isExpanded || isHovered || isMobileOpen) && <SidebarWidget />}
      </div>
    </aside>
  );
};

export default AppSidebar;
