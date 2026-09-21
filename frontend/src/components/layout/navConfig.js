import {
  FiGrid,
  FiUsers,
  FiUserCheck,
  FiBookOpen,
  FiCalendar,
  FiBell,
  FiFileText,
  FiCheckSquare,
  FiUser,
  FiLayers,
} from 'react-icons/fi';

export const NAV = {
  admin: [
    { to: '/admin', label: 'Dashboard', icon: FiGrid, end: true },
    { to: '/admin/classes', label: 'Classes', icon: FiLayers },
    { to: '/admin/students', label: 'Students', icon: FiUsers },
    { to: '/admin/teachers', label: 'Teachers', icon: FiUserCheck },
    { to: '/admin/library', label: 'Library', icon: FiBookOpen },
    { to: '/admin/events', label: 'Events', icon: FiCalendar },
    { to: '/admin/announcements', label: 'Announcements', icon: FiBell },
    { to: '/admin/profile', label: 'Profile', icon: FiUser },
  ],
  teacher: [
    { to: '/teacher', label: 'Dashboard', icon: FiGrid, end: true },
    { to: '/teacher/classes', label: 'My classes', icon: FiLayers },
    { to: '/teacher/assignments', label: 'Assignments', icon: FiFileText },
    { to: '/teacher/notices', label: 'Notices', icon: FiBell },
    { to: '/teacher/profile', label: 'Profile', icon: FiUser },
  ],
  student: [
    { to: '/student', label: 'Dashboard', icon: FiGrid, end: true },
    { to: '/student/assignments', label: 'Assignments', icon: FiFileText },
    { to: '/student/attendance', label: 'Attendance', icon: FiCheckSquare },
    { to: '/student/notices', label: 'Notices', icon: FiBell },
    { to: '/student/announcements', label: 'Announcements', icon: FiBell },
    { to: '/student/library', label: 'Library', icon: FiBookOpen },
    { to: '/student/profile', label: 'Profile', icon: FiUser },
  ],
};

export const ROLE_LABEL = {
  admin: 'Administrator',
  teacher: 'Teacher',
  student: 'Student',
};
