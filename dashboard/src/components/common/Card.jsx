const Card = ({ title, subtitle, actions, children, className = "", contentStyle }) => {
  const cardClassName = ["panel-card", className].filter(Boolean).join(" ");

  return (
    <section className={cardClassName} style={{ height: "100%" }}>
      {(title || subtitle || actions) && (
        <div className="panel-card__header">
          <div>
            {title && <h4 className="panel-card__title">{title}</h4>}
            {subtitle && <div className="panel-card__subtitle">{subtitle}</div>}
          </div>
          {actions && <div>{actions}</div>}
        </div>
      )}
      <div className="panel-card__content" style={contentStyle}>
        {children}
      </div>
    </section>
  );
};

export default Card;
