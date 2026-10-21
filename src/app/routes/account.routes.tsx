import { createRoute, lazyRouteComponent, useSearch, type AnyRoute } from "@tanstack/react-router";
import { toSignInSearch } from "./sign-in-search";
import { useLinkToken } from "./use-link-token";
import { withPagePreload } from "./with-page-preload";

const SignInPage = lazyRouteComponent(() =>
  import("@/pages/account").then(module => ({ default: module.SignInPage }))
);

const SignUpPage = lazyRouteComponent(() =>
  import("@/pages/account").then(module => ({ default: module.SignUpPage }))
);

const EmailVerificationPage = lazyRouteComponent(() =>
  import("@/pages/account").then(module => ({ default: module.EmailVerificationPage }))
);

const PasswordResetRequestPage = lazyRouteComponent(() =>
  import("@/pages/account").then(module => ({ default: module.PasswordResetRequestPage }))
);

const PasswordResetPage = lazyRouteComponent(() =>
  import("@/pages/account").then(module => ({ default: module.PasswordResetPage }))
);

function SignInRoute() {
  const { aviso } = useSearch({ strict: false });

  return <SignInPage notice={aviso} />;
}

function EmailVerificationRoute() {
  return <EmailVerificationPage token={useLinkToken()} />;
}

function PasswordResetRoute() {
  return <PasswordResetPage token={useLinkToken()} />;
}

export function createAccountRoutes<TGuestRoute extends AnyRoute, TPublicRoute extends AnyRoute>(
  guestRoute: TGuestRoute,
  publicRoute: TPublicRoute
) {
  const signInRoute = createRoute({
    getParentRoute: () => guestRoute,
    path: "/entrar",
    validateSearch: toSignInSearch,
    component: withPagePreload(SignInRoute, SignInPage),
  });

  const signUpRoute = createRoute({
    getParentRoute: () => guestRoute,
    path: "/cadastrar",
    component: SignUpPage,
  });

  const emailVerificationRoute = createRoute({
    getParentRoute: () => publicRoute,
    path: "/confirmar-email",
    component: withPagePreload(EmailVerificationRoute, EmailVerificationPage),
  });

  const passwordResetRequestRoute = createRoute({
    getParentRoute: () => publicRoute,
    path: "/esqueci-a-senha",
    component: PasswordResetRequestPage,
  });

  const passwordResetRoute = createRoute({
    getParentRoute: () => publicRoute,
    path: "/redefinir-senha",
    component: withPagePreload(PasswordResetRoute, PasswordResetPage),
  });

  return {
    signInRoute,
    signUpRoute,
    emailVerificationRoute,
    passwordResetRequestRoute,
    passwordResetRoute,
  };
}
