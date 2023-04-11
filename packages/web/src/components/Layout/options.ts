export enum EMenu {
  home = 'home',
  plugins = 'plugins',
  groups = 'groups',
  qqs = 'qqs',
}

export const menus = [
  EMenu.home,
  EMenu.plugins,
  EMenu.groups,
  EMenu.qqs,
] as const
