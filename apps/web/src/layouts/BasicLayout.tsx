import { useMemo, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useRequest } from 'ahooks';
import cls from 'classnames';
import { useI18n, useTheme, useStoreShallow } from '@milesight/shared/src/hooks';
import {
    iotLocalStorage,
    TOKEN_CACHE_KEY,
    REGISTERED_KEY,
} from '@milesight/shared/src/utils/storage';
import routes, { filterMobileRoutes } from '@/routes/routes';
import { useUserStore } from '@/stores';
import { globalAPI, awaitWrap, getResponseData, isRequestSuccess } from '@/services/http';
import { Sidebar, RouteLoadingIndicator, FloatingAiAssistant } from '@/components';
import { useUserPermissions } from '@/hooks';
import { PERMISSIONS } from '@/constants';
import useSidebarStore from '@/components/sidebar/store';
import useDrawingBoardStore from '@/components/drawing-board/store';
import { useRoutePermission, useSWUpdate } from './hooks';
import { LayoutSkeleton } from './components';

/**
 * Pages the floating AI assistant is offered on. Its tools read live and historical
 * entity values, so it is only useful where the page is about that data — there is
 * nothing for it to answer on Settings, User Role or Tag management.
 */
const AI_ASSISTANT_PATHS = ['/dashboard', '/device', '/entity'];

function BasicLayout() {
    const { lang } = useI18n();

    // ---------- Get user info and redirect ----------
    const navigate = useNavigate();
    const [loading, setLoading] = useState<null | boolean>(null);
    const userInfo = useUserStore(state => state.userInfo);
    const setUserInfo = useUserStore(state => state.setUserInfo);
    const token = iotLocalStorage.getItem(TOKEN_CACHE_KEY);
    const { shrink } = useSidebarStore(useStoreShallow(['shrink']));
    const { drawingBoardFullscreen } = useDrawingBoardStore(
        useStoreShallow('drawingBoardFullscreen'),
    );

    useRequest(
        async () => {
            // Check whether the client is registered. If yes, go to the login page. If no, go to the registration page
            const target = iotLocalStorage.getItem(REGISTERED_KEY)
                ? '/auth/login'
                : '/auth/register';

            if (!token) {
                navigate(target, { replace: true });
                return;
            }
            // store already has user information, you do not need to request again
            if (userInfo) {
                setLoading(false);
                return;
            }

            setLoading(true);
            const [error, resp] = await awaitWrap(globalAPI.getUserInfo());
            setLoading(false);

            if (error || !isRequestSuccess(resp)) {
                navigate(target, { replace: true });
                return;
            }

            setUserInfo(getResponseData(resp));
        },
        {
            refreshDeps: [userInfo],
            debounceWait: 300,
        },
    );

    // ---------- Render sidebar menus ----------
    /**
     * @description hooks
     * confirmation of permission
     */
    const { hasPermission } = useUserPermissions();
    const { matchTablet } = useTheme();

    /**
     * menus bar
     */
    const menus = useMemo(() => {
        const finalRoutes = !matchTablet ? routes : filterMobileRoutes(routes);

        return finalRoutes
            .filter(
                route =>
                    route.path &&
                    route.handle?.layout !== 'blank' &&
                    !route.handle?.hideInMenuBar &&
                    hasPermission(route.handle?.permissions),
            )
            .map(route => ({
                name: route.handle?.title || '',
                path: route.path || '',
                icon: route.handle?.icon,
            }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lang, loading, matchTablet, hasPermission]);

    // ---------- Render main content ----------
    /**
     * @description hooks
     * Determine whether the user has permission to access the current page.
     * No permission to jump directly to 403
     */
    const { hasPathPermission } = useRoutePermission(loading);

    // ---------- Floating AI assistant ----------
    const { pathname } = useLocation();
    const showAiAssistant = useMemo(() => {
        if (!hasPermission(PERMISSIONS.DASHBOARD_MODULE)) return false;

        return AI_ASSISTANT_PATHS.some(
            path => pathname === path || pathname.startsWith(`${path}/`),
        );
    }, [pathname, hasPermission]);

    // ---------- SW update confirm ----------
    useSWUpdate();

    return (
        <section
            className={cls('ms-layout', {
                'ms-layout__sidebar--collapsed': matchTablet ? true : shrink,
                'ms-layout__sidebar--expanding': matchTablet ? false : !shrink,
                'my-layout__drawing-board--fullscreen': drawingBoardFullscreen,
            })}
        >
            <RouteLoadingIndicator />
            {loading !== false ? (
                // <CircularProgress sx={{ marginX: 'auto', alignSelf: 'center' }} />
                <LayoutSkeleton />
            ) : (
                <>
                    <Sidebar menus={menus} />
                    <main className="ms-layout-right">{hasPathPermission ? <Outlet /> : null}</main>
                    {hasPathPermission && showAiAssistant && <FloatingAiAssistant />}
                </>
            )}
        </section>
    );
}

export default BasicLayout;
