import { useEffect, useState } from "react";

export function useAsync(asyncFn, deps = []) {
  const [reloadCount, setReloadCount] = useState(0);
  const [result, setResult] = useState({ depsKey: null });

  // depsKey menandai data milik parameter mana (mis. user/produk), sedangkan
  // reloadCount hanya memicu ambil ulang data yang sama.
  const depsKey = JSON.stringify(deps);
  const key = `${depsKey}:${reloadCount}`;

  useEffect(() => {
    let cancelled = false;
    asyncFn()
      .then((data) => {
        if (!cancelled) setResult({ depsKey, key, data, error: null });
      })
      .catch((error) => {
        if (!cancelled) setResult({ depsKey, key, data: null, error });
      });
    return () => {
      cancelled = true;
    };
  }, [key, depsKey]);

  const loading = result.key !== key;
  // Saat parameter berganti (produk/user lain), data lama tidak boleh tampil.
  // Saat reload biasa, data lama tetap dipakai supaya skeleton tidak berkedip.
  const switching = loading && result.depsKey !== depsKey;

  return {
    loading: switching,
    refreshing: loading,
    data: switching ? null : result.data,
    error: loading ? null : result.error,
    reload: () => setReloadCount((count) => count + 1),
  };
}
