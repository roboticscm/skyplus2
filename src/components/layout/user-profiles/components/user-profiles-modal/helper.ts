export const themes = [
  {
    key: 'theme-ivory',
    theme: 'Ivory',
    preview: '#FFFAF6',
  },
  // {
  //   key: 'theme-green',
  //   theme: T('COMMON.COLOR.GREEN'),
  //   preview: '#1b5e20',
  // },
  // {
  //   key: 'theme-blue',
  //   theme: T('COMMON.COLOR.BLUE'),
  //   preview: '#0000FF',
  // },
  // {
  //   key: 'theme-pink',
  //   theme: T('COMMON.COLOR.PINK'),
  //   preview: '#880e4f',
  // },
  // {
  //   key: 'theme-brown',
  //   theme: T('COMMON.COLOR.BROWN'),
  //   preview: '#3e2723',
  // },
  {
    key: 'theme-ebony',
    theme: 'Ebony',
    preview: '#161616',
  },
  // {
  //   key: 'theme-purple',
  //   theme: T('COMMON.COLOR.PURPLE'),
  //   preview: '#6a1b9a',
  // },
  // {
  //   key: 'theme-orange',
  //   theme: T('COMMON.COLOR.ORANGE'),
  //   preview: '#e65100',
  // },
];

export const getThemeColors = () => {
  const body: any = document.querySelector('body');
  return [
    {
      ['--bg-primary']: getComputedStyle(body as any)
        .getPropertyValue('--bg-primary')
        .trim(),
    },
    {
      ['--bg-secondary']: getComputedStyle(body as any)
        .getPropertyValue('--bg-secondary')
        .trim(),
    },
    {
      ['--bg-tertiary']: getComputedStyle(body as any)
        .getPropertyValue('--bg-tertiary')
        .trim(),
    },
    {
      ['--bg-gradient-from']: getComputedStyle(body as any)
        .getPropertyValue('--bg-gradient-from')
        .trim(),
    },
    {
      ['--bg-gradient-to']: getComputedStyle(body as any)
        .getPropertyValue('--bg-gradient-to')
        .trim(),
    },
  ];
};
