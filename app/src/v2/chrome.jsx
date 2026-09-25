import { useClerk, useUser } from "@clerk/react";
import { BottomNav, GearButton, Header, PageShell } from "./primitives.jsx";
import { readProfile, setLocalUser } from "./state.js";

const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

export function ShellWithNav({ active, navigate, openDrawer, children, pageRef, header = true }) {
  return (
    <PageShell withNav pageRef={pageRef}>
      {header ? <Header action={openDrawer ? <GearButton onClick={openDrawer} /> : null} /> : null}
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
    <aside className="v2-drawer" role="dialog" aria-label="Menu">
      <img src="/logo-gemelo.png" alt="Gemelo" />
      <p className="v2-drawer-name">{signedIn ? name : "Invité"}</p>
      <nav>
        <button type="button" onClick={() => go("profile")}>Profil</button>
        <button type="button" onClick={() => go("settings")}>Réglages</button>
        <button type="button" onClick={() => (signedIn ? onSignOut() : go("login"))}>{signedIn ? "Se déconnecter" : "Se connecter"}</button>
      </nav>
    </aside>
  );
}

function ClerkDrawer(props) {
  const { user, isSignedIn } = useUser();
  const { signOut } = useClerk();
  return (
    <DrawerBody
      {...props}
      signedIn={Boolean(isSignedIn)}
      name={user?.fullName || user?.firstName || "Alexandre"}
      onSignOut={() => signOut().then(() => { props.onClose(); props.navigate("discover"); })}
    />
  );
}

function LocalDrawer(props) {
  const profile = readProfile();
  return (
    <DrawerBody
      {...props}
      signedIn={Boolean(profile.user)}
      name={profile.name}
      onSignOut={() => { setLocalUser(null); props.onClose(); props.navigate("discover"); }}
    />
  );
}

export function SideDrawer({ open, onClose, navigate }) {
  if (!open) return null;
  return (
    <div className="v2-drawer-root">
      <button type="button" className="v2-drawer-backdrop" aria-label="Fermer le menu" onClick={onClose} />
      {clerkKey ? <ClerkDrawer navigate={navigate} onClose={onClose} /> : <LocalDrawer navigate={navigate} onClose={onClose} />}
    </div>
  );
}
