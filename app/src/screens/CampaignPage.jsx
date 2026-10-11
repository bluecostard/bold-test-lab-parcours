import { useRef, useState } from "react";
import { readAccount, writeAccount } from "./account.js";

const CATEGORIES = [
  "Alimentation",
  "Bien-être",
  "Écoresponsable",
  "Maison",
  "Nature",
  "Santé",
  "Technologie",
  "Voyage",
];

const NETWORKS = ["Instagram", "TikTok", "Facebook", "LinkedIn", "YouTube", "X"];
const EMPTY_SOCIAL = { platform: "", url: "" };
const EMPTY_INSTRUCTION = { title: "", text: "" };

function validUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function imageToDataUrl(file, maxSize = 1280) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Lecture du fichier impossible."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("Cette image ne peut pas être ouverte."));
      image.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("Compression de l’image impossible."));
          return;
        }
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export function CampaignPage({ onOpen }) {
  const saved = readAccount();
  const [name, setName] = useState(saved.projectName);
  const [pitch, setPitch] = useState(saved.projectPitch);
  const [link, setLink] = useState(saved.projectLink);
  const [category, setCategory] = useState(saved.category);
  const [logo, setLogo] = useState(saved.projectLogo);
  const [screens, setScreens] = useState(saved.projectScreens);
  const [socials, setSocials] = useState(
    saved.projectSocials.length ? saved.projectSocials : [{ ...EMPTY_SOCIAL }],
  );
  const [instructions, setInstructions] = useState(
    saved.projectInstructions.length
      ? saved.projectInstructions
      : saved.projectSteps
        ? [{ title: "Consigne principale", text: saved.projectSteps }]
        : [{ ...EMPTY_INSTRUCTION }],
  );
  const [errors, setErrors] = useState({});
  const [storageError, setStorageError] = useState("");
  const [imageError, setImageError] = useState("");
  const logoInput = useRef(null);
  const screensInput = useRef(null);

  function updateSocial(index, field, value) {
    setSocials((current) => current.map((social, position) => (
      position === index ? { ...social, [field]: value } : social
    )));
  }

  function updateInstruction(index, field, value) {
    setInstructions((current) => current.map((instruction, position) => (
      position === index ? { ...instruction, [field]: value } : instruction
    )));
  }

  async function chooseLogo(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageError("");
    try {
      setLogo(await imageToDataUrl(file, 720));
    } catch (error) {
      setImageError(error.message);
    } finally {
      event.target.value = "";
    }
  }

  async function chooseScreens(event) {
    const files = Array.from(event.target.files || []);
    const available = 6 - screens.length;
    if (files.length > available) {
      setImageError(`Vous pouvez ajouter ${available} capture${available > 1 ? "s" : ""} au maximum.`);
      event.target.value = "";
      return;
    }
    setImageError("");
    try {
      const additions = await Promise.all(files.map((file) => imageToDataUrl(file)));
      setScreens((current) => [...current, ...additions]);
    } catch (error) {
      setImageError(error.message);
    } finally {
      event.target.value = "";
    }
  }

  function save(event) {
    event.preventDefault();
    const nextErrors = {};
    const duplicatePlatforms = socials
      .map((social) => social.platform)
      .filter((platform, index, all) => platform && all.indexOf(platform) !== index);

    if (!name.trim()) nextErrors.name = "Le nom du projet est obligatoire.";
    if (!pitch.trim()) nextErrors.pitch = "La description est obligatoire.";
    if (!category) nextErrors.category = "Choisissez une catégorie.";
    if (link.trim() && !validUrl(link.trim())) nextErrors.link = "Saisissez une URL complète et valide.";
    const filledSocials = socials.filter((social) => social.platform || social.url.trim());
    if (!filledSocials.length) nextErrors.socials = "Ajoutez au moins 1 réseau social avec un lien valide.";
    if (socials.length > 6) nextErrors.socials = "Vous pouvez indiquer jusqu’à 6 réseaux.";
    if (duplicatePlatforms.length) nextErrors.socials = "Chaque réseau ne peut être choisi qu’une fois.";
    socials.forEach((social, index) => {
      const empty = !social.platform && !social.url.trim();
      if (empty) return;
      if (!social.platform) nextErrors[`socialPlatform-${index}`] = "Choisissez un réseau.";
      if (!validUrl(social.url)) nextErrors[`socialUrl-${index}`] = "Saisissez une URL complète et valide.";
    });
    if (!instructions.length) nextErrors.instructions = "Ajoutez au moins une consigne.";
    instructions.forEach((instruction, index) => {
      if (!instruction.title.trim()) nextErrors[`instructionTitle-${index}`] = "Le titre est obligatoire.";
      if (!instruction.text.trim()) nextErrors[`instructionText-${index}`] = "La consigne est obligatoire.";
    });

    setErrors(nextErrors);
    setStorageError("");
    if (Object.keys(nextErrors).length) return;

    const cleanInstructions = instructions.map((instruction) => ({
      title: instruction.title.trim(),
      text: instruction.text.trim(),
    }));
    try {
      writeAccount({
        ...readAccount(),
        projectName: name.trim(),
        projectPitch: pitch.trim(),
        projectLink: link.trim(),
        projectSteps: cleanInstructions.map((instruction) => instruction.text).join("\n\n"),
        category,
        projectLogo: logo,
        projectScreens: screens,
        projectSocials: socials
          .filter((social) => social.platform && validUrl(social.url))
          .map((social) => ({ platform: social.platform, url: social.url.trim() })),
        projectInstructions: cleanInstructions,
      });
      onOpen(12);
    } catch (error) {
      const quota = error?.name === "QuotaExceededError" || error?.code === 22;
      setStorageError(quota
        ? "Les images sont trop volumineuses pour être enregistrées sur cet appareil. Supprimez des captures ou choisissez des fichiers plus légers."
        : "Impossible d’enregistrer la campagne sur cet appareil.");
    }
  }

  return (
    <form className="campaign-form" onSubmit={save} noValidate>
      <button type="button" className="campaign-form-back" onClick={() => onOpen(11)}>‹ Retour</button>
      <h1>Page de <b>campagne</b></h1>
      <p className="campaign-form-intro">Ces informations composent la page que les testeurs ouvriront.</p>

      <section className="campaign-form-section" aria-labelledby="campaign-identity-title">
        <h2 id="campaign-identity-title">Identité du projet</h2>
        <label className="campaign-field">
          <span>Nom du projet</span>
          <input value={name} onChange={(event) => setName(event.target.value)} required aria-describedby={errors.name ? "name-error" : undefined} />
          {errors.name ? <small className="campaign-error" id="name-error">{errors.name}</small> : null}
        </label>
        <label className="campaign-field">
          <span>Description</span>
          <textarea value={pitch} onChange={(event) => setPitch(event.target.value)} required aria-describedby={errors.pitch ? "pitch-error" : undefined} />
          {errors.pitch ? <small className="campaign-error" id="pitch-error">{errors.pitch}</small> : null}
        </label>
        <label className="campaign-field">
          <span>Catégorie du projet</span>
          <select value={category} onChange={(event) => setCategory(event.target.value)} required aria-describedby={errors.category ? "category-error" : undefined}>
            <option value="">Choisir une catégorie</option>
            {CATEGORIES.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
          {errors.category ? <small className="campaign-error" id="category-error">{errors.category}</small> : null}
        </label>
        <label className="campaign-field">
          <span>Lien du site ou de l’appli</span>
          <input value={link} type="url" placeholder="https://" onChange={(event) => setLink(event.target.value)} aria-describedby={errors.link ? "link-error" : undefined} />
          {errors.link ? <small className="campaign-error" id="link-error">{errors.link}</small> : null}
        </label>
      </section>

      <section className="campaign-form-section" aria-labelledby="campaign-visuals-title">
        <div className="campaign-section-heading">
          <div>
            <h2 id="campaign-visuals-title">Visuels</h2>
            <p>Ajoutez votre logo et jusqu’à 6 captures.</p>
          </div>
          <span>{screens.length}/6</span>
        </div>

        <div className="campaign-upload-group">
          <span className="campaign-upload-label">Logo du projet</span>
          {logo ? (
            <div className="campaign-logo-preview">
              <img src={logo} alt="Aperçu du logo du projet" />
              <div className="campaign-preview-actions">
                <button type="button" className="campaign-secondary" onClick={() => logoInput.current?.click()}>Remplacer</button>
                <button type="button" className="campaign-remove" onClick={() => setLogo("")} aria-label="Supprimer le logo du projet">Supprimer</button>
              </div>
            </div>
          ) : (
            <button type="button" className="campaign-secondary" onClick={() => logoInput.current?.click()}>Ajouter un logo</button>
          )}
          <input ref={logoInput} className="campaign-file-input" type="file" accept="image/*" onChange={chooseLogo} aria-label="Choisir le logo du projet" />
        </div>

        <div className="campaign-upload-group">
          <span className="campaign-upload-label">Captures d’écran</span>
          {screens.length ? (
            <ul className="campaign-screen-previews">
              {screens.map((src, index) => (
                <li key={`${src.slice(-24)}-${index}`}>
                  <img src={src} alt={`Capture d’écran ${index + 1}`} />
                  <button
                    type="button"
                    className="campaign-preview-remove"
                    onClick={() => setScreens((current) => current.filter((_, position) => position !== index))}
                    aria-label={`Supprimer la capture d’écran ${index + 1}`}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          ) : <p className="campaign-empty">Aucune capture ajoutée.</p>}
          <button type="button" className="campaign-secondary" disabled={screens.length >= 6} onClick={() => screensInput.current?.click()}>
            Ajouter des captures
          </button>
          <input ref={screensInput} className="campaign-file-input" type="file" accept="image/*" multiple onChange={chooseScreens} aria-label="Choisir jusqu’à 6 captures d’écran" />
          <p className="campaign-error" aria-live="polite">{imageError}</p>
        </div>
      </section>

      <section className="campaign-form-section" aria-labelledby="campaign-socials-title">
        <div className="campaign-section-heading">
          <div>
            <h2 id="campaign-socials-title">Réseaux sociaux</h2>
            <p>Au moins 1 lien valide ; les autres sont facultatifs (max. 6).</p>
          </div>
          <span>{socials.length}/6</span>
        </div>
        <div className="campaign-collection">
          {socials.map((social, index) => (
            <fieldset className="campaign-repeat-card" key={index}>
              <legend>Réseau {index + 1}</legend>
              <label className="campaign-field">
                <span>Réseau</span>
                <select value={social.platform} onChange={(event) => updateSocial(index, "platform", event.target.value)}>
                  <option value="">Choisir un réseau</option>
                  {NETWORKS.map((network) => (
                    <option key={network} value={network} disabled={socials.some((item, position) => position !== index && item.platform === network)}>
                      {network}
                    </option>
                  ))}
                </select>
                {errors[`socialPlatform-${index}`] ? <small className="campaign-error">{errors[`socialPlatform-${index}`]}</small> : null}
              </label>
              <label className="campaign-field">
                <span>URL du profil</span>
                <input type="url" placeholder="https://" value={social.url} onChange={(event) => updateSocial(index, "url", event.target.value)} />
                {errors[`socialUrl-${index}`] ? <small className="campaign-error">{errors[`socialUrl-${index}`]}</small> : null}
              </label>
              <button type="button" className="campaign-remove" onClick={() => setSocials((current) => current.filter((_, position) => position !== index))} aria-label={`Supprimer le réseau ${index + 1}`}>
                Supprimer ce réseau
              </button>
            </fieldset>
          ))}
        </div>
        <p className="campaign-error" aria-live="polite">{errors.socials}</p>
        <button type="button" className="campaign-secondary" disabled={socials.length >= 6} onClick={() => setSocials((current) => [...current, { ...EMPTY_SOCIAL }])}>
          Ajouter un réseau
        </button>
      </section>

      <section className="campaign-form-section" aria-labelledby="campaign-instructions-title">
        <div className="campaign-section-heading">
          <div>
            <h2 id="campaign-instructions-title">Consignes</h2>
            <p>Expliquez clairement les actions à tester.</p>
          </div>
          <span>{instructions.length}</span>
        </div>
        <div className="campaign-collection">
          {instructions.map((instruction, index) => (
            <fieldset className="campaign-repeat-card" key={index}>
              <legend>Consigne {index + 1}</legend>
              <label className="campaign-field">
                <span>Titre de la consigne</span>
                <input value={instruction.title} onChange={(event) => updateInstruction(index, "title", event.target.value)} />
                {errors[`instructionTitle-${index}`] ? <small className="campaign-error">{errors[`instructionTitle-${index}`]}</small> : null}
              </label>
              <label className="campaign-field">
                <span>Consigne</span>
                <textarea value={instruction.text} onChange={(event) => updateInstruction(index, "text", event.target.value)} />
                {errors[`instructionText-${index}`] ? <small className="campaign-error">{errors[`instructionText-${index}`]}</small> : null}
              </label>
              <button type="button" className="campaign-remove" onClick={() => setInstructions((current) => current.filter((_, position) => position !== index))} aria-label={`Supprimer la consigne ${index + 1}`}>
                Supprimer cette consigne
              </button>
            </fieldset>
          ))}
        </div>
        <p className="campaign-error" aria-live="polite">{errors.instructions}</p>
        <button type="button" className="campaign-secondary" onClick={() => setInstructions((current) => [...current, { ...EMPTY_INSTRUCTION }])}>
          Ajouter une consigne
        </button>
      </section>

      <p className="campaign-storage-error" aria-live="assertive">{storageError}</p>
      <button type="submit" className="campaign-submit">Continuer vers l’offre</button>
    </form>
  );
}
