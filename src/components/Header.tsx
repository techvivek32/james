type HeaderProps = {
  title: string;
  subtitle?: string;
  userName: string;
  roleLabel: string;
  onLogout: () => void;
};

export function Header(props: HeaderProps) {
  return (
    <div className="header">
      <div className="header-titles">
        <h1 className="header-title">{props.title}</h1>
        {props.subtitle && (
          <p className="header-subtitle">{props.subtitle}</p>
        )}
      </div>
      <div className="header-profile">
        <div className="header-user-info">
          <span className="header-user-name">{props.userName}</span>
          <span className="header-user-role"> {props.roleLabel}</span>
        </div>
        <button className="header-logout" onClick={props.onLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}
