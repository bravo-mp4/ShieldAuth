export default function TopBar({ title, subtitle, actions }) {
  return (
    <div className="pageHeader">
      <div>
        <div className="pageTitle">{title}</div>
        {subtitle && <div className="pageSub">{subtitle}</div>}
      </div>
      {actions && <div className="pageActions">{actions}</div>}
    </div>
  );
}
