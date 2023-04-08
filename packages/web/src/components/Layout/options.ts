export enum EMenu {
  home = 'home',
  plugins = 'plugins',
  groups = 'groups',
}

export const menus = [
  EMenu.home,
  EMenu.plugins,
  EMenu.groups,
] as const;