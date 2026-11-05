// The main menu. `children` appear in a dropdown under their parent.
export const nav = [
  { label: 'Home', href: '/' },
  {
    label: 'Approach',
    href: '/approach',
    children: [
      { label: 'Premises', href: '/premises' },
      { label: 'Framework', href: '/framework' },
    ],
  },
  { label: 'Publications', href: '/publications' },
  { label: 'Dissemination', href: '/dissemination' },
  {
    label: 'Resources',
    href: '/resources',
    children: [{ label: 'Videos', href: '/videos' }],
  },
  { label: 'Contact', href: '/contact' },
];
