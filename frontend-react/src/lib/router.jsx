"use client";

import { useEffect, useMemo, useState } from "react";
import NextLink from "next/link";
import {
  useParams as useNextParams,
  usePathname,
  useRouter,
  useSearchParams as useNextSearchParams
} from "next/navigation";

function isRouteActive(pathname, href, end) {
  if (!href) return false;
  if (end) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Link({ to, href, ...props }) {
  return <NextLink href={to || href || "/"} {...props} />;
}

export function NavLink({ to, href, end = false, className, children, ...props }) {
  const pathname = usePathname();
  const linkTo = to || href || "/";
  const isActive = isRouteActive(pathname, linkTo, end);
  const resolvedClassName = typeof className === "function" ? className({ isActive }) : className;
  const content = typeof children === "function" ? children({ isActive }) : children;

  return (
    <NextLink href={linkTo} className={resolvedClassName} {...props}>
      {content}
    </NextLink>
  );
}

export function useNavigate() {
  const router = useRouter();

  return (to, options = {}) => {
    if (options?.replace) {
      router.replace(to);
      return;
    }
    router.push(to);
  };
}

export function useLocation() {
  const pathname = usePathname();
  const [locationState, setLocationState] = useState({ hash: "", search: "" });

  useEffect(() => {
    function syncLocation() {
      setLocationState({
        hash: window.location.hash || "",
        search: window.location.search || ""
      });
    }

    syncLocation();
    window.addEventListener("hashchange", syncLocation);
    window.addEventListener("popstate", syncLocation);
    return () => {
      window.removeEventListener("hashchange", syncLocation);
      window.removeEventListener("popstate", syncLocation);
    };
  }, [pathname]);

  return useMemo(() => {
    return {
      pathname,
      search: locationState.search,
      hash: locationState.hash
    };
  }, [locationState.hash, locationState.search, pathname]);
}

export function useParams() {
  return useNextParams();
}

export function useSearchParams() {
  const pathname = usePathname();
  const router = useRouter();
  const nextParams = useNextSearchParams();

  const params = useMemo(() => new URLSearchParams(nextParams?.toString() || ""), [nextParams]);

  function setSearchParams(nextValue) {
    const resolved =
      typeof nextValue === "function"
        ? nextValue(new URLSearchParams(params.toString()))
        : nextValue;
    const next = resolved instanceof URLSearchParams ? resolved : new URLSearchParams(resolved);
    const query = next.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return [params, setSearchParams];
}

export function Navigate({ to, replace = false }) {
  const router = useRouter();

  useEffect(() => {
    if (replace) {
      router.replace(to);
      return;
    }
    router.push(to);
  }, [replace, router, to]);

  return null;
}
