import { createContext, Dispatch, ReactNode, SetStateAction, useContext, useState } from 'react';
import type { Filter } from './db/cari';

export const FILTER_KOSONG: Filter = { kategori: null, kota: null, teks: '' };

type Ctx = { filter: Filter; setFilter: Dispatch<SetStateAction<Filter>> };

const FilterCtx = createContext<Ctx>({ filter: FILTER_KOSONG, setFilter: () => {} });

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filter, setFilter] = useState<Filter>(FILTER_KOSONG);
  return <FilterCtx.Provider value={{ filter, setFilter }}>{children}</FilterCtx.Provider>;
}

export const useFilter = () => useContext(FilterCtx);