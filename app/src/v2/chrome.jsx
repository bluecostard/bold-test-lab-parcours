import { Component } from "react";
import { useClerk, useUser } from "@clerk/react";
import { BottomNav, GearButton, Header, PageShell } from "./primitives.jsx";
import { readProfile, readPublicPseudo, setLocalUser } from "./state.js";

class DrawerGuard extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed) return this.props.fallback;
    return this.props.children;
  }
}

const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

export function ShellWithNav({ active, navigate, openDrawer, children, pageRef, header = true }) {
  return (
    <PageShell withNav pageRef={pageRef}>
      {header ? <Header onHome={() => navigate("discover")} action={openDrawer ? <GearButton onClick={openDrawer} /> : null} /> : null}
      {children}
      <BottomNav active={active} onNavigate={navigate} />
    </PageShell>
  );
}

function DrawerBody({ navigate, onClose, signedIn, name, onSignOut }) {
  function go(screen) {
    onClose();
    navigate(screen);
  }
  return (
    <aside className={signedIn ? "v2-drawer" : "v2-drawer v2-drawer--anon"} role="dialog" aria-label="Menu">
      <img src="/logo-gemelo.png" alt="Gemelo" />
      {signedIn && name ? <p className="v2-drawer-name">{name}</p> : null}
      <nav>
        <button type="button" onClick={() => go("profile")}>Profil</button>
        <button type="button" onClick={() => go("results")}>Mes résultats</button>
        <button type="button" onClick={() => go("messages")}>Messages</button>
        <button type="button" onClick={() => go("settings")}>Réglages</button>
        {signedIn ? (
          <button type="button" onClick={onSignOut}>Se déconnecter</button>
        ) : (
          <button type="button" onClick={() => go("login")}>Se connecter</button>
        )}
      </nav>
    </aside>
  );
}

async function signOutLocally(onClose, navigate) {
  setLocalUser(null);
  onClose();
  navigate("login");
}

function ClerkDrawer(props) {
  const { user, isSignedIn } = useUser();
  const { signOut } = useClerk();
  return (
    <DrawerBody
      {...props}
      signedIn={Boolean(isSignedIn)}
      name={readPublicPseudo(user)}
      onSignOut={async () => {
        setLocalUser(null);
        props.onClose();
        try {
          await signOut(() => {
            props.navigate("login");
          });
        } catch {
          props.navigate("login");
        }
      }}
    />
  );
}

function LocalDrawer(props) {
  const profile = readProfile();
  return (
    <DrawerBody
      {...props}
      signedIn={Boolean(profile.user)}
      name={readPublicPseudo()}
      onSignOut={() => signOutLocally(props.onClose, props.navigate)}
    />
  );
}

export function SideDrawer({ open, onClose, navigate }) {
  if (!open) return null;
  const local = <LocalDrawer navigate={navigate} onClose={onClose} />;
  return (
    <div className="v2-drawer-root">
      <button type="button" className="v2-drawer-backdrop" aria-label="Fermer le menu" onClick={onClose} />
      {clerkKey ? <DrawerGuard fallback={local}><ClerkDrawer navigate={navigate} onClose={onClose} /></DrawerGuard> : local}
    </div>
  );
}
