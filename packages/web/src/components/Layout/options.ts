export enum EMenu {
  home = 'home',
  plugins = 'plugins',
  groups = 'groups',
  qqs = 'qqs',
  panel = 'panel',
}

export const menus = [
  EMenu.home,
  EMenu.plugins,
  EMenu.groups,
  EMenu.qqs,
  EMenu.panel,
] as const
