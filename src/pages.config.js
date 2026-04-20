/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import Dashboard from './pages/Dashboard';
import WorkOrders from './pages/WorkOrders';
import Technicians from './pages/Technicians';
import Dispatch from './pages/Dispatch';
import Schedule from './pages/Schedule';
import Zones from './pages/Zones';
import Customers from './pages/Customers';
import Sites from './pages/Sites';
import Analytics from './pages/Analytics';
import Notifications from './pages/Notifications';
import MasterData from './pages/MasterData';
import ConfigPriority from './pages/ConfigPriority';
import ConfigServiceTypes from './pages/ConfigServiceTypes';
import ConfigSkills from './pages/ConfigSkills';
import StockManagement from './pages/StockManagement';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "WorkOrders": WorkOrders,
    "Technicians": Technicians,
    "Dispatch": Dispatch,
    "Schedule": Schedule,
    "Zones": Zones,
    "Customers": Customers,
    "Sites": Sites,
    "Analytics": Analytics,
    "Notifications": Notifications,
    "MasterData": MasterData,
    "ConfigPriority": ConfigPriority,
    "ConfigServiceTypes": ConfigServiceTypes,
    "ConfigSkills": ConfigSkills,
    "StockManagement": StockManagement,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};