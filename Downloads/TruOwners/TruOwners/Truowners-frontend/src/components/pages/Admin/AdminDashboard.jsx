// AdminDashboard.jsx
import React, { useState } from 'react';
import {
  Box, Typography, AppBar, Toolbar, IconButton, Menu, MenuItem,
  Tabs, Tab, Drawer, BottomNavigation, BottomNavigationAction, Paper,
  Divider, useTheme
} from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Home as HomeIcon,
  BookOnline as BookingsIcon,
  CardMembership as SubscriptionIcon,
  Logout as LogoutIcon,
  MoreVert as MoreVertIcon,
  Menu as MenuIcon
} from '@mui/icons-material';

import { useAdminAuth } from '../../../context/AdminAuthContext';
import AnalyticsOverview from './AnalyticsOverview';
import UsersTab from './UsersTab';
import PropertiesTab from './PropertiesTab';
import BookingsTab from './BookingsTab';
import SubscriptionTab from './SubscriptionTab';

const navItems = [
  { label: 'Dashboard', icon: <DashboardIcon /> },
  { label: 'Users', icon: <PeopleIcon /> },
  { label: 'Properties', icon: <HomeIcon /> },
  { label: 'Bookings', icon: <BookingsIcon /> },
  { label: 'Subscription', icon: <SubscriptionIcon /> }
];

export default function AdminDashboard() {
  const { logout } = useAdminAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTabletUp = !isMobile;

  const [tab, setTab] = useState(0);
  const [menuEl, setMenuEl] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <Box display="flex" flexDirection="column" height="100vh" width="100%">
      {/* AppBar */}
      <AppBar position="fixed" sx={{ bgcolor: '#1976d2' }}>
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
          {isMobile && (
            <IconButton edge="start" color="inherit" onClick={() => setDrawerOpen(true)}>
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Admin Dashboard
          </Typography>
          <IconButton color="inherit" onClick={e => setMenuEl(e.currentTarget)}>
            <MoreVertIcon />
          </IconButton>
          <Menu
            anchorEl={menuEl}
            open={Boolean(menuEl)}
            onClose={() => setMenuEl(null)}
          >
            <MenuItem onClick={handleLogout}>
              <LogoutIcon sx={{ mr: 1 }} /> Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Drawer for mobile */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: 240 } }}
      >
        <Box sx={{ mt: 1 }}>
          {navItems.map((item, idx) => (
            <MenuItem
              key={item.label}
              onClick={() => { setTab(idx); setDrawerOpen(false); }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {item.icon}
                <Typography sx={{ ml: 1 }}>{item.label}</Typography>
              </Box>
            </MenuItem>
          ))}
        </Box>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <LogoutIcon sx={{ mr: 1 }} /> Logout
        </MenuItem>
      </Drawer>

      {/* Spacer for AppBar */}
      <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }} />

      {/* Top Tabs for desktop/tablet */}
      {isTabletUp && (
        <Tabs
          value={tab}
          onChange={(_e, newVal) => setTab(newVal)}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
        >
          {navItems.map(item => (
            <Tab
              key={item.label}
              icon={item.icon}
              iconPosition="start"
              label={item.label}
              sx={{ textTransform: 'none', flex: 1 }}
            />
          ))}
        </Tabs>
      )}

      {/* Main content */}
      <Box component="main" flex={1} overflow="auto" px={{ xs: 1, md: 3 }} py={3}>
        {tab === 0 && <AnalyticsOverview fallback />}
        {tab === 1 && <UsersTab fallback />}
        {tab === 2 && <PropertiesTab fallback />}
        {tab === 3 && <BookingsTab fallback />}
        {tab === 4 && <SubscriptionTab />}
      </Box>

      {/* Bottom navigation for mobile */}
      {isMobile && (
        <Paper elevation={3} sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }}>
          <BottomNavigation
            showLabels
            value={tab}
            onChange={(_, newVal) => setTab(newVal)}
          >
            {navItems.map(item => (
              <BottomNavigationAction
                key={item.label}
                label={item.label}
                icon={item.icon}
                sx={{ flex: 1 }}
              />
            ))}
          </BottomNavigation>
        </Paper>
      )}
    </Box>
  );
}
