import { Menu } from "./Menu.jsx";

const services = {
  Plantae: {
    name: "Plantae",
    pitch: "Prenez soin de vos plantes",
    tags: ["Nature", "Maison", "Bien-être"],
    shots: ["/visuels/plantae.jpg"],
    network: null,
  },
  MindFlow: {
    name: "MindFlow",
    pitch: "Méditer plus simplement",
    tags: ["Bien-être", "Santé mentale", "Audio"],
    shots: ["/visuels/mindflow.jpg"],
    network: null,
  },
  GoodSpot: {
    name: "GoodSpot",
    pitch: "Mieux manger au quotidien",
    tags: ["Alimentation", "Local", "Écoresponsable"],
    shots: ["/visuels/goodspot.jpg"],
    network: null,
  },
  Alba: {
    name: "Alba",
    pitch: "Des idées d’escapades durables",
    tags: ["Voyage", "Outdoor", "Écoresponsable"],
    shots: ["/visuels/alba.jpg"],
    network: null,
  },
};

export function Detail({ name, onOpen }) {
  const service = services[name] ?? services.Plantae;
  const shots = service.shots.slice(0, 6);
  const network = service.network;

  return (
    <div className="campaign">
      <button type="button" className="campaign-back" onClick={() => onOpen(1)}>‹ Retour</button>
      <h1>{service.name}</h1>
      <p className="campaign-banner">{service.pitch}</p>
      <ul className="home-tags">
        {service.tags.map((tag) => <li key={tag}>{tag}</li>)}
      </ul>
      <ul className="detail-shots">
        {shots.map((src, index) => (
          <li key={`${src}-${index}`}>
            <img src={src} alt={`Écran ${index + 1} de ${service.name}`} />
          </li>
        ))}
      </ul>
      {network?.href ? (
        <a className="detail-network is-on" href={network.href} target="_blank" rel="noreferrer">
          {network.label}
        </a>
      ) : (
        <p className="detail-network is-off">Réseau non fourni</p>
      )}
      <Menu screen={9} onOpen={onOpen} />
    </div>
  );
}
