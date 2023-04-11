import { IVersionInfo } from '@/services/version'
import { atom, useAtom } from 'jotai'

export const versionAtom = atom<IVersionInfo | undefined>(undefined)
export const useVersion = () => useAtom(versionAtom)
