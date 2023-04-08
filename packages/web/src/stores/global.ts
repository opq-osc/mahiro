import { atom, useAtom } from 'jotai'

export const versionAtom = atom('')
export const useVersion = () => useAtom(versionAtom)