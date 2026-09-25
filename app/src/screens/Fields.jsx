import { useEffect, useRef, useState } from "react";
import { useClerk, useUser } from "@clerk/react";
import { readAccount, writeAccount } from "./account.js";
import { clerkKey } from "./Login.jsx";

function fileUrl(file, done) {
  const reader = new FileReader();
  reader.onload = () => done(String(reader.result || ""));
  reader.readAsDataURL(file);
}

function FieldsBody({ screen, onOpen, signedIn, displayName, onLogout }) {
  const [account, setAccount] = useState(readAccount);
  const [panel, setPanel] = useState(null);
  const [videoUrl, setVideoUrl] = useState("");
  const accountMenuRef = useRef(null);

  useEffect(() => {
    writeAccount(account);
  }, [account]);

  useEffect(() => {
    if (panel !== "account") return undefined;

    function closeOnOutsideClick(event) {
      if (!accountMenuRef.current?.contains(event.target)) setPanel(null);
    }

    function closeOnEscape(event) {
      if (event.key === "Escape") {
        setPanel(null);
        accountMenuRef.current?.querySelector(".field-account")?.focus();
      }
    }

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [panel]);

  function patch(next) {
    setAccount((current) => ({ ...current, ...next }));
  }

  return (
    <>
      {screen === 3 ? (
        <>
          <textarea
            className="field-text"
            maxLength={1000}
            placeholder="Ce qui fonctionne, ce qui bloque, votre suggestion..."
            value={account.reviewText}
            onChange={(event) => patch({ reviewText: event.target.value })}
          />
          <label className="field-file field-photo">
            Photo
            <input
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) fileUrl(file, (reviewPhoto) => patch({ reviewPhoto }));
              }}
            />
            {account.reviewPhoto ? <img src={account.reviewPhoto} alt="Photo ajoutée" /> : null}
          </label>
          <label className="field-file field-camera">
            Caméra
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) fileUrl(file, (reviewPhoto) => patch({ reviewPhoto }));
              }}
            />
          </label>
          <label className="field-file field-video">
            Vidéo
            <input
              type="file"
              accept="video/*"
              capture="environment"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                setVideoUrl(URL.createObjectURL(file));
                patch({ reviewVideoName: file.name });
              }}
            />
            {videoUrl ? <video src={videoUrl} muted /> : null}
          </label>
        </>
      ) : null}

      {screen === 6 ? (
        <button type="button" className="field-login" onClick={() => (signedIn ? onLogout() : onOpen("login"))}>
          {signedIn ? "Déconnexion" : "Connexion"}
        </button>
      ) : null}

      {screen === 11 ? (
        <>
          <label className="field-avatar">
            Photo de profil
            <input
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                fileUrl(file, (photo) => patch({ user: { ...(account.user || { name: "Alexandre", email: "" }), photo } }));
              }}
            />
            {account.user?.photo ? <img src={account.user.photo} alt="" /> : null}
          </label>
          {signedIn && displayName ? <p className="field-username">{displayName}</p> : null}
          <button type="button" className="field-edit" onClick={() => onOpen("campagne")}>
            Modifier mon projet
          </button>
          <div className="profile-account" ref={accountMenuRef}>
            <button
              type="button"
              className="field-account"
              aria-label="Ouvrir le menu du compte"
              aria-expanded={panel === "account"}
              aria-controls="profile-account-menu"
              onClick={() => setPanel((current) => current === "account" ? null : "account")}
            >
              Réglages
            </button>
            {panel === "account" ? (
              <div className="profile-account-menu" id="profile-account-menu" role="menu">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setPanel(null);
                    onOpen("reglages");
                  }}
                >
                  Réglages
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={async () => {
                    setPanel(null);
                    if (signedIn) {
                      await onLogout();
                      onOpen(1);
                    } else {
                      onOpen("login");
                    }
                  }}
                >
                  {signedIn ? "Se déconnecter" : "Se connecter"}
                </button>
              </div>
            ) : null}
          </div>
        </>
      ) : null}

      {panel === "project" ? (
        <form
          className="account-panel"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            patch({
              projectName: String(data.get("projectName") || "").trim(),
              projectPitch: String(data.get("projectPitch") || "").trim(),
            });
            setPanel(null);
          }}
        >
          <h2>Modifier mon projet</h2>
          <label>
            Nom
            <input name="projectName" defaultValue={account.projectName} required />
          </label>
          <label>
            Description
            <textarea name="projectPitch" defaultValue={account.projectPitch} required />
          </label>
          <button type="submit">Enregistrer</button>
          <button type="button" onClick={() => setPanel(null)}>Fermer</button>
        </form>
      ) : null}
    </>
  );
}

function ClerkFields(props) {
  const { isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const displayName = user?.fullName || user?.primaryEmailAddress?.emailAddress || "";
  return <FieldsBody {...props} signedIn={!!isSignedIn} displayName={displayName} onLogout={() => signOut()} />;
}

export function Fields(props) {
  if (!clerkKey) return <FieldsBody {...props} signedIn={false} displayName="" onLogout={() => {}} />;
  return <ClerkFields {...props} />;
}
