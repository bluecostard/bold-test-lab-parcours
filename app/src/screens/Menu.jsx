const items = [
  { id: 1, label: "Découvrir", icon: "decouvrir" },
  { id: 9, label: "Communauté", icon: "communaute" },
  { id: 10, label: "Classement", icon: "classement" },
  { id: 11, label: "Profil", icon: "profil" },
];

export function Menu({ screen, onOpen }) {
  return (
    <nav className="home-tabs" aria-label="Navigation">
      {items.map((item) => {
        const on = screen === item.id;
        return (
          <button key={item.id} type="button" className={on ? "is-on" : ""} onClick={() => onOpen(item.id)}>
            <img src={`/menu/${item.icon}${on ? "-on" : ""}.png`} alt="" />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
